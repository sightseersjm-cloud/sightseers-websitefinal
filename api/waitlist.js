const db = require('./_lib/db');
const { requireAdmin, getUser, uid } = require('./_lib/auth');

const COLLECTION = 'vtours-waitlist';

function cleanStr(v, max) {
  return String(v == null ? '' : v).trim().slice(0, max || 200);
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const entries = await db.getCollection(COLLECTION);
    return res.status(200).json({ ok: true, entries });
  }

  if (req.method === 'POST') {
    const { action } = req.body || {};

    if (action === 'join' || !action) {
      const { type, firstName, lastName, email, interests, location, experience, bio } = req.body || {};

      const acctType = type === 'guide' ? 'guide' : 'explorer';
      const first = cleanStr(firstName, 60);
      const last = cleanStr(lastName, 60);
      const mail = cleanStr(email, 160).toLowerCase();

      if (!first || !last || !mail) {
        return res.status(400).json({ error: 'First name, last name and email are required' });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
        return res.status(400).json({ error: 'Please enter a valid email address' });
      }

      // De-dupe: same email already registered for the same role
      const existing = await db.findInCollection(
        COLLECTION,
        e => e.email === mail && e.type === acctType
      );
      if (existing) {
        return res.status(200).json({ ok: true, id: existing.id, already: true });
      }

      const user = getUser(req);
      const entry = {
        id: uid(),
        userId: user ? user.id : null,
        type: acctType,
        firstName: first,
        lastName: last,
        email: mail,
        interests: Array.isArray(interests) ? interests.map(i => cleanStr(i, 40)).filter(Boolean).slice(0, 20) : [],
        location: cleanStr(location, 120),
        experience: experience != null && experience !== '' ? Number(experience) || 0 : null,
        bio: cleanStr(bio, 1000),
        status: 'new',
        createdAt: new Date().toISOString()
      };

      await db.addToCollection(COLLECTION, entry);
      return res.status(201).json({ ok: true, id: entry.id });
    }

    if (action === 'mark-read') {
      const admin = requireAdmin(req, res);
      if (!admin) return;

      const { id, status } = req.body;
      if (!id) return res.status(400).json({ error: 'Entry ID required' });

      const next = status === 'contacted' || status === 'read' ? status : 'read';
      const entry = await db.updateInCollection(COLLECTION, id, { status: next, reviewedBy: admin.id });
      if (!entry) return res.status(404).json({ error: 'Entry not found' });

      return res.status(200).json({ ok: true });
    }

    if (action === 'delete') {
      const admin = requireAdmin(req, res);
      if (!admin) return;

      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'Entry ID required' });

      const removed = await db.removeFromCollection(COLLECTION, id);
      if (!removed) return res.status(404).json({ error: 'Entry not found' });

      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'Invalid action' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
