/**
 * api/_lib/points.js
 * Travel Points, kept on the account (not in the browser). Every award is a line in a ledger with its own key, so the same action
 * can never be paid twice. A member's balance is the sum of their ledger, plus any starting allowance for Sight Seers' own accounts
 * and the showcase account.
 */
const db = require('./db');
const { uid } = require('./auth');

const LEDGER = 'points-ledger';
const RULES = { welcome: 100, save: 10, cart: 25, request: 25, trip: 100, review: 25, referral: 100 };
const LABELS = {
  welcome: 'Welcome bonus', save: 'Saved a tour', cart: 'Added to your cart', request: 'Sent a booking request', trip: 'Finished a trip',
  review: 'Review published', referral: 'A friend you invited travelled', referred: 'Joined through a friend', adjust: 'Added by the Sight Seers team'
};
const EARNABLE = { save: 1, cart: 1 };           /* actions a member does on the website; everything else is worked out from records */
const clampRule = v => Math.min(2000, Math.max(0, Math.round(Number(v)) || 0));

async function rulesNow() {
  const doc = (await db.getDoc('ops-auto-settings')) || {};
  const out = Object.assign({}, RULES), r = doc.pointRules || {};
  if (r.referral === undefined && doc.referralPoints !== undefined) out.referral = clampRule(doc.referralPoints);
  Object.keys(RULES).forEach(k => { if (r[k] !== undefined) out[k] = clampRule(r[k]); });
  return out;
}

/* one award, once: returns the entry, or null if that key was already paid */
async function award(userId, type, key, opts) {
  opts = opts || {};
  const id = userId + ':' + key;
  const list = await db.getCollection(LEDGER);
  if (list.some(x => x.id === id)) return null;
  const rules = await rulesNow();
  const pts = opts.points != null ? Math.round(Number(opts.points)) : (rules[type] || 0);
  if (!pts) return null;
  const entry = { id, userId, type, points: pts, note: String(opts.note || '').slice(0, 140), at: opts.at || new Date().toISOString() };
  await db.addToCollection(LEDGER, entry);
  return entry;
}

/* the points a member has earned from their records: a welcome bonus, finished trips, booking requests, published reviews */
async function sync(user, now) {
  if (!user || !user.id) return;
  const verified = require('./verified');
  await award(user.id, 'welcome', 'welcome', { at: user.createdAt });
  const email = String(user.email || '').trim().toLowerCase();
  const bookings = await db.getCollection('bookings');
  for (const b of bookings) {
    if (!(b.userId === user.id || String(b.email || '').trim().toLowerCase() === email) || b.status === 'cancelled') continue;
    await award(user.id, 'request', 'request:' + b.id, { note: String(b.tourName || b.stayName || '').slice(0, 80), at: b.createdAt });
  }
  for (const f of await verified.finishedFor(user, now)) await award(user.id, 'trip', 'trip:' + f.refKey, { note: f.title, at: f.end ? f.end + 'T12:00:00.000Z' : undefined });
  const reviews = await db.getCollection('reviews');
  for (const r of reviews) if (r.userId === user.id && r.status === 'approved') await award(user.id, 'review', 'review:' + r.id, { note: r.title, at: r.moderatedAt || r.createdAt });
}

async function summary(user, opts) {
  opts = opts || {};
  if (!user || !user.id) return { balance: 0, history: [] };
  if (!opts.skipSync) { try { await sync(user, opts.now); } catch (e) { console.error('points sync', e && e.message); } }
  const list = (await db.getCollection(LEDGER)).filter(x => x.userId === user.id);
  const floor = (await require('./verified').statusFor(user, opts.now)).pointsFloor || 0;   /* allowance + any older referral bonus */
  const sum = list.reduce((n, x) => n + x.points, 0);
  const history = list.slice().sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, 15).map(x => ({ label: LABELS[x.type] || 'Travel Points', note: x.note, points: x.points, at: x.at }));
  return { balance: Math.max(0, sum + floor), history };
}

/* a member's own website actions (saving a tour, adding to the cart): once per item */
async function earn(user, type, ref) {
  if (!EARNABLE[type]) return { error: 'Unknown action.' };
  const r = String(ref || '').replace(/[^\w .:-]/g, '').slice(0, 60);
  if (!r) return { error: 'Missing item.' };
  const e = await award(user.id, type, type + ':' + r, { note: '' });
  const s = await summary(user, { skipSync: true });
  return { awarded: e ? e.points : 0, balance: s.balance };
}

/* an admin gives or takes back points (a negative number takes back) */
async function adjust(userId, points, note) {
  const p = Math.max(-100000, Math.min(100000, Math.round(Number(points)) || 0));
  if (!p) return { error: 'Enter a number of points above or below zero.' };
  const e = await award(userId, 'adjust', 'adjust:' + uid(), { points: p, note });
  return { entry: e };
}

module.exports = { RULES, LABELS, LEDGER, rulesNow, award, sync, summary, earn, adjust, clampRule };
