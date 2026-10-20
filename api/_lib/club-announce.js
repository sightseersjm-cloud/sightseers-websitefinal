/**
 * api/_lib/club-announce.js
 * "Be first to hear about new trips": the people who left their email under the departures (club-interests with no trip)
 * get one email when a trip opens, with the trip's details and a button to see it and ask to join.
 *
 *  - It goes out once per trip (the trip is marked before anything is sent, so a retry never doubles it).
 *  - The owner switches it on or off with the other automatic emails (club-settings 'automation', newTrips), and can send it
 *    by hand for a trip that was already open.
 *  - Every email has its own one-click unsubscribe link, signed so nobody can take someone else off the list.
 *  - Each person gets their own email, so nobody sees anyone else's address.
 */
const crypto = require('crypto');
const db = require('./db');
const { sendBatch, BUSINESS_EMAIL } = require('./email');
const trip = require('./trip');
const auto = require('./club-auto');

const TRIPS = 'club-trips';
const INTERESTS = 'club-interests';
const SITE = auto.helpers.SITE;
const SECRET = process.env.JWT_SECRET || process.env.BLOB_READ_WRITE_TOKEN || '';
const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sig(id) { return crypto.createHmac('sha256', SECRET).update('unsub:' + id).digest('hex').slice(0, 32); }
function unsubUrl(id) { return SITE + '/api/trips?unsub=' + encodeURIComponent(id) + '&k=' + sig(id); }
function checkSig(id, k) {
  if (!SECRET || !id || !k || String(k).length !== 32) return false;
  try { return crypto.timingSafeEqual(Buffer.from(sig(id)), Buffer.from(String(k))); } catch (e) { return false; }
}

/* who is on the list for this trip: one entry per email, skipping anyone who already asked to join it */
function recipients(t, interests) {
  const onTrip = {};
  interests.forEach(i => { if (i.tripId === t.id && i.email) onTrip[String(i.email).toLowerCase()] = 1; });
  const seen = {}, out = [];
  interests
    .filter(i => !i.tripId && i.status !== 'cancelled' && EMAIL_OK.test(String(i.email || '')))
    .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)))
    .forEach(i => { const e = String(i.email).toLowerCase(); if (seen[e] || onTrip[e]) return; seen[e] = 1; out.push(i); });
  return out;
}

function message(i, t) {
  const rows = [
    ['Trip', t.title],
    ['Dates', t.dateText],
    ['Where', [t.destination, t.country].filter(Boolean).join(', ')],
    ['Price', t.priceText],
    ['Theme', t.theme],
    ['Led by', t.showOrganizer && t.organizerName ? t.organizerName + (t.organizerCommunity ? ' (' + t.organizerCommunity + ')' : '') : ''],
    ['Places', t.seatsTotal ? t.seatsTotal + ' in total' : '']
  ].filter(r => r[1]);
  const url = SITE + '/trip/' + encodeURIComponent(t.slug);
  const off = unsubUrl(i.id);
  const html = trip.shell('A new Travel Club trip is open',
    `<p>Hi ${trip.esc(auto.helpers.first(i.name))},</p>` +
    `<p>You asked us to tell you first when a new Travel Club trip opens. <b>${trip.esc(t.title)}</b> is open now.</p>` +
    (t.summary ? `<p>${trip.esc(t.summary)}</p>` : '') +
    trip.detailTable(rows) +
    auto.helpers.button(url, 'See the trip and ask to join') +
    `<p>Asking to join is free. We confirm your place and the payment terms with you by email before anything is charged.</p>` +
    `<p style="color:#7a8895;font-size:12px">You get this because you asked to hear about new Travel Club trips on sightseerscaribbean.com. ` +
    `<a href="${trip.esc(off)}" style="color:#7a8895">Stop these emails</a>.</p>`, ' ');
  return { to: i.email, subject: 'New trip: ' + t.title, html, replyTo: BUSINESS_EMAIL, headers: { 'List-Unsubscribe': '<' + off + '>', 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } };
}

/**
 * Emails the list about a trip that is open. opts.manual: the owner pressed the button (sends even with the switch off).
 * opts.dryRun: only counts. Returns { sent, count, skipped } where skipped says why nothing went out.
 */
async function announceTrip(tripId, opts) {
  opts = opts || {};
  const [trips, interests] = await Promise.all([db.getCollection(TRIPS), db.getCollection(INTERESTS)]);
  const t = trips.find(x => x.id === tripId);
  if (!t) return { skipped: 'not found', count: 0 };
  const list = recipients(t, interests);
  if (opts.dryRun) return { count: list.length, announcedAt: t.announcedAt || null };
  if (t.status !== 'open') return { skipped: 'not open', count: list.length };
  if (t.announcedAt) return { skipped: 'already sent', count: list.length, announcedAt: t.announcedAt };
  if (!opts.manual) { const s = await auto.getSettings(); if (!s.newTrips) return { skipped: 'switched off', count: list.length }; }
  const now = new Date().toISOString();
  await db.updateInCollection(TRIPS, t.id, { announcedAt: now, announcedCount: list.length });      /* marked first */
  if (!list.length) return { sent: 0, count: 0, announcedAt: now };
  const r = await sendBatch(list.map(i => message(i, t)));
  if (r.failed) await db.updateInCollection(TRIPS, t.id, { announcedFailed: r.failed });
  await auto.helpers.log('announce', 'New trip email for ' + t.title + ' sent to ' + r.sent + ' of ' + list.length + ' people on the list', t.id);
  return { sent: r.sent, failed: r.failed || 0, count: list.length, announcedAt: now };
}

/* the unsubscribe link: takes that email off the list (every alert entry with it) */
async function unsubscribe(id, k) {
  if (!checkSig(id, k)) return { ok: false };
  const interests = await db.getCollection(INTERESTS), rec = interests.find(x => x.id === id);
  if (!rec) return { ok: false };
  const e = String(rec.email || '').toLowerCase(), now = new Date().toISOString();
  for (const i of interests.filter(x => !x.tripId && String(x.email || '').toLowerCase() === e && x.status !== 'cancelled')) {
    await db.updateInCollection(INTERESTS, i.id, { status: 'cancelled', unsubscribedAt: now });
  }
  await auto.helpers.log('unsubscribe', 'Someone stopped the new trip emails', rec.ref);
  return { ok: true };
}

module.exports = { announceTrip, unsubscribe, recipients, message, unsubUrl, checkSig };
