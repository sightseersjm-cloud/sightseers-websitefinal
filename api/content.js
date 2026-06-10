const db = require('./_lib/db');
const { requireAdmin } = require('./_lib/auth');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const { page, type } = req.query || {};

    if (type === 'pages') {
      const pages = await db.getDoc('pages') || {};
      if (page) return res.status(200).json({ ok: true, page: pages[page] || null });
      return res.status(200).json({ ok: true, pages });
    }

    const content = await db.getDoc('content') || {};
    if (page) {
      const filtered = {};
      for (const [key, val] of Object.entries(content)) {
        if (key.startsWith(page + ':') || key.startsWith(page + '.')) filtered[key] = val;
      }
      return res.status(200).json({ ok: true, content: filtered });
    }
    return res.status(200).json({ ok: true, content });
  }

  if (req.method === 'POST') {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const { action } = req.body;

    // Content actions
    if (action === 'update') {
      const { selector, value, type } = req.body;
      if (!selector) return res.status(400).json({ error: 'Selector required' });

      const content = await db.getDoc('content') || {};
      content[selector] = {
        value,
        type: type || 'text',
        updatedBy: admin.id,
        updatedAt: new Date().toISOString()
      };
      await db.setDoc('content', content);

      return res.status(200).json({ ok: true });
    }

    if (action === 'bulk-update') {
      const { changes } = req.body;
      if (!Array.isArray(changes)) return res.status(400).json({ error: 'Changes array required' });

      const content = await db.getDoc('content') || {};
      const now = new Date().toISOString();
      for (const { selector, value, type } of changes) {
        if (selector) {
          content[selector] = { value, type: type || 'text', updatedBy: admin.id, updatedAt: now };
        }
      }
      await db.setDoc('content', content);

      return res.status(200).json({ ok: true, count: changes.length });
    }

    if (action === 'update-font') {
      const { selector, fontFamily, fontSize, fontWeight, fontStyle, color, letterSpacing, lineHeight, textTransform } = req.body;
      if (!selector) return res.status(400).json({ error: 'Selector required' });

      const fonts = await db.getDoc('fonts') || {};
      const styles = {};
      if (fontFamily) styles.fontFamily = fontFamily;
      if (fontSize) styles.fontSize = fontSize;
      if (fontWeight) styles.fontWeight = fontWeight;
      if (fontStyle) styles.fontStyle = fontStyle;
      if (color) styles.color = color;
      if (letterSpacing) styles.letterSpacing = letterSpacing;
      if (lineHeight) styles.lineHeight = lineHeight;
      if (textTransform) styles.textTransform = textTransform;

      fonts[selector] = { ...styles, updatedBy: admin.id, updatedAt: new Date().toISOString() };
      await db.setDoc('fonts', fonts);

      return res.status(200).json({ ok: true });
    }

    if (action === 'bulk-update-fonts') {
      const { changes } = req.body;
      if (!Array.isArray(changes)) return res.status(400).json({ error: 'Changes array required' });

      const fonts = await db.getDoc('fonts') || {};
      const now = new Date().toISOString();
      for (const change of changes) {
        if (change.selector) {
          const { selector, ...styles } = change;
          fonts[selector] = { ...styles, updatedBy: admin.id, updatedAt: now };
        }
      }
      await db.setDoc('fonts', fonts);

      return res.status(200).json({ ok: true, count: changes.length });
    }

    if (action === 'delete') {
      const { selector } = req.body;
      if (!selector) return res.status(400).json({ error: 'Selector required' });

      const content = await db.getDoc('content') || {};
      delete content[selector];
      await db.setDoc('content', content);

      return res.status(200).json({ ok: true });
    }

    if (action === 'reset-page') {
      const { page } = req.body;
      if (!page) return res.status(400).json({ error: 'Page ID required' });

      const content = await db.getDoc('content') || {};
      for (const key of Object.keys(content)) {
        if (key.startsWith(page + ':') || key.startsWith(page + '.')) delete content[key];
      }
      await db.setDoc('content', content);

      const fonts = await db.getDoc('fonts') || {};
      for (const key of Object.keys(fonts)) {
        if (key.startsWith(page + ':') || key.startsWith(page + '.')) delete fonts[key];
      }
      await db.setDoc('fonts', fonts);

      return res.status(200).json({ ok: true });
    }

    // Page config actions
    if (action === 'update-page') {
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

    if (action === 'reset-page-config') {
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
