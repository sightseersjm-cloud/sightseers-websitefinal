/**
 * api/_handlers/backup-cron.js
 * GET /api/backup-cron: saves the weekly backup of the website's content (see vercel.json "crons").
 * Vercel calls it with "Authorization: Bearer <CRON_SECRET>"; anything else is refused. The newest 8 weekly backups are kept.
 */
const crypto = require('crypto');
const backup = require('./backup');

function same(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

module.exports = async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return res.status(503).json({ error: 'The weekly backup is not configured.' });
  const given = String((req.headers && (req.headers.authorization || req.headers.Authorization)) || '');
  if (!same(given, 'Bearer ' + secret)) return res.status(401).json({ error: 'Not allowed.' });
  if (!process.env.BLOB_READ_WRITE_TOKEN) return res.status(503).json({ error: 'Website storage is not set up.' });
  try {
    const snap = await backup.saveWeekly();
    return res.status(200).json({ ok: true, backup: snap });
  } catch (e) {
    console.error('backup cron', e && e.stack || e);
    return res.status(500).json({ error: 'The weekly backup failed.' });
  }
};
