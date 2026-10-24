/**
 * api/_handlers/inbox.js
 *   GET  /api/inbox            admin: every website request in one list, newest first, with counts
 *   GET  /api/inbox?count=1    admin: only the counts (for the notification badges)
 *   POST { action:'update', source, id, status, note }   admin: set a request's status (new, in_progress, done) and private note
 *   POST { action:'delete', source, id }                admin: delete a request for good
 * The forms still save to their own collections and still email the team; this is the one place to work through them.
 */
const db = require('../_lib/db');
const { requireAdmin, requirePerm } = require('../_lib/auth');
const inbox = require('../_lib/inbox');

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
      return res.status(200).json({ ok: true, counts: c, items: items.slice(0, 600), statuses: inbox.STATUSES });
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
    if (b.action === 'delete') {
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
