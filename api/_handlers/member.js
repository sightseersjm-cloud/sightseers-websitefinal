/**
 * api/_handlers/member.js
 *   GET  /api/member                          member: their referral link, stamp book and Travel Points (balance, history, how points are earned)
 *   POST { action:'earn', type, ref }         member: points for saving a tour or adding to the cart (once per item)
 *   POST { action:'adjust', email, points, note }   admin: give (or take back, with a negative number) Travel Points
 */
const { getUser, requireAdmin } = require('../_lib/auth');
const db = require('../_lib/db');
const member = require('../_lib/member');
const ops = require('../_lib/ops-auto');
const pts = require('../_lib/points');

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method === 'POST') {
      const body = req.body || {};
      if (body.action === 'adjust') {
        const admin = requireAdmin(req, res); if (!admin) return;
        const email = String(body.email || '').trim().toLowerCase();
        const target = (await db.getCollection('users')).find(u => String(u.email || '').toLowerCase() === email);
        if (!target) return res.status(404).json({ error: 'No account has that email address.' });
        const r = await pts.adjust(target.id, body.points, String(body.note || '').slice(0, 140));
        if (r.error) return res.status(400).json({ error: r.error });
        return res.status(200).json({ ok: true, balance: (await pts.summary(target)).balance, name: target.name });
      }
      if (body.action === 'earn') {
        const caller = getUser(req);
        if (!caller) return res.status(401).json({ error: 'Sign in to earn Travel Points.' });
        const user = (await db.getCollection('users')).find(u => u.id === caller.id);
        if (!user) return res.status(404).json({ error: 'Account not found' });
        const r = await pts.earn(user, String(body.type || ''), body.ref);
        if (r.error) return res.status(400).json({ error: r.error });
        return res.status(200).json({ ok: true, awarded: r.awarded, balance: r.balance });
      }
      return res.status(400).json({ error: 'Unknown action' });
    }
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const caller = getUser(req);
    if (!caller) return res.status(401).json({ error: 'Sign in required' });
    const user = (await db.getCollection('users')).find(u => u.id === caller.id);
    if (!user) return res.status(404).json({ error: 'Account not found' });
    try { await member.attachReferral(req, user); } catch (e) { /* tying a referral is optional */ }
    const settings = await ops.getSettings();
    const points = Object.assign(await pts.summary(user), { rules: await pts.rulesNow(), labels: pts.LABELS });
    const demo = require('../_lib/demo');
    if (demo.isDemo(user)) {
      /* the showcase account: sample data, only for this account */
      const ref = await member.referralInfo(user, Object.assign({}, settings, { referrals: true }));
      const st = demo.stamps();
      return res.status(200).json({ ok: true, demo: true, referral: Object.assign(ref, demo.referral), stamps: st, tripsCompleted: st.length, points });
    }
    const stamps = await member.stampsFor(user);
    return res.status(200).json({ ok: true, referral: await member.referralInfo(user, settings), stamps, tripsCompleted: stamps.length, points });
  } catch (err) {
    console.error('member error:', err && err.message);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};
