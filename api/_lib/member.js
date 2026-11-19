/**
 * api/_lib/member.js
 * Travel Club member extras: referral codes and links, tying a new account to the friend who invited them,
 * the reward step, and the stamp book (one stamp for every finished trip).
 */
const crypto = require('crypto');
const db = require('./db');
const verified = require('./verified');

const SITE = (process.env.SITE_URL || 'https://www.sightseerscaribbean.com').replace(/\/+$/, '');
const lower = v => String(v || '').trim().toLowerCase();

/* the same code every time for the same account; it does not reveal the account id */
function referralCode(user) {
  return crypto.createHash('sha256').update('ref:' + String(user && user.id || '')).digest('hex').slice(0, 8).toUpperCase();
}
function referralLink(user) { return SITE + '/?ref=' + referralCode(user); }
function findByCode(users, code) {
  const c = String(code || '').trim().toUpperCase();
  if (!/^[0-9A-F]{8}$/.test(c)) return null;
  return users.find(u => referralCode(u) === c) || null;
}
function cookieValue(req, name) {
  const raw = String((req && req.headers && (req.headers.cookie || req.headers.Cookie)) || '');
  const m = raw.split(/;\s*/).map(p => p.split('=')).find(p => p[0] === name);
  return m ? decodeURIComponent(m.slice(1).join('=')) : '';
}

/* A new account is tied to the friend who invited them, using the code the website kept in a cookie. Only a recent account
   can be tied (14 days), never to itself, and only once. Returns true when it was tied just now. */
async function attachReferral(req, user, now) {
  if (!user || user.referredBy) return false;
  const code = cookieValue(req, 'ss_ref') || String((req && req.query && req.query.ref) || '');
  if (!code) return false;
  const age = ((now || new Date()).getTime() - new Date(user.createdAt || 0).getTime()) / 86400000;
  if (!(age >= 0 && age <= 14)) return false;
  const users = await db.getCollection('users');
  const ref = findByCode(users, code);
  if (!ref || ref.id === user.id || lower(ref.email) === lower(user.email)) return false;
  await db.updateInCollection('users', user.id, { referredBy: ref.id, referredAt: (now || new Date()).toISOString() });
  user.referredBy = ref.id;
  return true;
}

async function referralInfo(user, settings) {
  const users = await db.getCollection('users');
  const mine = users.filter(u => u.referredBy === user.id);
  return {
    code: referralCode(user), link: referralLink(user),
    joined: mine.length, rewarded: mine.filter(u => u.referralRewardedAt).length,
    points: Number(settings && settings.referralPoints) || 100, active: !!(settings && settings.referrals)
  };
}

/* the stamp book: one stamp for each finished trip (newest first), as the member sees it */
async function stampsFor(user, now) {
  const done = await verified.finishedFor(user, now);
  return done.slice().reverse().slice(0, 40).map(d => ({ title: d.title, country: d.country, on: d.end, kind: d.kind }));
}

module.exports = { referralCode, referralLink, findByCode, attachReferral, referralInfo, stampsFor, cookieValue };
