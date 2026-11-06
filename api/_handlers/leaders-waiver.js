/**
 * Leaders in Jamaica: application fee waiver codes. One code per applicant, used once.
 *
 * Applicants (no sign-in):
 *   POST { action:'check',  code, email }        -> { ok:true, valid:true|false }   does not use the code up
 *   POST { action:'redeem', code, email, name }  -> { ok:true }                      uses it up, once, as the application is sent
 *   POST { action:'apply', ...application }      -> { ok:true, id }                  keeps the application for the admin and emails the team, whatever happens next
 *   POST { action:'fee-choice', id, email, choice:'pay'|'waiver'|'code', reason?, code? }
 *                                                -> { ok:true, fee }                 the applicant's choice about the US$35 fee, once the application is in
 * Admin (needs the "inbox" permission):
 *   GET                                          -> { ok:true, codes:[...], applications:[...] }
 *   POST { action:'generate', name, email, note }-> { ok:true, code:{...} }
 *   POST { action:'revoke', id }                 -> { ok:true }                      unused codes only
 *   POST { action:'app-delete'|'code-delete', id }          permanently deletes an application, or a code (a used one too)
 *   POST { action:'app-sendpay', id, part:'deposit'|'second'|'third' }   emails the applicant a secure payment link for that part
 *   POST { action:'app-waive'|'app-decline'|'app-paylink'|'app-paid', id, part? }   decide an application's fee and email the applicant
 *
 * A code is tied to the applicant's email address: it only works with the email it was made for, and only one time, so
 * passing it on to someone else does nothing. Each visitor gets 10 checks an hour so codes cannot be guessed.
 */
const crypto = require('crypto');
const db = require('../_lib/db');
const { requirePerm, getUser, uid } = require('../_lib/auth');
const { sendEmail } = require('../_lib/email');
const trip = require('../_lib/trip');

const COLLECTION = 'leaders-waiver-codes';
const APPS = 'leaders-applications';
const SITE = () => String(process.env.SITE_URL || 'https://www.sightseerscaribbean.com').replace(/\/+$/, '');

/* The four payments, in US cents. The application fee is separate from, and on top of, the US$1,895 programme fee,
   which is paid in three parts: a 30% deposit, then two payments of 35%. */
const PARTS = {
  fee:     { cents: 3500,  label: 'Application fee',            name: 'Leaders in Jamaica: application fee',            due: '' },
  deposit: { cents: 56850, label: 'Deposit (30%)',              name: 'Leaders in Jamaica: deposit (30%)',              due: 'on selection, to secure your place. It is non-refundable' },
  second:  { cents: 66325, label: 'Second payment (35%)',       name: 'Leaders in Jamaica: second payment (35%)',       due: 'no later than 60 days before the programme' },
  third:   { cents: 66325, label: 'Third payment (35%)',        name: 'Leaders in Jamaica: third payment (35%)',        due: 'no later than 14 days before the programme' }
};
const usd = cents => 'US$' + (cents / 100).toFixed(2).replace(/\.00$/, '');

/* A payment link is a signed address on our own site. Clicking it makes a fresh Stripe checkout for that applicant and
   that payment, so the link never expires and cannot be changed to another amount or another applicant. */
function sign(v) { return crypto.createHmac('sha256', String(process.env.JWT_SECRET || '')).update(v).digest('base64url').slice(0, 32); }
function payUrl(app, part) {
  const v = Buffer.from(app.id + '.' + part).toString('base64url');
  return SITE() + '/api/leaders-waiver?pay=' + v + '.' + sign(v);
}
function readPay(token) {
  const [v, sig] = String(token || '').split('.');
  if (!v || !sig || sign(v) !== sig) return null;
  const [id, part] = Buffer.from(v, 'base64url').toString().split('.');
  return PARTS[part] ? { id, part } : null;
}
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

async function tooMany(req, prefix, limit) {
  const key = (prefix || '') + who(req), now = Date.now();
  const all = (await db.getDoc(TRIES_DOC)) || {};
  const mine = (all[key] || []).filter(t => now - t < WINDOW);
  if (mine.length >= (limit || LIMIT)) return true;
  mine.push(now);
  all[key] = mine;
  for (const k of Object.keys(all)) { if (k !== key) { all[k] = (all[k] || []).filter(t => now - t < WINDOW); if (!all[k].length) delete all[k]; } }
  await db.setDoc(TRIES_DOC, all);
  return false;
}

