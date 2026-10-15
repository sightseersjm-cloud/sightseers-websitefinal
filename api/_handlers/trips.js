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
 *
 * Nothing here invents a price, a seat count, a reward or a departure: a trip only exists when an admin enters it,
 * seats are only shown when an admin sets them, and an organizer's reward is private text an admin writes per trip.
 * Travelers are never charged here. Sight Seers confirms availability and payment terms with them first.
 */

const db = require('../_lib/db');
const { getUser, requireAdmin, uid } = require('../_lib/auth');
const { sendEmail, BUSINESS_EMAIL } = require('../_lib/email');
const trip = require('../_lib/trip');

const TRIPS = 'club-trips';
const APPS = 'club-applications';
const INTERESTS = 'club-interests';
const SETTINGS = 'club-settings';

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
    internalNote: str(b.internalNote, 1000)
  };
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
function interestMails(rec, t) {
  const rows = [['Reference', rec.ref], ['Trip', rec.tripTitle || 'No trip chosen yet: wants to hear when one opens'], ['Name', rec.name], ['Email', rec.email], ['Phone / WhatsApp', rec.phone],
    ['Travelers', String(rec.partySize)], ['Message', rec.message], ['Came from', rec.source], ['Led by', t && t.organizerName]];
  const guestBody = t
    ? `<p>Thanks, ${trip.esc(rec.name.split(' ')[0])}. We have your request for <b>${trip.esc(t.title)}</b>. ${trip.esc(t.paymentNote || PAYMENT_NOTE)}</p>${trip.detailTable(rows.slice(0, 1).concat([['Trip', t.title], ['Dates', t.dateText], ['Travelers', String(rec.partySize)]]))}`
    : `<p>Thanks, ${trip.esc(rec.name.split(' ')[0])}. We will email you as soon as a Travel Club departure opens. Nothing is charged and there is nothing else you need to do.</p>${trip.detailTable([['Reference', rec.ref], ['Travelers', String(rec.partySize)]])}`;
  return Promise.all([
    mail(rec.email, t ? 'We have your request: ' + t.title : 'You are on the Travel Club list', t ? 'Your trip request' : 'Travel Club', guestBody),
    sendEmail({ replyTo: rec.email, subject: '[' + rec.ref + '] Travel Club ' + (t ? 'request: ' + t.title : 'departure alert'), html: trip.shell('New Travel Club request', `<p>A traveler asked to join${t ? '' : ' a future'} trip.</p>${trip.detailTable(rows)}`, ' ') })
  ]);
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
  return mail(app.email, copy[0], 'Your application', `<p>Hi ${trip.esc(app.name.split(' ')[0])},</p><p>${copy[1]}</p>${reply}${trip.detailTable([['Reference', app.ref]])}`);
}

/* ---------- referral links (travel insurance, eSIM): written by an admin, never invented ---------- */
const PARTNER_DEFAULTS = {
  insurance: { title: 'Travel insurance', note: 'Cover for cancellations, delays and medical care while you travel.', cta: 'Get a quote' },
  esim: { title: 'eSIM', note: 'Land connected, without swapping your SIM or paying roaming.', cta: 'Get an eSIM' }
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
    out[k] = { url: d.url || '', title: d.title || f.title, note: d.note || f.note, cta: f.cta };
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
        const [trips, applications, interests, partnersDoc] = await Promise.all([db.getCollection(TRIPS), db.getCollection(APPS), db.getCollection(INTERESTS), getPartnersDoc()]);
        return res.status(200).json({ ok: true, trips, applications, interests, partners: publicPartners(partnersDoc), partnersRaw: partnersDoc || {}, statuses: { trip: TRIP_STATUS, application: APP_STATUS, interest: INTEREST_STATUS, reward: REWARD_STATUS } });
      }

      if (get('mine')) {
        const user = getUser(req);
        if (!user) return res.status(401).json({ error: 'Sign in required' });
        const mailAddr = lower(user.email, 120);
        const [trips, applications, interests] = await Promise.all([db.getCollection(TRIPS), db.getCollection(APPS), db.getCollection(INTERESTS)]);
        const myApps = applications.filter(a => a.email === mailAddr || (a.userId && a.userId === user.id))
          .map(a => ({
            ref: a.ref, status: a.status, communityName: a.communityName, reply: a.status === 'pending' ? '' : (a.reply || ''), createdAt: a.createdAt,
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
            travelers: list.filter(i => i.status !== 'cancelled').slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
              .map(i => ({ firstName: i.name.split(' ')[0], partySize: i.partySize, status: i.status, source: i.source || '', createdAt: i.createdAt }))
          };
        });
        const myInterests = interests.filter(i => i.email === mailAddr || (i.userId && i.userId === user.id))
          .map(i => ({ ref: i.ref, tripSlug: i.tripSlug, tripTitle: i.tripTitle, status: i.status, partySize: i.partySize, createdAt: i.createdAt }));
        return res.status(200).json({ ok: true, applications: myApps, trips: myTrips, interests: myInterests, partners: publicPartners(await getPartnersDoc()) });
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
      const partySize = int(body.partySize, 1, 60, 1);
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
        name: contact.name, email: contact.email, phone: contact.phone, partySize,
        message: str(body.message, 1200), source: str(body.source, 40),
        userId: user && user.id !== 'admin-passcode' ? user.id : null,
        status: full ? 'waitlist' : 'new', note: '', createdAt: new Date().toISOString()
      };
      await db.addToCollection(INTERESTS, rec);
      try { await interestMails(rec, t); } catch (e) { console.error('club interest email', e && e.message); }
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
      await db.addToCollection(APPS, rec);
      try { await applicationMails(rec); } catch (e) { console.error('club application email', e && e.message); }
      return res.status(200).json({ ok: true, ref: rec.ref });
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

    /* ===== admin ===== */
    if (action === 'trip-save' || action === 'trip-delete' || action === 'application-review' || action === 'interest-update' || action === 'partners-save') {
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
        return res.status(200).json({ ok: true, trip: saved });
      }

      if (action === 'trip-delete') {
        const trips = await db.getCollection(TRIPS), t = trips.find(x => x.id === body.id);
        if (!t) return res.status(404).json({ error: 'Trip not found.' });
        const interests = await db.getCollection(INTERESTS);
        if (interests.some(i => i.tripId === t.id)) return res.status(409).json({ error: 'This trip has traveler requests. Close it instead of deleting it.' });
        await db.removeFromCollection(TRIPS, t.id);
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
          drafted = {
            id: uid(), createdAt: new Date().toISOString(), applicationId: app.id, slug, status: 'draft',
            title: (app.communityName + (app.destination ? ': ' + app.destination : '')).slice(0, 120), destination: app.destination || '', country: '', dateText: '', startDate: '', endDate: '',
            summary: '', description: '', included: [], image: '', imageAlt: '', priceText: '', paymentNote: PAYMENT_NOTE, seatsTotal: 0,
            organizerName: app.name, organizerCommunity: app.communityName, organizerBio: '', organizerEmail: app.email, organizerUserId: app.userId || null, showOrganizer: true,
            reward: '', rewardStatus: 'not_set', internalNote: 'Drafted from application ' + app.ref
          };
          await db.addToCollection(TRIPS, drafted);
          updates.tripId = drafted.id;
        }
        const saved = await db.updateInCollection(APPS, app.id, updates);
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
