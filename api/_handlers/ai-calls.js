/**
 * AI calls: leads who agreed to be called, the admin "Call now" action, and the provider's end-of-call report.
 * Everything here is admin-only except the webhook, which is checked with a shared secret.
 * The safeguards live in api/_lib/ai-calls.js and run on every call.
 */
const db = require('../_lib/db');
const { requireAdmin, uid, escapeHtml } = require('../_lib/auth');
const { sendEmail } = require('../_lib/email');
const ai = require('../_lib/ai-calls');

const CALLS = 'ai-calls';
const DNC = 'call-dnc';
const SETTINGS = 'ai-call-settings';
const text = (v, n) => String(v == null ? '' : v).trim().slice(0, n);

async function settingsOf() {
  return Object.assign({}, ai.DEFAULTS, (await db.getDoc(SETTINGS)) || {});
}

async function addDnc(phone, reason) {
  const list = await db.getCollection(DNC);
  if (list.some(x => x.phone === phone)) return false;
  await db.addToCollection(DNC, { id: uid(), phone, reason: text(reason, 120), at: new Date().toISOString() });
  return true;
}

/* called from the booking handler: only a request with the consent box ticked and a usable number joins the queue */
async function enqueueFromBooking(booking) {
  if (!booking || !booking.callConsent || !booking.callConsentAt) return null;
  const phone = ai.normalizePhone(booking.phone);
  if (!phone) return null;
  if (ai.onDnc(await db.getCollection(DNC), phone)) return null;
  const existing = (await db.getCollection(CALLS)).find(c => c.bookingId === booking.id);
  if (existing) return existing;
  const rec = {
    id: uid(), bookingId: booking.id, name: text(booking.name, 120), email: text(booking.email, 160), phone,
    trip: text(booking.tourName, 160),
    dates: [booking.date, booking.endDate].filter(Boolean).join(' to '),
    guests: booking.guests || '', budget: '', notes: text(booking.notes, 400),
    consentAt: booking.callConsentAt, status: 'pending', attempts: 0, outcome: '', summary: '',
    createdAt: new Date().toISOString()
  };
  await db.addToCollection(CALLS, rec);
  return rec;
}

async function handleWebhook(req, res) {
  const secret = process.env.AI_CALL_WEBHOOK_SECRET || '';
  const sent = req.headers['x-vapi-secret'] || req.headers['x-webhook-secret'] || '';
  if (!ai.secretOk(sent, secret)) return res.status(401).json({ error: 'Not allowed.' });
  const rep = ai.readReport(req.body);
  if (!rep.isReport) return res.status(200).json({ ok: true, ignored: true });
  const calls = await db.getCollection(CALLS);
  const call = calls.find(c => (rep.id && c.id === rep.id) || (rep.providerCallId && c.providerCallId === rep.providerCallId));
  if (!call) return res.status(404).json({ error: 'No call matches this report.' });
  const patch = { status: 'completed', outcome: rep.outcome || call.outcome || '', summary: rep.summary || call.summary || '', endedReason: rep.endedReason, endedAt: new Date().toISOString() };
  await db.updateInCollection(CALLS, call.id, patch);
  if (patch.outcome === 'do_not_call') await addDnc(call.phone, 'asked not to be called');
  if (['interested', 'booked_call', 'call_back_later'].indexOf(patch.outcome) > -1) {
    try {
      await sendEmail({
        subject: 'AI call result: ' + (call.name || 'a lead') + ' (' + patch.outcome.replace(/_/g, ' ') + ')',
        html: '<h2 style="color:#0d5371">AI call result</h2><p><b>' + escapeHtml(call.name) + '</b> &middot; ' + escapeHtml(call.phone) + ' &middot; ' + escapeHtml(call.email) + '</p>' +
          '<p>Trip: ' + escapeHtml(call.trip) + (call.dates ? ' (' + escapeHtml(call.dates) + ')' : '') + '</p>' +
          '<p>Outcome: <b>' + escapeHtml(patch.outcome.replace(/_/g, ' ')) + '</b></p><p>' + escapeHtml(patch.summary || 'No summary was sent.') + '</p>'
      });
    } catch (e) { console.error('ai call email', e && e.message); }
  }
  return res.status(200).json({ ok: true });
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method === 'POST' && req.query && req.query.webhook) return await handleWebhook(req, res);

    const user = requireAdmin(req, res);
    if (!user) return;

    if (req.method === 'GET') {
      const [calls, dnc, settings] = await Promise.all([db.getCollection(CALLS), db.getCollection(DNC), settingsOf()]);
      return res.status(200).json({
        ok: true, settings, dnc,
        calls: calls.slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))),
        providerReady: ai.providerConfigured(), inWindow: ai.inCallWindow(new Date())
      });
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const body = req.body || {};
    const action = body.action;

    if (action === 'settings-save') {
      const s = {
        enabled: body.enabled === true,
        dailyCap: Math.min(100, Math.max(1, parseInt(body.dailyCap, 10) || ai.DEFAULTS.dailyCap)),
        maxAttempts: Math.min(3, Math.max(1, parseInt(body.maxAttempts, 10) || ai.DEFAULTS.maxAttempts))
      };
      await db.setDoc(SETTINGS, s);
      return res.status(200).json({ ok: true, settings: s });
    }

    if (action === 'start') {
      const calls = await db.getCollection(CALLS);
      const call = calls.find(c => c.id === text(body.id, 80));
      if (!call) return res.status(404).json({ error: 'That lead was not found.' });
      const reason = ai.blockReason(call, { settings: await settingsOf(), dnc: await db.getCollection(DNC), calls, now: new Date() });
      if (reason) return res.status(400).json({ error: reason });
      const now = new Date().toISOString();
      try {
        const out = await ai.placeCall(call, process.env);
        const upd = await db.updateInCollection(CALLS, call.id, { status: 'calling', attempts: (call.attempts || 0) + 1, lastCallAt: now, providerCallId: out.providerCallId, startedBy: user.id });
        return res.status(200).json({ ok: true, call: upd });
      } catch (e) {
        await db.updateInCollection(CALLS, call.id, { status: 'failed', lastCallAt: now, failNote: text(e && e.message, 200) });
        return res.status(502).json({ error: 'The call could not be started: ' + text(e && e.message, 200) });
      }
    }

    if (action === 'skip') {
      const upd = await db.updateInCollection(CALLS, text(body.id, 80), { status: 'skipped' });
      if (!upd) return res.status(404).json({ error: 'That lead was not found.' });
      return res.status(200).json({ ok: true, call: upd });
    }

    if (action === 'dnc-add') {
      const phone = ai.normalizePhone(body.phone);
      if (!phone) return res.status(400).json({ error: 'Enter a phone number with its area code.' });
      await addDnc(phone, body.reason || 'added by an admin');
      return res.status(200).json({ ok: true });
    }

    if (action === 'dnc-remove') {
      const phone = ai.normalizePhone(body.phone);
      await db.setCollection(DNC, (await db.getCollection(DNC)).filter(x => x.phone !== phone));
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'Unknown action.' });
  } catch (e) {
    console.error('ai-calls', e && e.message);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};
module.exports.enqueueFromBooking = enqueueFromBooking;
