/**
 * api/_lib/ops-auto.js
 * The daily "ease on me" jobs: follow-ups for quiet leads, Calendly sync, payment and waiver reminders,
 * pre-arrival and after-trip emails, and the morning summary to the team.
 * Everything is OFF until an admin switches it on in Admin, Automations, and every guest email can be previewed first.
 * Each email is marked as sent BEFORE it goes out, so a retried job never sends the same message twice.
 */
const db = require('./db');
const { sendEmail } = require('./email');
const { escapeHtml } = require('./auth');
const inv = require('./invoice');

const SETTINGS = 'ops-auto-settings', SENT = 'ops-sent', OPTOUT = 'ops-optout', REPLIES = 'ops-replies';
const SITE = (process.env.SITE_URL || 'https://www.sightseerscaribbean.com').replace(/\/+$/, '');
const CALENDLY_LINK = 'https://calendly.com/sightseersjm/30min';
const PHONE = '+1 (876) 465-0630';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_GUEST_EMAILS_PER_RUN = 40;

const KINDS = ['followups', 'calendly', 'payments', 'waivers', 'arrival', 'review', 'digest'];
const DEFAULTS = { followups: false, calendly: false, payments: false, waivers: false, arrival: false, review: false, digest: false, reviewLink: '', templates: {}, lastRun: null };

/* ---------- the wording (an admin can change any of these in the Automations screen) ---------- */
const DEFAULT_TEMPLATES = {
  followup1: { label: 'Follow-up, first nudge (about a day after a request)', subject: 'Your {trip} request: pick a time to plan it with us',
    body: 'Hi {first},\n\nThanks again for your request for {trip}. We would love to plan it with you. The quickest next step is a short call with one of our planners (about 30 minutes, on Zoom), where we go through your dates, group and ideas.\n\n{button:Choose a time}\n\nIf you have questions first, just reply to this email or message us on WhatsApp at ' + PHONE + '.\n\nSight Seers Caribbean Adventures' },
  followup2: { label: 'Follow-up, second nudge (a few days later)', subject: 'Still thinking about {trip}?',
    body: 'Hi {first},\n\nJust a friendly check-in on your {trip} request. Dates fill up, so if you would still like us to plan it, you can choose a time to talk here:\n\n{button:Choose a time}\n\nIf your plans changed, no problem at all. Reply and let us know and we will not bother you again.\n\nSight Seers Caribbean Adventures' },
  payment_soon: { label: 'Payment reminder, a few days before the due date', subject: 'Reminder: invoice {number} is due on {due}',
    body: 'Hi {first},\n\nA friendly reminder that invoice {number} for {amount} is due on {due}. The invoice is attached again with the payment details.\n\nIf you have already paid, thank you, and please ignore this note. Questions? Just reply to this email.\n\nSight Seers Caribbean Adventures' },
  payment_due: { label: 'Payment reminder, on the due date', subject: 'Invoice {number} is due today',
    body: 'Hi {first},\n\nInvoice {number} for {amount} is due today. The invoice is attached again with the payment details.\n\nIf you have already paid, thank you, and please ignore this note. If you need a little more time, reply and let us know.\n\nSight Seers Caribbean Adventures' },
  payment_late: { label: 'Payment reminder, after the due date', subject: 'Invoice {number} is now past due',
    body: 'Hi {first},\n\nInvoice {number} for {amount} was due on {due} and we have not yet received payment. The invoice is attached again with the payment details.\n\nIf you have already paid, thank you, and please ignore this note. If something is in the way, reply and we will sort it out together.\n\nSight Seers Caribbean Adventures' },
  waiver_week: { label: 'Waiver reminder, a week before the trip', subject: 'One quick thing before {trip}: your waiver',
    body: 'Hi {first},\n\nYour trip is coming up on {date}. Each traveller needs to sign a short participant waiver before the day. It takes a couple of minutes and you can do it on your phone.\n\n{button:Sign the waiver}\n\nYou will get a copy of the signed waiver by email.\n\nSight Seers Caribbean Adventures' },
  waiver_last: { label: 'Waiver reminder, two days before the trip', subject: 'Last reminder: sign your waiver for {trip}',
    body: 'Hi {first},\n\nYour trip is on {date} and we do not have your signed waiver yet. Please sign it before the day so nothing slows you down.\n\n{button:Sign the waiver}\n\nSight Seers Caribbean Adventures' },
  arrival: { label: 'Before you arrive (three days before)', subject: 'Getting ready for {trip} on {date}',
    body: 'Hi {first},\n\nYour trip is almost here. We are looking forward to hosting you.\n\nIf you have not already, please reply with your arrival details (flight or arrival time, and where you are staying) so we can confirm your pickup. Everyone in your group should sign the waiver before the day:\n\n{button:Sign the waiver}\n\nNeed us for anything? Message or call us on WhatsApp at ' + PHONE + '.\n\nSight Seers Caribbean Adventures' },
  review: { label: 'After the trip (two days after)', subject: 'Thank you, {first}. How was {trip}?',
    body: 'Hi {first},\n\nThank you for travelling with us. We hope {trip} was everything you hoped for.\n\n{reviewLine}\n\nWhen you are ready to plan the next one, just reply to this email or start a new request on our website. We would love to host you again.\n\nSight Seers Caribbean Adventures' }
};

