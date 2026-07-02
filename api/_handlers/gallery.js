const db = require('../_lib/db');
const { requireAdmin, uid } = require('../_lib/auth');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const gallery = await db.getCollection('gallery');
    return res.status(200).json({ ok: true, gallery });
  }

  if (req.method === 'POST') {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const { action } = req.body;

    if (action === 'create') {
      const { image, name, caption, badge, layout, category } = req.body;
      if (!image) return res.status(400).json({ error: 'Image URL required' });

      const entry = {
        id: uid(),
        image,
        name: (name || 'Sight Seers Guest').trim(),
        caption: (caption || 'Island moment').trim(),
        badge: (badge || 'Guest Story').trim(),
        layout: (layout || '').trim(),
        category: (category || 'general').trim(),
        position: 999,
        visible: true,
        createdBy: admin.id,
        createdAt: new Date().toISOString()
      };

      await db.addToCollection('gallery', entry);
      return res.status(201).json({ ok: true, entry });
    }

    if (action === 'update') {
      const { id, ...updates } = req.body;
      if (!id) return res.status(400).json({ error: 'Gallery entry ID required' });
      delete updates.action;

      const entry = await db.updateInCollection('gallery', id, updates);
      if (!entry) return res.status(404).json({ error: 'Entry not found' });

      return res.status(200).json({ ok: true, entry });
    }

    if (action === 'delete') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'Gallery entry ID required' });

      const removed = await db.removeFromCollection('gallery', id);
      if (!removed) return res.status(404).json({ error: 'Entry not found' });

      return res.status(200).json({ ok: true });
    }

    if (action === 'reorder') {
      const { orders } = req.body;
      if (!Array.isArray(orders)) return res.status(400).json({ error: 'Orders array required' });

      const gallery = await db.getCollection('gallery');
      for (const { id, position } of orders) {
        const e = gallery.find(g => g.id === id);
        if (e) e.position = position;
      }
      gallery.sort((a, b) => (a.position || 0) - (b.position || 0));
      await db.setCollection('gallery', gallery);

      return res.status(200).json({ ok: true, gallery });
    }

    return res.status(400).json({ error: 'Invalid action' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
