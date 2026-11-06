/**
 * Leaders in Jamaica: application fee waiver codes.
 *
 * POST /api/leaders-waiver  { code }  ->  { ok: true, valid: true|false }
 *
 * Codes live in the LEADERS_WAIVER_CODES environment variable (comma, semicolon or space separated), so they are never
 * in the page source and can be changed without a deploy of new code. Matching ignores case and spaces. Each address is
 * limited to 10 checks an hour so codes cannot be guessed.
 */
const crypto = require('crypto');
const db = require('../_lib/db');

const DOC = 'leaders-waiver-tries';
const LIMIT = 10;
const WINDOW = 3600000;

function norm(s) { return String(s == null ? '' : s).toUpperCase().replace(/[^A-Z0-9]/g, ''); }

function codes() {
  return String(process.env.LEADERS_WAIVER_CODES || '').split(/[,;\s]+/).map(norm).filter(Boolean);
}

function same(a, b) {
  const x = crypto.createHash('sha256').update(a).digest();
  const y = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(x, y);
}

function who(req) {
  const ip = String((req.headers && (req.headers['x-forwarded-for'] || req.headers['x-real-ip'])) || (req.socket && req.socket.remoteAddress) || 'unknown').split(',')[0].trim();
  return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 24);
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const entered = norm((req.body || {}).code);
    if (!entered || entered.length > 40) return res.status(400).json({ error: 'Please enter your code.' });

    const key = who(req), now = Date.now();
    const all = (await db.getDoc(DOC)) || {};
    const mine = (all[key] || []).filter(t => now - t < WINDOW);
    if (mine.length >= LIMIT) return res.status(429).json({ error: 'Too many tries. Please wait an hour or contact us.' });
    mine.push(now);
    all[key] = mine;
    for (const k of Object.keys(all)) { if (k !== key) { all[k] = (all[k] || []).filter(t => now - t < WINDOW); if (!all[k].length) delete all[k]; } }
    await db.setDoc(DOC, all);

    let valid = false;
    for (const c of codes()) { if (same(entered, c)) valid = true; }
    return res.status(200).json({ ok: true, valid });
  } catch (err) {
    console.error('leaders-waiver error:', err);
    return res.status(500).json({ error: 'We could not check that code just now. Please try again.' });
  }
};
