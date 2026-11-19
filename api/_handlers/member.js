/**
 * api/_handlers/member.js
 * GET /api/member : a signed-in member's Travel Club extras: their referral link and counts, and their stamp book.
 */
const { getUser } = require('../_lib/auth');
const db = require('../_lib/db');
const member = require('../_lib/member');
const ops = require('../_lib/ops-auto');

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    const caller = getUser(req);
    if (!caller) return res.status(401).json({ error: 'Sign in required' });
    const user = (await db.getCollection('users')).find(u => u.id === caller.id);
    if (!user) return res.status(404).json({ error: 'Account not found' });
    try { await member.attachReferral(req, user); } catch (e) { /* tying a referral is optional */ }
    const settings = await ops.getSettings();
    const stamps = await member.stampsFor(user);
    return res.status(200).json({ ok: true, referral: await member.referralInfo(user, settings), stamps, tripsCompleted: stamps.length, bonusPoints: Math.max(0, Number(user.bonusPoints) || 0) });
  } catch (err) {
    console.error('member error:', err && err.message);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};
