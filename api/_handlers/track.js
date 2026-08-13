/**
 * api/_handlers/track.js
 * First-party conversion analytics for the V-Tours funnel
 * (the audit's "track tour views / hotspot clicks / quote starts" item).
 *
 *   POST /api/track   body: { events: [{ e: "hotspot_click", k: "hs1" }, …] }
 *     → 204. Fire-and-forget; clients batch and send via sendBeacon.
 *       Counters aggregate into one Blob doc per UTC day:
 *       analytics-YYYY-MM-DD.json = { "hotspot_click|hs1": 3, … }
 *
 *   GET /api/track?days=7   (admin session required)
 *     → { ok, days, totals: { event|key: count }, daily: { date: {…} } }
 *
 * Event names are whitelisted by prefix; keys are truncated. Counter
 * writes are read-modify-write on Blob — fine at this traffic level,
 * slight undercount possible under heavy concurrency (acceptable for
 * funnel metrics, revisit if sessions grow past a few thousand/day).
 */

const db = require('../_lib/db');
const { requireAdmin } = require('../_lib/auth');

const ALLOWED = [
  'page_view', 'tour_page', 'pano_scene', 'hotspot_click', 'shop_add',
  'cart_open', 'checkout_click', '3d_view', 'xr_enter', 'book_cta',
  'quote_cta', 'live_join', 'rtc_join', 'invite_click', 'vote_cast',
  'trip_add'
];

function normalize(ev) {
  if (!ev || typeof ev.e !== 'string') return null;
  const name = ev.e.slice(0, 32);
  if (!ALLOWED.some(a => name === a || name.startsWith(a))) return null;
  const key = typeof ev.k === 'string' && ev.k
    ? name + '|' + ev.k.replace(/[^\w .$&'()-]/g, '').slice(0, 48)
    : name;
  return key;
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
    let events = [];
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      events = Array.isArray(body.events) ? body.events.slice(0, 25) : [];
    } catch (e) { /* ignore malformed */ }

    const keys = events.map(normalize).filter(Boolean);
    if (keys.length) {
      try {
        const day = new Date().toISOString().slice(0, 10);
        const doc = (await db.getDoc('analytics-' + day)) || {};
        keys.forEach(k => { doc[k] = (doc[k] || 0) + 1; });
        await db.setDoc('analytics-' + day, doc);
      } catch (e) { /* never fail the beacon */ }
    }
    return res.status(204).end();
  }

  if (req.method === 'GET') {
    const admin = requireAdmin(req, res);
    if (!admin) return;
    const days = Math.min(31, Math.max(1, parseInt((req.query || {}).days, 10) || 7));
    const daily = {};
    const totals = {};
    const now = Date.now();
    for (let i = 0; i < days; i++) {
      const day = new Date(now - i * 86400000).toISOString().slice(0, 10);
      const doc = await db.getDoc('analytics-' + day);
      if (doc && typeof doc === 'object') {
        daily[day] = doc;
        for (const k of Object.keys(doc)) totals[k] = (totals[k] || 0) + doc[k];
      }
    }
    return res.status(200).json({ ok: true, days, totals, daily });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
