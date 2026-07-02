const db = require('../_lib/db');
const { hashPassword, verifyPassword, validatePassword, createToken, requireAuth, requireAdmin, uid, ADMIN_CODE } = require('../_lib/auth');
const { sendEmail, BUSINESS_EMAIL } = require('../_lib/email');

const loginAttempts = new Map();
const RATE_WINDOW = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

function checkRate(key) {
  const now = Date.now();
  const record = loginAttempts.get(key);
  if (!record || now - record.start > RATE_WINDOW) {
    loginAttempts.set(key, { start: now, count: 1 });
    return true;
  }
  record.count++;
  return record.count <= MAX_ATTEMPTS;
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const admin = requireAdmin(req, res);
    if (!admin) return;
    const users = await db.getCollection('users');
    const safe = users.map(({ passwordHash, ...u }) => u);
    return res.status(200).json({ ok: true, accounts: safe });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action } = req.body || {};
  if (!action || typeof action !== 'string') return res.status(400).json({ error: 'Action required' });

  const clientIp = (req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown').split(',')[0].trim();

  if (action === 'signup') {
    const { name, email, password, phone, style, adminCode } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required' });
    if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Invalid input' });
    }
    if (name.length > 100 || email.length > 200) return res.status(400).json({ error: 'Input too long' });

    const pwError = validatePassword(password);
    if (pwError) return res.status(400).json({ error: pwError });

    if (!checkRate('signup:' + clientIp)) {
      return res.status(429).json({ error: 'Too many attempts. Please try again later.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const users = await db.getCollection('users');
    if (users.find(u => u.email === cleanEmail)) {
      return res.status(409).json({ error: 'An account with that email already exists' });
    }

    const isAdmin = ADMIN_CODE && adminCode && adminCode === ADMIN_CODE;
    const user = {
      id: uid(),
      name: name.trim().slice(0, 100),
      email: cleanEmail,
      passwordHash: hashPassword(password),
      phone: String(phone || '').trim().slice(0, 30),
      style: String(style || 'Adventure').slice(0, 50),
      role: isAdmin ? 'admin' : 'guest',
      createdAt: new Date().toISOString()
    };

    users.push(user);
    await db.setCollection('users', users);

    const token = createToken({ id: user.id, email: user.email, name: user.name, role: user.role });
    const { passwordHash, ...safe } = user;

    const firstName = user.name.split(' ')[0];
    sendEmail({
      to: user.email,
      subject: `Welcome aboard, ${firstName}! Your Caribbean adventure starts now`,
      html: buildWelcomeEmail(firstName)
    }).catch(() => {});

    sendEmail({
      to: BUSINESS_EMAIL,
      subject: `New member signup: ${user.name} (${user.email})`,
      html: `<p><strong>${user.name}</strong> just created an account.</p><p>Email: ${user.email}</p><p>Phone: ${user.phone || 'Not provided'}</p><p>Travel style: ${user.style}</p><p>Signed up: ${user.createdAt}</p>`
    }).catch(() => {});

    return res.status(201).json({ ok: true, token, user: safe });
  }

  if (action === 'signin') {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    if (!checkRate('signin:' + clientIp)) {
      return res.status(429).json({ error: 'Too many sign-in attempts. Please try again later.' });
    }

    const users = await db.getCollection('users');
    const user = users.find(u => u.email === String(email).trim().toLowerCase());
    if (!user || !verifyPassword(String(password), user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = createToken({ id: user.id, email: user.email, name: user.name, role: user.role });
    const { passwordHash, ...safe } = user;
    return res.status(200).json({ ok: true, token, user: safe });
  }

  // Exchange the admin passcode (checked against the server's ADMIN_PASSCODE env var)
  // for an admin token. Lets the passcode alone publish edits to the live site.
  if (action === 'passcode') {
    const { passcode } = req.body;
    if (!checkRate('passcode:' + clientIp)) {
      return res.status(429).json({ error: 'Too many attempts. Please try again later.' });
    }
    if (!ADMIN_CODE) {
      return res.status(500).json({ error: 'Admin passcode is not configured on the server (set ADMIN_PASSCODE in Vercel).' });
    }
    if (!passcode || String(passcode) !== ADMIN_CODE) {
      return res.status(401).json({ error: 'Incorrect admin passcode' });
    }
    // 'editor' can publish site content + images, but cannot read customer PII
    // (bookings, contact messages) or manage user accounts — those need a real admin login.
    const editorUser = { id: 'admin-passcode', email: 'editor@sightseerscaribbean.com', name: 'Site Editor', role: 'editor' };
    const token = createToken(editorUser);
    return res.status(200).json({ ok: true, token, user: editorUser });
  }

  if (action === 'me') {
    const caller = requireAuth(req, res);
    if (!caller) return;
    // Passcode-login editors have a synthetic id with no DB record — return
    // the token payload directly so checkAuth() doesn't wipe the session.
    if (caller.id === 'admin-passcode') {
      return res.status(200).json({ ok: true, user: { id: caller.id, email: caller.email, name: caller.name, role: caller.role } });
    }
    const users = await db.getCollection('users');
    const user = users.find(u => u.id === caller.id);
    if (!user) return res.status(404).json({ error: 'Account not found' });
    const { passwordHash, ...safe } = user;
    return res.status(200).json({ ok: true, user: safe });
  }

  if (action === 'update') {
    const caller = requireAuth(req, res);
    if (!caller) return;
    const { name, phone, style } = req.body;
    const users = await db.getCollection('users');
    const idx = users.findIndex(u => u.id === caller.id);
    if (idx === -1) return res.status(404).json({ error: 'Account not found' });

    if (name && typeof name === 'string') users[idx].name = name.trim().slice(0, 100);
    if (phone !== undefined) users[idx].phone = String(phone).trim().slice(0, 30);
    if (style && typeof style === 'string') users[idx].style = style.slice(0, 50);
    users[idx].updatedAt = new Date().toISOString();

    await db.setCollection('users', users);
    const { passwordHash, ...safe } = users[idx];
    return res.status(200).json({ ok: true, user: safe });
  }

  if (action === 'update-password') {
    const caller = requireAuth(req, res);
    if (!caller) return;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Current and new password are required' });

    const pwError = validatePassword(String(newPassword));
    if (pwError) return res.status(400).json({ error: pwError });

    const users = await db.getCollection('users');
    const idx = users.findIndex(u => u.id === caller.id);
    if (idx === -1) return res.status(404).json({ error: 'Account not found' });

    if (!verifyPassword(String(currentPassword), users[idx].passwordHash)) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    users[idx].passwordHash = hashPassword(String(newPassword));
    users[idx].updatedAt = new Date().toISOString();
    await db.setCollection('users', users);
    return res.status(200).json({ ok: true });
  }

  if (action === 'admin-create') {
    const admin = requireAdmin(req, res);
    if (!admin) return;
    const { name, email, password, phone, style, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password required' });

    const pwError = validatePassword(String(password));
    if (pwError) return res.status(400).json({ error: pwError });

    const cleanEmail = String(email).trim().toLowerCase();
    const users = await db.getCollection('users');
    if (users.find(u => u.email === cleanEmail)) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const user = {
      id: uid(),
      name: String(name).trim().slice(0, 100),
      email: cleanEmail,
      passwordHash: hashPassword(String(password)),
      phone: String(phone || '').trim().slice(0, 30),
      style: String(style || 'Adventure').slice(0, 50),
      role: role === 'admin' ? 'admin' : 'guest',
      createdAt: new Date().toISOString()
    };
    users.push(user);
    await db.setCollection('users', users);
    const { passwordHash: _, ...safe } = user;
    return res.status(201).json({ ok: true, account: safe });
  }

  if (action === 'admin-update') {
    const admin = requireAdmin(req, res);
    if (!admin) return;
    const { id, name, email, phone, style, role } = req.body;
    if (!id) return res.status(400).json({ error: 'Account ID required' });

    const users = await db.getCollection('users');
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Account not found' });

    if (name && typeof name === 'string') users[idx].name = name.trim().slice(0, 100);
    if (email && typeof email === 'string') users[idx].email = email.trim().toLowerCase();
    if (phone !== undefined) users[idx].phone = String(phone).trim().slice(0, 30);
    if (style && typeof style === 'string') users[idx].style = style.slice(0, 50);
    if (role === 'admin' || role === 'guest') users[idx].role = role;
    users[idx].updatedAt = new Date().toISOString();

    await db.setCollection('users', users);
    const { passwordHash: _, ...safe } = users[idx];
    return res.status(200).json({ ok: true, account: safe });
  }

  if (action === 'admin-reset-password') {
    const admin = requireAdmin(req, res);
    if (!admin) return;
    const { id, newPassword } = req.body;
    if (!id || !newPassword) return res.status(400).json({ error: 'Account ID and new password required' });

    const pwError = validatePassword(String(newPassword));
    if (pwError) return res.status(400).json({ error: pwError });

    const users = await db.getCollection('users');
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Account not found' });

    users[idx].passwordHash = hashPassword(String(newPassword));
    users[idx].updatedAt = new Date().toISOString();
    await db.setCollection('users', users);
    return res.status(200).json({ ok: true });
  }

  if (action === 'admin-delete') {
    const admin = requireAdmin(req, res);
    if (!admin) return;
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'Account ID required' });
    if (id === admin.id) return res.status(400).json({ error: 'Cannot delete your own account' });

    const users = await db.getCollection('users');
    const filtered = users.filter(u => u.id !== id);
    if (filtered.length === users.length) return res.status(404).json({ error: 'Account not found' });

    await db.setCollection('users', filtered);
    return res.status(200).json({ ok: true });
  }

  return res.status(400).json({ error: 'Invalid action' });
};

function buildWelcomeEmail(firstName) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f7fa;font-family:'Helvetica Neue',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fa;padding:32px 16px">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

<!-- Header -->
<tr><td style="background:linear-gradient(135deg,#0a3557,#0d6e96);padding:40px 36px;border-radius:24px 24px 0 0;text-align:center">
<div style="font-size:28px;font-weight:800;color:#fff;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px">SIGHT SEERS</div>
<div style="font-size:11px;font-weight:600;color:rgba(255,255,255,.65);letter-spacing:3px;text-transform:uppercase">Caribbean Adventures</div>
</td></tr>

<!-- Hero -->
<tr><td style="background:#fff;padding:44px 36px 28px;text-align:center">
<div style="font-size:36px;margin-bottom:8px">&#127796;</div>
<h1 style="margin:0 0 10px;font-size:26px;font-weight:800;color:#0a3557;line-height:1.2">Welcome aboard, ${firstName}!</h1>
<p style="margin:0;font-size:15px;color:#6b7a8d;line-height:1.7">You just joined the crew. And honestly? We think your timing is perfect.</p>
</td></tr>

<!-- Body -->
<tr><td style="background:#fff;padding:0 36px 36px">
<div style="background:linear-gradient(135deg,rgba(239,135,49,.06),rgba(6,58,99,.04));border:1px solid rgba(239,135,49,.15);border-radius:18px;padding:28px;margin-bottom:28px">
<p style="margin:0 0 16px;font-size:15px;color:#1a2b3f;line-height:1.8;font-weight:500">Here's the deal &mdash; we don't do cookie-cutter vacations. Every single trip we build is crafted around <em>you</em>. Your group. Your vibe. Your pace.</p>
<p style="margin:0;font-size:15px;color:#1a2b3f;line-height:1.8;font-weight:500">Whether it's catamaran cruises in the Bahamas, volcanic mud baths in Saint Lucia, or a full MBA retreat in Jamaica &mdash; we've got the Caribbean covered.</p>
</div>

<h2 style="margin:0 0 18px;font-size:18px;font-weight:800;color:#0a3557">What you just unlocked:</h2>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:10px 0;border-bottom:1px solid #f0f2f5">
<table cellpadding="0" cellspacing="0"><tr>
<td style="width:36px;font-size:20px;vertical-align:top;padding-top:2px">&#9993;</td>
<td style="padding-left:8px"><strong style="color:#0a3557;font-size:14px">Priority booking access</strong><br><span style="color:#6b7a8d;font-size:13px">Skip the back-and-forth. Your requests go straight to our team.</span></td>
</tr></table>
</td></tr>
<tr><td style="padding:10px 0;border-bottom:1px solid #f0f2f5">
<table cellpadding="0" cellspacing="0"><tr>
<td style="width:36px;font-size:20px;vertical-align:top;padding-top:2px">&#127775;</td>
<td style="padding-left:8px"><strong style="color:#0a3557;font-size:14px">100 welcome points</strong><br><span style="color:#6b7a8d;font-size:13px">Already in your Travel Club balance. Earn more with every trip.</span></td>
</tr></table>
</td></tr>
<tr><td style="padding:10px 0">
<table cellpadding="0" cellspacing="0"><tr>
<td style="width:36px;font-size:20px;vertical-align:top;padding-top:2px">&#127758;</td>
<td style="padding-left:8px"><strong style="color:#0a3557;font-size:14px">Bespoke itineraries</strong><br><span style="color:#6b7a8d;font-size:13px">Tell us the dream. We'll build the trip. Seven Caribbean destinations and counting.</span></td>
</tr></table>
</td></tr>
</table>
</td></tr>

<!-- CTA -->
<tr><td style="background:#fff;padding:0 36px 40px;text-align:center">
<a href="https://sightseerscaribbean.com" style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#ef8731,#f5a04b);color:#fff;font-size:15px;font-weight:800;text-decoration:none;border-radius:14px;letter-spacing:.5px">Start Exploring</a>
<p style="margin:18px 0 0;font-size:13px;color:#9aabb8">Or reply to this email &mdash; we actually read those.</p>
</td></tr>

<!-- Footer -->
<tr><td style="background:#0a3557;padding:28px 36px;border-radius:0 0 24px 24px;text-align:center">
<p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#fff;letter-spacing:1px">Sight Seers Caribbean Adventures</p>
<p style="margin:0 0 12px;font-size:12px;color:rgba(255,255,255,.55);line-height:1.6">Turtle Beach Road, Ocho Rios, Jamaica<br>+1 (876) 465-0630 &bull; +1 (347) 291-6868</p>
<p style="margin:0;font-size:11px;color:rgba(255,255,255,.35)">You're receiving this because you created an account at sightseerscaribbean.com</p>
</td></tr>

</table>
</td></tr>
</table>
</body></html>`;
}
