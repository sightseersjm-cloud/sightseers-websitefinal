/**
 * api/_handlers/club-cron.js
 * GET /api/club-cron: the Travel Club's daily job (see vercel.json "crons").
 * Vercel calls it with "Authorization: Bearer <CRON_SECRET>"; anything else is refused, so nobody can trigger the emails by visiting the address.
 * It does the waitlist check, the countdown reminders and (on Mondays) the leader digest, each only if the owner has switched it on.
 */
const crypto = require('crypto');
const auto = require('../_lib/club-auto');

function same(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

module.exports = async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return res.status(503).json({ error: 'The daily job is not configured.' });
  const given = String((req.headers && (req.headers.authorization || req.headers.Authorization)) || '');
  if (!same(given, 'Bearer ' + secret)) return res.status(401).json({ error: 'Not allowed.' });
  try {
    const summary = await auto.runDaily({});
    return res.status(200).json({ ok: true, at: summary.at, counts: summary.counts });
  } catch (e) {
    console.error('club cron', e && e.stack || e);
    return res.status(500).json({ error: 'The daily job failed.' });
  }
};
