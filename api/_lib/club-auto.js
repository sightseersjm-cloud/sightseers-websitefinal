/**
 * api/_lib/club-auto.js
 * The Travel Club's automatic emails, shared by the trips API (a seat opens) and the daily job (reminders, weekly digest):
 *
 *  - waitlist promotion: when a place opens, the people who have waited longest move up and are emailed
 *  - countdown reminders: confirmed and booked travelers, once per milestone (14 days and 3 days before departure)
 *  - the leader digest: every Monday, how each live trip is doing
 *
 * The owner turns each one on or off (club-settings, id 'automation'). Reminders and the digest start OFF, so nothing
 * goes out to real people until the owner has looked at the preview and switched them on. Every send is marked first,
 * so a retry or a second run never emails the same person twice.
 */

const db = require('./db');
const { sendEmail, BUSINESS_EMAIL } = require('./email');
const trip = require('./trip');
const { uid } = require('./auth');

const TRIPS = 'club-trips';
const APPS = 'club-applications';
const INTERESTS = 'club-interests';
const SETTINGS = 'club-settings';
const ACTIVITY = 'club-activity';
const SITE = (process.env.SITE_URL || 'https://www.sightseerscaribbean.com').replace(/\/+$/, '');
const DEFAULTS = { waitlist: true, reminders: false, digest: false };
const MILESTONES = [3, 14];          /* days before departure, nearest first */
const DAY = 86400000;

function first(name) { return String(name || '').trim().split(/\s+/)[0] || 'there'; }
function mail(to, subject, heading, body) {
  return sendEmail({ to, replyTo: BUSINESS_EMAIL, subject, html: trip.shell(heading, body, ' ') });
}
async function safe(label, p) { try { await p; return true; } catch (e) { console.error('club auto ' + label, e && e.message); return false; } }
function button(url, label) {
  return '<p style="margin:18px 0"><a href="' + trip.esc(url) + '" style="display:inline-block;background:#063a63;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:999px">' + trip.esc(label) + '</a></p>';
}
async function log(type, text, ref) {
  try { await db.addToCollection(ACTIVITY, { id: uid(), type, text: String(text).slice(0, 300), ref: String(ref || '').slice(0, 40), at: new Date().toISOString() }); }
  catch (e) { console.error('club activity', e && e.message); }
}

/* ---------- the owner's switches ---------- */
async function getSettings() {
  const doc = (await db.getCollection(SETTINGS)).find(x => x.id === 'automation') || {};
  return {
    waitlist: doc.waitlist === undefined ? DEFAULTS.waitlist : !!doc.waitlist,
    reminders: doc.reminders === undefined ? DEFAULTS.reminders : !!doc.reminders,
    digest: doc.digest === undefined ? DEFAULTS.digest : !!doc.digest,
    lastRun: doc.lastRun || null, updatedBy: doc.updatedBy || ''
  };
}
async function saveSettings(patch, by) {
  const docs = await db.getCollection(SETTINGS), cur = docs.find(x => x.id === 'automation');
  const next = {};
  ['waitlist', 'reminders', 'digest'].forEach(k => { if (patch && patch[k] !== undefined) next[k] = !!patch[k]; });
  if (by) next.updatedBy = by;
  if (cur) await db.updateInCollection(SETTINGS, 'automation', next);
  else await db.addToCollection(SETTINGS, Object.assign({ id: 'automation', createdAt: new Date().toISOString() }, next));
  return getSettings();
}
async function recordRun(summary) {
  const docs = await db.getCollection(SETTINGS), cur = docs.find(x => x.id === 'automation');
  const lastRun = { at: summary.at, dryRun: !!summary.dryRun, counts: summary.counts };
  if (cur) await db.updateInCollection(SETTINGS, 'automation', { lastRun });
  else await db.addToCollection(SETTINGS, { id: 'automation', createdAt: new Date().toISOString(), lastRun });
}

/* ---------- waitlist promotion ---------- */
function seatsFree(t, list) {
  if (!t.seatsTotal) return 0;
  const held = list.filter(i => i.status === 'confirmed' || i.status === 'booked').reduce((n, i) => n + (i.partySize || 1), 0);
  const asking = list.filter(i => i.status === 'new' || i.status === 'contacted').reduce((n, i) => n + (i.partySize || 1), 0);
  return t.seatsTotal - held - asking;
}
/**
 * Moves the people who have waited longest off the waitlist while there are places for them.
 * `force` ignores the owner's switch (the preview and the manual run decide for themselves).
 */
