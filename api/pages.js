const db = require('./_lib/db');
const { requireAdmin, getUser } = require('./_lib/auth');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const { id } = req.query || {};
    const pages = await db.getDoc('pages') || {};
    if (id) return res.status(200).json({ ok: true, page: pages[id] || null });
    return res.status(200).json({ ok: true, pages });
  }

  if (req.method === 'POST') {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const { action } = req.body;

    if (action === 'update') {
      const { id, title, heroImage, heroTitle, heroSubtitle, visible, meta } = req.body;
      if (!id) return res.status(400).json({ error: 'Page ID required' });

      const pages = await db.getDoc('pages') || {};
      pages[id] = {
        ...(pages[id] || {}),
        id,
        updatedBy: admin.id,
        updatedAt: new Date().toISOString()
      };
      if (title !== undefined) pages[id].title = title;
      if (heroImage !== undefined) pages[id].heroImage = heroImage;
      if (heroTitle !== undefined) pages[id].heroTitle = heroTitle;
      if (heroSubtitle !== undefined) pages[id].heroSubtitle = heroSubtitle;
      if (visible !== undefined) pages[id].visible = visible;
      if (meta) pages[id].meta = { ...(pages[id].meta || {}), ...meta };

      await db.setDoc('pages', pages);
      return res.status(200).json({ ok: true, page: pages[id] });
    }

    if (action === 'update-seo') {
      const { id, metaTitle, metaDescription, ogImage } = req.body;
      if (!id) return res.status(400).json({ error: 'Page ID required' });

      const pages = await db.getDoc('pages') || {};
      if (!pages[id]) pages[id] = { id };
      pages[id].seo = { metaTitle, metaDescription, ogImage };
      pages[id].updatedAt = new Date().toISOString();

      await db.setDoc('pages', pages);
      return res.status(200).json({ ok: true, page: pages[id] });
    }

    if (action === 'reset') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'Page ID required' });

      const pages = await db.getDoc('pages') || {};
      delete pages[id];
      await db.setDoc('pages', pages);

      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'Invalid action' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
