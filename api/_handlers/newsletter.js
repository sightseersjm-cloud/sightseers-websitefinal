/**
 * api/_handlers/newsletter.js
 *   POST { action:'subscribe', email, source }         anyone: join the newsletter list (the box at the bottom of the home page)
 *   GET  ?admin=1                                      admin: the list (also in the Travel Club admin data)
 *   POST { action:'status', id, status }               admin: mark someone unsubscribed or subscribed again
 *   POST { action:'delete', id }                       admin: remove someone from the list entirely
 *   GET  ?unsub=<id>&k=<signature>                     the unsubscribe link for newsletters: takes that address off the list
 */
const news = require('../_lib/newsletter');
const { requireAdmin, getUser, escapeHtml } = require('../_lib/auth');
const { sendEmail } = require('../_lib/email');

const hits = new Map();
function allow(key, max, windowMs) {
  const now = Date.now(), rec = hits.get(key);
  if (!rec || now - rec.start > windowMs) { hits.set(key, { start: now, count: 1 }); return true; }
  rec.count++;
  return rec.count <= max;
}
function ip(req) { return String((req.headers && (req.headers['x-forwarded-for'] || req.headers['x-real-ip'])) || '').split(',')[0].trim() || 'unknown'; }
function page(res, ok) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  const msg = ok ? 'You will not get the Sight Seers newsletter any more. You can subscribe again on our website at any time.' : 'That link did not work. Reply to any of our emails and we will take you off the list.';
  return res.status(ok ? 200 : 400).end('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sight Seers</title><body style="margin:0;font-family:Arial,sans-serif;background:#f4f8fb;color:#062e4b"><div style="max-width:520px;margin:12vh auto;padding:28px;background:#fff;border-top:4px solid #ef8731"><h1 style="font-size:22px;margin:0 0 12px">' + (ok ? 'You are unsubscribed' : 'Something went wrong') + '</h1><p style="line-height:1.6;color:#4a5d6e">' + msg + '</p><p><a href="/" style="color:#d96f12;font-weight:bold">Go to sightseerscaribbean.com</a></p></div></body>');
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'OPTIONS') return res.status(200).end();
    const url = new URL(req.url || '/', 'http://x');
    const q = Object.assign(Object.fromEntries(url.searchParams), req.query || {});

    if (req.method === 'GET') {
      if (q.unsub) return page(res, (await news.unsubscribeLink(String(q.unsub).slice(0, 80), String(q.k || '').slice(0, 64))).ok);
      const admin = requireAdmin(req, res);
      if (!admin) return;
      return res.status(200).json({ ok: true, subscribers: await news.list() });
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const body = req.body || {};

    if (body.action === 'subscribe') {
      if (body.website) return res.status(200).json({ ok: true });            /* a bot filled the hidden box */
      if (!allow('news:' + ip(req), 8, 10 * 60 * 1000)) return res.status(429).json({ error: 'Too many tries. Please wait a few minutes.' });
      const user = getUser(req);
      const r = await news.subscribe({ email: body.email, name: body.name || (user && user.name) || '', source: body.source, userId: user && user.id !== 'admin-passcode' ? user.id : null });
      if (r.error) return res.status(400).json({ error: r.error });
      if (r.rec) {
        try {
          await sendEmail({ replyTo: r.rec.email, subject: 'New newsletter subscriber: ' + escapeHtml(r.rec.email), html: '<h2 style="color:#0d5371">New newsletter subscriber</h2><p><b>' + escapeHtml(r.rec.email) + '</b> subscribed' + (r.rec.source ? ' on ' + escapeHtml(r.rec.source) : '') + '.</p><p>See the whole list, and download it, in the Travel Club admin, Newsletter tab.</p>' });
        } catch (e) { console.error('newsletter notice', e && e.message); }
      }
      return res.status(200).json({ ok: true, already: !!r.already, back: !!r.back });
    }

    const admin = requireAdmin(req, res);
    if (!admin) return;
    const id = String(body.id || '').slice(0, 80);
    if (body.action === 'status') {
      const saved = await news.setStatus(id, body.status === 'subscribed' ? 'subscribed' : 'unsubscribed');
      if (!saved) return res.status(404).json({ error: 'Subscriber not found.' });
      return res.status(200).json({ ok: true, subscriber: saved });
    }
    if (body.action === 'delete') {
      const done = await news.remove(id);
      if (!done) return res.status(404).json({ error: 'Subscriber not found.' });
      return res.status(200).json({ ok: true });
    }
    return res.status(400).json({ error: 'Unknown action.' });
  } catch (e) {
    console.error('newsletter', e && e.message);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};
