const db = require('./_lib/db');
const { requireAdmin, hashPassword, uid } = require('./_lib/auth');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  const admin = requireAdmin(req, res);
  if (!admin) return;

  if (req.method === 'GET') {
    const users = await db.getCollection('users');
    const safe = users.map(({ passwordHash, ...u }) => u);
    return res.status(200).json({ ok: true, accounts: safe });
  }

  if (req.method === 'POST') {
    const { action } = req.body;

    if (action === 'create') {
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

    if (action === 'update') {
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

    if (action === 'reset-password') {
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

    if (action === 'delete') {
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
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
