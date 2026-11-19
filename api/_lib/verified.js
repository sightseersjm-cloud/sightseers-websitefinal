/**
 * api/_lib/verified.js
 * The "Verified traveller" badge: a person has one once a confirmed booking, or a confirmed or booked Travel Club trip, has finished.
 * It is worked out from the records each time (nothing is stored), so a cancelled or still-upcoming trip never counts.
 * It says the person has travelled with Sight Seers. It does not check anyone's identity.
 */
const db = require('./db');

const lower = v => String(v || '').trim().toLowerCase();
function jamaicaDay(d) { return new Date(d.getTime() - 5 * 3600 * 1000).toISOString().slice(0, 10); }   /* Jamaica is UTC-5 all year */
const ymd = v => { const m = /^(\d{4}-\d{2}-\d{2})/.exec(String(v || '')); return m ? m[1] : ''; };

/* Sight Seers' own accounts (the owner and the business inbox) are Verified and start at the Voyager tier (250 points) */
const HOUSE_POINTS = 250;
function houseEmails() {
  return new Set([process.env.OWNER_EMAIL, process.env.BUSINESS_EMAIL, 'info@sightseerscaribbean.com', 'sightseersjm@gmail.com'].map(lower).filter(Boolean));
}

async function statusFor(user, now) {
  const out = { verifiedTraveller: false, tripsCompleted: 0, firstTripOn: '', pointsFloor: 0 };
  if (!user || !user.email) return out;
  const today = jamaicaDay(now || new Date()), email = lower(user.email);
  const dates = [];

  const bookings = await db.getCollection('bookings');
  bookings.forEach(b => {
    if (!(b.userId === user.id || lower(b.email) === email)) return;
    if (b.status === 'completed') { dates.push(ymd(b.endDate || b.checkOut || b.date || b.checkIn) || ymd(b.createdAt)); return; }
    if (b.status !== 'confirmed') return;
    const end = ymd(b.endDate || b.checkOut || b.date || b.checkIn);
    if (end && end < today) dates.push(end);
  });

  const [trips, interests] = await Promise.all([db.getCollection('club-trips'), db.getCollection('club-interests')]);
  interests.forEach(i => {
    if (lower(i.email) !== email || (i.status !== 'confirmed' && i.status !== 'booked')) return;
    const t = trips.find(x => x.id === i.tripId);
    const end = t ? ymd(t.endDate || t.startDate) : '';
    if (end && end < today) dates.push(end);
  });

  const done = dates.filter(Boolean).sort();
  out.tripsCompleted = done.length;
  out.verifiedTraveller = done.length > 0;
  out.firstTripOn = done[0] || '';
  if (houseEmails().has(email)) { out.verifiedTraveller = true; out.pointsFloor = HOUSE_POINTS; }
  return out;
}

/* the same rule for many people at once (leader and inbox lists): returns the set of verified emails among those given */
async function verifiedSet(emails, now) {
  const want = new Set((emails || []).map(lower).filter(Boolean));
  const out = new Set();
  if (!want.size) return out;
  const today = jamaicaDay(now || new Date());
  houseEmails().forEach(e => { if (want.has(e)) out.add(e); });
  const [bookings, trips, interests] = await Promise.all([db.getCollection('bookings'), db.getCollection('club-trips'), db.getCollection('club-interests')]);
  bookings.forEach(b => {
    const e = lower(b.email); if (!want.has(e) || out.has(e)) return;
    if (b.status === 'completed') { out.add(e); return; }
    if (b.status !== 'confirmed') return;
    const end = ymd(b.endDate || b.checkOut || b.date || b.checkIn);
    if (end && end < today) out.add(e);
  });
  interests.forEach(i => {
    const e = lower(i.email); if (!want.has(e) || out.has(e) || (i.status !== 'confirmed' && i.status !== 'booked')) return;
    const t = trips.find(x => x.id === i.tripId); const end = t ? ymd(t.endDate || t.startDate) : '';
    if (end && end < today) out.add(e);
  });
  return out;
}

module.exports = { statusFor, verifiedSet, HOUSE_POINTS };
