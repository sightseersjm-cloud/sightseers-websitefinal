const db = require('./_lib/db');
const { hashPassword, verifyPassword, createToken, requireAuth, uid, ADMIN_CODE } = require('./_lib/auth');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action } = req.body;

  if (action === 'signup') {
    const { name, email, password, phone, style, adminCode } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required' });

    const users = await db.getCollection('users');
    if (users.find(u => u.email === email.toLowerCase())) {
      return res.status(409).json({ error: 'An account with that email already exists' });
    }

    const isAdmin = adminCode && adminCode === ADMIN_CODE;
    const user = {
      id: uid(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash: hashPassword(password),
      phone: (phone || '').trim(),
      style: style || 'Adventure',
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

    const users = await db.getCollection('users');
    const user = users.find(u => u.email === email.trim().toLowerCase());
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = createToken({ id: user.id, email: user.email, name: user.name, role: user.role });
    const { passwordHash, ...safe } = user;
    return res.status(200).json({ ok: true, token, user: safe });
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

    if (name) users[idx].name = name.trim();
    if (phone !== undefined) users[idx].phone = phone.trim();
    if (style) users[idx].style = style;
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

    const users = await db.getCollection('users');
    const idx = users.findIndex(u => u.id === caller.id);
    if (idx === -1) return res.status(404).json({ error: 'Account not found' });

    if (!verifyPassword(currentPassword, users[idx].passwordHash)) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    users[idx].passwordHash = hashPassword(newPassword);
    users[idx].updatedAt = new Date().toISOString();
    await db.setCollection('users', users);

    return res.status(200).json({ ok: true });
  }

  return res.status(400).json({ error: 'Invalid action' });
};
