const db = require('./_lib/db');
const { requireAdmin, getUser, uid } = require('./_lib/auth');
const { sendEmail } = require('./_lib/email');

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method === 'GET') {
      const admin = requireAdmin(req, res);
      if (!admin) return;

      const messages = await db.getCollection('contact-messages');
      return res.status(200).json({ ok: true, messages });
    }

    if (req.method === 'POST') {
      const { action } = req.body || {};

      if (action === 'send' || !action) {
        const { name, email, phone, subject, message } = req.body || {};
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
        // Fire email without awaiting — DB save already succeeded, email is best-effort
        sendEmail({
          subject: `New Enquiry from ${msg.name}${msg.subject ? ' — ' + msg.subject : ''}`,
          html: `
            <h2 style="color:#0d5371">New Contact Enquiry — Sight Seers Caribbean</h2>
            <table style="border-collapse:collapse;width:100%;font-family:sans-serif">
              <tr><td style="padding:8px;font-weight:bold;width:130px">Name</td><td style="padding:8px">${msg.name}</td></tr>
              <tr style="background:#f5f5f5"><td style="padding:8px;font-weight:bold">Email</td><td style="padding:8px"><a href="mailto:${msg.email}">${msg.email}</a></td></tr>
              ${msg.phone ? `<tr><td style="padding:8px;font-weight:bold">Phone</td><td style="padding:8px">${msg.phone}</td></tr>` : ''}
              ${msg.subject ? `<tr style="background:#f5f5f5"><td style="padding:8px;font-weight:bold">Subject</td><td style="padding:8px">${msg.subject}</td></tr>` : ''}
              <tr><td style="padding:8px;font-weight:bold;vertical-align:top">Message</td><td style="padding:8px;white-space:pre-wrap">${msg.message}</td></tr>
              <tr style="background:#f5f5f5"><td style="padding:8px;font-weight:bold">Received</td><td style="padding:8px">${new Date(msg.createdAt).toLocaleString('en-US',{timeZone:'America/Jamaica'})}</td></tr>
            </table>
            <p style="color:#888;font-size:12px;margin-top:20px">This message was submitted via sightseerscaribbean.com</p>`
        });
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
  } catch (err) {
    console.error('Contact error:', err && err.message, err && err.stack);
    return res.status(500).json({ error: err && err.message ? err.message : 'Something went wrong. Please try again.' });
  }
};
