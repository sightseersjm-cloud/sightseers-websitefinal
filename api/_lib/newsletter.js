/**
 * api/_lib/newsletter.js
 * The newsletter list. The box at the bottom of the home page saves people here (it used to only email the team).
 * The owner writes and sends the newsletter in their own email tool; the master admin's Newsletter tab shows the list,
 * downloads it as a CSV and marks people as unsubscribed. Each subscriber has a signed unsubscribe link for later use.
 *
 * People who subscribed before this list existed were stored as contact messages with the subject
 * "Newsletter Subscription"; they are brought in the first time the list is read.
 */
const crypto = require('crypto');
const db = require('./db');
const { uid } = require('./auth');

const COL = 'newsletter-subscribers';
const SITE = (process.env.SITE_URL || 'https://www.sightseerscaribbean.com').replace(/\/+$/, '');
const SECRET = process.env.JWT_SECRET || process.env.BLOB_READ_WRITE_TOKEN || '';
const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function clean(v, max) { return String(v == null ? '' : v).trim().slice(0, max || 200); }
function sig(id) { return crypto.createHmac('sha256', SECRET).update('news:' + id).digest('hex').slice(0, 32); }
function unsubUrl(id) { return SITE + '/api/newsletter?unsub=' + encodeURIComponent(id) + '&k=' + sig(id); }
function checkSig(id, k) {
  if (!SECRET || !id || !k || String(k).length !== 32) return false;
  try { return crypto.timingSafeEqual(Buffer.from(sig(id)), Buffer.from(String(k))); } catch (e) { return false; }
}

/* a new subscriber, or someone coming back after unsubscribing */
async function subscribe(input) {
  const email = clean(input.email, 160).toLowerCase();
  if (!EMAIL_OK.test(email)) return { error: 'Please enter a valid email address.' };
  const list = await db.getCollection(COL), now = new Date().toISOString();
  const cur = list.find(x => x.email === email);
  if (cur && cur.status === 'subscribed') return { ok: true, already: true };
  if (cur) { await db.updateInCollection(COL, cur.id, { status: 'subscribed', resubscribedAt: now, unsubscribedAt: '' }); return { ok: true, back: true }; }
  const rec = { id: uid(), email, name: clean(input.name, 80), source: clean(input.source, 80), userId: input.userId || null, status: 'subscribed', createdAt: now };
  await db.addToCollection(COL, rec);
  return { ok: true, rec };
}

/* everyone, newest first, with the older sign-ups (kept as contact messages) brought in once */
async function list() {
  const [subs, msgs] = await Promise.all([db.getCollection(COL), db.getCollection('contact-messages')]);
  const have = {};
  subs.forEach(x => { have[x.email] = 1; });
  for (const m of msgs.filter(x => /^newsletter subscription$/i.test(String(x.subject || '').trim()))) {
    const email = clean(m.email, 160).toLowerCase();
    if (!EMAIL_OK.test(email) || have[email]) continue;
    have[email] = 1;
    const rec = { id: uid(), email, name: '', source: 'Earlier sign-up (before this list)', userId: m.userId || null, status: 'subscribed', createdAt: m.createdAt || new Date().toISOString(), imported: true };
    await db.addToCollection(COL, rec);
    subs.push(rec);
  }
  return subs.slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

async function setStatus(id, status) {
  const now = new Date().toISOString();
  const patch = status === 'subscribed' ? { status, resubscribedAt: now, unsubscribedAt: '' } : { status: 'unsubscribed', unsubscribedAt: now };
  return db.updateInCollection(COL, id, patch);
}
async function remove(id) { return db.removeFromCollection(COL, id); }

async function unsubscribeLink(id, k) {
  if (!checkSig(id, k)) return { ok: false };
  const rec = (await db.getCollection(COL)).find(x => x.id === id);
  if (!rec) return { ok: false };
  if (rec.status !== 'unsubscribed') await setStatus(id, 'unsubscribed');
  return { ok: true };
}

module.exports = { COL, subscribe, list, setStatus, remove, unsubscribeLink, unsubUrl, checkSig };
