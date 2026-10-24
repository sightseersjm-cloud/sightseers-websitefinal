/**
 * api/_handlers/inbox.js
 *   GET  /api/inbox            admin: every website request in one list, newest first, with counts
 *   GET  /api/inbox?count=1    admin: only the counts (for the notification badges)
 *   POST { action:'update', source, id, status, note }   admin: set a request's status (new, in_progress, done) and private note
 *   POST { action:'delete', source, id }                admin: delete a request for good
 * The forms still save to their own collections and still email the team; this is the one place to work through them.
 */
const db = require('../_lib/db');
const { requireAdmin, requirePerm, requireOwner, permsOf, uid, escapeHtml } = require('../_lib/auth');
const { sendEmail } = require('../_lib/email');
const inbox = require('../_lib/inbox');

/* the people a request can be handed to: the owner and team members who may work the inbox */
async function assignable() {
  const users = await db.getCollection('users');
  return users.filter(u => !u.disabled && (u.role === 'admin' || (u.role === 'staff' && Array.isArray(u.perms) && u.perms.indexOf('inbox') > -1)))
    .map(u => ({ id: u.id, name: u.name || u.email, email: u.email, role: u.role }));
}
const who = u => ({ id: u.id, name: u.name || u.email || 'Someone' });
function logLine(rec, entry) {
  const t = Array.isArray(rec.inboxThread) ? rec.inboxThread.slice(-59) : [];
  t.push(Object.assign({ id: uid(), at: new Date().toISOString() }, entry));
  return t;
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'OPTIONS') return res.status(200).end();
    const admin = await requirePerm(req, res, 'inbox');
    if (!admin) return;

    if (req.method === 'GET') {
      const url = new URL(req.url || '/', 'http://x');
      const items = await inbox.collect(db);
      const c = inbox.counts(items);
      if ((req.query && req.query.count) || url.searchParams.get('count')) return res.status(200).json({ ok: true, counts: c });
      return res.status(200).json({ ok: true, counts: c, items: items.slice(0, 600), statuses: inbox.STATUSES, team: await assignable() });
    }

    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const b = req.body || {};
    if (b.action === 'update') {
      const src = inbox.SOURCES[String(b.source || '')];
      if (!src) return res.status(400).json({ error: 'Unknown request type.' });
      if (inbox.STATUSES.indexOf(b.status) < 0) return res.status(400).json({ error: 'Choose a status.' });
      const list = await db.getCollection(src.collection);
      const rec = list.find(x => x.id === String(b.id || ''));
      if (!rec) return res.status(404).json({ error: 'Request not found.' });
      const saved = await db.updateInCollection(src.collection, rec.id, { inboxStatus: b.status, inboxNote: String(b.note || '').trim().slice(0, 1000), inboxAt: new Date().toISOString(), inboxBy: admin.email || admin.id });
      return res.status(200).json({ ok: true, item: inbox.toItem(String(b.source), saved) });
    }
    /* the working actions: each finds the request, changes it, and writes a line in its history */
    if (['set-status', 'assign', 'note', 'reply'].indexOf(b.action) > -1) {
      const src = inbox.SOURCES[String(b.source || '')];
      if (!src) return res.status(400).json({ error: 'Unknown request type.' });
      const list = await db.getCollection(src.collection);
      const rec = list.find(x => x.id === String(b.id || ''));
      if (!rec) return res.status(404).json({ error: 'Request not found.' });
      const me = who(admin);
      const item = inbox.toItem(String(b.source), rec);
      let patch;

      if (b.action === 'set-status') {
        if (inbox.STATUSES.indexOf(b.status) < 0) return res.status(400).json({ error: 'Choose a status.' });
        if (b.status === item.status) return res.status(200).json({ ok: true, item });
        const label = { new: 'New', in_progress: 'In progress', done: 'Done' }[b.status];
        patch = { inboxStatus: b.status, inboxAt: new Date().toISOString(), inboxBy: me.name, inboxThread: logLine(rec, { type: 'status', by: me, text: 'Marked ' + label }) };
      }

      if (b.action === 'assign') {
        let to = null;
        if (b.assigneeId) {
          to = (await assignable()).find(x => x.id === String(b.assigneeId));
          if (!to) return res.status(400).json({ error: 'That person cannot be given requests. They need inbox access.' });
        }
        patch = { inboxAssignee: to ? { id: to.id, name: to.name } : null, inboxThread: logLine(rec, { type: 'assign', by: me, text: to ? 'Given to ' + to.name : 'No one is handling this now' }) };
        if (to && item.status === 'new') { patch.inboxStatus = 'in_progress'; patch.inboxAt = new Date().toISOString(); }
        if (to && to.id !== me.id && to.email) {
          const site = (process.env.SITE_URL || 'https://www.sightseerscaribbean.com').replace(/\/+$/, '');
          sendEmail({
            to: to.email, subject: me.name + ' gave you a request: ' + (item.name || item.title),
            html: '<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#1a2b3f"><h2 style="color:#0a3557">A request is yours</h2><p><b>' + escapeHtml(me.name) + '</b> gave you this one:</p><p style="border-left:3px solid #ef8731;padding-left:12px"><b>' + escapeHtml(item.type) + '</b>: ' + escapeHtml(item.name || '') + '<br>' + escapeHtml(item.summary || item.title || '') + '</p><p><a href="' + site + '/manage#inbox" style="display:inline-block;background:#0a3557;color:#fff;padding:14px 26px;text-decoration:none;font-weight:bold">Open the inbox</a></p></div>'
          }).catch(() => {});
        }
      }

      if (b.action === 'note') {
        const text = String(b.text || '').trim().slice(0, 1500);
        if (!text) return res.status(400).json({ error: 'Write a note first.' });
        patch = { inboxThread: logLine(rec, { type: 'note', by: me, text }) };
      }

      if (b.action === 'reply') {
        const text = String(b.message || '').trim().slice(0, 6000), subject = String(b.subject || '').trim().slice(0, 160);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(item.email || '')) return res.status(400).json({ error: 'This request has no email address to reply to.' });
        if (!text) return res.status(400).json({ error: 'Write your reply first.' });
        if (!subject) return res.status(400).json({ error: 'Add a subject.' });
        const hourAgo = Date.now() - 3600000;
        const recent = (Array.isArray(rec.inboxThread) ? rec.inboxThread : []).filter(t => t.type === 'reply' && t.by && t.by.id === me.id && new Date(t.at).getTime() > hourAgo).length;
        if (recent >= 20) return res.status(429).json({ error: 'That is a lot of replies on one request. Please wait a little.' });
        if (!process.env.RESEND_API_KEY) return res.status(503).json({ error: 'Email sending is not set up on the website yet, so the reply was not sent.' });
        const body = text.split(/\n{2,}/).map(p => '<p style="margin:0 0 14px;line-height:1.6">' + escapeHtml(p).replace(/\n/g, '<br>') + '</p>').join('');
        const r = await sendEmail({
          to: item.email, subject,
          replyTo: process.env.BUSINESS_EMAIL || undefined,
          html: '<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1a2b3f">' + body + '<p style="margin:22px 0 0;color:#5c6f82;font-size:13px">' + escapeHtml(me.name) + '<br>Sight Seers Caribbean Adventures</p></div>'
        });
        if (!r || r.ok === false) return res.status(502).json({ error: 'The email service did not accept that reply, so it was not sent. Nothing was recorded.' });
        patch = { inboxThread: logLine(rec, { type: 'reply', by: me, subject, text, to: item.email }) };
        if (item.status === 'new') { patch.inboxStatus = 'in_progress'; patch.inboxAt = new Date().toISOString(); patch.inboxBy = me.name; }
      }

      const saved = await db.updateInCollection(src.collection, rec.id, patch);
      return res.status(200).json({ ok: true, item: inbox.toItem(String(b.source), saved) });
    }

    if (b.action === 'delete') {
      /* removing a customer's request for good is the owner's call */
      const owner = await requireOwner(req, res);
      if (!owner) return;
      const src = inbox.SOURCES[String(b.source || '')];
      if (!src) return res.status(400).json({ error: 'Unknown request type.' });
      const list = await db.getCollection(src.collection);
      if (!list.some(x => x.id === String(b.id || ''))) return res.status(404).json({ error: 'Request not found.' });
      await db.removeFromCollection(src.collection, String(b.id));
      return res.status(200).json({ ok: true });
    }
    return res.status(400).json({ error: 'Unknown action' });
  } catch (e) {
    console.error('inbox handler', e && e.stack || e);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};
