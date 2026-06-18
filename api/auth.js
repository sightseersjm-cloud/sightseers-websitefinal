const db = require('./_lib/db');
const { hashPassword, verifyPassword, validatePassword, createToken, requireAuth, requireAdmin, uid, ADMIN_CODE } = require('./_lib/auth');

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
