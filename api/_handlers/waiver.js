/* Signed participant waivers.
   POST: the page builds the signed PDF in the browser and sends it here. We email a copy to the guest and to the team,
   and keep a short record (no medical answers) that shows in the Inbox and counts signatures per booking reference.
   GET (Inbox permission): the signed-waiver count for a booking reference, so the Team Lead can compare it to the headcount. */
const db = require('../_lib/db');
const { uid, escapeHtml, requirePerm } = require('../_lib/auth');
const { sendEmail } = require('../_lib/email');
const WAIVER = require('../_data/waiver.json');

const clip = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f]+/g, ' ').trim().slice(0, n);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const EVENT_IDS = WAIVER.events.map(e => e.id);

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method === 'GET') {
      const admin = await requirePerm(req, res, 'inbox');
      if (!admin) return;
      const ref = clip((req.query && req.query.ref) || new URL(req.url, 'http://x').searchParams.get('ref'), 40).toUpperCase();
      const all = await db.getCollection('signed-waivers');
      const list = (ref ? all.filter(w => w.ref === ref) : all).map(w => ({ id: w.id, name: w.name, ref: w.ref, event: w.event, company: w.company, createdAt: w.createdAt, medicalFlag: !!w.medicalFlag }));
      return res.status(200).json({ ok: true, count: list.length, waivers: list });
    }

    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const b = req.body || {};
    if (b.website) return res.status(200).json({ ok: true }); /* honeypot: bots fill hidden fields */

    const name = clip(b.name, 120), email = clip(b.email, 160).toLowerCase(), phone = clip(b.phone, 40);
    const event = EVENT_IDS.includes(b.event) ? b.event : 'general';
    const ev = WAIVER.events.find(e => e.id === event);
    const ref = clip(b.ref, 40).toUpperCase();
    const company = clip(b.company, 120);
    if (!name || !EMAIL_RE.test(email) || !phone) return res.status(400).json({ error: 'Name, a valid email and a phone number are required.' });
    if (b.agreed !== true || b.over18 !== true) return res.status(400).json({ error: 'You must agree to the waiver and confirm you are 18 or older.' });
    const pdf = typeof b.pdfBase64 === 'string' ? b.pdfBase64.replace(/^data:[^,]*,/, '') : '';
    if (!pdf || pdf.length < 2000 || pdf.slice(0, 5) !== 'JVBER') return res.status(400).json({ error: 'The signed PDF is missing. Please try again.' });
    if (pdf.length > 8000000) return res.status(413).json({ error: 'The signed PDF is too large.' });

    const safe = name.replace(/[^\w]+/g, '-').replace(/^-+|-+$/g, '') || 'guest';
    const attachments = [{ filename: 'Sight-Seers-Waiver-' + safe + '.pdf', content: pdf }];
    const medicalFlag = !!b.medicalFlag;
    const now = new Date();
    const when = now.toLocaleString('en-US', { timeZone: 'America/Jamaica' });
    const rec = { id: uid(), name, email, phone, event, ref, company, version: clip(b.version, 40) || WAIVER.version, medicalFlag, createdAt: now.toISOString() };
    await db.addToCollection('signed-waivers', rec);
    /* shows in the Inbox like any other message; the medical answers stay in the signed PDF only */
    await db.addToCollection('contact-messages', {
      id: uid(), userId: null, name, email, phone, subject: 'Signed waiver: ' + name + (ref ? ' (' + ref + ')' : ''),
      message: 'Signed waiver received.\nActivity: ' + ev.label + (ref ? '\nBooking reference: ' + ref : '') + (company ? '\nCompany or team: ' + company : '') +
        '\nMedical flag: ' + (medicalFlag ? 'YES, a medical answer needs the Team Lead\'s attention (see the signed PDF)' : 'no') + '\nWaiver version: ' + rec.version + '\nSigned: ' + when + '\nThe signed PDF was emailed to the team and to the guest.',
      status: 'new', createdAt: rec.createdAt
    });

    const row = (k, v) => v ? '<tr><td style="padding:8px;font-weight:bold;width:150px">' + k + '</td><td style="padding:8px">' + escapeHtml(v) + '</td></tr>' : '';
    const team = await sendEmail({
      replyTo: email,
      subject: 'Signed waiver: ' + escapeHtml(name) + (ref ? ' (' + escapeHtml(ref) + ')' : ''),
      html: '<h2 style="color:#0d5371">Signed participant waiver</h2><table style="border-collapse:collapse;width:100%;font-family:sans-serif">' +
        row('Name', name) + row('Email', email) + row('Phone', phone) + row('Activity', ev.label) + row('Booking reference', ref) + row('Company or team', company) +
        row('Medical flag', medicalFlag ? 'YES. Check the signed PDF before the day.' : 'No') + row('Signed', when) + '</table><p style="color:#0d5371;font-size:13px">The signed PDF is attached.</p>',
      attachments
    });
    const guest = await sendEmail({
      to: email,
      replyTo: 'info@sightseerscaribbean.com',
      subject: 'Your signed waiver: Sight Seers Caribbean Adventures',
      html: '<div style="font-family:sans-serif;max-width:560px;color:#17323f"><h2 style="color:#063a63">Thank you, ' + escapeHtml(name.split(' ')[0]) + '.</h2>' +
        '<p>We have your signed waiver for <b>' + escapeHtml(ev.label) + '</b>' + (ref ? ' (booking reference ' + escapeHtml(ref) + ')' : '') + '. Your signed copy is attached to this email. Please keep it for your records.</p>' +
        '<p style="font-size:13px;color:#5b6b76">If anything in it is wrong, reply to this email or contact us on +1 (876) 465-0630 or info@sightseerscaribbean.com.</p>' +
        '<p style="font-size:13px;color:#5b6b76">Sight Seers Caribbean Adventures</p></div>',
      attachments
    });
    const teamOk = !!(team && team.ok), guestOk = !!(guest && guest.ok);
    /* the record is saved either way; if the team email failed the guest is told to send the PDF themselves */
    if (!teamOk && !guestOk) return res.status(502).json({ error: 'Saved, but the emails could not be sent. Please download your PDF and email it to info@sightseerscaribbean.com.', saved: true, id: rec.id });
    return res.status(201).json({ ok: true, id: rec.id, teamCopy: teamOk, guestCopy: guestOk });
  } catch (err) {
    console.error('Waiver error:', err && err.message);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};
