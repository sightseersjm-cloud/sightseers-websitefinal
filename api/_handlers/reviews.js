/**
 * api/_handlers/reviews.js
 * Traveller reviews. Only someone who has finished a trip can review it, once per trip, and the team approves a review before anyone sees it.
 *   GET  ?trip=<slug>   public: approved reviews for one Travel Club trip, with the average
 *   GET  ?recent=1      public: the latest approved reviews
 *   GET  ?mine=1        member: trips they can review now, and the reviews they wrote
 *   GET  ?admin=1       admin: every review
 *   POST { action:'create', refKey, rating, text }          member
 *   POST { action:'moderate', id, status:'approved'|'hidden' } admin
 *   POST { action:'delete', id }                              admin
 */
const db = require('../_lib/db');
const { getUser, requireAdmin, uid, escapeHtml } = require('../_lib/auth');
const { sendEmail } = require('../_lib/email');
const verified = require('../_lib/verified');

const COLL = 'reviews';
const clip = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, n);

function publicName(full) {
  const p = String(full || '').trim().split(/\s+/).filter(Boolean);
  if (!p.length) return 'A traveller';
  return p.length > 1 ? p[0] + ' ' + p[p.length - 1].charAt(0).toUpperCase() + '.' : p[0];
}
const view = r => ({ id: r.id, name: r.name, rating: r.rating, text: r.text, title: r.title, country: r.country || '', on: r.tripOn || '', verified: true });
function summary(list) {
  const n = list.length;
  return { count: n, average: n ? Math.round(list.reduce((s, r) => s + r.rating, 0) / n * 10) / 10 : 0 };
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'OPTIONS') return res.status(200).end();
    const q = req.query || {};

    if (req.method === 'GET') {
      if (q.admin) {
        const admin = requireAdmin(req, res); if (!admin) return;
        const all = (await db.getCollection(COLL)).slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
        return res.status(200).json({ ok: true, reviews: all });
      }
      if (q.mine) {
        const caller = getUser(req);
        if (!caller) return res.status(401).json({ error: 'Sign in required' });
        const user = (await db.getCollection('users')).find(u => u.id === caller.id);
        if (!user) return res.status(404).json({ error: 'Account not found' });
        if (require('../_lib/demo').isDemo(user)) return res.status(200).json(Object.assign({ ok: true, demo: true }, require('../_lib/demo').reviewsFor()));
        const all = await db.getCollection(COLL);
        const mine = all.filter(r => r.userId === user.id);
        const done = await verified.finishedFor(user);
        const eligible = done.filter(d => !mine.some(r => r.refKey === d.refKey)).reverse().map(d => ({ refKey: d.refKey, title: d.title, country: d.country, on: d.end }));
        return res.status(200).json({ ok: true, eligible, mine: mine.map(r => Object.assign(view(r), { status: r.status })) });
      }
      const approved = (await db.getCollection(COLL)).filter(r => r.status === 'approved');
      const sorted = approved.slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
      if (q.trip) {
        const list = sorted.filter(r => r.slug && r.slug === clip(q.trip, 120));
        return res.status(200).json(Object.assign({ ok: true, reviews: list.slice(0, 20).map(view) }, summary(list)));
      }
      const list = sorted.slice(0, 12);
      return res.status(200).json(Object.assign({ ok: true, reviews: list.map(view) }, summary(approved)));
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const body = req.body || {}, action = body.action;
    if (action === 'create') {
      const caller = getUser(req);
      if (!caller) return res.status(401).json({ error: 'Sign in to write a review.' });
      const user = (await db.getCollection('users')).find(u => u.id === caller.id);
      if (!user) return res.status(404).json({ error: 'Account not found' });
      const rating = Math.round(Number(body.rating));
      const text = clip(body.text, 600);
      if (!(rating >= 1 && rating <= 5)) return res.status(400).json({ error: 'Choose a rating from 1 to 5 stars.' });
      if (text.length < 10) return res.status(400).json({ error: 'Please write at least a sentence about your trip.' });
      const refKey = clip(body.refKey, 80);
      /* the showcase account can try writing a review; nothing is saved or sent */
      if (require('../_lib/demo').isDemo(user) && refKey.indexOf('demo:') === 0) {
        return res.status(201).json({ ok: true, demo: true, review: { id: 'demo-new', name: 'You', title: refKey.slice(5), rating, text, status: 'pending', verified: true } });
      }
      const trip = (await verified.finishedFor(user)).find(d => d.refKey === refKey);
      if (!trip) return res.status(403).json({ error: 'You can review a trip once it has finished.' });
      const all = await db.getCollection(COLL);
      if (all.some(r => r.userId === user.id && r.refKey === refKey)) return res.status(409).json({ error: 'You have already reviewed this trip.' });
      const rec = { id: uid(), userId: user.id, refKey, kind: trip.kind, title: trip.title, slug: trip.slug || '', country: trip.country || '', tripOn: trip.end,
        name: publicName(user.name), rating, text, status: 'pending', createdAt: new Date().toISOString() };
      await db.addToCollection(COLL, rec);
      try {
        await sendEmail({ subject: 'New traveller review to approve: ' + trip.title,
          html: '<h2 style="color:#0d5371">New traveller review</h2><p><b>' + escapeHtml(rec.name) + '</b> rated <b>' + rating + ' of 5</b>: ' + escapeHtml(trip.title) + '</p><p style="white-space:pre-wrap">' + escapeHtml(text) + '</p><p>It stays hidden until you approve it in Admin, Reviews.</p>' });
      } catch (e) { console.error('review email', e && e.message); }
      return res.status(201).json({ ok: true, review: Object.assign(view(rec), { status: rec.status }) });
    }
    if (action === 'moderate' || action === 'delete') {
      const admin = requireAdmin(req, res); if (!admin) return;
      const id = clip(body.id, 80);
      const cur = (await db.getCollection(COLL)).find(r => r.id === id);
      if (!cur) return res.status(404).json({ error: 'That review was not found.' });
      if (action === 'delete') { await db.removeFromCollection(COLL, id); return res.status(200).json({ ok: true }); }
      const status = body.status === 'approved' ? 'approved' : 'hidden';
      const up = await db.updateInCollection(COLL, id, { status, moderatedAt: new Date().toISOString(), moderatedBy: admin.id });
      return res.status(200).json({ ok: true, review: up });
    }
    return res.status(400).json({ error: 'Unknown action' });
  } catch (err) {
    console.error('reviews error:', err && err.message);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};
