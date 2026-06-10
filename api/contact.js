const db = require('./_lib/db');
const { requireAdmin, getUser, uid } = require('./_lib/auth');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const messages = await db.getCollection('contact-messages');
    return res.status(200).json({ ok: true, messages });
  }

  if (req.method === 'POST') {
    const { action } = req.body;

    if (action === 'send' || !action) {
      const { name, email, phone, subject, message } = req.body;
      if (!name || !email || !message) return res.status(400).json({ error: 'Name, email and message required' });

      const user = getUser(req);
      const msg = {
        id: uid(),
        userId: user ? user.id : null,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: (phone || '').trim(),
        subject: (subject || '').trim(),
        message: message.trim(),
        status: 'new',
        createdAt: new Date().toISOString()
      };

      await db.addToCollection('contact-messages', msg);
      return res.status(201).json({ ok: true, id: msg.id });
    }

    if (action === 'mark-read') {
      const admin = requireAdmin(req, res);
      if (!admin) return;

      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'Message ID required' });

      const msg = await db.updateInCollection('contact-messages', id, { status: 'read', readBy: admin.id });
      if (!msg) return res.status(404).json({ error: 'Message not found' });

      return res.status(200).json({ ok: true });
    }

    if (action === 'delete') {
      const admin = requireAdmin(req, res);
      if (!admin) return;

      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'Message ID required' });

      const removed = await db.removeFromCollection('contact-messages', id);
      if (!removed) return res.status(404).json({ error: 'Message not found' });

      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'Invalid action' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
