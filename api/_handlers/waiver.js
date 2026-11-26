/* Signed participant waivers.
   POST: the page builds the signed PDF in the browser and sends it here. We email a copy to the guest and to the team,
   and keep a short record (no medical answers) that shows in the Inbox and counts signatures per booking reference.
   GET (Inbox permission): the signed-waiver count for a booking reference, so the Team Lead can compare it to the headcount.
   GET ?admin=1 (Inbox permission): every signed waiver and every invite sent. GET ?id=...&pdf=1: the stored signed PDF.
   POST { action:'invite' } (Inbox permission): email people a link to sign, for a trip or any activity, and track who has signed.
   A waiver signed for a trip request marks that traveller's Forms as done on the roster. The signed PDF is stored privately. */
const db = require('../_lib/db');
const { uid, escapeHtml, requirePerm } = require('../_lib/auth');
const { sendEmail } = require('../_lib/email');
const { WAIVER } = require('../_lib/waiver');
const { put, get } = require('@vercel/blob');

const SITE = () => String(process.env.SITE_URL || 'https://www.sightseerscaribbean.com').replace(/\/+$/, '');
const PDF_PATH = id => 'ss-data/waivers/' + String(id).replace(/[^\w-]/g, '') + '.pdf';
const INVITES = 'waiver-invites';

