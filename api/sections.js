const db = require('./_lib/db');
const { requireAdmin, getUser, uid } = require('./_lib/auth');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const sections = await db.getCollection('sections');
    return res.status(200).json({ ok: true, sections });
  }

  if (req.method === 'POST') {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const { action } = req.body;

    if (action === 'create') {
      const { pageId, title, type, content, position, styles } = req.body;
      if (!pageId || !title) return res.status(400).json({ error: 'Page ID and title are required' });

      const section = {
        id: uid(),
        pageId,
        title: title.trim(),
        type: type || 'content',
        content: content || {},
        styles: styles || {},
        position: position || 999,
        visible: true,
        createdBy: admin.id,
        createdAt: new Date().toISOString()
      };

      await db.addToCollection('sections', section);
      return res.status(201).json({ ok: true, section });
    }

    if (action === 'update') {
      const { id, title, content, styles, position, visible } = req.body;
      if (!id) return res.status(400).json({ error: 'Section ID required' });

      const updates = {};
      if (title !== undefined) updates.title = title.trim();
      if (content !== undefined) updates.content = content;
      if (styles !== undefined) updates.styles = styles;
      if (position !== undefined) updates.position = position;
      if (visible !== undefined) updates.visible = visible;

      const section = await db.updateInCollection('sections', id, updates);
      if (!section) return res.status(404).json({ error: 'Section not found' });

      return res.status(200).json({ ok: true, section });
    }

    if (action === 'delete') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'Section ID required' });

      const removed = await db.removeFromCollection('sections', id);
      if (!removed) return res.status(404).json({ error: 'Section not found' });

      return res.status(200).json({ ok: true });
    }

    if (action === 'reorder') {
      const { orders } = req.body;
      if (!Array.isArray(orders)) return res.status(400).json({ error: 'Orders array required' });

      const sections = await db.getCollection('sections');
      for (const { id, position } of orders) {
        const s = sections.find(sec => sec.id === id);
        if (s) s.position = position;
      }
      sections.sort((a, b) => (a.position || 0) - (b.position || 0));
      await db.setCollection('sections', sections);

      return res.status(200).json({ ok: true, sections });
    }

    if (action === 'duplicate') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'Section ID required' });

      const sections = await db.getCollection('sections');
      const original = sections.find(s => s.id === id);
      if (!original) return res.status(404).json({ error: 'Section not found' });

      const copy = {
        ...original,
        id: uid(),
        title: original.title + ' (Copy)',
        position: (original.position || 0) + 1,
        createdBy: admin.id,
        createdAt: new Date().toISOString()
      };
      sections.push(copy);
      await db.setCollection('sections', sections);

      return res.status(201).json({ ok: true, section: copy });
    }

    return res.status(400).json({ error: 'Invalid action' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
