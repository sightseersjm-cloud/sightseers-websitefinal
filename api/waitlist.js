const db = require('./_lib/db');
const { requireAdmin, getUser, uid } = require('./_lib/auth');
const { sendEmail } = require('./_lib/email');

const COLLECTION = 'vtours-waitlist';

function cleanStr(v, max) {
  return String(v == null ? '' : v).trim().slice(0, max || 200);
}

module.exports = async function handler(req, res) {
  try {
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
        // Fire email without awaiting — DB save already succeeded, email is best-effort
        sendEmail({
          subject: `New V-Tours Waitlist Signup — ${entry.firstName} ${entry.lastName} (${acctType})`,
          html: `
            <h2 style="color:#0d5371">New V-Tours Waitlist Signup — Sight Seers Caribbean</h2>
            <table style="border-collapse:collapse;width:100%;font-family:sans-serif">
              <tr><td style="padding:8px;font-weight:bold;width:140px">Name</td><td style="padding:8px">${entry.firstName} ${entry.lastName}</td></tr>
              <tr style="background:#f5f5f5"><td style="padding:8px;font-weight:bold">Email</td><td style="padding:8px"><a href="mailto:${entry.email}">${entry.email}</a></td></tr>
              <tr><td style="padding:8px;font-weight:bold">Account Type</td><td style="padding:8px;text-transform:capitalize">${entry.type}</td></tr>
              ${entry.location ? `<tr style="background:#f5f5f5"><td style="padding:8px;font-weight:bold">Location</td><td style="padding:8px">${entry.location}</td></tr>` : ''}
              ${entry.experience != null ? `<tr><td style="padding:8px;font-weight:bold">Experience</td><td style="padding:8px">${entry.experience} years</td></tr>` : ''}
              ${entry.interests && entry.interests.length ? `<tr style="background:#f5f5f5"><td style="padding:8px;font-weight:bold">Interests</td><td style="padding:8px">${entry.interests.join(', ')}</td></tr>` : ''}
              ${entry.bio ? `<tr><td style="padding:8px;font-weight:bold;vertical-align:top">Bio</td><td style="padding:8px">${entry.bio}</td></tr>` : ''}
              <tr style="background:#f5f5f5"><td style="padding:8px;font-weight:bold">Signed Up</td><td style="padding:8px">${new Date(entry.createdAt).toLocaleString('en-US',{timeZone:'America/Jamaica'})}</td></tr>
            </table>
            <p style="color:#888;font-size:12px;margin-top:20px">This signup was submitted via sightseerscaribbean.com</p>`
        });
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
  } catch (err) {
    console.error('Waitlist error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};