function shapeApp(a) {
  return { id: a.id, name: a.name, email: a.email, phone: a.phone || '', university: a.university || '', studentGov: a.studentGov || '', applyingAs: a.applyingAs || '', position: a.position || '',
    funding: a.funding || '', goal: a.goal || '', fee: a.fee, waiverReason: a.waiverReason || '', code: a.code || '', createdAt: a.createdAt, decidedAt: a.decidedAt || '', decidedBy: a.decidedBy || '',
    payments: a.payments || {}, payLinks: a.payLinks || {} };
}

async function safe(p) { try { await p; } catch (e) { console.error('leaders email', e && e.message); } }

function payButton(url, label) {
  return '<p style="margin:18px 0"><a href="' + url + '" style="display:inline-block;background:#063a63;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:0">' + trip.esc(label) + '</a></p>';
}

function firstName(a) { return String(a.name || '').trim().split(/\s+/)[0] || 'there'; }
function mailTo(a, subject, heading, html) {
  return sendEmail({ to: a.email, replyTo: process.env.BUSINESS_EMAIL || 'sightseersjm@gmail.com', subject, html: trip.shell(heading, html, ' ') });
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

    if (req.method === 'GET' && req.query && req.query.pay) {
      const back = SITE() + '/leaders-in-jamaica';
      const go = (u) => { res.status(302); res.setHeader('Location', u); res.end(); };
      const t = readPay(req.query.pay);
      if (!t) return go(back + '?pay=invalid');
      const a = (await db.getCollection(APPS)).find(x => x.id === t.id);
      if (!a) return go(back + '?pay=invalid');
      if ((a.payments || {})[t.part] || (t.part === 'fee' && (a.fee === 'paid' || a.fee === 'waived' || a.fee === 'waived-code'))) return go(back + '?pay=done');
      if (!process.env.STRIPE_SECRET_KEY) return go(back + '?pay=unavailable');
      const P = PARTS[t.part];
      const r = await trip.stripeRequest('POST', '/v1/checkout/sessions', {
        'mode': 'payment', 'success_url': back + '?paid=' + t.part, 'cancel_url': back, 'customer_email': a.email, 'client_reference_id': a.id,
        'line_items[0][quantity]': '1', 'line_items[0][price_data][currency]': 'usd', 'line_items[0][price_data][unit_amount]': String(P.cents),
        'line_items[0][price_data][product_data][name]': P.name,
        'metadata[kind]': 'leaders', 'metadata[appId]': a.id, 'metadata[part]': t.part, 'metadata[name]': String(a.name || '').slice(0, 120)
      });
      if (r.status !== 200 || !r.body || !r.body.url) return go(back + '?pay=unavailable');
      return go(r.body.url);
    }

    if (req.method === 'GET') {
      const admin = await requirePerm(req, res, 'inbox');
      if (!admin) return;
      const list = (await db.getCollection(COLLECTION)).slice().sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
      const apps = (await db.getCollection(APPS)).slice().sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
      return res.status(200).json({ ok: true, codes: list.map(shape), applications: apps.map(shapeApp) });
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const body = req.body || {};
    const action = body.action || 'check';

    if (action === 'app-delete' || action === 'code-delete') {
      const admin = await requirePerm(req, res, 'inbox');
      if (!admin) return;
      const coll = action === 'app-delete' ? APPS : COLLECTION;
      const gone = await db.removeFromCollection(coll, body.id);
      if (!gone) return res.status(404).json({ error: 'That was not found. It may already be deleted.' });
      return res.status(200).json({ ok: true });
    }

    if (action === 'app-sendpay') {
      const admin = await requirePerm(req, res, 'inbox');
      if (!admin) return;
      const part = String(body.part || '');
      if (!PARTS[part] || part === 'fee') return res.status(400).json({ error: 'Choose the deposit, the second payment or the third payment.' });
      const a = (await db.getCollection(APPS)).find(x => x.id === body.id);
      if (!a) return res.status(404).json({ error: 'That application was not found.' });
      if ((a.payments || {})[part]) return res.status(400).json({ error: 'That payment has already been made.' });
      const P = PARTS[part];
      const rest = part === 'deposit' ? '<p>The rest of the programme fee is paid in two further payments of ' + usd(PARTS.second.cents) + ': the second ' + PARTS.second.due + ', and the third ' + PARTS.third.due + '. We will email you a link for each one.</p>' : '';
      const r = await mailTo(a, 'Your Leaders in Jamaica ' + P.label.toLowerCase(), P.label,
        '<p>Hello ' + trip.esc(firstName(a)) + ',</p><p>' + (part === 'deposit' ? 'Your place in <b>Leaders in Jamaica</b> is ready to be secured. ' : 'Your next <b>Leaders in Jamaica</b> payment is ready. ')
        + 'The ' + trip.esc(P.label.toLowerCase()) + ' is <b>' + usd(P.cents) + '</b>, due ' + P.due + '. You can pay securely by card here:</p>'
        + payButton(payUrl(a, part), 'Pay ' + usd(P.cents)) + rest);
      if (r && r.ok === false) return res.status(502).json({ error: 'The email to ' + a.email + ' did not go through, so nothing was changed. Try again in a moment.' });
      const u = getUser(req) || {};
      const links = Object.assign({}, a.payLinks || {}); links[part] = { sentAt: new Date().toISOString(), by: text(u.name || u.email || '', 120) };
      const up = await db.updateInCollection(APPS, a.id, { payLinks: links });
      return res.status(200).json({ ok: true, application: shapeApp(up) });
    }

    if (action === 'app-waive' || action === 'app-decline' || action === 'app-paylink' || action === 'app-paid') {
      const admin = await requirePerm(req, res, 'inbox');
      if (!admin) return;
      const a = (await db.getCollection(APPS)).find(x => x.id === body.id);
      if (!a) return res.status(404).json({ error: 'That application was not found.' });
      const u = getUser(req) || {};
      const first = String(a.name || '').trim().split(/\s+/)[0] || 'there';
      let fee, subject, heading, html;
      if (action === 'app-waive') {
        fee = 'waived'; subject = 'Your Leaders in Jamaica application fee is waived'; heading = 'Application fee waived';
        html = '<p>Hello ' + trip.esc(first) + ',</p><p>Your request to waive the US$35 application fee for <b>Leaders in Jamaica</b> has been approved. Nothing is due, and there is nothing more you need to do.</p><p>The programme director reviews every submission personally and typically responds within two working days.</p>';
      } else if (action === 'app-decline') {
        fee = 'pay-link-sent'; subject = 'About your Leaders in Jamaica application fee waiver'; heading = 'Your fee waiver request';
        html = '<p>Hello ' + trip.esc(first) + ',</p><p>Thank you for your interest in <b>Leaders in Jamaica</b> and for taking the time to apply.</p>'
          + '<p>Unfortunately, we are not able to waive the US$35 application fee for your application. Your application has been received and stays as submitted. To complete it, please pay the application fee using the link below:</p>'
          + payButton(payUrl(a, 'fee'), 'Pay the US$35 application fee')
          + '<p>The application fee is non-refundable.</p>';
      } else if (action === 'app-paylink') {
        fee = 'pay-link-sent'; subject = 'Your Leaders in Jamaica application fee'; heading = 'Application fee';
        html = '<p>Hello ' + trip.esc(first) + ',</p><p>Thank you for your Leaders in Jamaica application. The US$35 application fee is due, and you can pay it here:</p>'
          + payButton(payUrl(a, 'fee'), 'Pay the US$35 application fee')
          + '<p>The application fee is non-refundable.</p>';
      } else {
        const part = PARTS[body.part] ? body.part : 'fee';
        if (part !== 'fee') {
          const pay = Object.assign({}, a.payments || {}); pay[part] = { paidAt: new Date().toISOString(), amount: PARTS[part].cents / 100, via: 'manual' };
          const up2 = await db.updateInCollection(APPS, a.id, { payments: pay });
          return res.status(200).json({ ok: true, application: shapeApp(up2) });
        }
        fee = 'paid';
        const pay = Object.assign({}, a.payments || {}); pay.fee = { paidAt: new Date().toISOString(), amount: 35, via: 'manual' };
        const up3 = await db.updateInCollection(APPS, a.id, { fee, payments: pay, decidedAt: new Date().toISOString(), decidedBy: text(u.name || u.email || '', 120) });
        return res.status(200).json({ ok: true, application: shapeApp(up3) });
      }
      if (subject) {
        const r = await sendEmail({ to: a.email, replyTo: process.env.BUSINESS_EMAIL || 'sightseersjm@gmail.com', subject, html: trip.shell(heading, html, ' ') });
        if (r && r.ok === false) return res.status(502).json({ error: 'The email to ' + a.email + ' did not go through, so nothing was changed. Try again in a moment.' });
      }
      const up = await db.updateInCollection(APPS, a.id, { fee, decidedAt: new Date().toISOString(), decidedBy: text(u.name || u.email || '', 120) });
      return res.status(200).json({ ok: true, application: shapeApp(up) });
    }

    if (action === 'apply') {
      /* the application is kept and sent to the team first, whatever the applicant does about the fee afterwards */
      if (await tooMany(req, 'apply-', 20)) return res.status(429).json({ error: 'Too many tries. Please wait an hour or contact us.' });
      const name = text(body.fullName, 120), email = mail(body.email);
      if (!name || !EMAIL.test(email)) return res.status(400).json({ error: 'Please check your name and email address.' });
      const item = { id: uid(), name, email, phone: text(body.phone, 60), university: text(body.university, 160), studentGov: text(body.studentGov, 160), applyingAs: text(body.applyingAs, 20),
        position: text(body.position, 120), funding: text(body.funding, 80), goal: text(body.goal, 700), fee: 'fee-due', waiverReason: '', code: '', createdAt: new Date().toISOString() };
      await db.addToCollection(APPS, item);
      const rows = [['Name', item.name], ['Email', item.email], ['Phone', item.phone], ['University and country', item.university], ['Student government', item.studentGov],
        ['Applying as', item.applyingAs], [item.applyingAs === 'Advisor' ? 'Job title' : 'Executive position held', item.position], ['Funding route', item.funding],
        ['Application fee', 'Pending. The applicant is choosing to pay the US$35 or to apply for a fee waiver. You will get a second email if they request a waiver or use a code.'],
        ['The single most important thing they intend to fix or build', item.goal]];
      await safe(sendEmail({ replyTo: item.email, subject: 'New Leaders in Jamaica application: ' + item.name + ', ' + item.university + ' (' + item.applyingAs + ')',
        html: '<h2 style="color:#0d5371">New Leaders in Jamaica application</h2>' + trip.detailTable(rows.map(r => [r[0], r[1] || "Not given"])) }));
      const fp = payUrl(item, 'fee');
      await safe(mailTo(item, 'We received your Leaders in Jamaica application', 'Application received',
        '<p>Hello ' + trip.esc(firstName(item)) + ',</p><p>Thank you for your application to <b>Leaders in Jamaica</b>. The programme director reviews every submission personally and typically responds within two working days.</p>'
        + '<p><b>Application fee.</b> The US$35 application fee is separate from the programme fee. If you have not paid it or asked for a fee waiver yet, you can pay it here at any time:</p>'
        + payButton(fp, 'Pay the US$35 application fee') + '<p style="font-size:13px">The application fee is non-refundable. If you asked for a fee waiver, there is nothing to pay now and we will reply by email.</p>'));
      return res.status(200).json({ ok: true, id: item.id, payUrl: fp });
    }

    if (action === 'fee-choice') {
      if (await tooMany(req, 'apply-', 20)) return res.status(429).json({ error: 'Too many tries. Please wait an hour or contact us.' });
      const email = mail(body.email);
      const a = (await db.getCollection(APPS)).find(x => x.id === body.id);
      if (!a || mail(a.email) !== email) return res.status(404).json({ error: 'We could not find that application.' });
      const choice = String(body.choice || '');
      if (a.fee !== 'fee-due') return res.status(200).json({ ok: true, fee: a.fee }); // already decided, nothing to change
      if (choice === 'pay') return res.status(200).json({ ok: true, fee: a.fee });
      if (choice === 'waiver') {
        const reason = text(body.reason, 400);
        await db.updateInCollection(APPS, a.id, { fee: 'waiver-requested', waiverReason: reason });
        await safe(sendEmail({ replyTo: a.email, subject: 'Fee waiver requested: ' + a.name + ' (Leaders in Jamaica)',
          html: '<h2 style="color:#0d5371">Fee waiver requested</h2><p style="font-family:sans-serif">' + trip.esc(a.name) + ' (' + trip.esc(a.email) + ') applied to Leaders in Jamaica and asked for the US$35 application fee to be waived. They have not been asked to pay.</p>'
            + (reason ? '<p style="font-family:sans-serif"><b>Their note:</b> ' + trip.esc(reason) + '</p>' : '') + '<p style="font-family:sans-serif">Approve it, or decline it and send the payment link, in the admin under Leaders applications.</p>' }));
        await safe(mailTo(a, 'We received your fee waiver request', 'Fee waiver request received', '<p>Hello ' + trip.esc(firstName(a)) + ',</p><p>We have received your request to waive the US$35 application fee for <b>Leaders in Jamaica</b>. You are not asked to pay now, and we will reply by email.</p>'));
        return res.status(200).json({ ok: true, fee: 'waiver-requested' });
      }
      if (choice === 'code') {
        const r = await find(body.code, email);
        if (!r.c) return res.status(409).json({ error: r.why === 'used' ? 'That code has already been used.' : r.why === 'email' ? 'That code was made for a different email address.' : 'That code is not valid.' });
        const now = new Date().toISOString();
        await db.updateInCollection(COLLECTION, r.c.id, { usedAt: now, usedByName: a.name, applicationId: a.id });
        await db.updateInCollection(APPS, a.id, { fee: 'waived-code', code: r.c.code });
        await safe(sendEmail({ replyTo: a.email, subject: 'Fee waived with a code: ' + a.name + ' (Leaders in Jamaica)',
          html: '<h2 style="color:#0d5371">Fee waived with a code</h2><p style="font-family:sans-serif">' + trip.esc(a.name) + ' (' + trip.esc(a.email) + ') used the fee waiver code ' + trip.esc(r.c.code) + '. Nothing is due.</p>' }));
        await safe(mailTo(a, 'Your Leaders in Jamaica application fee is waived', 'Application fee waived', '<p>Hello ' + trip.esc(firstName(a)) + ',</p><p>Your fee waiver code was accepted, so the US$35 application fee for <b>Leaders in Jamaica</b> is waived. Nothing is due, and there is nothing more you need to do.</p>'));
        return res.status(200).json({ ok: true, fee: 'waived-code' });
      }
      return res.status(400).json({ error: 'Unknown choice' });
    }

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
    if (await tooMany(req, '', LIMIT)) return res.status(429).json({ error: 'Too many tries. Please wait an hour or contact us.' });

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

/** Called by api/stripe-webhook.js when a Leaders payment is completed. Safe to call twice for the same payment. */
module.exports.markPaid = async function markPaid(session) {
  const md = (session && session.metadata) || {};
  const part = md.part;
  if (!PARTS[part]) return { ok: false };
  const a = (await db.getCollection(APPS)).find(x => x.id === md.appId);
  if (!a) return { ok: false };
  if ((a.payments || {})[part] && a.payments[part].session === session.id) return { ok: true, already: true };
  const paid = (session.amount_total || PARTS[part].cents) / 100;
  const pay = Object.assign({}, a.payments || {}); pay[part] = { paidAt: new Date().toISOString(), amount: paid, via: 'stripe', session: session.id };
  const patch = { payments: pay };
  if (part === 'fee') patch.fee = 'paid';
  await db.updateInCollection(APPS, a.id, patch);
  const label = PARTS[part].label;
  await safe(mailTo(a, 'Payment received: ' + label, 'Payment received',
    '<p>Hello ' + trip.esc(firstName(a)) + ',</p><p>Thank you. We have received your <b>Leaders in Jamaica ' + trip.esc(label.toLowerCase()) + '</b> of <b>US$' + paid.toFixed(2) + '</b>.</p>'
    + (part === 'fee' ? '<p>Your application fee is paid. The programme director reviews every submission personally and typically responds within two working days.</p>' : '<p>A receipt from Stripe is on its way to you separately.</p>')));
  await safe(sendEmail({ subject: 'Payment received: ' + a.name + ', ' + label + ' (Leaders in Jamaica)',
    html: '<h2 style="color:#0d5371">Payment received</h2><p style="font-family:sans-serif">' + trip.esc(a.name) + ' (' + trip.esc(a.email) + ') paid the <b>' + trip.esc(label) + '</b>: US$' + paid.toFixed(2) + '. It is marked paid in the admin under Leaders applications.</p>' }));
  return { ok: true };
};
