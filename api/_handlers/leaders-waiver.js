/**
 * Leaders in Jamaica: application fee waiver codes. One code per applicant, used once.
 *
 * Applicants (no sign-in):
 *   POST { action:'check',  code, email }        -> { ok:true, valid:true|false }   does not use the code up
 *   POST { action:'redeem', code, email, name }  -> { ok:true }                      uses it up, once, as the application is sent
 *   POST { action:'apply', ...application, code?, waiverRequested?, waiverReason? }
 *                                                -> { ok:true, id, fee }             stores the application for the admin; uses the code up
 * Admin (needs the "inbox" permission):
 *   GET                                          -> { ok:true, codes:[...], applications:[...] }
 *   POST { action:'generate', name, email, note }-> { ok:true, code:{...} }
 *   POST { action:'revoke', id }                 -> { ok:true }                      unused codes only
 *   POST { action:'app-waive'|'app-decline'|'app-paylink'|'app-paid', id }   decide an application's fee and email the applicant
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
const FEE_LINK = 'https://buy.stripe.com/14A8wQf9M6cf910cvi5kk01'; // the US$35 application fee payment link
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
    funding: a.funding || '', goal: a.goal || '', fee: a.fee, waiverReason: a.waiverReason || '', code: a.code || '', createdAt: a.createdAt, decidedAt: a.decidedAt || '', decidedBy: a.decidedBy || '' };
}

function payButton() {
  return '<p style="margin:18px 0"><a href="' + FEE_LINK + '" style="display:inline-block;background:#063a63;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:999px">Pay the US$35 application fee</a></p>';
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
          + payButton()
          + '<p>The application fee is non-refundable.</p>';
      } else if (action === 'app-paylink') {
        fee = 'pay-link-sent'; subject = 'Your Leaders in Jamaica application fee'; heading = 'Application fee';
        html = '<p>Hello ' + trip.esc(first) + ',</p><p>Thank you for your Leaders in Jamaica application. The US$35 application fee is due, and you can pay it here:</p>'
          + payButton()
          + '<p>The application fee is non-refundable.</p>';
      } else {
        fee = 'paid';
      }
      if (subject) {
        const r = await sendEmail({ to: a.email, replyTo: process.env.BUSINESS_EMAIL || 'sightseersjm@gmail.com', subject, html: trip.shell(heading, html, ' ') });
        if (r && r.ok === false) return res.status(502).json({ error: 'The email to ' + a.email + ' did not go through, so nothing was changed. Try again in a moment.' });
      }
      const up = await db.updateInCollection(APPS, a.id, { fee, decidedAt: new Date().toISOString(), decidedBy: text(u.name || u.email || '', 120) });
      return res.status(200).json({ ok: true, application: shapeApp(up) });
    }

    if (action === 'apply') {
      if (await tooMany(req, 'apply-', 20)) return res.status(429).json({ error: 'Too many tries. Please wait an hour or contact us.' });
      const name = text(body.fullName, 120), email = mail(body.email);
      if (!name || !EMAIL.test(email)) return res.status(400).json({ error: 'Please check your name and email address.' });
      const code = text(body.code, 40);
      let fee, used = null;
      if (code) {
        const r = await find(code, email);
        if (!r.c) return res.status(409).json({ error: r.why === 'used' ? 'That code has already been used.' : 'That code could not be used with this email address.' });
        used = r.c; fee = 'waived-code';
      } else if (body.waiverRequested === true) fee = 'waiver-requested';
      else fee = 'fee-due';
      const item = { id: uid(), name, email, phone: text(body.phone, 60), university: text(body.university, 160), studentGov: text(body.studentGov, 160), applyingAs: text(body.applyingAs, 20),
        position: text(body.position, 120), funding: text(body.funding, 80), goal: text(body.goal, 700), fee, waiverReason: text(body.waiverReason, 400), code: used ? used.code : '', createdAt: new Date().toISOString() };
      await db.addToCollection(APPS, item);
      if (used) await db.updateInCollection(COLLECTION, used.id, { usedAt: item.createdAt, usedByName: name, applicationId: item.id });
      return res.status(200).json({ ok: true, id: item.id, fee });
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
