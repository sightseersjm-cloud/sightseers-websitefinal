const db = require('./_lib/db');
const { requireAdmin, getUser, uid } = require('./_lib/auth');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const { id } = req.query || {};
    const tours = await db.getCollection('tours');
    if (id) {
      const tour = tours.find(t => t.id === id);
      return tour ? res.status(200).json({ ok: true, tour }) : res.status(404).json({ error: 'Tour not found' });
    }
    return res.status(200).json({ ok: true, tours });
  }

  if (req.method === 'POST') {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const { action } = req.body;

    if (action === 'create') {
      const { name, description, price, duration, location, category, image, images, highlights, includes, meetingPoint, maxGuests, difficulty } = req.body;
      if (!name) return res.status(400).json({ error: 'Tour name required' });

      const tour = {
        id: uid(),
        name: name.trim(),
        description: (description || '').trim(),
        price: price || 0,
        duration: duration || '',
        location: (location || '').trim(),
        category: category || 'adventure',
        image: image || '',
        images: images || [],
        highlights: highlights || [],
        includes: includes || [],
        meetingPoint: meetingPoint || '',
        maxGuests: maxGuests || 0,
        difficulty: difficulty || 'easy',
        active: true,
        createdBy: admin.id,
        createdAt: new Date().toISOString()
      };

      await db.addToCollection('tours', tour);
      return res.status(201).json({ ok: true, tour });
    }

    if (action === 'update') {
      const { id, ...updates } = req.body;
      if (!id) return res.status(400).json({ error: 'Tour ID required' });
      delete updates.action;

      const tour = await db.updateInCollection('tours', id, updates);
      if (!tour) return res.status(404).json({ error: 'Tour not found' });

      return res.status(200).json({ ok: true, tour });
    }

    if (action === 'delete') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'Tour ID required' });

      const removed = await db.removeFromCollection('tours', id);
      if (!removed) return res.status(404).json({ error: 'Tour not found' });

      return res.status(200).json({ ok: true });
    }

    if (action === 'toggle') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'Tour ID required' });

      const tours = await db.getCollection('tours');
      const idx = tours.findIndex(t => t.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Tour not found' });

      tours[idx].active = !tours[idx].active;
      tours[idx].updatedAt = new Date().toISOString();
      await db.setCollection('tours', tours);

      return res.status(200).json({ ok: true, tour: tours[idx] });
    }

    return res.status(400).json({ error: 'Invalid action' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
