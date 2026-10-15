/**
 * api/_handlers/trips.js
 * Travel Club: approved group trips (Join a Trip) and the organizers who recruit for them (Lead a Trip).
 *
 *   GET  /api/trips                    public: the departures that are open (or full, as a waitlist)
 *   GET  /api/trips?slug=<slug>        public: one departure
 *   GET  /api/trips?mine=1             signed in: my applications, the trips I lead (with counts), and my own interest requests
 *   GET  /api/trips?admin=1            admin: every trip, application and interest request
 *   POST { action:'interest' }         public: ask to join a trip, or ask to hear when one opens
 *   POST { action:'apply' }            public: apply to lead a trip
 *   POST { action:'application-invite' } signed in: change the number of people you would invite (your own application only)
 *   GET  /api/trips?partners=1         public: the travel insurance and eSIM referral links (as the admin set them)
 *   POST { action:'partners-save' }    admin: set the referral links, titles and notes
 *   POST { action:'trip-save' }        admin: create or update a trip
 *   POST { action:'trip-delete' }      admin: delete a trip that never opened
 *   POST { action:'application-review' } admin: approve, decline or ask for more information (optionally drafts the trip)
 *   POST { action:'interest-update' }  admin: move a traveler through new, contacted, confirmed, booked, cancelled, waitlist
 *   POST { action:'trip-group-link' }  signed in (the trip's leader): add the WhatsApp group or channel link; joiners are emailed it
 *   POST { action:'notice-seen' }      signed in: mark a dashboard popup (approved, trip live, group link) as seen
 *
 * Nothing here invents a price, a seat count, a reward or a departure: a trip only exists when an admin enters it,
 * seats are only shown when an admin sets them, and an organizer's reward is private text an admin writes per trip.
 * Travelers are never charged here. Sight Seers confirms availability and payment terms with them first.
 */

const db = require('../_lib/db');
const { getUser, requireAdmin, uid, hashPassword, validatePassword, createToken } = require('../_lib/auth');
const crypto = require('crypto');
const { sendEmail, BUSINESS_EMAIL } = require('../_lib/email');
const trip = require('../_lib/trip');
const inboxLib = require('../_lib/inbox');
const { geo } = require('../_lib/geo');

const TRIPS = 'club-trips';
const APPS = 'club-applications';
const INTERESTS = 'club-interests';
const SETTINGS = 'club-settings';
const ACTIVITY = 'club-activity';
const SITE = (process.env.SITE_URL || 'https://www.sightseerscaribbean.com').replace(/\/+$/, '');

const TRIP_STATUS = ['draft', 'open', 'full', 'closed'];
const APP_STATUS = ['pending', 'needs_info', 'approved', 'declined'];
const INTEREST_STATUS = ['new', 'contacted', 'confirmed', 'booked', 'cancelled', 'waitlist'];
const REWARD_STATUS = ['not_set', 'agreed', 'earned', 'paid'];
const COMMUNITY_TYPES = ['Creator or influencer', 'Birthday or celebration organizer', 'Alumni or school representative', 'Club or association', 'Fitness instructor or coach', 'Faith or community group', 'Other group leader'];
const GROUP_SIZES = ['5 to 10', '11 to 20', '21 to 40', '41 or more', 'Not sure yet'];
const AUDIENCE_SIZES = ['Fewer than 25', '25 to 100', '100 to 500', '500 to 2,000', '2,000 to 10,000', 'More than 10,000'];
const CHANNELS = ['Instagram', 'TikTok', 'YouTube', 'WhatsApp or group chat', 'Email list', 'Events or in person', 'Other'];
const EXPERIENCE = ['I have organized group trips', 'I have organized events, not trips', 'This would be my first'];
const STYLES = ['Adventure and excursions', 'Villa and relaxation', 'Celebration or party', 'Wellness or fitness', 'Culture and food', 'Group retreat or learning'];
const PAYMENT_NOTE = 'We confirm availability and payment terms with you by email before anything is charged.';

