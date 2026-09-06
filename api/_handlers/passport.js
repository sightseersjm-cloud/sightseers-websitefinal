const db = require('../_lib/db');
const { getUser, uid, escapeHtml } = require('../_lib/auth');
const { sendEmail } = require('../_lib/email');

/* Strip a data-URI prefix if the client sent one; Resend wants bare base64. */
function cleanB64(s) {
  if (typeof s !== 'string') return '';
  const i = s.indexOf('base64,');
  return i >= 0 ? s.slice(i + 7) : s;
}

/* Give the attachment a safe filename with the right extension for its type. */
function safeName(name, type, fallback) {
  let n = (name || fallback || 'file').replace(/[^\w.\- ]+/g, '_').slice(0, 80);
  if (!/\.[a-z0-9]{2,5}$/i.test(n)) {
    if (type && type.indexOf('pdf') >= 0) n += '.pdf';
    else if (type && type.indexOf('png') >= 0) n += '.png';
    else n += '.jpg';
  }
  return n;
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'OPTIONS') return res.status(200).end();

    // Admin listing of submitted requests
    if (req.method === 'GET') {
      const { requireAdmin } = require('../_lib/auth');
      const admin = requireAdmin(req, res);
      if (!admin) return;
      const requests = await db.getCollection('passport-requests');
      return res.status(200).json({ ok: true, requests });
    }

    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const b = req.body || {};
    const name = (b.name || '').trim();
    const email = (b.email || '').trim();
    const phone = (b.phone || '').trim();
    const ia = (b.ia || '').trim();
    const bio = b.bio || {};
    const photo = b.photo || {};

    if (!name || !email || !phone || !ia || !bio.b64 || !photo.b64) {
      return res.status(400).json({ error: 'All fields and both files are required.' });
    }

    const bioName = safeName(bio.name, bio.type, 'biography-page');
    const photoName = safeName(photo.name, photo.type, 'passport-photo');

    // Store a lightweight record (no file bytes) so the team has a log.
    const user = getUser(req);
    const rec = {
      id: uid(),
      userId: user ? user.id : null,
      name, email: email.toLowerCase(), phone, ia,
      bioFile: bioName, photoFile: photoName,
      status: 'new',
      createdAt: new Date().toISOString()
    };
    try { await db.addToCollection('passport-requests', rec); } catch (e) { /* logging is best-effort */ }

    await sendEmail({
      subject: `Passport Renewal Request — ${escapeHtml(name)}`,
      replyTo: email,
      attachments: [
        { filename: bioName, content: cleanB64(bio.b64) },
        { filename: photoName, content: cleanB64(photo.b64) }
      ],
      html: `
        <h2 style="color:#0d5371">New Passport Renewal Request — Sight Seers Caribbean</h2>
        <table style="border-collapse:collapse;width:100%;font-family:sans-serif">
          <tr><td style="padding:8px;font-weight:bold;width:190px">Name</td><td style="padding:8px">${escapeHtml(name)}</td></tr>
          <tr style="background:#f5f5f5"><td style="padding:8px;font-weight:bold">Email</td><td style="padding:8px">${escapeHtml(email)}</td></tr>
          <tr><td style="padding:8px;font-weight:bold">Phone / WhatsApp</td><td style="padding:8px">${escapeHtml(phone)}</td></tr>
          <tr style="background:#f5f5f5"><td style="padding:8px;font-weight:bold">Birth Certificate No. (IA No.)</td><td style="padding:8px">${escapeHtml(ia)}</td></tr>
          <tr><td style="padding:8px;font-weight:bold">Received</td><td style="padding:8px">${new Date(rec.createdAt).toLocaleString('en-US', { timeZone: 'America/Jamaica' })}</td></tr>
        </table>
        <p style="margin-top:16px;font-size:14px">The applicant's <strong>biography page</strong> and <strong>passport photo</strong> are attached to this email.</p>
        <p style="color:#888;font-size:12px;margin-top:20px">Submitted via the passport renewal form on sightseerscaribbean.com</p>`
    });

    return res.status(201).json({ ok: true, id: rec.id });
  } catch (err) {
    console.error('Passport error:', err && err.message, err && err.stack);
    return res.status(500).json({ error: err && err.message ? err.message : 'Something went wrong. Please try again.' });
  }
};
