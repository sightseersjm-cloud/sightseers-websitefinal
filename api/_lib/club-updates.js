/**
 * api/_lib/club-updates.js
 * Trip updates for the Travel Club.
 *
 *  - a leader (or the owner) posts an update on one trip: it shows on the dashboard of everyone who joined and is emailed to them
 *  - the owner can send an advisory to every upcoming trip in a country (one email per person, however many trips they are on)
 *
 * Updates belong to a trip, never to a country: the country only decides which trips an advisory reaches.
 * Stored in 'club-updates'. Waitlisted and cancelled people are never emailed.
 */

const db = require('./db');
const trip = require('./trip');
const { uid } = require('./auth');
const { sendEmail, BUSINESS_EMAIL } = require('./email');
const { helpers } = require('./club-auto');
const { button, first, safe, log, SITE } = helpers;

const TRIPS = 'club-trips';
const INTERESTS = 'club-interests';
const UPDATES = 'club-updates';
const LIVE = ['new', 'contacted', 'confirmed', 'booked'];

function str(v, max) { return String(v == null ? '' : v).trim().slice(0, max || 200); }
function clean(title, body) {
  const t = str(title, 120), b = String(body == null ? '' : body).replace(/\r\n/g, '\n').trim().slice(0, 3000);
  if (t.length < 3) return { error: 'Give the update a short title.' };
  if (b.length < 5) return { error: 'Write the update.' };
  return { title: t, body: b };
}
function note(body) { return `<p style="white-space:pre-wrap;background:#f6faf7;border-left:4px solid #70c257;padding:12px 16px;color:#33505f">${trip.esc(body)}</p>`; }
function mail(to, subject, heading, html) { return sendEmail({ to, replyTo: BUSINESS_EMAIL, subject, html: trip.shell(heading, html, ' ') }); }

/* the people a trip's updates reach: everyone who joined and has not cancelled or been waitlisted */
function joinersOf(interests, tripId) { return interests.filter(i => i.tripId === tripId && LIVE.indexOf(i.status) > -1 && i.email); }

/* ---------- one trip ---------- */
async function postTripUpdate(t, author, input) {
  const c = clean(input.title, input.body);
  if (c.error) return { error: c.error };
  const rec = { id: uid(), kind: 'trip', tripId: t.id, tripTitle: t.title, country: '', title: c.title, body: c.body,
    authorName: author.role === 'admin' ? 'Sight Seers' : (author.name || t.organizerName || 'Your group leader'), authorRole: author.role === 'admin' ? 'owner' : 'leader', authorId: author.id || '', createdAt: new Date().toISOString(), emailed: 0 };
  const interests = await db.getCollection(INTERESTS);
  const people = joinersOf(interests, t.id);
  /* once per address, even when two travelers share one */
  const seen = {}, mailTo = people.filter(i => !seen[i.email] && (seen[i.email] = 1));
  if (input.notify !== false) {
    for (const i of mailTo) {
      await safe('trip update', mail(i.email, 'Update on ' + t.title + ': ' + c.title, 'A note about your trip',
        `<p>Hi ${trip.esc(first(i.name))},</p><p>${trip.esc(rec.authorName)} posted an update on <b>${trip.esc(t.title)}</b>.</p><h3 style="margin:14px 0 6px;color:#063a63">${trip.esc(c.title)}</h3>${note(c.body)}${button(SITE + '/account', 'Open my dashboard')}`));
    }
    rec.emailed = mailTo.length;
  }
  await db.addToCollection(UPDATES, rec);
  await log('update', rec.authorName + ' posted an update on ' + t.title + ': ' + c.title + (rec.emailed ? ' (emailed ' + rec.emailed + ')' : ''), t.id);
  if (rec.authorRole === 'leader') {
    await safe('update admin', sendEmail({ subject: 'Leader update on ' + t.title + ': ' + c.title, html: trip.shell('A leader posted a trip update', `<p><b>${trip.esc(rec.authorName)}</b> posted this on <b>${trip.esc(t.title)}</b>${rec.emailed ? ' and it was emailed to ' + rec.emailed + ' traveler' + (rec.emailed === 1 ? '' : 's') : ''}.</p><h3 style="margin:14px 0 6px;color:#063a63">${trip.esc(c.title)}</h3>${note(c.body)}`, ' ') }));
  }
  return { update: rec };
}

