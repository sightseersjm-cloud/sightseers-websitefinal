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
const { sendEmail } = require('../_lib/email');

const evKey = id => 'team-events/' + id;
const cleanId = v => String(v || '').replace(/[^A-Za-z0-9-]/g, '').slice(0, 40);

async function loadEvent(id) {
  const doc = await db.getDoc(evKey(id));
  /* the Summit roster lives in the code, so a change to it applies to the saved event too */
  if (doc) { if (id === T.SUMMIT.id) doc.roster = T.SUMMIT.roster; return doc; }
  if (id === T.SUMMIT.id) return Object.assign({ createdAt: '2026-11-26T00:00:00.000Z', members: [] }, T.SUMMIT);
  return null;
}
/* someone who has just asked to join The Summit Challenge can spin straight away with their request reference and email */
async function spinner(req, b) {
  const user = auth.getUser(req);
  if (user) return user;
  const ref = String(b.interestRef || '').replace(/[^A-Za-z0-9-]/g, '').slice(0, 30);
  const email = String(b.email || '').trim().toLowerCase().slice(0, 120);
  if (!ref || !email) return null;
  let list = [];
  try { list = await db.getCollection('club-interests'); } catch (e) { list = []; }
  const rec = list.find(i => i.ref === ref && String(i.email || '').toLowerCase() === email && i.tripSlug === 'the-summit-challenge' && i.status !== 'cancelled' && i.status !== 'waitlist');
  if (!rec) return null;
  return { id: rec.userId || ('req-' + rec.ref), name: rec.name, email: rec.email, role: 'guest' };
}
const mine = (ev, user) => user ? (ev.members || []).find(x => x.userId === String(user.id)) || null : null;
const strip = m => m ? { name: m.name, team: m.team, at: m.at, shirtSize: m.shirtSize || '' } : null;

const tn = (ev, t) => t === 'wc' ? 'the Wild Card' + (ev.wildTeam ? ' (joining the ' + ev.teams[ev.wildTeam] + ')' : '') : 'the ' + ev.teams[t];
async function notify(ev, m) {
  const left = ev.size - ev.members.length, e = auth.escapeHtml;
  const rows = ['g', 'o', 'wc'].map(t => '<tr><td style="padding:6px 10px;font-weight:bold">' + e(t === 'wc' ? 'Wild Card' : ev.teams[t]) + '</td><td style="padding:6px 10px">' +
    (ev.members.filter(x => x.team === t).map(x => e(x.name)).join(', ') || '<span style="color:#888">none yet</span>') + '</td></tr>').join('');
  try {
    await sendEmail({
      subject: e(ev.title) + ' team spin: ' + e(m.name) + ' is on ' + e(tn(ev, m.team)),
      html: '<h2 style="color:#063a63;font-family:sans-serif">' + e(m.name) + ' spun for a team</h2>' +
        '<p style="font-family:sans-serif">' + e(m.name) + (m.email ? ' (' + e(m.email) + ')' : '') + ' is on <b>' + e(tn(ev, m.team)) + '</b>. ' +
        (left ? left + ' of ' + ev.size + ' places still to spin.' : 'All places are taken, the teams are set.') + '</p>' +
        '<table style="border-collapse:collapse;font-family:sans-serif">' + rows + '</table>' +
        '<p style="font-family:sans-serif"><a href="https://www.sightseerscaribbean.com/team-draw">See the teams</a></p>'
    });
    if (m.email) await sendEmail({
      to: m.email,
      subject: (m.team === 'wc' ? 'You’re the Wild Card, joining the ' + (ev.teams[ev.wildTeam] || '') : 'You’re on ' + tn(ev, m.team)) + ': ' + ev.title,
      html: '<div style="font-family:sans-serif;color:#17323f"><h2 style="color:#063a63">' + (m.team === 'wc' ? 'You’re the Wild Card!' : 'You’re on ' + e(tn(ev, m.team)) + '!') + '</h2>' +
        '<p>Hi ' + e(m.name) + ', thanks for spinning for ' + e(ev.title) + '.</p>' +
        '<p>' + (m.team === 'wc' ? 'You were the last to spin, so you’re the Wild Card, joining the ' + e(ev.teams[ev.wildTeam] || '') + '. Your shirt will have ' + e(ev.teams[ev.wildTeam] || '') + ' on the back.' : 'Your shirt will have ' + e(ev.teams[m.team]) + ' on the back.') + '</p>' +
        '<p>You can see the teams any time at <a href="https://www.sightseerscaribbean.com/team-draw">sightseerscaribbean.com/team-draw</a>.</p>' +
        '<p>Sight Seers Caribbean Adventures</p></div>'
    });
  } catch (err) { console.error('team spin email', err && err.message); }
}