/* ---------- small helpers ---------- */
function str(v, max) { return String(v == null ? '' : v).trim().slice(0, max || 200); }
function lower(v, max) { return str(v, max).toLowerCase(); }
function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || '')); }
function int(v, min, max, dflt) {
  const n = parseInt(v, 10);
  if (isNaN(n)) return dflt;
  return Math.min(max, Math.max(min, n));
}
function oneOf(v, list, dflt) { return list.indexOf(v) > -1 ? v : dflt; }
function manyOf(v, list, max) {
  const arr = Array.isArray(v) ? v : (v == null || v === '' ? [] : [v]);
  const out = [];
  arr.forEach(x => { const t = str(x, 60); if (list.indexOf(t) > -1 && out.indexOf(t) === -1) out.push(t); });
  return out.slice(0, max || list.length);
}
function slugify(v) {
  return String(v || '').toLowerCase().replace(/[‘’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}
function lines(v, maxItems, maxLen) {
  return String(v == null ? '' : (Array.isArray(v) ? v.join('\n') : v)).split(/\r?\n/).map(x => x.trim()).filter(Boolean).slice(0, maxItems || 12).map(x => x.slice(0, maxLen || 160));
}
function paragraphs(v) {
  return String(v == null ? '' : v).split(/\r?\n\s*\r?\n/).map(x => x.trim()).filter(Boolean).slice(0, 12).map(x => x.slice(0, 1400));
}
function safeUrl(v) {
  const u = str(v, 500);
  if (!u) return '';
  if (/^\/assets\/[\w\-./]+$/.test(u)) return u;
  if (/^https:\/\/[^\s"'<>]+$/.test(u)) return u;
  return '';
}
function groupLinkOf(v) {
  const u = str(v, 400);
  if (!u) return '';
  try { const x = new URL(u); return x.protocol === 'https:' && x.hostname.indexOf('.') > 0 ? x.toString() : ''; } catch (e) { return ''; }
}
function isoDate(v) {
  const s = str(v, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : '';
}
function ip(req) {
  return String((req.headers && (req.headers['x-forwarded-for'] || req.headers['x-real-ip'])) || '').split(',')[0].trim() || 'unknown';
}

/* a light per-address limit on the public forms (the serverless instance keeps it, like the sign-in limit) */
const hits = new Map();
function allow(key, max, windowMs) {
  const now = Date.now(), rec = hits.get(key);
  if (!rec || now - rec.start > windowMs) { hits.set(key, { start: now, count: 1 }); return true; }
  rec.count++;
  return rec.count <= max;
}

function mail(to, subject, heading, body) {
  return sendEmail({ to, replyTo: BUSINESS_EMAIL, subject, html: trip.shell(heading, body, ' ') });
}
/* an email must never break the request that caused it */
async function safe(label, p) { try { await p; } catch (e) { console.error('club ' + label + ' email', e && e.message); } }
function button(url, label) {
  return '<p style="margin:18px 0"><a href="' + trip.esc(url) + '" style="display:inline-block;background:#063a63;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:999px">' + trip.esc(label) + '</a></p>';
}
function adminMail(subject, heading, body, replyTo) {
  return sendEmail({ replyTo: replyTo || undefined, subject, html: trip.shell(heading, body, ' ') });
}
/* a running log the admin overview reads: who did what, and when */
async function log(type, text, ref) {
  try {
    await db.addToCollection(ACTIVITY, { id: uid(), type, text: str(text, 300), ref: str(ref, 40), at: new Date().toISOString() });
  } catch (e) { console.error('club activity', e && e.message); }
}
function joinedPeople(list) {
  return list.filter(i => i.status !== 'cancelled' && i.status !== 'waitlist').reduce((n, i) => n + (i.partySize || 1), 0);
}
function activeJoiners(list) { return list.filter(i => i.status !== 'cancelled' && i.status !== 'waitlist'); }
function hasGroupLink(t) { return !!(t && t.groupLink); }

/* ---------- shaping ---------- */
function travelersCounted(interests, tripId) {
  return interests.filter(i => i.tripId === tripId && (i.status === 'confirmed' || i.status === 'booked'))
    .reduce((n, i) => n + (i.partySize || 1), 0);
}

function publicTrip(t, interests) {
  const total = t.seatsTotal || 0;
  const taken = total ? travelersCounted(interests, t.id) : 0;
  return {
    id: t.id,
    slug: t.slug,
    title: t.title,
    destination: t.destination,
    country: t.country,
    dateText: t.dateText,
    startDate: t.startDate,
    endDate: t.endDate,
    summary: t.summary,
    description: paragraphs(t.description),
    included: t.included || [],
    image: t.image,
    imageAlt: t.imageAlt || t.title,
    priceText: t.priceText,
    paymentNote: t.paymentNote || PAYMENT_NOTE,
    status: t.status,
    seats: total ? { total, left: Math.max(0, total - taken) } : null,
    led: !!(t.organizerName || t.organizerEmail),
    organizer: t.showOrganizer && t.organizerName ? { name: t.organizerName, community: t.organizerCommunity || '', bio: t.organizerBio || '' } : null
  };
}

function cleanTrip(b, existing, all) {
  const title = str(b.title, 120);
  if (title.length < 3) return { error: 'Give the trip a title.' };
  const status = oneOf(b.status, TRIP_STATUS, existing ? existing.status : 'draft');
  let slug = slugify(b.slug || (existing && existing.slug) || title);
  if (!slug) return { error: 'The trip needs a web address (slug).' };
  if (all.some(t => t.slug === slug && (!existing || t.id !== existing.id))) return { error: 'Another trip already uses that web address. Change the slug.' };
  const out = {
    title, slug, status,
    destination: str(b.destination, 80),
    country: str(b.country, 60),
    dateText: str(b.dateText, 80),
    startDate: isoDate(b.startDate),
    endDate: isoDate(b.endDate),
    summary: str(b.summary, 300),
    description: String(b.description == null ? '' : b.description).trim().slice(0, 6000),
    included: lines(b.included, 14, 140),
    image: safeUrl(b.image),
    imageAlt: str(b.imageAlt, 140),
    priceText: str(b.priceText, 120),
    paymentNote: str(b.paymentNote, 300) || PAYMENT_NOTE,
    seatsTotal: int(b.seatsTotal, 0, 500, 0),
    organizerName: str(b.organizerName, 80),
    organizerCommunity: str(b.organizerCommunity, 100),
    organizerBio: str(b.organizerBio, 600),
    organizerEmail: lower(b.organizerEmail, 120),
    showOrganizer: !!b.showOrganizer,
    reward: str(b.reward, 600),
    rewardStatus: oneOf(b.rewardStatus, REWARD_STATUS, 'not_set'),
    internalNote: str(b.internalNote, 1000),
    groupLink: groupLinkOf(b.groupLink)
  };
  if (b.groupLink && !out.groupLink) return { error: 'The group link must start with https://, for example your WhatsApp invite link.' };
  if (out.organizerEmail && !isEmail(out.organizerEmail)) return { error: 'The organizer email is not a valid address.' };
  if (status === 'open' || status === 'full') {
    if (!out.summary) return { error: 'Add a short summary before the trip opens.' };
    if (!out.dateText && !out.startDate) return { error: 'Add the dates before the trip opens.' };
  }
  return { value: out };
}

function statusCounts(list) {
  const c = { total: list.length, new: 0, contacted: 0, confirmed: 0, booked: 0, cancelled: 0, waitlist: 0, travelers: 0 };
  list.forEach(i => { c[i.status] = (c[i.status] || 0) + 1; if (i.status === 'confirmed' || i.status === 'booked') c.travelers += (i.partySize || 1); });
  return c;
}

function ownsTrip(t, user) {
  if (!user) return false;
  const mail_ = lower(user.email, 120);
  return (t.organizerUserId && t.organizerUserId === user.id) || (!!t.organizerEmail && !!mail_ && t.organizerEmail === mail_);
}

/* ---------- emails ---------- */
function firstName(n) { return String(n || '').trim().split(/\s+/)[0] || 'there'; }
function rosterLine(rec) {
  const withGuests = (rec.guests && rec.guests.length) ? [['Also travelling', rec.guests.join(', ')]] : [];
  return (rec.shareContact
    ? [['Name', rec.name], ['Email', rec.email], ['Phone / WhatsApp', rec.phone], ['Travelers', String(rec.partySize)]]
    : [['Name', firstName(rec.name)], ['Travelers', String(rec.partySize)]]).concat(withGuests);
}
function interestMails(rec, t, extra) {
  extra = extra || {};
  const rows = [['Reference', rec.ref], ['Trip', rec.tripTitle || 'No trip chosen yet: wants to hear when one opens'], ['Name', rec.name], ['Email', rec.email], ['Phone / WhatsApp', rec.phone],
    ['Travelers', String(rec.partySize)], ['Also travelling', (rec.guests || []).join(', ')], ['Message', rec.message], ['Came from', rec.source], ['Led by', t && t.organizerName], ['Shares contact with leader', t ? (rec.shareContact ? 'Yes' : 'No') : '']];
  const led = t && t.organizerName ? ' It is led by ' + trip.esc(t.organizerName) + '.' : '';
  const guestBody = t
    ? `<p>Thanks, ${trip.esc(firstName(rec.name))}. You are in for <b>${trip.esc(t.title)}</b>.${led} ${trip.esc(t.paymentNote || PAYMENT_NOTE)}</p>${trip.detailTable([['Reference', rec.ref], ['Trip', t.title], ['Dates', t.dateText], ['Travelers', String(rec.partySize)], ['Also travelling', (rec.guests || []).join(', ')]])}<p>${rec.status === 'waitlist' ? 'The trip is full, so you are on the waitlist and we will email you if a place opens.' : (hasGroupLink(t) ? 'The group chat is ready. Open your dashboard to join it.' : 'When the group chat is ready, we will email you the link and it will also show on your dashboard.')}</p>${button(SITE + '/account', 'Open my dashboard')}`
    : `<p>Thanks, ${trip.esc(firstName(rec.name))}. We will email you as soon as a Travel Club departure opens. Nothing is charged and there is nothing else you need to do.</p>${trip.detailTable([['Reference', rec.ref], ['Travelers', String(rec.partySize)]])}`;
  const jobs = [
    safe('interest guest', mail(rec.email, t ? 'You are in: ' + t.title : 'You are on the Travel Club list', t ? 'Your trip request' : 'Travel Club', guestBody)),
    safe('interest admin', adminMail('[' + rec.ref + '] Travel Club ' + (t ? 'request: ' + t.title : 'departure alert'), 'New Travel Club request', `<p>A traveler asked to join${t ? '' : ' a future'} trip.</p>${trip.detailTable(rows)}`, rec.email))
  ];
  if (t && t.organizerEmail && t.organizerEmail !== rec.email) {
    jobs.push(safe('interest leader', mail(t.organizerEmail, 'New traveler on ' + t.title, 'Someone joined your trip',
      `<p>${trip.esc(firstName(rec.name))} ${rec.status === 'waitlist' ? 'joined the waitlist for' : 'joined'} <b>${trip.esc(t.title)}</b>${rec.source ? ' (from your link tagged <b>' + trip.esc(rec.source) + '</b>)' : ''}.</p>${trip.detailTable(rosterLine(rec).concat(extra.goalLine ? [['Your goal', extra.goalLine]] : []))}${rec.shareContact ? '' : '<p style="color:#555">This traveler chose not to share contact details. Add your group chat link in your dashboard so they can join it.</p>'}${button(SITE + '/account', 'Open my dashboard')}`)));
  }
  return Promise.all(jobs);
}

function goalMails(t, goal, asked) {
  const body = `<p>Your group has reached its goal: <b>${asked}</b> of <b>${goal}</b> people have joined <b>${trip.esc(t.title)}</b>.</p>${button(SITE + '/account', 'Open my dashboard')}`;
  const jobs = [safe('goal admin', adminMail('Goal reached: ' + t.title, 'Invite goal reached', `<p><b>${trip.esc(t.organizerName || 'A leader')}</b> reached their invite goal on <b>${trip.esc(t.title)}</b> (${asked} of ${goal}).</p>`))];
  if (t.organizerEmail) jobs.push(safe('goal leader', mail(t.organizerEmail, 'Your group reached its goal', 'Goal reached', body)));
  return Promise.all(jobs);
}

function groupLinkMails(t, joiners) {
  const jobs = joiners.map(i => safe('group link', mail(i.email, 'Join the group chat for ' + t.title, 'Your group chat is ready',
    `<p>Hi ${trip.esc(firstName(i.name))},</p><p>${t.organizerName ? trip.esc(t.organizerName) + ' has set up' : 'The group chat is ready for'} <b>${trip.esc(t.title)}</b>. Join to meet the group and get every update in one place.</p>${button(t.groupLink, 'Join the group chat')}<p style="color:#555">You can also find it on your dashboard.</p>`)));
  jobs.push(safe('group link admin', adminMail('Group chat added: ' + t.title, 'Group chat added', `<p>${trip.esc(t.organizerName || 'The leader')} added a group chat link to <b>${trip.esc(t.title)}</b>. ${joiners.length} traveler${joiners.length === 1 ? ' was' : 's were'} emailed.</p>${trip.detailTable([['Link', t.groupLink]])}`)));
  if (t.organizerEmail) jobs.push(safe('group link leader', mail(t.organizerEmail, 'Your group chat link is saved', 'Group chat saved', `<p>Your link is saved on <b>${trip.esc(t.title)}</b> and ${joiners.length} traveler${joiners.length === 1 ? ' has' : 's have'} been emailed it. New travelers see it as soon as they join.</p>`)));
  return Promise.all(jobs);
}

const INTEREST_COPY = {
  contacted: ['We are following up on your trip', 'A member of our team has started on your request and will be in touch with the details.'],
  confirmed: ['Your place is confirmed', 'Your place on this trip is confirmed. We will email you the next steps and payment details. Nothing has been charged yet.'],
  booked: ['Your trip is booked', 'You are booked. Everything for the trip will be shared with you by email and on your dashboard.'],
  cancelled: ['Your trip request was cancelled', 'Your request for this trip has been cancelled. If this is a surprise, just reply to this email and we will sort it out.'],
  waitlist: ['You are on the waitlist', 'The trip is full right now. You are on the waitlist and we will email you the moment a place opens.']
};
function interestStatusMails(i, t) {
  const c = INTEREST_COPY[i.status];
  if (!c) return Promise.resolve();
  const jobs = [safe('interest status', mail(i.email, c[0] + (i.tripTitle ? ': ' + i.tripTitle : ''), c[0], `<p>Hi ${trip.esc(firstName(i.name))},</p><p>${c[1]}</p>${trip.detailTable([['Reference', i.ref], ['Trip', i.tripTitle], ['Travelers', String(i.partySize)]])}${i.status !== 'cancelled' && t && hasGroupLink(t) ? '<p>Your group chat:</p>' + button(t.groupLink, 'Join the group chat') : ''}${button(SITE + '/account', 'Open my dashboard')}`))];
  if (i.status === 'booked' && t && t.organizerEmail && t.organizerEmail !== i.email) {
    jobs.push(safe('booked leader', mail(t.organizerEmail, 'A traveler booked: ' + t.title, 'A traveler booked', `<p>${trip.esc(firstName(i.name))} is now booked on <b>${trip.esc(t.title)}</b>.</p>${trip.detailTable([['Travelers', String(i.partySize)]])}`)));
  }
  return Promise.all(jobs);
}

function tripLiveMail(t) {
  if (!t.organizerEmail) return Promise.resolve();
  const link = SITE + '/trip/' + t.slug;
  if (t.status === 'open') {
    return safe('trip live', mail(t.organizerEmail, 'Your trip page is live: ' + t.title, 'Your trip is live',
      `<p>Good news${t.organizerName ? ', ' + trip.esc(firstName(t.organizerName)) : ''}. Your trip page is open and ready to share.</p>${trip.detailTable([['Trip', t.title], ['Dates', t.dateText], ['Your link', link]])}${button(link, 'Open my trip page')}<p>Share the link with your community. Travelers who join are counted on your dashboard, where you can also add your WhatsApp group or channel link so everyone lands in the same place.</p>${button(SITE + '/account', 'Open my dashboard')}`));
  }
  if (t.status === 'full') {
    return safe('trip full', mail(t.organizerEmail, 'Your trip is full: ' + t.title, 'Your trip is full', `<p><b>${trip.esc(t.title)}</b> is full. New travelers join the waitlist.</p>${button(SITE + '/account', 'Open my dashboard')}`));
  }
  if (t.status === 'closed') {
    return safe('trip closed', mail(t.organizerEmail, 'Your trip has closed: ' + t.title, 'Your trip has closed', `<p><b>${trip.esc(t.title)}</b> is closed to new travelers. Thank you for leading it with us.</p>`));
  }
  return Promise.resolve();
}

function applicationMails(rec) {
  const rows = [['Reference', rec.ref], ['Name', rec.name], ['Email', rec.email], ['Phone / WhatsApp', rec.phone], ['City and country', rec.city], ['Who they lead', rec.communityType],
    ['Community or group', rec.communityName], ['Link', rec.link], ['Community size', rec.audienceSize], ['How they reach them', (rec.channels || []).join(', ')], ['Organized trips before', rec.experience],
    ['Destination', rec.destination], ['People they would invite', rec.inviteCount != null ? String(rec.inviteCount) : rec.groupSize], ['Kind of trip', (rec.styles || []).join(', ')], ['Timing', rec.timing], ['In their words', rec.message], ['Anything else', rec.notes]];
  return Promise.all([
    mail(rec.email, 'We have your Travel Club application', 'Lead a trip',
      `<p>Thanks, ${trip.esc(rec.name.split(' ')[0])}. We have your application to lead a trip with Sight Seers. A member of the team will review it and get back to you by email. Every trip is approved by Sight Seers before it opens, and nothing is promoted until the package and your reward are agreed in writing.</p>${trip.detailTable([['Reference', rec.ref], ['Who you lead', rec.communityType], ['Community or group', rec.communityName], ['People they would invite', rec.inviteCount != null ? String(rec.inviteCount) : rec.groupSize]])}`),
    sendEmail({ replyTo: rec.email, subject: '[' + rec.ref + '] Travel Club application: ' + rec.communityName, html: trip.shell('New application to lead a trip', `<p>Review it in the admin portal under Travel Club trips.</p>${trip.detailTable(rows)}`, ' ') })
  ]);
}

const DECISION_COPY = {
  approved: ['Your Travel Club application is approved', 'Good news. We would like to build a trip with you. We will be in touch to agree the package, the dates and your reward in writing before anything is promoted.'],
  declined: ['About your Travel Club application', 'Thank you for applying. We are not able to move forward with this one right now.'],
  needs_info: ['A question about your Travel Club application', 'Thanks for applying. Before we decide, we need a little more from you.']
};
function decisionMail(app) {
  const copy = DECISION_COPY[app.status];
  if (!copy) return Promise.resolve();
  const reply = app.reply ? `<p style="white-space:pre-wrap;background:#f6faf7;border-left:4px solid #70c257;padding:10px 14px">${trip.esc(app.reply)}</p>` : '';
  const next = app.status === 'approved'
    ? '<p>Sign in to your dashboard to see your approval. Your trip page and your link to share will appear there once the package, dates and reward are agreed. From the dashboard you will also be able to see everyone who joins and add your WhatsApp group or channel link.</p>' + button(SITE + '/account', 'Open my dashboard')
    : (app.status === 'needs_info' ? button(SITE + '/account', 'Open my dashboard') : '');
  return mail(app.email, copy[0], 'Your application', `<p>Hi ${trip.esc(app.name.split(' ')[0])},</p><p>${copy[1]}</p>${reply}${trip.detailTable([['Reference', app.ref]])}${next}`);
}

/* ---------- referral links (travel insurance, eSIM): written by an admin, never invented ---------- */
const PARTNER_DEFAULTS = {
  insurance: { title: 'Travel insurance', note: 'Cover for cancellations, delays and medical care while you travel.', cta: 'Get a quote', url: '', logo: '' },
  esim: { title: 'Saily eSIM', note: 'Land connected, without swapping your SIM or paying roaming.', cta: 'Get an eSIM', url: 'https://go.saily.site/aff_c?offer_id=101&aff_id=14170', logo: '/logos/saily.png' }
};
const DEFAULT_DISCLOSURE = 'These are referral links. Sight Seers may receive a reward if you sign up through them.';
function cleanPartner(src) {
  src = src && typeof src === 'object' ? src : {};
  const url = str(src.url, 600);
  if (url) {
    let ok = false;
    try { const u = new URL(url); ok = u.protocol === 'https:' && !!u.hostname && u.hostname.indexOf('.') > 0; } catch (e) { ok = false; }
    if (!ok) return { error: 'use a full link that starts with https://' };
  }
  return { value: { url, title: str(src.title, 60), note: str(src.note, 200) } };
}
function publicPartners(doc) {
  doc = doc || {};
  const out = {};
  ['insurance', 'esim'].forEach(k => {
    const d = doc[k] || {}, f = PARTNER_DEFAULTS[k];
    out[k] = { url: d.url || f.url, title: d.title || f.title, note: d.note || f.note, cta: f.cta, logo: f.logo };
  });
  out.disclosure = doc.disclosure || DEFAULT_DISCLOSURE;
  return out;
}
async function getPartnersDoc() { return (await db.getCollection(SETTINGS)).find(x => x.id === 'partners') || null; }

/* ---------- handler ---------- */
module.exports = async function handler(req, res) {
  try {
    if (req.method === 'OPTIONS') return res.status(200).end();

    /* ===== reads ===== */
    if (req.method === 'GET') {
      const q = req.query || {};
      const url = new URL(req.url || '/', 'http://x');
      const get = k => (q[k] != null ? q[k] : url.searchParams.get(k));

      if (get('partners')) {
        return res.status(200).json({ ok: true, partners: publicPartners(await getPartnersDoc()) });
      }

      if (get('admin')) {
        const admin = requireAdmin(req, res);
        if (!admin) return;
        const [trips, applications, interests, partnersDoc, activity, users] = await Promise.all([db.getCollection(TRIPS), db.getCollection(APPS), db.getCollection(INTERESTS), getPartnersDoc(), db.getCollection(ACTIVITY), db.getCollection('users')]);
        /* every account, with what we hold on it (never the password): the owner's contact list for the Travel Club */
        const accounts = users.map(u => {
          const e = lower(u.email, 120);
          const apps = applications.filter(a => a.email === e || (a.userId && a.userId === u.id));
          const led = trips.filter(t => (t.organizerUserId && t.organizerUserId === u.id) || (t.organizerEmail && t.organizerEmail === e));
          const joined = interests.filter(i => i.email === e || (i.userId && i.userId === u.id));
          const latest = apps.slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))[0];
          return { id: u.id, name: u.name || '', email: u.email || '', phone: u.phone || (latest && latest.phone) || '', role: u.role || 'guest', source: u.provider || 'sign-up', createdAt: u.createdAt || '',
            country: u.country || '', city: u.city || '', basedIn: latest ? (latest.city || '') : '', applicationStatus: latest ? latest.status : '', applicationRef: latest ? latest.ref : '', community: latest ? latest.communityName : '', tripsLed: led.length, tripsJoined: joined.filter(i => i.status !== 'cancelled').length };
        }).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
        return res.status(200).json({ ok: true, accounts, trips, applications, interests, activity: activity.slice().sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, 150), partners: publicPartners(partnersDoc), partnersRaw: partnersDoc || {}, statuses: { trip: TRIP_STATUS, application: APP_STATUS, interest: INTEREST_STATUS, reward: REWARD_STATUS } });
      }

      if (get('mine')) {
        const user = getUser(req);
        if (!user) return res.status(401).json({ error: 'Sign in required' });
        const mailAddr = lower(user.email, 120);
        const [trips, applications, interests] = await Promise.all([db.getCollection(TRIPS), db.getCollection(APPS), db.getCollection(INTERESTS)]);
        const myApps = applications.filter(a => a.email === mailAddr || (a.userId && a.userId === user.id))
          .map(a => ({
            ref: a.ref, status: a.status, communityName: a.communityName, reply: a.status === 'pending' ? '' : (a.reply || ''), createdAt: a.createdAt, seenApproved: !!a.seenApproved,
            communityType: a.communityType || '', city: a.city || '', link: a.link || '', audienceSize: a.audienceSize || '', channels: a.channels || [], experience: a.experience || '',
            inviteCount: a.inviteCount != null ? a.inviteCount : null, destination: a.destination || '', styles: a.styles || [], timing: a.timing || '', message: a.message || '', notes: a.notes || ''
          }));
        const myTrips = trips.filter(t => ownsTrip(t, user)).map(t => {
          const list = interests.filter(i => i.tripId === t.id);
          return {
            id: t.id, slug: t.slug, title: t.title, status: t.status, dateText: t.dateText, destination: t.destination,
            url: '/trip/' + t.slug, counts: statusCounts(list), seatsTotal: t.seatsTotal || 0,
            inviteGoal: (() => { const a = t.applicationId ? applications.find(x => x.id === t.applicationId) : null; return a && a.inviteCount != null ? a.inviteCount : null; })(),
            reward: { status: t.rewardStatus || 'not_set', text: t.reward || '' },
            groupLink: t.groupLink || '', joined: joinedPeople(list),
            travelers: list.filter(i => i.status !== 'cancelled').slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
              .map(i => Object.assign({ firstName: i.name.split(' ')[0], partySize: i.partySize, guests: i.guests || [], status: i.status, source: i.source || '', createdAt: i.createdAt, shared: !!i.shareContact },
                i.shareContact ? { name: i.name, email: i.email, phone: i.phone || '' } : {}))
          };
        });
        const myInterests = interests.filter(i => i.email === mailAddr || (i.userId && i.userId === user.id))
          .map(i => {
            const t = trips.find(x => x.id === i.tripId);
            const open = i.status !== 'cancelled' && i.status !== 'waitlist';
            return { guests: i.guests || [], ref: i.ref, tripSlug: i.tripSlug, tripTitle: i.tripTitle, status: i.status, partySize: i.partySize, createdAt: i.createdAt,
              leaderName: t && t.organizerName ? t.organizerName : '', dateText: t ? t.dateText || '' : '', groupLink: open && t ? t.groupLink || '' : '', shareContact: !!i.shareContact };
          });
        /* popups for the dashboard: an approval, a trip going live, a group chat ready to join; for the owner, each new application and new website requests */
        const notices = [];
        if (user.role === 'admin' && user.id !== 'admin-passcode') {
          try {
            const items = (await inboxLib.collect(db)).filter(i => i.status === 'new');
            const seenDoc = (await db.getCollection(SETTINGS)).find(x => x.id === 'inboxSeen');
            const since = seenDoc ? String(seenDoc.at || '') : '';
            const fresh = items.filter(i => String(i.createdAt) > since);
            if (fresh.length) notices.push({ key: 'inbox:' + fresh[0].createdAt, kind: 'inbox', count: fresh.length, types: Object.keys(fresh.reduce((m, i) => { m[i.type] = 1; return m; }, {})).slice(0, 4) });
          } catch (e) { console.error('inbox notice', e && e.message); }
        }
        if (user.role === 'admin' && user.id !== 'admin-passcode') {
          /* one popup for all the applications waiting, never one per application */
          const waiting = applications.filter(a => (a.status === 'pending') && !a.adminSeen).sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
          if (waiting.length) notices.push({ key: 'adm:' + waiting.slice(0, 50).map(a => a.ref).join(','), kind: 'adminapps', count: waiting.length,
            items: waiting.slice(0, 6).map(a => ({ name: a.name, community: a.communityName, ref: a.ref, invite: a.inviteCount != null ? a.inviteCount : null, destination: a.destination || '' })) });
        }
        myApps.forEach(a => { if (a.status === 'approved' && !a.seenApproved) notices.push({ key: 'app:' + a.ref, kind: 'approved', community: a.communityName, ref: a.ref }); });
        trips.filter(t => ownsTrip(t, user) && (t.status === 'open' || t.status === 'full') && !t.liveSeen).forEach(t => notices.push({ key: 'trip:' + t.id, kind: 'live', title: t.title, url: '/trip/' + t.slug, slug: t.slug }));
        interests.filter(i => (i.email === mailAddr || (i.userId && i.userId === user.id)) && i.status !== 'cancelled' && i.status !== 'waitlist' && !i.linkSeen).forEach(i => {
          const t = trips.find(x => x.id === i.tripId);
          if (t && t.groupLink) notices.push({ key: 'join:' + i.ref, kind: 'group', title: t.title, groupLink: t.groupLink, leaderName: t.organizerName || '' });
        });
        notices.sort((x, y) => (y.kind === 'adminapps' ? 1 : 0) - (x.kind === 'adminapps' ? 1 : 0));   /* the owner's applications come first */
        return res.status(200).json({ ok: true, applications: myApps, trips: myTrips, interests: myInterests, notices, partners: publicPartners(await getPartnersDoc()) });
      }

      const [trips, interests] = await Promise.all([db.getCollection(TRIPS), db.getCollection(INTERESTS)]);
      const slug = get('slug');
      if (slug) {
        const t = trips.find(x => x.slug === String(slug));
        if (!t || (t.status !== 'open' && t.status !== 'full')) return res.status(404).json({ error: 'That trip is not open right now.' });
        return res.status(200).json({ ok: true, trip: publicTrip(t, interests) });
      }
      const open = trips.filter(t => t.status === 'open' || t.status === 'full')
        .sort((a, b) => String(a.startDate || '9999').localeCompare(String(b.startDate || '9999')))
        .map(t => publicTrip(t, interests));
      return res.status(200).json({ ok: true, trips: open });
    }

    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const body = req.body || {};
    const action = body.action;

    /* ===== public: ask to join a trip, or to hear when one opens ===== */
    if (action === 'interest') {
      if (str(body.website, 80)) return res.status(200).json({ ok: true });   /* the hidden field only a bot fills in */
      if (!allow('interest:' + ip(req), 10, 10 * 60 * 1000)) return res.status(429).json({ error: 'Too many requests. Please try again in a few minutes.' });
      const contact = trip.cleanContact({ name: body.name, email: body.email, phone: body.phone });
      if (contact.error) return res.status(400).json({ error: contact.error });
      if (!body.consent) return res.status(400).json({ error: 'Please agree to be contacted about this trip.' });
      /* one person per request: friends and teammates each join for themselves through the same trip page */
      const partySize = 1;
      const guests = [];
      const [trips, interests] = await Promise.all([db.getCollection(TRIPS), db.getCollection(INTERESTS)]);
      let t = null;
      const slug = str(body.tripSlug, 80);
      if (slug) {
        t = trips.find(x => x.slug === slug);
        if (!t || (t.status !== 'open' && t.status !== 'full')) return res.status(404).json({ error: 'That trip is not open right now.' });
      }
      const dupe = interests.find(i => i.email === contact.email && (i.tripId || null) === (t ? t.id : null) && i.status !== 'cancelled');
      if (dupe) return res.status(200).json({ ok: true, already: true, ref: dupe.ref });
      const user = getUser(req);
      const full = t && (t.status === 'full' || (t.seatsTotal && travelersCounted(interests, t.id) + partySize > t.seatsTotal));
      const rec = {
        id: uid(), ref: trip.ref('TC'), kind: t ? 'trip' : 'alert',
        tripId: t ? t.id : null, tripSlug: t ? t.slug : '', tripTitle: t ? t.title : '',
        name: contact.name, email: contact.email, phone: contact.phone, partySize, guests: partySize > 1 ? guests : [],
        message: str(body.message, 1200), source: str(body.source, 40), shareContact: !!body.shareContact,
        userId: user && user.id !== 'admin-passcode' ? user.id : null,
        status: full ? 'waitlist' : 'new', note: '', createdAt: new Date().toISOString()
      };
      await db.addToCollection(INTERESTS, rec);
      let goalLine = '', goalHit = null;
      if (t) {
        const all = interests.concat([rec]).filter(i => i.tripId === t.id);
        const asked = joinedPeople(all);
        const apps = t.applicationId ? await db.getCollection(APPS) : [];
        const app = t.applicationId ? apps.find(x => x.id === t.applicationId) : null;
        const goal = app && app.inviteCount != null ? app.inviteCount : null;
        if (goal) {
          goalLine = asked + ' of ' + goal;
          if (asked >= goal && !t.goalNotified && rec.status !== 'waitlist') { goalHit = { asked, goal }; await db.updateInCollection(TRIPS, t.id, { goalNotified: true }); }
        }
      }
      await log('joined', rec.name + ' ' + (rec.status === 'waitlist' ? 'joined the waitlist for ' : 'joined ') + (t ? t.title : 'the departure alert list') + (rec.partySize > 1 ? ' (' + rec.partySize + ' travelers)' : ''), rec.ref);
      await interestMails(rec, t, { goalLine });
      if (goalHit) { await log('goal', (t.organizerName || 'A leader') + ' reached the invite goal on ' + t.title, rec.ref); await goalMails(t, goalHit.goal, goalHit.asked); }
      return res.status(200).json({ ok: true, ref: rec.ref, waitlist: rec.status === 'waitlist' });
    }

    /* ===== public: apply to lead a trip ===== */
    if (action === 'apply') {
      if (str(body.website, 80)) return res.status(200).json({ ok: true });
      if (!allow('apply:' + ip(req), 10, 30 * 60 * 1000)) return res.status(429).json({ error: 'Too many requests. Please try again later.' });
      const contact = trip.cleanContact({ name: body.name, email: body.email, phone: body.phone });
      if (contact.error) return res.status(400).json({ error: contact.error });
      if (!str(body.communityName, 120)) return res.status(400).json({ error: 'Tell us the name of your community or group.' });
      if (!str(body.message, 2000) || str(body.message, 2000).length < 20) return res.status(400).json({ error: 'Tell us a little about your group and the trip you have in mind.' });
      if (!body.consent) return res.status(400).json({ error: 'Please agree to be contacted about your application.' });
      const apps = await db.getCollection(APPS);
      const open = apps.find(a => a.email === contact.email && (a.status === 'pending' || a.status === 'needs_info'));
      if (open) return res.status(200).json({ ok: true, already: true, ref: open.ref });
      let inviteCount = null;
      const rawInvite = body.inviteCount;
      if (rawInvite !== undefined && rawInvite !== null && String(rawInvite).trim() !== '') {
        const n = (typeof rawInvite === 'number' || typeof rawInvite === 'string') ? Number(rawInvite) : NaN;
        if (!Number.isInteger(n) || n < 1 || n > 1000) return res.status(400).json({ error: 'Enter the number of people you would invite as a whole number from 1 to 1000.' });
        inviteCount = n;
      }
      const user = getUser(req);
      const rec = {
        id: uid(), ref: trip.ref('TL'),
        name: contact.name, email: contact.email, phone: contact.phone, city: str(body.city, 100),
        communityType: oneOf(str(body.communityType, 60), COMMUNITY_TYPES, 'Other group leader'),
        communityName: str(body.communityName, 120), link: str(body.link, 300),
        audienceSize: oneOf(str(body.audienceSize, 30), AUDIENCE_SIZES, ''),
        channels: manyOf(body.channels, CHANNELS), experience: oneOf(str(body.experience, 60), EXPERIENCE, ''),
        inviteCount, groupSize: oneOf(str(body.groupSize, 20), GROUP_SIZES, ''), styles: manyOf(body.styles, STYLES),
        destination: str(body.destination, 120), timing: str(body.timing, 120), message: str(body.message, 2000), notes: str(body.notes, 600),
        userId: user && user.id !== 'admin-passcode' ? user.id : null,
        status: 'pending', reply: '', note: '', tripId: null, createdAt: new Date().toISOString()
      };
      /* applying also opens a Sight Seers account for that email (if there is none) and signs the applicant in, so they
         land on their dashboard with the application pending. They choose the password on the form. An applicant who
         is already signed in, or who already has an account, keeps theirs. */
      let newAccount = false, session = null;
      const pw = typeof body.password === 'string' ? body.password : '';
      if (!rec.userId) {
        try {
          const users = await db.getCollection('users');
          const found = users.find(u => u.email === rec.email);
          if (found) rec.userId = found.id;
          else {
            if (pw) { const pwErr = validatePassword(pw); if (pwErr) return res.status(400).json({ error: pwErr }); }
            const acct = { id: uid(), name: rec.name, email: rec.email, passwordHash: hashPassword(pw || (crypto.randomBytes(18).toString('hex') + 'Aa1')), phone: rec.phone || '', style: 'Adventure', role: 'guest', provider: pw ? 'application' : 'application-link', country: geo(req).country, city: geo(req).city, createdAt: new Date().toISOString() };
            await db.addToCollection('users', acct);
            rec.userId = acct.id;
            newAccount = true;
            if (pw) {
              const tokenStr = createToken({ id: acct.id, email: acct.email, name: acct.name, role: acct.role });
              if (tokenStr) { const { passwordHash, ...safeUser } = acct; session = { token: tokenStr, user: safeUser }; }
            }
          }
        } catch (e) { console.error('club apply account', e && e.message); }
      }
      await db.addToCollection(APPS, rec);
      if (newAccount) {
        const how = session
          ? '<p><b>To sign in later,</b> use this email address and the password you chose.</p>'
          : `<p><b>To sign in, set your password first:</b> open the sign-in page, choose <b>Forgot password</b>, and enter <b>${trip.esc(rec.email)}</b>. We will email you a code.</p>`;
        await safe('apply account', mail(rec.email, 'Your Sight Seers account is ready', 'Your account is ready',
          `<p>Hi ${trip.esc(firstName(rec.name))},</p><p>We opened a Sight Seers account for you with this email address, so you can follow your application to lead a trip. A member of the team is reviewing it now.</p>${how}${button(SITE + '/account', 'Open my account')}`));
      }
      await log('application', rec.name + ' applied to lead a trip: ' + rec.communityName, rec.ref);
      try { await applicationMails(rec); } catch (e) { console.error('club application email', e && e.message); }
      return res.status(200).json(Object.assign({ ok: true, ref: rec.ref, account: newAccount ? 'created' : 'existing' }, session ? { token: session.token, user: session.user } : {}));
    }

    /* ===== signed in: the applicant changes the number of people they would invite ===== */
    if (action === 'application-invite') {
      const user = getUser(req);
      if (!user || user.id === 'admin-passcode') return res.status(401).json({ error: 'Sign in with your account to change this.' });
      const raw = body.inviteCount;
      const n = (typeof raw === 'number' || typeof raw === 'string') && String(raw).trim() !== '' ? Number(raw) : NaN;
      if (!Number.isInteger(n) || n < 1 || n > 1000) return res.status(400).json({ error: 'Enter the number of people you would invite as a whole number from 1 to 1000.' });
      const mailAddr = lower(user.email, 120);
      const apps = await db.getCollection(APPS);
      const a = apps.find(x => x.ref === str(body.ref, 40) && (x.email === mailAddr || (x.userId && x.userId === user.id)));
      if (!a) return res.status(404).json({ error: 'We could not find that application.' });
      if (a.status === 'declined') return res.status(400).json({ error: 'This application is closed.' });
      const saved = await db.updateInCollection(APPS, a.id, { inviteCount: n });
      return res.status(200).json({ ok: true, inviteCount: saved.inviteCount });
    }

    /* ===== signed in: the leader adds their WhatsApp group or channel link; joiners are emailed it ===== */
    if (action === 'trip-group-link') {
      const user = getUser(req);
      if (!user || user.id === 'admin-passcode') return res.status(401).json({ error: 'Sign in with your account to do this.' });
      const link = groupLinkOf(body.groupLink);
      if (str(body.groupLink, 400) && !link) return res.status(400).json({ error: 'Paste the full invite link, starting with https://' });
      const [trips, interests] = await Promise.all([db.getCollection(TRIPS), db.getCollection(INTERESTS)]);
      const t = trips.find(x => x.id === str(body.id, 60));
      if (!t || !ownsTrip(t, user)) return res.status(404).json({ error: 'We could not find that trip.' });
      const changed = link !== (t.groupLink || '');
      const saved = await db.updateInCollection(TRIPS, t.id, { groupLink: link, groupLinkAt: new Date().toISOString() });
      if (changed && link) {
        const joiners = activeJoiners(interests.filter(i => i.tripId === t.id));
        await log('group-link', (t.organizerName || 'A leader') + ' added the group chat for ' + t.title, t.id);
        await groupLinkMails(saved, joiners);
      }
      return res.status(200).json({ ok: true, groupLink: saved.groupLink || '' });
    }

    /* ===== signed in: mark a dashboard popup as seen ===== */
    if (action === 'notice-seen') {
      const user = getUser(req);
      if (!user || user.id === 'admin-passcode') return res.status(401).json({ error: 'Sign in required' });
      const key = str(body.key, 80), mailAddr = lower(user.email, 120);
      if (key.indexOf('inbox:') === 0) {
        if (user.role === 'admin') {
          const at = key.slice(6), doc = (await db.getCollection(SETTINGS)).find(x => x.id === 'inboxSeen');
          if (doc) await db.updateInCollection(SETTINGS, 'inboxSeen', { at });
          else await db.addToCollection(SETTINGS, { id: 'inboxSeen', at });
        }
      } else if (key.indexOf('adm:') === 0) {
        if (user.role === 'admin') {
          const refs = key.slice(4).split(',').slice(0, 50), all = await db.getCollection(APPS);
          for (const a of all.filter(x => refs.indexOf(x.ref) > -1)) await db.updateInCollection(APPS, a.id, { adminSeen: true });
        }
      } else if (key.indexOf('app:') === 0) {
        const a = (await db.getCollection(APPS)).find(x => x.ref === key.slice(4) && (x.email === mailAddr || (x.userId && x.userId === user.id)));
        if (a) await db.updateInCollection(APPS, a.id, { seenApproved: true });
      } else if (key.indexOf('trip:') === 0) {
        const t = (await db.getCollection(TRIPS)).find(x => x.id === key.slice(5));
        if (t && ownsTrip(t, user)) await db.updateInCollection(TRIPS, t.id, { liveSeen: true });
      } else if (key.indexOf('join:') === 0) {
        const i = (await db.getCollection(INTERESTS)).find(x => x.ref === key.slice(5) && (x.email === mailAddr || (x.userId && x.userId === user.id)));
        if (i) await db.updateInCollection(INTERESTS, i.id, { linkSeen: true });
      }
      return res.status(200).json({ ok: true });
    }

    /* ===== admin ===== */
    if (action === 'account-delete') {
      const admin = requireAdmin(req, res);
      if (!admin) return;
      const users = await db.getCollection('users');
      const u = users.find(x => x.id === str(body.id, 80));
      if (!u) return res.status(404).json({ error: 'Account not found.' });
      if (u.role === 'admin') return res.status(400).json({ error: 'Admin accounts cannot be deleted here.' });
      const em = lower(u.email, 120);
      const [tripsAll, apps, ints] = await Promise.all([db.getCollection(TRIPS), db.getCollection(APPS), db.getCollection(INTERESTS)]);
      if (tripsAll.some(t => (t.organizerUserId && t.organizerUserId === u.id) || (t.organizerEmail && t.organizerEmail === em))) return res.status(409).json({ error: 'This account leads a trip. Close or reassign the trip first.' });
      const theirApps = apps.filter(a => a.email === em || (a.userId && a.userId === u.id));
      const keepApps = theirApps.filter(a => a.status === 'approved');
      /* an approved leader application is kept on record; everything else of theirs goes with the account */
      for (const a of theirApps) { if (a.status !== 'approved') await db.removeFromCollection(APPS, a.id); }
      for (const i of ints.filter(i => (i.email === em || (i.userId && i.userId === u.id)) && i.status !== 'booked')) await db.removeFromCollection(INTERESTS, i.id);
      await db.setCollection('users', users.filter(x => x.id !== u.id));
      await log('account-deleted', 'Account removed: ' + (u.name || u.email), u.id);
      return res.status(200).json({ ok: true, keptApplications: keepApps.length });
    }
    if (action === 'trip-save' || action === 'trip-status' || action === 'trip-delete' || action === 'application-delete' || action === 'interest-delete' || action === 'activity-delete' || action === 'application-review' || action === 'interest-update' || action === 'partners-save') {
      const admin = requireAdmin(req, res);
      if (!admin) return;

      if (action === 'trip-save') {
        const trips = await db.getCollection(TRIPS);
        const existing = body.id ? trips.find(t => t.id === body.id) : null;
        if (body.id && !existing) return res.status(404).json({ error: 'Trip not found.' });
        const c = cleanTrip(body, existing, trips);
        if (c.error) return res.status(400).json({ error: c.error });
        let saved;
        if (existing) saved = await db.updateInCollection(TRIPS, existing.id, c.value);
        else {
          saved = Object.assign({ id: uid(), createdAt: new Date().toISOString(), applicationId: str(body.applicationId, 60) || null }, c.value);
          await db.addToCollection(TRIPS, saved);
        }
        if ((!existing || existing.status !== saved.status) && ['open', 'full', 'closed'].indexOf(saved.status) > -1 && body.notify !== false) {
          await log('trip-' + saved.status, saved.title + ' is now ' + saved.status, saved.id);
          await tripLiveMail(saved);
        }
        return res.status(200).json({ ok: true, trip: saved });
      }

      if (action === 'application-delete') {
        const apps = await db.getCollection(APPS), a = apps.find(x => x.id === str(body.id, 80));
        if (!a) return res.status(404).json({ error: 'Application not found.' });
        await db.removeFromCollection(APPS, a.id);
        /* a trip drafted from it stays, but no longer points back at the deleted application */
        for (const t of (await db.getCollection(TRIPS)).filter(x => x.applicationId === a.id)) await db.updateInCollection(TRIPS, t.id, { applicationId: null });
        await log('application-deleted', 'Application deleted: ' + a.communityName + ' (' + a.name + ')', a.ref);
        return res.status(200).json({ ok: true });
      }

      if (action === 'activity-delete') {
        await db.removeFromCollection(ACTIVITY, str(body.id, 80));
        return res.status(200).json({ ok: true });
      }

      if (action === 'interest-delete') {
        const ints = await db.getCollection(INTERESTS), i = ints.find(x => x.id === str(body.id, 80));
        if (!i) return res.status(404).json({ error: 'Request not found.' });
        await db.removeFromCollection(INTERESTS, i.id);
        await log('request-deleted', 'Request deleted: ' + i.name + (i.tripTitle ? ' on ' + i.tripTitle : ''), i.ref);
        return res.status(200).json({ ok: true });
      }

      if (action === 'trip-status') {
        const trips = await db.getCollection(TRIPS), t = trips.find(x => x.id === str(body.id, 80));
        if (!t) return res.status(404).json({ error: 'Trip not found.' });
        const status = oneOf(body.status, TRIP_STATUS, null);
        if (!status) return res.status(400).json({ error: 'Choose a status.' });
        if ((status === 'open' || status === 'full') && !t.summary) return res.status(400).json({ error: 'Add a short summary to the trip before it opens.' });
        if ((status === 'open' || status === 'full') && !t.dateText && !t.startDate) return res.status(400).json({ error: 'Add the dates to the trip before it opens.' });
        const saved = await db.updateInCollection(TRIPS, t.id, { status });
        if (t.status !== status && ['open', 'full', 'closed'].indexOf(status) > -1) { await log('trip-' + status, saved.title + ' is now ' + status, saved.id); if (body.notify !== false) await tripLiveMail(saved); }
        return res.status(200).json({ ok: true, trip: saved });
      }

      if (action === 'trip-delete') {
        const trips = await db.getCollection(TRIPS), t = trips.find(x => x.id === body.id);
        if (!t) return res.status(404).json({ error: 'Trip not found.' });
        const interests = await db.getCollection(INTERESTS);
        const theirs = interests.filter(i => i.tripId === t.id);
        if (theirs.length && !body.force) return res.status(409).json({ error: 'This trip has traveler requests. Close it instead, or delete it together with its requests.', requests: theirs.length });
        for (const i of theirs) await db.removeFromCollection(INTERESTS, i.id);
        /* also clear tripId from any applications that reference this trip */
        const apps = await db.getCollection(APPS);
        const linkedApps = apps.filter(a => a.tripId === t.id);
        for (const a of linkedApps) {
          await db.updateInCollection(APPS, a.id, { tripId: null });
        }
        await db.removeFromCollection(TRIPS, t.id);
        await log('trip-deleted', 'Trip deleted: ' + t.title + (theirs.length ? ' (with ' + theirs.length + ' request' + (theirs.length === 1 ? '' : 's') + ')' : ''), t.id);
        return res.status(200).json({ ok: true });
      }

      if (action === 'application-review') {
        const apps = await db.getCollection(APPS), app = apps.find(a => a.id === body.id);
        if (!app) return res.status(404).json({ error: 'Application not found.' });
        const status = oneOf(body.status, APP_STATUS, null);
        if (!status) return res.status(400).json({ error: 'Choose a decision.' });
        const updates = { status, reply: str(body.reply, 1500), note: str(body.note, 1000), reviewedBy: admin.email || admin.id, reviewedAt: new Date().toISOString() };
        let drafted = null;
        if (status === 'approved' && body.createTrip && !app.tripId) {
          const trips = await db.getCollection(TRIPS);
          let slug = slugify(app.communityName + '-' + (app.destination || 'trip')) || 'trip';
          let n = 2, base = slug;
          while (trips.some(t => t.slug === slug)) slug = base + '-' + n++;
          /* the draft starts from what the leader wrote, so it can go straight on the departure board */
          const draftSummary = str(app.message, 240).replace(/\s+/g, ' ');
          const draftDates = str(app.timing, 80) || 'Dates to be announced';
          const goLive = !!body.publish && draftSummary.length >= 10;
          drafted = {
            id: uid(), createdAt: new Date().toISOString(), applicationId: app.id, slug, status: goLive ? 'open' : 'draft',
            title: (app.communityName + (app.destination ? ': ' + app.destination : '')).slice(0, 120), destination: app.destination || '', country: '', dateText: draftDates, startDate: '', endDate: '',
            summary: draftSummary, description: '', included: [], image: '', imageAlt: '', priceText: '', paymentNote: PAYMENT_NOTE, seatsTotal: 0,
            organizerName: app.name, organizerCommunity: app.communityName, organizerBio: '', organizerEmail: app.email, organizerUserId: app.userId || null, showOrganizer: true,
            reward: '', rewardStatus: 'not_set', internalNote: 'Drafted from application ' + app.ref
          };
          await db.addToCollection(TRIPS, drafted);
          updates.tripId = drafted.id;
        }
        const saved = await db.updateInCollection(APPS, app.id, updates);
        if (drafted && drafted.status === 'open') { await log('trip-open', drafted.title + ' is now open', drafted.id); if (body.notify !== false) await tripLiveMail(drafted); }
        await log('decision', app.communityName + ' (' + app.name + ') ' + status.replace('_', ' '), app.ref);
        if (body.notify !== false) { try { await decisionMail(saved); } catch (e) { console.error('club decision email', e && e.message); } }
        return res.status(200).json({ ok: true, application: saved, trip: drafted });
      }

      if (action === 'partners-save') {
        const doc = { id: 'partners' };
        for (const k of ['insurance', 'esim']) {
          const c = cleanPartner(body[k]);
          if (c.error) return res.status(400).json({ error: (k === 'esim' ? 'eSIM' : 'Travel insurance') + ': ' + c.error + '.' });
          doc[k] = c.value;
        }
        doc.disclosure = str(body.disclosure, 300);
        doc.updatedBy = admin.email || admin.id;
        const cur = await getPartnersDoc();
        const saved = cur ? await db.updateInCollection(SETTINGS, 'partners', doc) : await db.addToCollection(SETTINGS, Object.assign({ createdAt: new Date().toISOString() }, doc));
        return res.status(200).json({ ok: true, partners: publicPartners(saved), partnersRaw: saved });
      }

      if (action === 'interest-update') {
        const interests = await db.getCollection(INTERESTS), i = interests.find(x => x.id === body.id);
        if (!i) return res.status(404).json({ error: 'Request not found.' });
        const status = oneOf(body.status, INTEREST_STATUS, null);
        if (!status) return res.status(400).json({ error: 'Choose a status.' });
        const saved = await db.updateInCollection(INTERESTS, i.id, { status, note: str(body.note, 1000) });
        if (status !== i.status) {
          await log('traveler', i.name + ' is now ' + status + ' on ' + (i.tripTitle || 'a departure alert'), i.ref);
          if (body.notify !== false) { const tt = i.tripId ? (await db.getCollection(TRIPS)).find(x => x.id === i.tripId) : null; await interestStatusMails(saved, tt); }
        }
        return res.status(200).json({ ok: true, interest: saved });
      }
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (e) {
    console.error('trips handler', e && e.stack || e);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

module.exports.constants = { TRIP_STATUS, APP_STATUS, INTEREST_STATUS, REWARD_STATUS, COMMUNITY_TYPES, GROUP_SIZES, AUDIENCE_SIZES, CHANNELS, EXPERIENCE, STYLES, PAYMENT_NOTE };