/* ---------- a country advisory from the owner ---------- */
function upcoming(t, now) {
  if (['open', 'full', 'closed'].indexOf(t.status) < 0) return false;
  const end = t.endDate || t.startDate;
  if (!end) return true;
  return end >= now.toISOString().slice(0, 10);
}
function norm(s) { return str(s, 80).toLowerCase(); }
async function advisoryTargets(country, now) {
  const [trips, interests] = await Promise.all([db.getCollection(TRIPS), db.getCollection(INTERESTS)]);
  const key = norm(country);
  const hit = key ? trips.filter(t => norm(t.country) === key && upcoming(t, now || new Date())) : [];
  const byEmail = {};
  hit.forEach(t => {
    joinersOf(interests, t.id).forEach(i => { (byEmail[i.email] = byEmail[i.email] || { name: i.name, email: i.email, trips: [] }).trips.push(t.title); });
    if (t.organizerEmail) (byEmail[t.organizerEmail] = byEmail[t.organizerEmail] || { name: t.organizerName, email: t.organizerEmail, trips: [], leader: true }).trips.push(t.title);
  });
  return { trips: hit, people: Object.keys(byEmail).map(k => { const p = byEmail[k]; p.trips = p.trips.filter((x, n, a) => a.indexOf(x) === n); return p; }), joiners: hit.reduce((n, t) => n + joinersOf(interests, t.id).length, 0) };
}
async function postAdvisory(admin, input, now) {
  const country = str(input.country, 80);
  if (!country) return { error: 'Choose the country this advisory is for.' };
  const c = clean(input.title, input.body);
  if (c.error) return { error: c.error };
  const t = await advisoryTargets(country, now);
  if (!t.trips.length) return { error: 'No upcoming trips are set to ' + country + '. Check the country on each trip under Trips.', trips: [], people: [] };
  const summary = { trips: t.trips.map(x => ({ id: x.id, title: x.title, dateText: x.dateText })), people: t.people.map(p => ({ name: p.name, email: p.email, leader: !!p.leader, trips: p.trips })) };
  if (input.dryRun) return { preview: summary };
  const stamp = new Date().toISOString(), group = uid();
  for (const x of t.trips) {
    await db.addToCollection(UPDATES, { id: uid(), kind: 'advisory', advisoryId: group, tripId: x.id, tripTitle: x.title, country, title: c.title, body: c.body, authorName: 'Sight Seers', authorRole: 'owner', authorId: admin.id || '', createdAt: stamp, emailed: 0 });
  }
  let sent = 0;
  if (input.notify !== false) {
    for (const p of t.people) {
      await safe('advisory', mail(p.email, 'Travel update for ' + country + ': ' + c.title, 'A travel update for ' + country,
        `<p>Hi ${trip.esc(first(p.name))},</p><p>Sight Seers has an update that affects ${'your trip'} to ${trip.esc(country)}: <b>${trip.esc(p.trips.join(', '))}</b>.</p><h3 style="margin:14px 0 6px;color:#063a63">${trip.esc(c.title)}</h3>${note(c.body)}${button(SITE + '/account', 'Open my dashboard')}`));
      sent++;
    }
  }
  await log('advisory', 'Advisory for ' + country + ' sent to ' + t.trips.length + ' trip' + (t.trips.length === 1 ? '' : 's') + (sent ? ' and ' + sent + ' people' : '') + ': ' + c.title, group);
  return { sent: { trips: t.trips.length, people: sent }, preview: summary };
}

/* ---------- reading and removing ---------- */
async function updatesFor(tripIds) {
  const all = await db.getCollection(UPDATES);
  return all.filter(u => tripIds.indexOf(u.tripId) > -1).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}
function publicUpdate(u) { return { id: u.id, kind: u.kind, tripId: u.tripId, country: u.country || '', title: u.title, body: u.body, authorName: u.authorName, authorRole: u.authorRole, createdAt: u.createdAt }; }

async function removeForTrip(tripId) {
  for (const u of (await db.getCollection(UPDATES)).filter(x => x.tripId === tripId)) await db.removeFromCollection(UPDATES, u.id);
}

module.exports = { removeForTrip, postTripUpdate, postAdvisory, advisoryTargets, updatesFor, publicUpdate, joinersOf, upcoming, UPDATES };