async function sizeEmail(ev, m) {
  const e = auth.escapeHtml, given = ev.members.filter(x => x.shirtSize);
  const rows = ev.members.map(x => '<tr><td style="padding:6px 10px">' + e(x.name) + '</td><td style="padding:6px 10px">' + e(x.team === 'wc' ? 'Wild Card' : ev.teams[x.team]) +
    '</td><td style="padding:6px 10px;font-weight:bold">' + e(x.shirtSize || '-') + '</td></tr>').join('');
  try {
    await sendEmail({
      subject: e(ev.title) + ' shirt size: ' + e(m.name) + ' is ' + e(m.shirtSize),
      html: '<h2 style="color:#063a63;font-family:sans-serif">' + e(m.name) + ' chose shirt size ' + e(m.shirtSize) + '</h2>' +
        '<p style="font-family:sans-serif">' + given.length + ' of ' + ev.size + ' sizes in so far.</p>' +
        '<table style="border-collapse:collapse;font-family:sans-serif"><tr><th style="text-align:left;padding:6px 10px">Name</th><th style="text-align:left;padding:6px 10px">Team</th><th style="text-align:left;padding:6px 10px">Size</th></tr>' + rows + '</table>'
    });
  } catch (err) { console.error('team size email', err && err.message); }
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  const q = req.query || {}, b = req.body || {};
  if (req.method === 'GET') {
    const ev = await loadEvent(cleanId(q.event || T.SUMMIT.id));
    if (!ev) return res.status(404).json({ error: 'That team spin could not be found. Check the link with whoever sent it.' });
    const who = auth.getUser(req) || (q.ref && q.email ? await spinner(req, { interestRef: q.ref, email: q.email }) : null);
    return res.status(200).json({ event: T.publicEvent(ev), me: strip(mine(ev, who)) });
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
    const user = await spinner(req, b);
    if (!user) return res.status(401).json({ error: 'Sign in or create your free account to spin for your team.', signIn: true });
    if (user.role === 'admin') return res.status(403).json({ error: 'Admins don’t spin, so no place is taken.' });
    const id = cleanId(b.event || T.SUMMIT.id);
    const ev = await loadEvent(id);
    if (!ev) return res.status(404).json({ error: 'That team spin could not be found.' });
    const r = T.join(ev, b, user);
    if (r.error) return res.status(400).json({ error: r.error, event: T.publicEvent(ev) });
    if (!r.already) {
      const saved = Object.assign({}, ev); delete saved.roster;
      await db.setDoc(evKey(id), saved);
      await notify(ev, r.member);
    }
    return res.status(200).json({ me: strip(r.member), already: !!r.already, event: T.publicEvent(ev) });
  }
  if (b.action === 'wildcard') {
    const admin = auth.requireAdmin(req, res); if (!admin) return;
    const id = cleanId(b.event || T.SUMMIT.id);
    const ev = await loadEvent(id);
    if (!ev) return res.status(404).json({ error: 'That team spin could not be found.' });
    const r = T.setWildTeam(ev, b.team);
    if (r.error) return res.status(400).json({ error: r.error });
    const saved = Object.assign({}, ev); delete saved.roster;
    await db.setDoc(evKey(id), saved);
    if (b.team && r.member && r.member.email) {
      try {
        await sendEmail({ to: r.member.email, subject: 'Your Wild Card team: the ' + ev.teams[b.team] + ', ' + ev.title,
          html: '<div style="font-family:sans-serif;color:#17323f"><h2 style="color:#063a63">You’re joining the ' + auth.escapeHtml(ev.teams[b.team]) + '!</h2><p>Hi ' + auth.escapeHtml(r.member.name) + ', the Wild Card has been decided: you’re on the ' + auth.escapeHtml(ev.teams[b.team]) + ' for ' + auth.escapeHtml(ev.title) + '.</p><p>Sight Seers Caribbean Adventures</p></div>' });
      } catch (e) { console.error('wild card email', e && e.message); }
    }
    return res.status(200).json({ event: T.publicEvent(ev) });
  }
  if (b.action === 'size') {
    const user = await spinner(req, b);
    if (!user) return res.status(401).json({ error: 'Please sign in again.', signIn: true });
    const id = cleanId(b.event || T.SUMMIT.id);
    const ev = await loadEvent(id);
    if (!ev) return res.status(404).json({ error: 'That team spin could not be found.' });
    const r = T.setSize(ev, user, b.size);
    if (r.error) return res.status(400).json({ error: r.error });
    const saved = Object.assign({}, ev); delete saved.roster;
    await db.setDoc(evKey(id), saved);
    await sizeEmail(ev, r.member);
    return res.status(200).json({ me: strip(r.member), event: T.publicEvent(ev) });
  }
  return res.status(400).json({ error: 'Unknown request.' });
};