function templateFor(settings, key) {
  const d = DEFAULT_TEMPLATES[key], o = (settings.templates && settings.templates[key]) || {};
  return { subject: String(o.subject || d.subject).slice(0, 200), body: String(o.body || d.body).slice(0, 4000) };
}

function render(tpl, vars, buttonUrl) {
  const sub = s => String(s).replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? String(vars[k]) : m));
  const subject = sub(tpl.subject);
  const paras = String(tpl.body).split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  let html = '', text = '';
  paras.forEach(p => {
    const b = p.match(/^\{button:([^}]{1,40})\}$/);
    if (b) {
      html += '<p style="margin:18px 0"><a href="' + escapeHtml(buttonUrl || SITE) + '" style="background:#0d5371;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:700">' + escapeHtml(b[1]) + '</a></p>';
      text += b[1] + ': ' + (buttonUrl || SITE) + '\n\n';
      return;
    }
    const line = sub(p);
    html += '<p style="margin:0 0 14px">' + escapeHtml(line).replace(/\n/g, '<br>') + '</p>';
    text += line + '\n\n';
  });
  html = '<div style="font-family:sans-serif;max-width:560px;color:#17323f;line-height:1.55">' + html +
    '<p style="margin:22px 0 0;font-size:12px;color:#7a8a96">If you would rather not get these reminders, just reply with the word STOP and we will not send them again.</p></div>';
  return { subject, html, text };
}

