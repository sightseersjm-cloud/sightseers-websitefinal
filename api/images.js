const { put } = require('@vercel/blob');
const db = require('./_lib/db');
const { requireAdmin, getUser, uid } = require('./_lib/auth');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const images = await db.listImages('site-images/');
    return res.status(200).json({ ok: true, images });
  }

  if (req.method === 'POST') {
    const user = getUser(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { action } = req.body;

    if (action === 'delete') {
      const { url } = req.body;
      if (!url) return res.status(400).json({ error: 'Image URL required' });
      const removed = await db.deleteBlob(url);
      return res.status(200).json({ ok: true, deleted: removed });
    }

    const { filename, data, type, folder } = req.body;
    if (!filename || !data) return res.status(400).json({ error: 'Filename and data required' });

    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    const ALLOWED_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];
    const MAX_SIZE = 10 * 1024 * 1024;

    try {
      const ext = (filename.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!ALLOWED_EXTS.includes(ext)) return res.status(400).json({ error: 'File type not allowed' });
      if (type && !ALLOWED_TYPES.includes(type)) return res.status(400).json({ error: 'MIME type not allowed' });
      if (data.length > MAX_SIZE * 1.37) return res.status(400).json({ error: 'File too large (max 10MB)' });
      const safeName = uid() + '.' + ext;
      const path = (folder || 'site-images') + '/' + safeName;

      const buffer = Buffer.from(data, 'base64');
      const blob = await put(path, buffer, {
        access: 'public',
        contentType: type || 'image/jpeg',
        addRandomSuffix: false,
        allowOverwrite: true
      });

      const imgUrl = blob.url || blob.downloadUrl;
      const meta = await db.getCollection('image-meta');
      meta.push({
        id: uid(),
        url: imgUrl,
        pathname: blob.pathname,
        originalName: filename,
        size: buffer.length,
        type: type || 'image/jpeg',
        folder: folder || 'site-images',
        uploadedBy: user.id,
        uploadedAt: new Date().toISOString()
      });
      await db.setCollection('image-meta', meta);

      return res.status(200).json({ ok: true, url: imgUrl, pathname: blob.pathname });
    } catch (err) {
      console.error('Image upload error:', err.message);
      return res.status(500).json({ error: 'Upload failed. Please try again.' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
