/**
 * /api/team-draw: team spins for group challenges.
 * GET ?event=<id>           the teams so far (and the caller's own place when signed in)
 * POST {action:'join'}      signed-in members spin once; the server places them and keeps it with the time
 * POST {action:'event'}     admins open a new team spin
 * Every placement is made here, so nobody pressing a button can shape the teams.
 */
const db = require('../_lib/db');
const auth = require('../_lib/auth');
const T = require('../_lib/team-draw');

const evKey = id => 'team-events/' + id;
const cleanId = v => String(v || '').replace(/[^A-Za-z0-9-]/g, '').slice(0, 40);

async function loadEvent(id) {
  const doc = await db.getDoc(evKey(id));
  if (doc) return doc;
  if (id === T.SUMMIT.id) return Object.assign({ createdAt: '2026-11-26T00:00:00.000Z', members: [] }, T.SUMMIT);
  return null;
}
const mine = (ev, user) => user ? (ev.members || []).find(x => x.userId === String(user.id)) || null : null;
const strip = m => m ? { name: m.name, gender: m.gender, team: m.team, at: m.at } : null;

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  const q = req.query || {}, b = req.body || {};
  if (req.method === 'GET') {
    const ev = await loadEvent(cleanId(q.event || T.SUMMIT.id));
    if (!ev) return res.status(404).json({ error: 'That team spin could not be found. Check the link with whoever sent it.' });
    return res.status(200).json({ event: T.publicEvent(ev), me: strip(mine(ev, auth.getUser(req))) });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (b.action === 'event') {
    const admin = auth.requireAdmin(req, res); if (!admin) return;
    const ev = T.newEvent(b);
    if (ev.error) return res.status(400).json({ error: ev.error });
    await db.setDoc(evKey(ev.id), ev);
    return res.status(200).json({ event: T.publicEvent(ev) });
  }
  if (b.action === 'join') {
    const user = auth.getUser(req);
    if (!user) return res.status(401).json({ error: 'Sign in or create your free account to spin for your team.', signIn: true });
    const id = cleanId(b.event || T.SUMMIT.id);
    const ev = await loadEvent(id);
    if (!ev) return res.status(404).json({ error: 'That team spin could not be found.' });
    const r = T.join(ev, b, user);
    if (r.error) return res.status(400).json({ error: r.error, event: T.publicEvent(ev) });
    if (!r.already) await db.setDoc(evKey(id), ev);
    return res.status(200).json({ me: strip(r.member), already: !!r.already, event: T.publicEvent(ev) });
  }
  return res.status(400).json({ error: 'Unknown request.' });
};
