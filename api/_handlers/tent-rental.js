const db = require('../_lib/db');
const { requireAdmin, getUser, uid, escapeHtml } = require('../_lib/auth');
const { sendEmail } = require('../_lib/email');

const COLLECTION = 'tent-rental-agreements';

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'OPTIONS') return res.status(200).end();

    // Admin can list submitted agreements
    if (req.method === 'GET') {
      const admin = requireAdmin(req, res);
      if (!admin) return;
      const agreements = await db.getCollection(COLLECTION);
      return res.status(200).json({ ok: true, agreements });
    }

    if (req.method === 'POST') {
      const b = req.body || {};
      const name = (b.name || '').trim();
      const email = (b.email || '').trim();
      const phone = (b.phone || '').trim();
      const pickup = (b.pickup || '').trim();
      const ret = (b['return'] || '').trim();
      const signName = (b.signName || '').trim();

      if (!name || !email || !phone) return res.status(400).json({ error: 'Name, email and phone are required' });
      if (!pickup || !ret) return res.status(400).json({ error: 'Pickup and return dates are required' });
      if (!signName) return res.status(400).json({ error: 'A typed legal name (signature) is required' });

      const user = getUser(req);
      const rec = {
        id: uid(),
        userId: user ? user.id : null,
        name, email: email.toLowerCase(), phone,
        address: (b.address || '').trim(),
        idInfo: (b.id || '').trim(),
        reference: (b.ref || '').trim(),
        pickup, return: ret,
        location: (b.location || '').trim(),
        rate: (b.rate || '').trim(),
        total: (b.total || '').trim(),
        deposit: (b.deposit || '').trim(),
        payment: (b.payment || '').trim(),
        acceptedTerms: {
          deposit: !!b.ackDeposit, responsibilities: !!b.ackResp,
          damage: !!b.ackDamage, risk: !!b.ackRisk, general: !!b.ackGeneral
        },
        initials: (b.initials || '').trim(),
        signName,
        dateSigned: (b.date || '').trim(),
        hasSignatureImage: !!(b.signature && String(b.signature).startsWith('data:image')),
        status: 'new',
        createdAt: new Date().toISOString()
      };

      // Persist to blob storage, but never let a storage hiccup block the email.
      try { await db.addToCollection(COLLECTION, rec); }
      catch (e) { console.error('Tent rental save failed (continuing to email):', e && e.message); }

      const row = (k, v) =>
        `<tr><td style="padding:8px;font-weight:bold;width:170px;vertical-align:top">${escapeHtml(k)}</td>` +
        `<td style="padding:8px">${v ? escapeHtml(v) : '<span style="color:#bbb">—</span>'}</td></tr>`;
      const yn = (v) => (v ? '✅ Yes' : '⬜️ No');

      const attachments = [];
      if (rec.hasSignatureImage) {
        const base64 = String(b.signature).split(',')[1] || '';
        if (base64) attachments.push({ filename: 'renter-signature.png', content: base64 });
      }

      await sendEmail({
        subject: `New Tent Rental Agreement — ${escapeHtml(name)}`,
        replyTo: rec.email,
        attachments,
        html: `
          <h2 style="color:#0d5371;font-family:sans-serif">New Camping Tent Rental Agreement</h2>
          <p style="font-family:sans-serif;color:#666">JELUCAMP 1–2 person dome tent</p>
          <h3 style="font-family:sans-serif;color:#0d5371;margin-bottom:4px">Renter</h3>
          <table style="border-collapse:collapse;width:100%;font-family:sans-serif">
            ${row('Full name', rec.name)}
            ${row('Email', rec.email)}
            ${row('Phone', rec.phone)}
            ${row('Address', rec.address)}
            ${row('ID type & last 4', rec.idInfo)}
            ${row('Group / tour reference', rec.reference)}
          </table>
          <h3 style="font-family:sans-serif;color:#0d5371;margin-bottom:4px">Rental period & fees</h3>
          <table style="border-collapse:collapse;width:100%;font-family:sans-serif">
            ${row('Pickup date & time', rec.pickup)}
            ${row('Return date & time', rec.return)}
            ${row('Pickup / return location', rec.location)}
            ${row('Rental rate', rec.rate)}
            ${row('Total rental fee', rec.total)}
            ${row('Security deposit', rec.deposit)}
            ${row('Payment method', rec.payment)}
          </table>
          <h3 style="font-family:sans-serif;color:#0d5371;margin-bottom:4px">Acceptance</h3>
          <table style="border-collapse:collapse;width:100%;font-family:sans-serif">
            ${row('Security deposit (S4)', yn(rec.acceptedTerms.deposit))}
            ${row('Responsibilities (S6)', yn(rec.acceptedTerms.responsibilities))}
            ${row('Damage & replacement (S7–9)', yn(rec.acceptedTerms.damage))}
            ${row('Risk & liability (S11)', yn(rec.acceptedTerms.risk))}
            ${row('General terms (S12)', yn(rec.acceptedTerms.general))}
            ${row('Initials (S7–9)', rec.initials)}
          </table>
          <h3 style="font-family:sans-serif;color:#0d5371;margin-bottom:4px">Signature</h3>
          <table style="border-collapse:collapse;width:100%;font-family:sans-serif">
            ${row('Signed (typed name)', rec.signName)}
            ${row('Date signed', rec.dateSigned)}
            ${row('Drawn signature', rec.hasSignatureImage ? 'Attached (renter-signature.png)' : 'Not provided')}
          </table>
          ${rec.hasSignatureImage ? `<p style="font-family:sans-serif"><img src="${escapeHtml(b.signature)}" alt="signature" style="max-width:360px;border:1px solid #eee;border-radius:8px;background:#fff"/></p>` : ''}
          <p style="color:#888;font-size:12px;margin-top:20px;font-family:sans-serif">Submitted via the Camping Tent Rental page on sightseerscaribbean.com</p>`
      });

      return res.status(201).json({ ok: true, id: rec.id });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Tent rental error:', err && err.message, err && err.stack);
    return res.status(500).json({ error: err && err.message ? err.message : 'Something went wrong. Please try again.' });
  }
};
