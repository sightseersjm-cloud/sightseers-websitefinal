const db = require('../_lib/db');
const { hashPassword, verifyPassword, validatePassword, createToken, requireAuth, requireAdmin, requireOwner, permsOf, tokenFor, publicUser, PERMS, PRESETS, cleanPerms, newTotpSecret, totpOk, sealSecret, openSecret, uid } = require('../_lib/auth');
const { sendEmail, BUSINESS_EMAIL } = require('../_lib/email');
const social = require('../_lib/social');
const { geo } = require('../_lib/geo');

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

function sameSecret(a, b) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && require('crypto').timingSafeEqual(x, y);
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    /* Continue with Google / Microsoft */
    const gurl = new URL(req.url || '/', 'http://x');
    const gq = Object.assign(Object.fromEntries(gurl.searchParams), req.query || {});
    if (gq.providers) return res.status(200).json({ ok: true, providers: social.providers() });
    const am = gurl.pathname.match(/\/auth\/avatar\/([^/]+)$/);
    if (am) return require('../_lib/avatar').serve(decodeURIComponent(am[1]), res);
    const sm = gurl.pathname.match(/\/auth\/(google|microsoft)\/(start|callback)\/?$/);
    if (sm) {
      if (sm[2] === 'start') return social.start(sm[1], res);
      return social.callback(sm[1], req, res, gq, { geo, db, createToken, tokenFor, hashPassword, uid, sendEmail, BUSINESS_EMAIL, escapeHtml: require('../_lib/auth').escapeHtml });
    }
    const admin = await requireOwner(req, res);
    if (!admin) return;
    const users = await db.getCollection('users');
    const safe = users.map(publicUser);
    return res.status(200).json({ ok: true, accounts: safe });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action } = req.body || {};
  if (!action || typeof action !== 'string') return res.status(400).json({ error: 'Action required' });

  const clientIp = (req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown').split(',')[0].trim();

  if (action === 'signup') {
    const { name, email, password, phone, style } = req.body;
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

    /* Signing up never makes an admin. Signing up must never be able to create an admin account. Admins come from the owner login or an existing admin. */
    const isAdmin = false;
    const user = {
      id: uid(),
      name: name.trim().slice(0, 100),
      email: cleanEmail,
      passwordHash: hashPassword(password),
      phone: String(phone || '').trim().slice(0, 30),
      style: String(style || 'Adventure').slice(0, 50),
      role: isAdmin ? 'admin' : 'guest',
      country: geo(req).country, city: geo(req).city,
      createdAt: new Date().toISOString()
    };

    users.push(user);
    await db.setCollection('users', users);

    const token = tokenFor(user);
    const safe = publicUser(user);

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
    const cleanIn = String(email).trim().toLowerCase();
    /* Owner sign-in: the owner's email and password live in the host's environment (OWNER_EMAIL / OWNER_PASSWORD),
       never in the code. Signing in with them creates or repairs the owner's admin account. */
    const ownerEmail = String(process.env.OWNER_EMAIL || '').trim().toLowerCase();
    const ownerPass = String(process.env.OWNER_PASSWORD || '');
    if (ownerEmail && ownerPass && cleanIn === ownerEmail && sameSecret(String(password), ownerPass)) {
      let owner = users.find(u => u.email === ownerEmail);
      if (!owner) {
        owner = { id: uid(), name: 'Sight Seers Admin', email: ownerEmail, passwordHash: hashPassword(ownerPass), phone: '', style: 'Adventure', role: 'admin', createdAt: new Date().toISOString() };
        users.push(owner);
        await db.setCollection('users', users);
      } else if (owner.role !== 'admin' || !verifyPassword(ownerPass, owner.passwordHash)) {
        owner.role = 'admin';
        owner.passwordHash = hashPassword(ownerPass);
        await db.setCollection('users', users);
      }
    }
    const user = users.find(u => u.email === cleanIn);
    if (!user || !verifyPassword(String(password), user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    /* accounts made before countries were recorded get the country they sign in from */
    if (!user.country) { const g = geo(req); if (g.country) { user.country = g.country; user.city = user.city || g.city; try { await db.setCollection('users', users); } catch (e) { /* best effort */ } } }

    if (user.disabled) return res.status(403).json({ error: 'This account has been switched off. Please contact the owner.' });
    /* two-step sign-in: an owner or team member who turned it on also needs the 6-digit code from their authenticator app */
    if (user.totpEnabled && user.totpSecret) {
      const code = String(req.body.code || '').trim();
      if (!code) return res.status(401).json({ error: 'Enter the 6-digit code from your authenticator app.', need2fa: true });
      if (!checkRate('totp:' + user.id)) return res.status(429).json({ error: 'Too many attempts. Please try again later.' });
      if (!totpOk(openSecret(user.totpSecret), code)) return res.status(401).json({ error: 'That code is not right. Try the newest one.', need2fa: true });
    }
    if (user.role === 'admin' || user.role === 'staff') {
      user.lastSignInAt = new Date().toISOString();
      try { await db.setCollection('users', users); } catch (e) { /* best effort */ }
    }
    const token = tokenFor(user);
    const safe = publicUser(user);
    return res.status(200).json({ ok: true, token, user: safe });
  }

  if (action === 'me') {
    const caller = requireAuth(req, res);
    if (!caller) return;
    const users = await db.getCollection('users');
    const user = users.find(u => u.id === caller.id);
    if (!user) return res.status(404).json({ error: 'Account not found' });
    const safe = publicUser(user);
    safe.perms = await permsOf(caller);
    return res.status(200).json({ ok: true, user: safe });
  }

  if (action === 'update') {
    const caller = requireAuth(req, res);
    if (!caller) return;
    const { name, phone, style, passportCountry, passportExpiry, bio } = req.body;
    const users = await db.getCollection('users');
    const idx = users.findIndex(u => u.id === caller.id);
    if (idx === -1) return res.status(404).json({ error: 'Account not found' });

    if (name && typeof name === 'string') users[idx].name = name.trim().slice(0, 100);
    if (phone !== undefined) users[idx].phone = String(phone).trim().slice(0, 30);
    if (style && typeof style === 'string') users[idx].style = style.slice(0, 50);
    /* optional, for the Travel Club's before-you-go checklist: only the passport's country and when it expires (a month), never a passport number */
    /* a short intro in their own words, shown on trips they lead (plain text) */
    if (bio !== undefined) users[idx].bio = String(bio || '').replace(/\r\n/g, '\n').trim().slice(0, 700);
    if (passportCountry !== undefined) users[idx].passportCountry = String(passportCountry || '').trim().slice(0, 60);
    if (passportExpiry !== undefined) users[idx].passportExpiry = /^\d{4}-(0[1-9]|1[0-2])$/.test(String(passportExpiry || '').trim()) ? String(passportExpiry).trim() : '';
    users[idx].updatedAt = new Date().toISOString();

    await db.setCollection('users', users);
    const safe = publicUser(users[idx]);
    return res.status(200).json({ ok: true, user: safe });
  }

  /* a profile photo: anyone with an account; it shows on their dashboard, to the leader of a trip they join, and on trips they lead */
  if (action === 'avatar' || action === 'avatar-remove') {
    const caller = requireAuth(req, res);
    if (!caller) return;
    const users = await db.getCollection('users');
    const idx = users.findIndex(u => u.id === caller.id);
    if (idx === -1) return res.status(404).json({ error: 'Account not found' });
    const avatar = require('../_lib/avatar');
    if (action === 'avatar-remove') {
      await avatar.removeAvatar(users[idx].avatarUrl);
      users[idx].avatarUrl = '';
    } else {
      let r;
      try { r = await avatar.saveAvatar(caller.id, req.body.data, users[idx].avatarUrl); }
      catch (e) { console.error('avatar upload', e && e.message); return res.status(502).json({ error: 'We could not save that photo just now. Please try again.' }); }
      if (r.error) return res.status(400).json({ error: r.error });
      users[idx].avatarUrl = r.url;
    }
    users[idx].updatedAt = new Date().toISOString();
    await db.setCollection('users', users);
    const safe = publicUser(users[idx]);
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

  // Step 1 of self-service reset: email the user a 6-digit code.
  if (action === 'request-reset') {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    if (!checkRate('reset:' + clientIp)) {
      return res.status(429).json({ error: 'Too many attempts. Please try again later.' });
    }
    const cleanEmail = String(email).trim().toLowerCase();
    const users = await db.getCollection('users');
    const idx = users.findIndex(u => u.email === cleanEmail);
    // Only send if the account exists, but always return ok so we don't reveal which emails are registered.
    if (idx !== -1) {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      users[idx].resetCode = code;
      users[idx].resetExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
      await db.setCollection('users', users);
      const firstName = (users[idx].name || 'there').split(' ')[0];
      sendEmail({
        to: cleanEmail,
        subject: `Your Sight Seers password reset code: ${code}`,
        html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#1a2b3f">
          <h2 style="color:#0a3557">Password reset</h2>
          <p>Hi ${firstName}, use this code to reset your Sight Seers Travel Club password. It expires in 30 minutes.</p>
          <p style="font-size:32px;font-weight:800;letter-spacing:8px;color:#0d6e96;background:#f4f7fa;border-radius:12px;padding:18px;text-align:center">${code}</p>
          <p style="color:#6b7a8d;font-size:13px">If you didn't request this, you can safely ignore this email. Your password stays the same.</p>
        </div>`
      }).catch(() => {});
    }
    return res.status(200).json({ ok: true });
  }

  // Step 2 of self-service reset: verify the code and set a new password.
  if (action === 'reset-password') {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) return res.status(400).json({ error: 'Email, code and new password are required' });
    if (!checkRate('reset:' + clientIp)) {
      return res.status(429).json({ error: 'Too many attempts. Please try again later.' });
    }
    const pwError = validatePassword(String(newPassword));
    if (pwError) return res.status(400).json({ error: pwError });

    const cleanEmail = String(email).trim().toLowerCase();
    const users = await db.getCollection('users');
    const idx = users.findIndex(u => u.email === cleanEmail);
    if (idx === -1 || !users[idx].resetCode || String(code) !== String(users[idx].resetCode)) {
      return res.status(400).json({ error: 'That reset code is not correct.' });
    }
    if (!users[idx].resetExpires || Date.now() > users[idx].resetExpires) {
      return res.status(400).json({ error: 'That reset code has expired. Please request a new one.' });
    }

    users[idx].passwordHash = hashPassword(String(newPassword));
    delete users[idx].resetCode;
    delete users[idx].resetExpires;
    delete users[idx].inviteCode;
    users[idx].updatedAt = new Date().toISOString();
    await db.setCollection('users', users);

    const u = users[idx];
    const token = tokenFor(u);
    const safe = publicUser(u);
    return res.status(200).json({ ok: true, token, user: safe });
  }


  /* ============================ team and sign-in security ============================ */
  if (action === 'team-list') {
    const owner = await requireOwner(req, res);
    if (!owner) return;
    const users = await db.getCollection('users');
    const team = users.filter(u => u.role === 'admin' || u.role === 'staff').map(u => ({
      id: u.id, name: u.name || '', email: u.email, role: u.role, perms: u.role === 'admin' ? PERMS.slice() : cleanPerms(u.perms),
      preset: u.preset || '', needsApproval: u.role === 'staff' ? u.needsApproval !== false : false, disabled: !!u.disabled, twoStep: !!u.totpEnabled, invited: !!u.inviteCode, lastSignInAt: u.lastSignInAt || '', createdAt: u.createdAt || ''
    }));
    return res.status(200).json({ ok: true, team, presets: Object.keys(PRESETS).map(k => ({ id: k, label: PRESETS[k].label, perms: PRESETS[k].perms })), perms: PERMS });
  }

  if (action === 'team-invite') {
    const owner = await requireOwner(req, res);
    if (!owner) return;
    if (!checkRate('invite:' + owner.id)) return res.status(429).json({ error: 'That is a lot of invitations. Please try again later.' });
    const { name, email, preset, perms } = req.body;
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail) || cleanEmail.length > 200) return res.status(400).json({ error: 'Please enter a valid email address.' });
    const cleanName = String(name || '').trim().slice(0, 100);
    if (!cleanName) return res.status(400).json({ error: 'Please add their name.' });
    const granted = PRESETS[preset] ? PRESETS[preset].perms.slice() : cleanPerms(perms);
    if (!granted.length) return res.status(400).json({ error: 'Choose a role, or tick at least one thing they can do.' });
    const users = await db.getCollection('users');
    let idx = users.findIndex(u => u.email === cleanEmail);
    const inviteCode = require('crypto').randomBytes(9).toString('hex');
    if (idx === -1) {
      users.push({ id: uid(), name: cleanName, email: cleanEmail, passwordHash: hashPassword(require('crypto').randomBytes(18).toString('hex') + 'Aa1'), phone: '', style: 'Adventure', role: 'staff', perms: granted, preset: PRESETS[preset] ? preset : '', needsApproval: req.body.needsApproval !== false, invitedBy: owner.id, createdAt: new Date().toISOString() });
      idx = users.length - 1;
    } else {
      if (users[idx].role === 'admin') return res.status(409).json({ error: 'That person is already an owner.' });
      if (users[idx].role === 'staff') return res.status(409).json({ error: 'That person is already on the team. Change their role instead.' });
      users[idx].role = 'staff'; users[idx].perms = granted; users[idx].preset = PRESETS[preset] ? preset : ''; users[idx].needsApproval = req.body.needsApproval !== false; users[idx].invitedBy = owner.id;
    }
    users[idx].inviteCode = inviteCode;
    users[idx].resetCode = inviteCode;
    users[idx].resetExpires = Date.now() + 7 * 24 * 60 * 60 * 1000;
    users[idx].updatedAt = new Date().toISOString();
    await db.setCollection('users', users);
    const host = String(req.headers['x-forwarded-host'] || req.headers.host || 'www.sightseerscaribbean.com').split(',')[0].trim();
    const link = 'https://' + host + '/manage?invite=' + encodeURIComponent(cleanEmail) + '&code=' + inviteCode;
    const first = cleanName.split(' ')[0];
    const label = PRESETS[preset] ? PRESETS[preset].label : 'Team member';
    sendEmail({
      to: cleanEmail,
      subject: 'You have been invited to the Sight Seers admin',
      html: '<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#1a2b3f"><h2 style="color:#0a3557">Welcome to the team, ' + require('../_lib/auth').escapeHtml(first) + '</h2><p>You have been invited to help run the Sight Seers website as a <b>' + require('../_lib/auth').escapeHtml(label) + '</b>. Choose a password to get started. This link works for 7 days.</p><p><a href="' + link + '" style="display:inline-block;background:#ef8731;color:#fff;padding:14px 26px;text-decoration:none;font-weight:bold">Set my password</a></p><p style="color:#6b7a8d;font-size:13px">If you were not expecting this, you can ignore this email.</p></div>'
    }).catch(() => {});
    return res.status(200).json({ ok: true, link, member: { id: users[idx].id, email: cleanEmail, name: cleanName, perms: granted } });
  }

  if (action === 'team-update') {
    const owner = await requireOwner(req, res);
    if (!owner) return;
    const { id, preset, perms, disabled, needsApproval } = req.body;
    const users = await db.getCollection('users');
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) return res.status(404).json({ error: 'We could not find that person.' });
    if (users[idx].role !== 'staff') return res.status(400).json({ error: 'Only team members can be changed here.' });
    if (preset !== undefined || perms !== undefined) {
      const granted = PRESETS[preset] ? PRESETS[preset].perms.slice() : cleanPerms(perms);
      if (!granted.length) return res.status(400).json({ error: 'Choose a role, or tick at least one thing they can do.' });
      users[idx].perms = granted; users[idx].preset = PRESETS[preset] ? preset : '';
    }
    if (disabled !== undefined) users[idx].disabled = !!disabled;
    if (needsApproval !== undefined) users[idx].needsApproval = !!needsApproval;
    users[idx].updatedAt = new Date().toISOString();
    await db.setCollection('users', users);
    return res.status(200).json({ ok: true });
  }

  if (action === 'team-remove') {
    const owner = await requireOwner(req, res);
    if (!owner) return;
    const users = await db.getCollection('users');
    const idx = users.findIndex(u => u.id === req.body.id);
    if (idx === -1) return res.status(404).json({ error: 'We could not find that person.' });
    if (users[idx].role !== 'staff') return res.status(400).json({ error: 'Only team members can be removed here.' });
    users[idx].role = 'guest'; delete users[idx].perms; delete users[idx].preset; delete users[idx].inviteCode; delete users[idx].disabled; delete users[idx].needsApproval;
    users[idx].sessionVersion = (users[idx].sessionVersion || 0) + 1;
    users[idx].updatedAt = new Date().toISOString();
    await db.setCollection('users', users);
    return res.status(200).json({ ok: true });
  }

  /* "sign out everywhere": every older sign-in of this account stops working for admin and team access; this device gets a fresh one */
  if (action === 'signout-all') {
    const caller = requireAuth(req, res);
    if (!caller) return;
    const users = await db.getCollection('users');
    const idx = users.findIndex(u => u.id === caller.id);
    if (idx === -1) return res.status(404).json({ error: 'Account not found' });
    users[idx].sessionVersion = (users[idx].sessionVersion || 0) + 1;
    users[idx].updatedAt = new Date().toISOString();
    await db.setCollection('users', users);
    return res.status(200).json({ ok: true, token: tokenFor(users[idx]) });
  }

  if (action === '2fa-setup' || action === '2fa-enable' || action === '2fa-disable') {
    const caller = requireAuth(req, res);
    if (!caller) return;
    const users = await db.getCollection('users');
    const idx = users.findIndex(u => u.id === caller.id);
    if (idx === -1) return res.status(404).json({ error: 'Account not found' });
    const u = users[idx];
    if (u.role !== 'admin' && u.role !== 'staff') return res.status(403).json({ error: 'Two-step sign-in is for the owner and team.' });
    if (!checkRate('2fa:' + u.id)) return res.status(429).json({ error: 'Too many attempts. Please try again later.' });
    if (action === '2fa-setup') {
      if (u.totpEnabled) return res.status(409).json({ error: 'Two-step sign-in is already on.' });
      const secret = newTotpSecret();
      u.totpPending = sealSecret(secret);
      await db.setCollection('users', users);
      const issuer = 'Sight Seers Admin';
      return res.status(200).json({ ok: true, secret, otpauth: 'otpauth://totp/' + encodeURIComponent(issuer) + ':' + encodeURIComponent(u.email) + '?secret=' + secret + '&issuer=' + encodeURIComponent(issuer) });
    }
    if (action === '2fa-enable') {
      if (!u.totpPending) return res.status(400).json({ error: 'Start again: ask for a new set-up code first.' });
      if (!totpOk(openSecret(u.totpPending), req.body.code)) return res.status(400).json({ error: 'That code is not right. Check your phone and try the newest one.' });
      u.totpSecret = u.totpPending; u.totpEnabled = true; delete u.totpPending;
      await db.setCollection('users', users);
      return res.status(200).json({ ok: true });
    }
    if (!u.totpEnabled || !verifyPassword(String(req.body.password || ''), u.passwordHash) || !totpOk(openSecret(u.totpSecret), req.body.code)) {
      return res.status(400).json({ error: 'Your password or code is not right.' });
    }
    delete u.totpSecret; delete u.totpPending; u.totpEnabled = false;
    await db.setCollection('users', users);
    return res.status(200).json({ ok: true });
  }

  if (action === 'admin-create') {
    const admin = await requireOwner(req, res);
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
    const admin = await requireOwner(req, res);
    if (!admin) return;
    const { id, name, email, phone, style, role, passportCountry, passportExpiry } = req.body;
    if (!id) return res.status(400).json({ error: 'Account ID required' });

    const users = await db.getCollection('users');
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Account not found' });

    if (name && typeof name === 'string') users[idx].name = name.trim().slice(0, 100);
    if (email && typeof email === 'string') users[idx].email = email.trim().toLowerCase();
    if (phone !== undefined) users[idx].phone = String(phone).trim().slice(0, 30);
    if (style && typeof style === 'string') users[idx].style = style.slice(0, 50);
    /* optional, for the Travel Club's before-you-go checklist: only the passport's country and when it expires (a month), never a passport number */
    if (passportCountry !== undefined) users[idx].passportCountry = String(passportCountry || '').trim().slice(0, 60);
    if (passportExpiry !== undefined) users[idx].passportExpiry = /^\d{4}-(0[1-9]|1[0-2])$/.test(String(passportExpiry || '').trim()) ? String(passportExpiry).trim() : '';
    if (role === 'admin' || role === 'guest') users[idx].role = role;
    users[idx].updatedAt = new Date().toISOString();

    await db.setCollection('users', users);
    return res.status(200).json({ ok: true, account: publicUser(users[idx]) });
  }

  if (action === 'admin-reset-password') {
    const admin = await requireOwner(req, res);
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
    const admin = await requireOwner(req, res);
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