/* ---------- small helpers ---------- */
const first = n => String(n || '').trim().split(/\s+/)[0] || 'there';
function jamaicaDay(d) { return new Date(d.getTime() - 5 * 3600 * 1000).toISOString().slice(0, 10); }   /* Jamaica is UTC-5 all year */
function dayNum(s) { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || '')); return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) / 86400000 : null; }
function daysUntil(dateStr, now) { const a = dayNum(dateStr), b = dayNum(jamaicaDay(now)); return a == null ? null : a - b; }
function nice(dateStr) { const n = dayNum(dateStr); if (n == null) return String(dateStr || ''); return new Date(n * 86400000).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' }); }
const money = n => inv.money ? inv.money(n) : 'US$' + Number(n || 0).toFixed(2);

async function getSettings() {
  const doc = (await db.getDoc(SETTINGS)) || {};
  const out = Object.assign({}, DEFAULTS, doc);
  KINDS.forEach(k => { out[k] = doc[k] === true; });
  out.templates = (doc.templates && typeof doc.templates === 'object') ? doc.templates : {};
  out.reviewLink = String(doc.reviewLink || '').slice(0, 400);
  return out;
}
async function saveSettings(patch) {
  const cur = await getSettings();
  const next = Object.assign({}, cur);
  KINDS.forEach(k => { if (patch && patch[k] !== undefined) next[k] = patch[k] === true; });
  if (patch && patch.reviewLink !== undefined) {
    const v = String(patch.reviewLink || '').trim();
    next.reviewLink = /^https:\/\/[^\s]+$/i.test(v) ? v.slice(0, 400) : '';
  }
  if (patch && patch.templates && typeof patch.templates === 'object') {
    next.templates = {};
    Object.keys(DEFAULT_TEMPLATES).forEach(k => {
      const t = patch.templates[k]; if (!t) return;
      const subject = String(t.subject || '').trim().slice(0, 200), body = String(t.body || '').trim().slice(0, 4000);
      if ((subject && subject !== DEFAULT_TEMPLATES[k].subject) || (body && body !== DEFAULT_TEMPLATES[k].body)) next.templates[k] = { subject, body };
    });
  }
  await db.setDoc(SETTINGS, next);
  return next;
}

async function loadSent() {
  const list = await db.getCollection(SENT);
  return { list, keys: new Set(list.map(x => x.id)) };
}
async function markSent(sent, key, kind, to) {
  sent.keys.add(key);
  await db.addToCollection(SENT, { id: key, kind, to, at: new Date().toISOString() });
}
async function trimSent() {
  const list = await db.getCollection(SENT);
  if (list.length > 3000) await db.setCollection(SENT, list.slice(-2000));
}

/* a guest who said STOP, or who told the AI assistant they are not interested, gets no more of these emails */
async function blockedEmails() {
  const set = new Set((await db.getCollection(OPTOUT)).map(x => String(x.email || '').toLowerCase()));
  (await db.getCollection('ai-calls')).forEach(c => { if (c.email && (c.outcome === 'do_not_call' || c.outcome === 'not_interested')) set.add(String(c.email).toLowerCase()); });
  return set;
}

/* ---------- Calendly: mark leads who booked a discovery call so the follow-ups stop ---------- */
async function syncCalendly(now, dryRun, fetchFn) {
  const token = process.env.CALENDLY_API_TOKEN;
  const out = { configured: !!token, booked: [] };
  if (!token) return out;
  const f = fetchFn || fetch, H = { Authorization: 'Bearer ' + token };
  const me = await (await f('https://api.calendly.com/users/me', { headers: H })).json();
  const userUri = me && me.resource && me.resource.uri;
  if (!userUri) return out;
  const from = new Date(now.getTime() - 3 * 86400000).toISOString();
  const evs = await (await f('https://api.calendly.com/scheduled_events?user=' + encodeURIComponent(userUri) + '&status=active&count=100&sort=start_time:asc&min_start_time=' + encodeURIComponent(from), { headers: H })).json();
  const events = ((evs && evs.collection) || []).slice(0, 60);
  const byEmail = new Map();
  for (const ev of events) {
    const r = await (await f(ev.uri + '/invitees?count=20', { headers: H })).json();
    ((r && r.collection) || []).forEach(i => { if (i.email && i.status !== 'canceled') byEmail.set(String(i.email).toLowerCase(), ev.start_time); });
  }
  const bookings = await db.getCollection('bookings');
  for (const b of bookings) {
    const at = byEmail.get(String(b.email || '').toLowerCase());
    if (!at || b.callBookedFor === at) continue;
    out.booked.push({ name: b.name, email: b.email, at });
    if (!dryRun) await db.updateInCollection('bookings', b.id, { callBookedFor: at, callBookedAt: b.callBookedAt || now.toISOString() });
  }
  return out;
}

/* ---------- the guest emails ---------- */
async function guestMail(settings, key, to, vars, buttonUrl, extra) {
  const tpl = templateFor(settings, key);
  return Object.assign({ to, replyTo: 'info@sightseerscaribbean.com' }, render(tpl, vars, buttonUrl), extra || {});
}

async function runDaily(opts) {
  opts = opts || {};
  const now = opts.now || new Date(), dryRun = !!opts.dryRun;
  const settings = opts.settings || await getSettings();
  const on = k => (opts.force && dryRun) ? true : settings[k];
  const summary = { at: now.toISOString(), dryRun, calendly: { configured: !!process.env.CALENDLY_API_TOKEN, booked: [] }, followups: [], payments: [], waivers: [], arrival: [], review: [], digest: false, counts: {} };

  const sent = await loadSent();
  const blocked = await blockedEmails();
  let budget = MAX_GUEST_EMAILS_PER_RUN;
  const send = async (key, kind, mail) => {
    if (sent.keys.has(key) || budget <= 0) return false;
    if (!mail.to || !EMAIL_RE.test(mail.to) || blocked.has(String(mail.to).toLowerCase())) return false;
    if (dryRun) return true;
    budget--;
    await markSent(sent, key, kind, mail.to);
    try { await sendEmail(mail); } catch (e) { console.error('ops mail', kind, e && e.message); }
    return true;
  };

  if (on('calendly') && !(dryRun && opts.force)) { try { summary.calendly = await syncCalendly(now, dryRun, opts.fetch); } catch (e) { console.error('calendly sync', e && e.message); } }

  const [bookings, invoices, waivers] = await Promise.all([db.getCollection('bookings'), db.getCollection('invoices'), db.getCollection('signed-waivers')]);
  const aiCalls = await db.getCollection('ai-calls');

  /* 1. quiet leads */
  if (on('followups')) {
    for (const b of bookings) {
      if (b.status !== 'pending' || b.callBookedAt || !b.email) continue;
      const ageH = (now.getTime() - new Date(b.createdAt).getTime()) / 3600000;
      if (!(ageH >= 24 && ageH <= 24 * 14)) continue;
      const linked = aiCalls.find(c => c.bookingId === b.id && c.linkSentAt);
      const stage = ageH >= 96 ? 2 : 1;
      if (stage === 1 && linked) continue;                        /* they already got the link from the call */
      const key = 'followup' + stage + ':' + b.id;
      const vars = { first: first(b.name), trip: b.tourName || b.stayName || 'your trip' };
      const mail = await guestMail(settings, 'followup' + stage, b.email, vars, CALENDLY_LINK);
      if (await send(key, 'followup' + stage, mail)) summary.followups.push({ name: b.name, email: b.email, stage });
    }
  }

  /* 2. invoices */
  if (on('payments')) {
    for (const i of invoices) {
      if (i.status !== 'sent' || !i.dueOn || !i.customerEmail) continue;
      const d = daysUntil(i.dueOn, now);
      let kind = null;
      if (d === 3) kind = 'payment_soon'; else if (d === 0) kind = 'payment_due'; else if (d === -3 || d === -10) kind = 'payment_late';
      if (!kind) continue;
      const key = kind + ':' + i.id + ':' + (kind === 'payment_late' ? (d === -3 ? 'a' : 'b') : 'x');
      if (sent.keys.has(key)) continue;
      const total = inv.totals(i.items, i.discount).total;
      const vars = { first: first(i.customerName), number: i.number, amount: money(total), due: nice(i.dueOn) };
      let attachments;
      if (!dryRun) { try { const buf = await require('./invoice-pdf').build(i); attachments = [{ filename: 'Invoice-' + i.number + '.pdf', content: buf.toString('base64') }]; } catch (e) { console.error('ops invoice pdf', e && e.message); } }
      const mail = await guestMail(settings, kind, i.customerEmail, vars, SITE, attachments ? { attachments } : {});
      if (await send(key, kind, mail)) summary.payments.push({ number: i.number, email: i.customerEmail, kind });
    }
  }

  /* 3. waivers, and 4. arrival, and 5. after the trip: all for confirmed bookings with a start date */
  const signedEmails = new Set(waivers.map(w => String(w.email || '').toLowerCase()));
  const confirmed = bookings.filter(b => b.status === 'confirmed' && b.email && (b.date || b.checkIn));
  for (const b of confirmed) {
    const start = b.date || b.checkIn, end = b.endDate || b.checkOut || start;
    const ds = daysUntil(start, now), de = daysUntil(end, now);
    const trip = b.tourName || b.stayName || 'your trip';
    const vars = { first: first(b.name), trip, date: nice(start) };
    const waiverUrl = SITE + '/waiver';
    if (on('waivers') && !signedEmails.has(String(b.email).toLowerCase())) {
      const k = ds === 7 ? 'waiver_week' : (ds === 2 ? 'waiver_last' : null);
      if (k && await send(k + ':' + b.id, k, await guestMail(settings, k, b.email, vars, waiverUrl))) summary.waivers.push({ name: b.name, email: b.email, kind: k });
    }
    if (on('arrival') && ds === 3) {
      if (await send('arrival:' + b.id, 'arrival', await guestMail(settings, 'arrival', b.email, vars, waiverUrl))) summary.arrival.push({ name: b.name, email: b.email });
    }
    if (on('review') && de === -2) {
      const line = settings.reviewLink ? 'If you have a minute, we would be so grateful for a short review of your trip:\n' + settings.reviewLink : 'If you have a minute, reply and tell us how it went, what you loved and what we could do better.';
      const mail = await guestMail(settings, 'review', b.email, Object.assign({ reviewLine: line }, vars), settings.reviewLink || SITE);
      if (await send('review:' + b.id, 'review', mail)) summary.review.push({ name: b.name, email: b.email });
    }
  }

  /* 6. the morning summary to the team */
  if (on('digest')) summary.digest = await sendDigest({ now, dryRun, bookings, invoices, waivers, aiCalls, signedEmails, summary });

  if (!dryRun) { await trimSent(); try { await db.setDoc(SETTINGS, Object.assign({}, await getSettings(), { lastRun: { at: summary.at, counts: counts(summary) } })); } catch (e) { /* the record of the last run is optional */ } }
  summary.counts = counts(summary);
  return summary;
}
function counts(s) { return { calendlyBooked: s.calendly.booked.length, followups: s.followups.length, payments: s.payments.length, waivers: s.waivers.length, arrival: s.arrival.length, review: s.review.length, digest: s.digest ? 1 : 0 }; }

/* ---------- the morning summary ---------- */
function digestData(ctx) {
  const { now, bookings, invoices, waivers, aiCalls, signedEmails } = ctx;
  const day = 86400000;
  const since = new Date(now.getTime() - day);
  const fresh = bookings.filter(b => new Date(b.createdAt) >= since);
  const waiting = bookings.filter(b => b.status === 'pending' && !b.callBookedAt && (now - new Date(b.createdAt)) >= 2 * day && (now - new Date(b.createdAt)) <= 21 * day);
  const callsBooked = bookings.filter(b => b.callBookedFor && new Date(b.callBookedFor) >= new Date(now.getTime() - 3 * day) && new Date(b.callBookedFor) <= new Date(now.getTime() + 7 * day));
  const aiDone = aiCalls.filter(c => c.endedAt && new Date(c.endedAt) >= since);
  const open = invoices.filter(i => i.status === 'sent' && i.dueOn);
  const overdue = open.filter(i => daysUntil(i.dueOn, now) < 0), dueSoon = open.filter(i => { const d = daysUntil(i.dueOn, now); return d >= 0 && d <= 7; });
  const upcoming = bookings.filter(b => b.status === 'confirmed' && (b.date || b.checkIn) && daysUntil(b.date || b.checkIn, now) >= 0 && daysUntil(b.date || b.checkIn, now) <= 7);
  const noWaiver = upcoming.filter(b => !signedEmails.has(String(b.email || '').toLowerCase()));
  const tomorrow = upcoming.filter(b => daysUntil(b.date || b.checkIn, now) === 1);
  const weekAgo = new Date(now.getTime() - 7 * day);
  const week = {
    requests: bookings.filter(b => new Date(b.createdAt) >= weekAgo).length,
    confirmed: bookings.filter(b => b.status === 'confirmed' && new Date(b.updatedAt || b.createdAt) >= weekAgo).length,
    paid: invoices.filter(i => i.status === 'paid' && i.paidAt && new Date(i.paidAt) >= weekAgo),
  };
  week.revenue = week.paid.reduce((n, i) => n + inv.totals(i.items, i.discount).total, 0);
  return { fresh, waiting, callsBooked, aiDone, overdue, dueSoon, upcoming, noWaiver, tomorrow, week };
}
async function sendDigest(ctx) {
  const d = digestData(ctx), monday = new Date(ctx.now.getTime() - 5 * 3600000).getUTCDay() === 1;
  const total = d.fresh.length + d.waiting.length + d.callsBooked.length + d.aiDone.length + d.overdue.length + d.dueSoon.length + d.noWaiver.length + d.tomorrow.length;
  if (!total && !monday) return false;
  const li = a => a.length ? '<ul style="margin:6px 0 14px;padding-left:20px">' + a.join('') + '</ul>' : '';
  const sec = (t, items) => items.length ? '<h3 style="margin:18px 0 4px;color:#0d5371;font-size:15px">' + t + ' (' + items.length + ')</h3>' + li(items) : '';
  const tripOf = b => escapeHtml(b.tourName || b.stayName || 'trip');
  let html = '<div style="font-family:sans-serif;max-width:620px;color:#17323f;line-height:1.5"><h2 style="color:#0d5371;margin:0 0 4px">Good morning. Here is your day.</h2>' +
    sec('New requests in the last day', d.fresh.map(b => '<li><b>' + escapeHtml(b.name) + '</b>: ' + tripOf(b) + (b.date ? ' on ' + escapeHtml(b.date) : '') + ', ' + escapeHtml(b.guests) + ' guests</li>')) +
    sec('Discovery calls booked (recent and coming up)', d.callsBooked.map(b => '<li><b>' + escapeHtml(b.name) + '</b>: ' + escapeHtml(new Date(b.callBookedFor).toLocaleString('en-US', { timeZone: 'America/Jamaica', weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })) + ' Jamaica time</li>')) +
    sec('AI calls finished', d.aiDone.map(c => '<li><b>' + escapeHtml(c.name) + '</b>: ' + escapeHtml(String(c.outcome || 'no outcome').replace(/_/g, ' ')) + (c.summary ? ' &middot; ' + escapeHtml(c.summary) : '') + '</li>')) +
    sec('Requests still waiting for a reply (2+ days)', d.waiting.map(b => '<li><b>' + escapeHtml(b.name) + '</b>: ' + tripOf(b) + ' &middot; ' + escapeHtml(b.email) + '</li>')) +
    sec('Overdue invoices', d.overdue.map(i => '<li><b>' + escapeHtml(i.customerName) + '</b>: ' + escapeHtml(i.number) + ', ' + escapeHtml(money(inv.totals(i.items, i.discount).total)) + ', was due ' + escapeHtml(nice(i.dueOn)) + '</li>')) +
    sec('Invoices due in the next 7 days', d.dueSoon.map(i => '<li><b>' + escapeHtml(i.customerName) + '</b>: ' + escapeHtml(i.number) + ', ' + escapeHtml(money(inv.totals(i.items, i.discount).total)) + ', due ' + escapeHtml(nice(i.dueOn)) + '</li>')) +
    sec('Trips tomorrow', d.tomorrow.map(b => '<li><b>' + escapeHtml(b.name) + '</b>: ' + tripOf(b) + ', ' + escapeHtml(b.guests) + ' guests</li>')) +
    sec('Travelling within 7 days with no signed waiver', d.noWaiver.map(b => '<li><b>' + escapeHtml(b.name) + '</b>: ' + tripOf(b) + ' on ' + escapeHtml(nice(b.date || b.checkIn)) + '</li>'));
  if (!total) html += '<p>Nothing needs you today.</p>';
  if (monday) html += '<h3 style="margin:22px 0 4px;color:#0d5371;font-size:15px">Last 7 days</h3><ul style="margin:6px 0 14px;padding-left:20px"><li>' + d.week.requests + ' new requests</li><li>' + d.week.confirmed + ' bookings confirmed</li><li>' + d.week.paid.length + ' invoices paid, ' + escapeHtml(money(d.week.revenue)) + '</li></ul>';
  html += '</div>';
  if (ctx.dryRun) return true;
  await sendEmail({ subject: 'Your Sight Seers day: ' + (total ? total + ' things to look at' : 'all quiet'), html });
  return true;
}

/* ---------- a sample of one email, sent to the admin only, so the wording can be checked ---------- */
async function previewMail(key, to, settings) {
  if (!DEFAULT_TEMPLATES[key]) return null;
  const vars = { first: 'Cara', trip: 'the Blue Hole trip', date: 'July 1, 2027', number: 'SS-2027-001', amount: 'US$1,250.00', due: 'June 15, 2027', reviewLine: settings.reviewLink ? 'If you have a minute, we would be so grateful for a short review of your trip:\n' + settings.reviewLink : 'If you have a minute, reply and tell us how it went, what you loved and what we could do better.' };
  const m = render(templateFor(settings, key), vars, key.indexOf('followup') === 0 ? CALENDLY_LINK : SITE + '/waiver');
  m.subject = '[Sample] ' + m.subject;
  return Object.assign({ to }, m);
}

module.exports = { KINDS, DEFAULTS, DEFAULT_TEMPLATES, REPLIES, OPTOUT, SENT, getSettings, saveSettings, runDaily, previewMail, render, templateFor, daysUntil, digestData, syncCalendly };
