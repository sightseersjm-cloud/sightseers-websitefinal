const db = require('./_lib/db');
const { requireAdmin } = require('./_lib/auth');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const { page } = req.query || {};
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

    return res.status(400).json({ error: 'Invalid action' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
