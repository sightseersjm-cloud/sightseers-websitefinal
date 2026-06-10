const db = require('./_lib/db');
const { hashPassword, verifyPassword, createToken, requireAuth, requireAdmin, uid, ADMIN_CODE } = require('./_lib/auth');

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

  // Admin account management actions
  if (action === 'admin-create') {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const { name, email, password, phone, style, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password required' });

    const users = await db.getCollection('users');
    if (users.find(u => u.email === email.toLowerCase())) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const user = {
      id: uid(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash: hashPassword(password),
      phone: (phone || '').trim(),
      style: style || 'Adventure',
      role: role || 'guest',
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

    if (name) users[idx].name = name.trim();
    if (email) users[idx].email = email.trim().toLowerCase();
    if (phone !== undefined) users[idx].phone = phone.trim();
    if (style) users[idx].style = style;
    if (role) users[idx].role = role;
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

    const users = await db.getCollection('users');
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Account not found' });

    users[idx].passwordHash = hashPassword(newPassword);
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
