/**
 * Leaders in Jamaica: application fee waiver codes. One code per applicant, used once.
 *
 * Applicants (no sign-in):
 *   POST { action:'check',  code, email }        -> { ok:true, valid:true|false }   does not use the code up
 *   POST { action:'redeem', code, email, name }  -> { ok:true }                      uses it up, once, as the application is sent
 * Admin (needs the "inbox" permission):
 *   GET                                          -> { ok:true, codes:[...] }
 *   POST { action:'generate', name, email, note }-> { ok:true, code:{...} }
 *   POST { action:'revoke', id }                 -> { ok:true }                      unused codes only
 *
 * A code is tied to the applicant's email address: it only works with the email it was made for, and only one time, so
 * passing it on to someone else does nothing. Each visitor gets 10 checks an hour so codes cannot be guessed.
 */
const crypto = require('crypto');
const db = require('../_lib/db');
const { requirePerm, getUser, uid } = require('../_lib/auth');

const COLLECTION = 'leaders-waiver-codes';
const TRIES_DOC = 'leaders-waiver-tries';
const LIMIT = 10;
const WINDOW = 3600000;
// no 0/O/1/I/L so a code read out loud or copied from a message is not misread
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

const norm = s => String(s == null ? '' : s).toUpperCase().replace(/[^A-Z0-9]/g, '');
const mail = s => String(s == null ? '' : s).trim().toLowerCase().slice(0, 160);
const text = (s, n) => String(s == null ? '' : s).trim().slice(0, n);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function newCode() {
  let a = '', b = '';
  for (let i = 0; i < 4; i++) { a += ALPHABET[crypto.randomInt(ALPHABET.length)]; b += ALPHABET[crypto.randomInt(ALPHABET.length)]; }
  return 'LJ-' + a + '-' + b;
}

function who(req) {
  const ip = String((req.headers && (req.headers['x-forwarded-for'] || req.headers['x-real-ip'])) || (req.socket && req.socket.remoteAddress) || 'unknown').split(',')[0].trim();
  return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 24);
}

async function tooMany(req) {
  const key = who(req), now = Date.now();
  const all = (await db.getDoc(TRIES_DOC)) || {};
  const mine = (all[key] || []).filter(t => now - t < WINDOW);
  if (mine.length >= LIMIT) return true;
  mine.push(now);
  all[key] = mine;
  for (const k of Object.keys(all)) { if (k !== key) { all[k] = (all[k] || []).filter(t => now - t < WINDOW); if (!all[k].length) delete all[k]; } }
  await db.setDoc(TRIES_DOC, all);
  return false;
}

function status(c) { return c.usedAt ? 'used' : 'unused'; }
function shape(c) {
  return { id: c.id, code: c.code, name: c.name, email: c.email, note: c.note || '', createdAt: c.createdAt, createdBy: c.createdBy || '', status: status(c), usedAt: c.usedAt || '', usedByName: c.usedByName || '' };
}

/** The unused code for this applicant's email, or why it cannot be used. */
async function find(code, email) {
  const n = norm(code);
  if (!n) return { why: 'empty' };
  const list = await db.getCollection(COLLECTION);
  const c = list.find(x => norm(x.code) === n);
  if (!c) return { why: 'unknown' };
  if (c.usedAt) return { why: 'used' };
  if (mail(c.email) !== mail(email)) return { why: 'email' };
  return { c };
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method === 'GET') {
      const admin = await requirePerm(req, res, 'inbox');
      if (!admin) return;
      const list = (await db.getCollection(COLLECTION)).slice().sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
      return res.status(200).json({ ok: true, codes: list.map(shape) });
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const body = req.body || {};
    const action = body.action || 'check';

    if (action === 'generate' || action === 'revoke') {
      const admin = await requirePerm(req, res, 'inbox');
      if (!admin) return;
      if (action === 'revoke') {
        const list = await db.getCollection(COLLECTION);
        const c = list.find(x => x.id === body.id);
        if (!c) return res.status(404).json({ error: 'That code was not found.' });
        if (c.usedAt) return res.status(400).json({ error: 'That code has already been used, so it is kept as a record.' });
        await db.removeFromCollection(COLLECTION, c.id);
        return res.status(200).json({ ok: true });
      }
      const name = text(body.name, 120), email = mail(body.email);
      if (!name) return res.status(400).json({ error: 'Add the applicant\'s name.' });
      if (!EMAIL.test(email)) return res.status(400).json({ error: 'Add the email address the applicant will use on the application. The code only works with that address.' });
      const list = await db.getCollection(COLLECTION);
      let code = newCode();
      while (list.some(x => norm(x.code) === norm(code))) code = newCode();
      const u = getUser(req) || {};
      const item = { id: uid(), code, name, email, note: text(body.note, 200), createdAt: new Date().toISOString(), createdBy: text(u.name || u.email || '', 120), usedAt: '' };
      await db.addToCollection(COLLECTION, item);
      return res.status(200).json({ ok: true, code: shape(item) });
    }

    if (action !== 'check' && action !== 'redeem') return res.status(400).json({ error: 'Unknown action' });
    const code = text(body.code, 40), email = mail(body.email);
    if (!norm(code)) return res.status(400).json({ error: 'Please enter your code.' });
    if (!EMAIL.test(email)) return res.status(400).json({ error: 'Please fill in your email address on the first step, then enter the code.' });
    if (await tooMany(req)) return res.status(429).json({ error: 'Too many tries. Please wait an hour or contact us.' });

    const r = await find(code, email);
    if (action === 'check') {
      return res.status(200).json({ ok: true, valid: !!r.c, reason: r.c ? '' : r.why === 'used' ? 'used' : r.why === 'email' ? 'email' : 'unknown' });
    }
    if (!r.c) return res.status(409).json({ error: r.why === 'used' ? 'That code has already been used.' : 'That code could not be used with this email address.' });
    await db.updateInCollection(COLLECTION, r.c.id, { usedAt: new Date().toISOString(), usedByName: text(body.name, 120) });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('leaders-waiver error:', err);
    return res.status(500).json({ error: 'We could not check that code just now. Please try again.' });
  }
};
