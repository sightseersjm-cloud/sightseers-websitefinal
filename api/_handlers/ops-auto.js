/**
 * api/_handlers/ops-auto.js
 * GET  /api/ops-auto : admin only. Switches, wording, what was sent lately, opt-outs, saved replies, this week's numbers.
 * POST /api/ops-auto : admin only. action = settings-save | preview | run | optout-add | optout-remove | reply-save | reply-delete
 * The daily job itself is started by the existing daily cron (api/club-cron), never by a visitor.
 */
const db = require('../_lib/db');
const { requireAdmin, uid } = require('../_lib/auth');
const ops = require('../_lib/ops-auto');
const { sendEmail } = require('../_lib/email');

const text = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, n);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const STARTER_REPLIES = [
  { id: 'starter-1', title: 'Thanks for your request', body: 'Hi {name},\n\nThanks for sending your request. We have it and one of our planners will be in touch shortly. The quickest way to move things along is a short call, you can choose a time here: https://calendly.com/sightseersjm/30min\n\nSight Seers Caribbean Adventures' },
  { id: 'starter-2', title: 'Next steps after the call', body: 'Hi {name},\n\nGreat speaking with you. As discussed, we will put your itinerary together and send it over. If anything changes in the meantime, just reply here.\n\nSight Seers Caribbean Adventures' },
  { id: 'starter-3', title: 'Waiver link', body: 'Hi {name},\n\nPlease have each traveller sign the participant waiver before the trip: https://www.sightseerscaribbean.com/waiver\n\nSight Seers Caribbean Adventures' }
];

async function repliesOf() {
  const list = await db.getCollection(ops.REPLIES);
  return list.length ? list : STARTER_REPLIES;
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'OPTIONS') return res.status(200).end();
    const user = requireAdmin(req, res);
    if (!user) return;

    if (req.method === 'GET') {
      const [settings, sent, optouts, replies] = await Promise.all([ops.getSettings(), db.getCollection(ops.SENT), db.getCollection(ops.OPTOUT), repliesOf()]);
      let preview = null;
      try { preview = await ops.runDaily({ dryRun: true, force: true }); } catch (e) { console.error('ops preview', e && e.message); }
      return res.status(200).json({
        ok: true, settings, templates: ops.DEFAULT_TEMPLATES,
        sent: sent.slice(-40).reverse(), optouts, replies,
        calendlyReady: !!process.env.CALENDLY_API_TOKEN, cronReady: !!process.env.CRON_SECRET,
        preview: preview ? { counts: preview.counts, followups: preview.followups, payments: preview.payments, waivers: preview.waivers, arrival: preview.arrival, review: preview.review, referrals: preview.referrals } : null
      });
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const body = req.body || {};
    const action = body.action;

    if (action === 'settings-save') {
      const s = await ops.saveSettings(body);
      return res.status(200).json({ ok: true, settings: s });
    }
    if (action === 'preview') {
      const to = text(user.email, 160);
      if (!EMAIL_RE.test(to)) return res.status(400).json({ error: 'Your admin account has no email address to send the sample to.' });
      const settings = await ops.getSettings();
      /* the wording being edited on screen can be tried before it is saved */
      if (body.templates) settings.templates = Object.assign({}, settings.templates, body.templates);
      const m = await ops.previewMail(text(body.kind, 40), to, settings);
      if (!m) return res.status(400).json({ error: 'Unknown email.' });
      const r = await sendEmail(m);
      if (r && r.ok === false) return res.status(502).json({ error: 'The sample did not go through. Try again.' });
      return res.status(200).json({ ok: true, to });
    }
    if (action === 'run') {
      /* an admin can run today's jobs now; switches still apply, and the same message is never sent twice */
      const s = await ops.runDaily({});
      return res.status(200).json({ ok: true, counts: s.counts });
    }
    if (action === 'optout-add') {
      const email = text(body.email, 160).toLowerCase();
      if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
      const list = await db.getCollection(ops.OPTOUT);
      if (!list.some(x => x.email === email)) await db.addToCollection(ops.OPTOUT, { id: uid(), email, at: new Date().toISOString() });
      return res.status(200).json({ ok: true });
    }
    if (action === 'optout-remove') {
      const email = text(body.email, 160).toLowerCase();
      const list = await db.getCollection(ops.OPTOUT);
      await db.setCollection(ops.OPTOUT, list.filter(x => x.email !== email));
      return res.status(200).json({ ok: true });
    }
    if (action === 'reply-save') {
      const title = text(body.title, 80), msg = text(body.body, 3000);
      if (!title || !msg) return res.status(400).json({ error: 'Give the reply a title and some text.' });
      let list = await db.getCollection(ops.REPLIES);
      if (!list.length) list = STARTER_REPLIES.slice();
      const id = text(body.id, 60);
      const i = id ? list.findIndex(x => x.id === id) : -1;
      if (i > -1) list[i] = { id, title, body: msg }; else list.push({ id: uid(), title, body: msg });
      await db.setCollection(ops.REPLIES, list.slice(0, 40));
      return res.status(200).json({ ok: true, replies: list });
    }
    if (action === 'reply-delete') {
      let list = await db.getCollection(ops.REPLIES);
      if (!list.length) list = STARTER_REPLIES.slice();
      list = list.filter(x => x.id !== text(body.id, 60));
      await db.setCollection(ops.REPLIES, list);
      return res.status(200).json({ ok: true, replies: list });
    }
    return res.status(400).json({ error: 'Unknown action' });
  } catch (err) {
    console.error('ops-auto error:', err && err.message);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};