async function promoteWaitlist(tripId, opts) {
  opts = opts || {};
  if (!opts.force && !(await getSettings()).waitlist) return [];
  const [trips, interests] = await Promise.all([db.getCollection(TRIPS), db.getCollection(INTERESTS)]);
  const t = trips.find(x => x.id === tripId);
  if (!t || (t.status !== 'open' && t.status !== 'full') || !t.seatsTotal) return [];
  const list = interests.filter(i => i.tripId === t.id);
  let free = seatsFree(t, list);
  const out = [];
  const waiting = list.filter(i => i.status === 'waitlist' && i.email).sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
  for (const i of waiting) {
    const need = i.partySize || 1;
    if (need > free) break;                       /* keep the queue in order: nobody jumps ahead of a bigger party */
    free -= need;
    out.push({ ref: i.ref, name: i.name, email: i.email, trip: t.title });
    if (opts.dryRun) continue;
    await db.updateInCollection(INTERESTS, i.id, { status: 'new', promotedAt: new Date().toISOString() });
    await log('traveler', i.name + ' moved off the waitlist on ' + t.title + ' (a place opened)', i.ref);
    await safe('waitlist promotion', mail(i.email, 'A place opened: ' + t.title, 'A place opened for you',
      `<p>Hi ${trip.esc(first(i.name))},</p><p>Good news. A place has opened on <b>${trip.esc(t.title)}</b> and you are off the waitlist. Our team will follow up shortly with the next steps and the payment terms. Nothing has been charged.</p>${trip.detailTable([['Reference', i.ref], ['Trip', t.title], ['Dates', t.dateText], ['Travelers', String(i.partySize || 1)]])}${button(SITE + '/account', 'Open my dashboard')}`));
  }
  return out;
}

/* ---------- countdown reminders ---------- */
function todayUtc(now) { return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()); }
function daysUntil(startDate, now) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(startDate || ''));
  if (!m) return null;
  return Math.round((Date.UTC(+m[1], +m[2] - 1, +m[3]) - todayUtc(now)) / DAY);
}
function milestoneFor(days) {
  if (days == null || days < 0) return null;
  for (const m of MILESTONES) if (days <= m) return m;
  return null;
}
function whenWords(days) { return days === 0 ? 'today' : days === 1 ? 'tomorrow' : 'in ' + days + ' days'; }
function reminderMail(i, t, days) {
  const link = t.groupLink ? '<p>Your group chat:</p>' + button(t.groupLink, 'Join the group chat') : '';
  return mail(i.email, t.title + ' is ' + whenWords(days), 'Your trip is ' + whenWords(days),
    `<p>Hi ${trip.esc(first(i.name))},</p><p><b>${trip.esc(t.title)}</b> leaves ${whenWords(days)}. Here is everything in one place.</p>${trip.detailTable([['Trip', t.title], ['Dates', t.dateText], ['Led by', t.organizerName], ['Your reference', i.ref], ['Travelers', String(i.partySize || 1)]])}${link}<p>Your dashboard has the trip details${t.groupLink ? ' and the group chat' : ''}. If anything changes, just reply to this email.</p>${button(SITE + '/account', 'Open my dashboard')}`);
}

/* ---------- the Monday digest for leaders ---------- */
function isoWeek(now) {
  const d = new Date(todayUtc(now));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const y0 = Date.UTC(d.getUTCFullYear(), 0, 1);
  return d.getUTCFullYear() + '-W' + String(Math.ceil(((d - y0) / DAY + 1) / 7)).padStart(2, '0');
}
function digestFor(t, list, goal, now) {
  const people = l => l.reduce((n, i) => n + (i.partySize || 1), 0);
  const active = list.filter(i => i.status !== 'cancelled' && i.status !== 'waitlist');
  const weekAgo = now.getTime() - 7 * DAY;
  const fresh = active.filter(i => new Date(i.createdAt).getTime() >= weekAgo);
  const booked = list.filter(i => i.status === 'booked'), conf = list.filter(i => i.status === 'confirmed'), wait = list.filter(i => i.status === 'waitlist');
  const days = daysUntil(t.startDate, now);
  const rows = [
    ['New this week', String(people(fresh))],
    ['Joined so far', String(people(active))],
    ['Your invite goal', goal ? people(active) + ' of ' + goal : ''],
    ['Confirmed', String(people(conf))], ['Booked', String(people(booked))],
    ['On the waitlist', wait.length ? String(people(wait)) : ''],
    ['Places left', t.seatsTotal ? String(Math.max(0, t.seatsTotal - people(conf) - people(booked))) : ''],
    ['Days to departure', days != null && days >= 0 ? String(days) : '']
  ];
  const quiet = !people(active);
  const nudge = quiet
    ? '<p>Nobody has joined yet. Open the <b>Invite kit</b> on your dashboard: it has a ready message, a WhatsApp share, a QR code and a share card for your trip.</p>'
    : (people(fresh) ? '<p>Nice work, people are joining through your link. Keep sharing it, and add your group chat link on your dashboard so everyone lands in the same place.</p>'
      : '<p>It was a quiet week. A fresh post or a reminder in your group chat usually brings a few more people in. The <b>Invite kit</b> on your dashboard has everything ready to share.</p>');
  return { rows, nudge, newPeople: people(fresh) };
}

