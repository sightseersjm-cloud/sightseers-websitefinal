const db = require('./_lib/db');
const { requireAdmin, uid } = require('./_lib/auth');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const { id, country } = req.query || {};
    const stays = await db.getCollection('stays');
    if (id) {
      const stay = stays.find(s => s.id === id);
      return stay ? res.status(200).json({ ok: true, stay }) : res.status(404).json({ error: 'Stay not found' });
    }
    if (country) {
      const filtered = stays.filter(s => s.country && s.country.toLowerCase() === country.toLowerCase());
      return res.status(200).json({ ok: true, stays: filtered });
    }
    return res.status(200).json({ ok: true, stays });
  }

  if (req.method === 'POST') {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const { action } = req.body;

    if (action === 'create') {
      const { name, description, country, location, price, priceUnit, bedrooms, bathrooms, maxGuests, image, images, amenities, type } = req.body;
      if (!name) return res.status(400).json({ error: 'Property name required' });

      const stay = {
        id: uid(),
        name: name.trim(),
        description: (description || '').trim(),
        country: (country || 'Jamaica').trim(),
        location: (location || '').trim(),
        price: price || 0,
        priceUnit: priceUnit || 'per night',
        bedrooms: bedrooms || 0,
        bathrooms: bathrooms || 0,
        maxGuests: maxGuests || 0,
        image: image || '',
        images: images || [],
        amenities: amenities || [],
        type: type || 'villa',
        active: true,
        createdBy: admin.id,
        createdAt: new Date().toISOString()
      };

      await db.addToCollection('stays', stay);
      return res.status(201).json({ ok: true, stay });
    }

    if (action === 'update') {
      const { id, ...updates } = req.body;
      if (!id) return res.status(400).json({ error: 'Stay ID required' });
      delete updates.action;

      const stay = await db.updateInCollection('stays', id, updates);
      if (!stay) return res.status(404).json({ error: 'Stay not found' });

      return res.status(200).json({ ok: true, stay });
    }

    if (action === 'delete') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'Stay ID required' });

      const removed = await db.removeFromCollection('stays', id);
      if (!removed) return res.status(404).json({ error: 'Stay not found' });

      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'Invalid action' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
