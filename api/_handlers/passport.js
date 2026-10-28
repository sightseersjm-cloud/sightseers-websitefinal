const db = require('../_lib/db');
const { getUser, uid, escapeHtml, requirePerm } = require('../_lib/auth');
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
      const admin = await requirePerm(req, res, 'inbox');
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
    const address = String(b.address || '').trim().slice(0, 300);
    const bio = b.bio || {};
    const photo = b.photo || {};
    const photoCheck = String(b.photoCheck || '').slice(0, 600);

    if (!name || !email || !phone || !address || !ia || !bio.b64 || !photo.b64) {
      return res.status(400).json({ error: 'All fields and both files are required.' });
    }
    /* where the renewed passport is to be shipped: the home address, or another one */
    const shipSame = !(b.shipTo && b.shipTo.same === false);
    const shipAddress = shipSame ? address : String((b.shipTo && b.shipTo.address) || '').trim().slice(0, 300);
    if (!shipAddress || (!shipSame && shipAddress.length < 8)) {
      return res.status(400).json({ error: 'Please give the address the passport should be shipped to.' });
    }
    /* two emergency contacts, each with every detail */
    const clip = v => String(v || '').trim().slice(0, 200);
    const contacts = (Array.isArray(b.contacts) ? b.contacts : []).slice(0, 2).map(c => ({
      name: clip(c && c.name), relationship: clip(c && c.relationship), phone: clip(c && c.phone), email: clip(c && c.email).toLowerCase(), address: clip(c && c.address)
    }));
    if (contacts.length !== 2 || contacts.some(c => !c.name || !c.relationship || !c.phone || !c.email || !c.address)) {
      return res.status(400).json({ error: 'Please give two emergency contacts, each with a name, relationship, phone, email and address.' });
    }
    if (contacts.some(c => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email))) {
      return res.status(400).json({ error: 'Please check the email address of each emergency contact.' });
    }

    const bioName = safeName(bio.name, bio.type, 'biography-page');
    const photoName = safeName(photo.name, photo.type, 'passport-photo');

    // Store a lightweight record (no file bytes) so the team has a log.
    const user = getUser(req);
    const rec = {
      id: uid(),
      userId: user ? user.id : null,
      name, email: email.toLowerCase(), phone, address, shipSame, shipAddress, ia,
      contacts, photoCheck,
      bioFile: bioName, photoFile: photoName,
      status: 'new',
      createdAt: new Date().toISOString()
    };
    try { await db.addToCollection('passport-requests', rec); } catch (e) { /* logging is best-effort */ }

    const sent = await sendEmail({
      subject: `Passport Renewal Request: ${escapeHtml(name)}`,
      replyTo: email,
      attachments: [
        { filename: bioName, content: cleanB64(bio.b64) },
        { filename: photoName, content: cleanB64(photo.b64) }
      ],
      html: `
        <h2 style="color:#0d5371">New Passport Renewal Request: Sight Seers Caribbean</h2>
        <table style="border-collapse:collapse;width:100%;font-family:sans-serif">
          <tr><td style="padding:8px;font-weight:bold;width:190px">Name</td><td style="padding:8px">${escapeHtml(name)}</td></tr>
          <tr style="background:#f5f5f5"><td style="padding:8px;font-weight:bold">Email</td><td style="padding:8px">${escapeHtml(email)}</td></tr>
          <tr><td style="padding:8px;font-weight:bold">Phone / WhatsApp</td><td style="padding:8px">${escapeHtml(phone)}</td></tr>
          <tr><td style="padding:8px;font-weight:bold">Home address</td><td style="padding:8px">${escapeHtml(address)}</td></tr>
          <tr style="background:#f5f5f5"><td style="padding:8px;font-weight:bold">Ship the passport to</td><td style="padding:8px">${shipSame ? 'The home address above' : escapeHtml(shipAddress)}</td></tr>
          <tr><td style="padding:8px;font-weight:bold">Birth Certificate No. (IA No.)</td><td style="padding:8px">${escapeHtml(ia)}</td></tr>
          <tr><td style="padding:8px;font-weight:bold">Received</td><td style="padding:8px">${new Date(rec.createdAt).toLocaleString('en-US', { timeZone: 'America/Jamaica' })}</td></tr>
        </table>
        ${contacts.map((c, i) => `
        <h3 style="color:#0d5371;margin:22px 0 6px;font-family:sans-serif">Emergency contact ${i + 1}</h3>
        <table style="border-collapse:collapse;width:100%;font-family:sans-serif">
          <tr><td style="padding:8px;font-weight:bold;width:190px">Name</td><td style="padding:8px">${escapeHtml(c.name)}</td></tr>
          <tr style="background:#f5f5f5"><td style="padding:8px;font-weight:bold">Relationship</td><td style="padding:8px">${escapeHtml(c.relationship)}</td></tr>
          <tr><td style="padding:8px;font-weight:bold">Phone / WhatsApp</td><td style="padding:8px">${escapeHtml(c.phone)}</td></tr>
          <tr style="background:#f5f5f5"><td style="padding:8px;font-weight:bold">Email</td><td style="padding:8px">${escapeHtml(c.email)}</td></tr>
          <tr><td style="padding:8px;font-weight:bold">Address</td><td style="padding:8px">${escapeHtml(c.address)}</td></tr>
        </table>`).join('')}
        ${photoCheck ? `<p style="margin:18px 0 0;font-size:14px;font-family:sans-serif"><strong>Photo size check (done on the applicant's device):</strong> ${escapeHtml(photoCheck)}</p>` : ''}
        <p style="margin-top:16px;font-size:14px">The applicant's <strong>biography page</strong> and <strong>passport photo</strong> are attached to this email.</p>
        <p style="color:#888;font-size:12px;margin-top:20px">Submitted via the passport renewal form on sightseerscaribbean.com</p>`
    });

    /* the files live only in this email, so a failed send must not look like success */
    if (!sent || sent.ok === false) {
      try { await db.updateInCollection('passport-requests', rec.id, { status: 'email-failed' }); } catch (e) { /* best-effort */ }
      return res.status(502).json({ error: 'We could not send your request just now. Please try again, or email info@sightseerscaribbean.com.' });
    }
    return res.status(201).json({ ok: true, id: rec.id });
  } catch (err) {
    console.error('Passport error:', err && err.message, err && err.stack);
    return res.status(500).json({ error: err && err.message ? err.message : 'Something went wrong. Please try again.' });
  }
};