/* ---------- the daily run ---------- */
/**
 * What the daily job does. With dryRun it only lists what it would send and changes nothing.
 * `force` (the owner's manual run) ignores the owner's switches and the Monday rule for the digest, so the preview shows everything.
 */
async function runDaily(opts) {
  opts = opts || {};
  const now = opts.now || new Date(), dryRun = !!opts.dryRun;
  const settings = await getSettings();
  const on = k => (opts.force && dryRun) ? true : settings[k];
  const summary = { at: now.toISOString(), dryRun, switches: { waitlist: settings.waitlist, reminders: settings.reminders, digest: settings.digest }, waitlist: [], reminders: [], digests: [], counts: {} };

  const [trips, interests, apps] = await Promise.all([db.getCollection(TRIPS), db.getCollection(INTERESTS), db.getCollection(APPS)]);

  if (on('waitlist')) {
    for (const t of trips.filter(x => x.status === 'open' || x.status === 'full')) {
      const moved = await promoteWaitlist(t.id, { dryRun, force: true });
      summary.waitlist.push(...moved);
    }
  }

  if (on('reminders')) {
    for (const t of trips.filter(x => x.status === 'open' || x.status === 'full' || x.status === 'closed')) {
      const days = daysUntil(t.startDate, now), n = milestoneFor(days);
      if (n == null) continue;
      for (const i of interests.filter(x => x.tripId === t.id && (x.status === 'confirmed' || x.status === 'booked') && x.email)) {
        const sent = i.remSent || {};
        if (sent[n]) continue;
        summary.reminders.push({ ref: i.ref, name: i.name, email: i.email, trip: t.title, days, milestone: n });
        if (dryRun) continue;
        await db.updateInCollection(INTERESTS, i.id, { remSent: Object.assign({}, sent, { [n]: now.toISOString() }) });     /* marked first: a retry never doubles it */
        await safe('reminder', reminderMail(i, t, days));
      }
    }
  }

  if (on('digest') && (opts.force || now.getUTCDay() === 1)) {
    const week = isoWeek(now);
    for (const t of trips.filter(x => (x.status === 'open' || x.status === 'full') && x.organizerEmail)) {
      if (!dryRun && t.digestWeek === week) continue;
      if (dryRun && t.digestWeek === week && !opts.force) continue;
      const app = t.applicationId ? apps.find(a => a.id === t.applicationId) : null;
      const d = digestFor(t, interests.filter(i => i.tripId === t.id), app && app.inviteCount != null ? app.inviteCount : null, now);
      summary.digests.push({ trip: t.title, to: t.organizerEmail, newPeople: d.newPeople, alreadySent: t.digestWeek === week });
      if (dryRun || t.digestWeek === week) continue;
      await db.updateInCollection(TRIPS, t.id, { digestWeek: week });
      await safe('digest', mail(t.organizerEmail, 'Your week on ' + t.title, 'Your week on ' + t.title,
        `<p>Hi ${trip.esc(first(t.organizerName))},</p><p>Here is how <b>${trip.esc(t.title)}</b> is doing.</p>${trip.detailTable(d.rows)}${d.nudge}${button(SITE + '/account', 'Open my dashboard')}<p style="color:#7a8895;font-size:12px">You get this every Monday while your trip is open. Reply to this email if you would rather not.</p>`));
    }
  }

  summary.counts = { waitlist: summary.waitlist.length, reminders: summary.reminders.length, digests: summary.digests.length };
  if (!dryRun) { await recordRun(summary); if (summary.counts.waitlist || summary.counts.reminders || summary.counts.digests) await log('automation', 'Automatic emails sent: ' + summary.counts.waitlist + ' waitlist, ' + summary.counts.reminders + ' reminders, ' + summary.counts.digests + ' leader digests', ''); }
  return summary;
}

module.exports = { helpers: { mail, button, first, safe, log, SITE }, DEFAULTS, MILESTONES, getSettings, saveSettings, promoteWaitlist, runDaily, daysUntil, milestoneFor, isoWeek, seatsFree };
