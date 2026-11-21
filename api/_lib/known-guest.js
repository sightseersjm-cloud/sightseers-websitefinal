/**
 * api/_lib/known-guest.js
 * Guests who reached us through a form (a trip request, an application to lead a trip, a booking, a contact message,
 * a waiver, a planning request, the newsletter) but have no row in 'users' (for example their account was never
 * created, or the request was made before forms opened accounts). "Forgot password" can still email such a guest
 * a code: the code proves they own the address, and entering it creates their account with the password they choose.
 *
 * The pending code lives in its own collection, never in 'users', so asking for a code never rewrites the accounts.
 */
const crypto = require('crypto');
const db = require('./db');

const PENDING = 'password-resets';
const SOURCES = [
  ['club-interests', 'trip request'],
  ['club-applications', 'application'],
  ['bookings', 'booking'],
  ['signed-waivers', 'waiver'],
  ['planning-requests', 'planning request'],
  ['group-trips', 'group trip'],
  ['contact-messages', 'message'],
  ['newsletter-subscribers', 'newsletter']
];
const MAX_TRIES = 5;

function normEmail(v) { return String(v == null ? '' : v).trim().toLowerCase(); }
function recEmail(r) { return normEmail(r && (r.email || (r.contact && r.contact.email))); }
function recName(r) { return String((r && (r.name || (r.contact && r.contact.name))) || '').trim().slice(0, 100); }
function recPhone(r) { return String((r && (r.phone || (r.contact && r.contact.phone))) || '').trim().slice(0, 30); }
function hashCode(email, code) { return crypto.createHash('sha256').update(normEmail(email) + ':' + String(code).trim()).digest('hex'); }
function idFor(email) { return 'r_' + crypto.createHash('sha256').update(normEmail(email)).digest('hex').slice(0, 32); }

/* the newest record with this email, with the name and phone it gave, or null */
async function find(email) {
  const want = normEmail(email);
  if (!want) return null;
  const lists = await Promise.all(SOURCES.map(([col]) => db.getCollection(col).catch(() => [])));
  let best = null;
  lists.forEach((list, i) => {
    (list || []).forEach(r => {
      if (recEmail(r) !== want) return;
      const at = String(r.createdAt || r.at || '');
      const name = recName(r);
      if (!best || (name && !best.name) || (name && at > best.at)) best = { email: want, name, phone: recPhone(r), source: SOURCES[i][1], at };
    });
  });
  return best;
}

/* remember a code for a guest with no account (replacing an older one) */
async function savePending(guest, code, ttlMs) {
  const id = idFor(guest.email);
  const row = { id, email: guest.email, name: guest.name || '', phone: guest.phone || '', source: guest.source || '', codeHash: hashCode(guest.email, code), expires: Date.now() + ttlMs, tries: 0, createdAt: new Date().toISOString() };
  const cur = (await db.getCollection(PENDING)).find(x => x.id === id);
  if (cur) await db.updateInCollection(PENDING, id, row);
  else await db.addToCollection(PENDING, row);
  return row;
}

/* check a code for a guest with no account: { ok, guest } or { error } */
async function checkPending(email, code) {
  const id = idFor(email);
  const row = (await db.getCollection(PENDING)).find(x => x.id === id);
  if (!row) return { error: 'wrong' };
  if (!row.expires || Date.now() > row.expires) return { error: 'expired' };
  if ((row.tries || 0) >= MAX_TRIES) return { error: 'tries' };
  const a = Buffer.from(hashCode(email, code)), b = Buffer.from(String(row.codeHash || ''));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    await db.updateInCollection(PENDING, id, { tries: (row.tries || 0) + 1 });
    return { error: 'wrong' };
  }
  return { ok: true, guest: row };
}

async function clearPending(email) {
  try { await db.removeFromCollection(PENDING, idFor(email)); } catch (e) { /* it expires anyway */ }
}

module.exports = { find, savePending, checkPending, clearPending, normEmail, MAX_TRIES, PENDING };