const clip = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f]+/g, ' ').trim().slice(0, n);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const EVENT_IDS = WAIVER.events.map(e => e.id);

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method === 'GET') {
      const admin = await requirePerm(req, res, 'inbox');
      if (!admin) return;
      const q = new URL(req.url, 'http://x').searchParams;
      if (q.get('id') && q.get('pdf')) {
        const w = (await db.getCollection('signed-waivers')).find(x => x.id === q.get('id'));
        if (!w) return res.status(404).json({ error: 'We could not find that waiver.' });
        let file = null;
        try { file = await get(PDF_PATH(w.id), { access: 'private', useCache: false }); } catch (e) { file = null; }
        if (!file || !file.stream) return res.status(404).json({ error: 'The signed PDF for this waiver was not stored (it was signed before copies were kept). It was emailed to the team.' });
        const buf = Buffer.from(await new Response(file.stream).arrayBuffer());
        const fname = 'Sight-Seers-Waiver-' + (String(w.name).replace(/[^\w]+/g, '-').replace(/^-+|-+$/g, '') || 'guest') + '.pdf';
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="' + fname + '"');
        return res.status(200).send(buf);
      }
      if (q.get('admin')) {
        const [ws, inv] = await Promise.all([db.getCollection('signed-waivers'), db.getCollection(INVITES)]);
        const waivers = ws.slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
          .map(w => ({ id: w.id, name: w.name, email: w.email, phone: w.phone || '', event: w.event, eventLabel: (WAIVER.events.find(e => e.id === w.event) || {}).label || w.event, ref: w.ref || '', company: w.company || '', tripSlug: w.tripSlug || '', tripTitle: w.tripTitle || '', createdAt: w.createdAt, medicalFlag: !!w.medicalFlag, hasPdf: !!w.pdfStored, version: w.version || '' }));
        const invites = inv.slice().sort((a, b) => String(b.sentAt).localeCompare(String(a.sentAt)));
        const events = WAIVER.events.map(e => ({ id: e.id, label: e.label }));
        const trips = (await db.getCollection('club-trips')).filter(t => t.status !== 'draft' && t.status !== 'archived').map(t => ({ slug: t.slug, title: t.title }));
        return res.status(200).json({ ok: true, waivers, invites, events, trips });
      }
      const ref = clip((req.query && req.query.ref) || new URL(req.url, 'http://x').searchParams.get('ref'), 40).toUpperCase();
      const all = await db.getCollection('signed-waivers');
      const list = (ref ? all.filter(w => w.ref === ref) : all).map(w => ({ id: w.id, name: w.name, ref: w.ref, event: w.event, company: w.company, createdAt: w.createdAt, medicalFlag: !!w.medicalFlag }));
      return res.status(200).json({ ok: true, count: list.length, waivers: list });
    }

    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const b = req.body || {};
    if (b.action === 'invite') return invite(req, res, b);
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
    const tripSlug = clip(b.tripSlug, 120), interestRef = clip(b.interestRef, 40).toUpperCase();
    const rec = { id: uid(), name, email, phone, event, ref, company, version: clip(b.version, 40) || WAIVER.version, medicalFlag, createdAt: now.toISOString() };
    /* keep the signed PDF privately on the platform so the team can open it from the admin portal */
    try {
      await put(PDF_PATH(rec.id), Buffer.from(pdf, 'base64'), { access: 'private', contentType: 'application/pdf', addRandomSuffix: false, allowOverwrite: true });
      rec.pdfStored = true;
    } catch (e) { console.error('Waiver PDF not stored:', e && e.message); }
    /* tie it to the trip request it was signed for, so the roster shows Forms done */
    let linked = null;
    try {
      const [interests, trips] = await Promise.all([db.getCollection('club-interests'), db.getCollection('club-trips')]);
      const mine = interests.filter(i => i.email === email && i.status !== 'cancelled');
      linked = (interestRef && mine.find(i => i.ref === interestRef)) || (tripSlug && mine.find(i => i.tripSlug === tripSlug)) || null;
      if (linked) {
        const t = trips.find(x => x.id === linked.tripId);
        rec.tripSlug = linked.tripSlug || tripSlug; rec.tripTitle = linked.tripTitle || (t && t.title) || ''; rec.interestRef = linked.ref;
        await db.updateInCollection('club-interests', linked.id, { formsDone: true, waiverSignedAt: rec.createdAt, waiverId: rec.id });
      } else if (tripSlug) { rec.tripSlug = tripSlug; const t = trips.find(x => x.slug === tripSlug); rec.tripTitle = t ? t.title : ''; }
    } catch (e) { console.error('Waiver not linked to a trip request:', e && e.message); }
    await db.addToCollection('signed-waivers', rec);
    /* mark any invite sent to this email for the same activity as signed */
    try {
      const inv = await db.getCollection(INVITES);
      let changed = false;
      inv.forEach(x => { if (!x.signedAt && x.email === email && (x.event === event || (x.tripSlug && x.tripSlug === rec.tripSlug))) { x.signedAt = rec.createdAt; x.waiverId = rec.id; changed = true; } });
      if (changed) await db.setCollection(INVITES, inv);
    } catch (e) { /* invites are only a tracker */ }
    /* shows in the Inbox like any other message; the medical answers stay in the signed PDF only */
    await db.addToCollection('contact-messages', {
      id: uid(), userId: null, name, email, phone, subject: 'Signed waiver: ' + name + (ref ? ' (' + ref + ')' : ''),
      message: 'Signed waiver received.\nActivity: ' + ev.label + (ref ? '\nBooking reference: ' + ref : '') + (company ? '\nCompany or team: ' + company : '') +
        (rec.tripTitle ? '\nTrip: ' + rec.tripTitle : '') + '\nMedical flag: ' + (medicalFlag ? 'YES, a medical answer needs the Team Lead\'s attention (see the signed PDF)' : 'no') + '\nWaiver version: ' + rec.version + '\nSigned: ' + when + '\nThe signed PDF was emailed to the team and to the guest.',
      status: 'new', createdAt: rec.createdAt
    });

    const row = (k, v) => v ? '<tr><td style="padding:8px;font-weight:bold;width:150px">' + k + '</td><td style="padding:8px">' + escapeHtml(v) + '</td></tr>' : '';
    const team = await sendEmail({
      replyTo: email,
      subject: 'Signed waiver: ' + escapeHtml(name) + (ref ? ' (' + escapeHtml(ref) + ')' : ''),
      html: '<h2 style="color:#0d5371">Signed participant waiver</h2><table style="border-collapse:collapse;width:100%;font-family:sans-serif">' +
        row('Name', name) + row('Email', email) + row('Phone', phone) + row('Activity', ev.label) + row('Trip', rec.tripTitle) + row('Booking reference', ref) + row('Trip', rec.tripTitle) + row('Company or team', company) +
        row('Medical flag', medicalFlag ? 'YES. Check the signed PDF before the day.' : 'No') + row('Signed', when) + '</table><p style="color:#0d5371;font-size:13px">The signed PDF is attached.</p>',
      attachments
    });
    const guest = await sendEmail({
      to: email,
      replyTo: 'info@sightseerscaribbean.com',
      subject: 'Your signed waiver: Sight Seers Caribbean Adventures',
      html: '<div style="font-family:sans-serif;max-width:560px;color:#17323f"><h2 style="color:#063a63">Thank you, ' + escapeHtml(name.split(' ')[0]) + '.</h2>' +
        '<p>We have your signed waiver for <b>' + escapeHtml(ev.label) + '</b>' + (ref ? ' (booking reference ' + escapeHtml(ref) + ')' : '') + '. Your signed copy is attached to this email. Please keep it for your records. Sight Seers keeps a signed copy on file too.</p>' +
        '<p style="font-size:13px;color:#5b6b76">If anything in it is wrong, reply to this email or contact us on +1 (876) 465-0630 (Jamaica), +1 (347) 291-6868 (US) or info@sightseerscaribbean.com.</p>' +
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

/* Type one or more email addresses and we send each a personal link to sign. Used for people who have not signed from their Travel Club dashboard. */
async function invite(req, res, b) {
  const admin = await requirePerm(req, res, 'inbox');
  if (!admin) return;
  const emails = Array.from(new Set(String(b.emails || '').split(/[\s,;]+/).map(x => x.trim().toLowerCase()).filter(Boolean)));
  if (!emails.length) return res.status(400).json({ error: 'Type at least one email address.' });
  const bad = emails.filter(x => !EMAIL_RE.test(x));
  if (bad.length) return res.status(400).json({ error: 'These do not look like email addresses: ' + bad.slice(0, 5).join(', ') });
  if (emails.length > 40) return res.status(400).json({ error: 'Please send 40 or fewer at a time.' });
  let event = EVENT_IDS.includes(b.event) ? b.event : 'general';
  let tripSlug = clip(b.tripSlug, 120), tripTitle = '';
  if (tripSlug) {
    const t = (await db.getCollection('club-trips')).find(x => x.slug === tripSlug);
    if (!t) return res.status(400).json({ error: 'We could not find that trip.' });
    tripTitle = t.title;
    if (!EVENT_IDS.includes(b.event)) event = /summit/i.test(t.slug + ' ' + t.title) ? 'summit' : 'group-trip';
  }
  const ev = WAIVER.events.find(e => e.id === event);
  const note = clip(b.note, 600);
  const out = [];
  const signedAll = await db.getCollection('signed-waivers');
  for (const email of emails) {
    /* already signed this activity or trip: nothing to send, just note it as signed */
    const done = signedAll.find(w => w.email === email && (w.event === event || (tripSlug && w.tripSlug === tripSlug)));
    let sentOk = false;
    if (!done) {
      const qs = 'event=' + encodeURIComponent(event) + (tripSlug ? '&trip=' + encodeURIComponent(tripSlug) : '') + '&email=' + encodeURIComponent(email);
      const link = SITE() + '/waiver?' + qs;
      const r = await sendEmail({
        to: email,
        replyTo: 'info@sightseerscaribbean.com',
        subject: 'Please sign your waiver: ' + (tripTitle || ev.label),
        html: '<div style="font-family:sans-serif;max-width:560px;color:#17323f"><h2 style="color:#063a63">Your waiver, please</h2>' +
          '<p>Before you join <b>' + escapeHtml(tripTitle || ev.label) + '</b>, we need your signed participant waiver. It takes about five minutes and you can do it on your phone.</p>' +
          (note ? '<p>' + escapeHtml(note) + '</p>' : '') +
          '<p style="margin:22px 0"><a href="' + link + '" style="background:#0d5371;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:bold;display:inline-block">Sign my waiver</a></p>' +
          '<p style="font-size:13px;color:#5b6b76">When you sign, a copy of your signed waiver is emailed to you. Questions? Reply to this email or call +1 (876) 465-0630 (Jamaica) or +1 (347) 291-6868 (US).</p>' +
          '<p style="font-size:13px;color:#5b6b76">Sight Seers Caribbean Adventures</p></div>'
      });
      sentOk = !!(r && r.ok);
    }
    const row = { id: uid(), email, event, eventLabel: ev.label, tripSlug, tripTitle, note, sentAt: new Date().toISOString(), sentBy: admin.name || admin.email || '', sentOk: done ? false : sentOk };
    if (done) { row.signedAt = done.createdAt; row.waiverId = done.id; }
    await db.addToCollection(INVITES, row);
    out.push({ email, sent: sentOk, alreadySigned: !!done });
  }
  const failed = out.filter(x => !x.sent && !x.alreadySigned).length;
  const sentN = out.filter(x => x.sent).length;
  return res.status(failed && !sentN && failed === out.length ? 502 : 200).json({ ok: true, results: out, sent: sentN, failed, alreadySigned: out.filter(x => x.alreadySigned).length });
}
