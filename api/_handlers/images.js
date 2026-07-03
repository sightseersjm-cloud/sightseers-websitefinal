const { put } = require('@vercel/blob');
const db = require('../_lib/db');
const { getUser, uid } = require('../_lib/auth');

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
const ALLOWED_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];
const EXT_FOR_TYPE = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
  'image/gif': 'gif', 'image/svg+xml': 'svg'
};
// Base64 expands the raw byte count by ~4/3; cap the DECODED size at 4MB so we
// stay under Vercel's 4.5MB request-body limit with headroom.
const MAX_DECODED_BYTES = 4 * 1024 * 1024;
const SAFE_FOLDERS = ['site-images', 'logos', 'gallery', 'tours', 'stays', 'blog', 'partners', 'panos', 'models'];

function sanitizeFolder(folder) {
  const f = String(folder || 'site-images').replace(/[^a-z0-9-]/gi, '').toLowerCase();
  return SAFE_FOLDERS.includes(f) ? f : 'site-images';
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    try {
      const images = await db.listImages('site-images/');
      return res.status(200).json({ ok: true, images });
    } catch (e) {
      return res.status(200).json({ ok: true, images: [] });
    }
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Sign in required to manage images.' });
  if (user.role !== 'admin' && user.role !== 'editor') {
    return res.status(403).json({ error: 'Admin or editor access required to manage images.' });
  }

  const { action } = req.body;

  if (action === 'delete') {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'Image URL required' });
    try {
      const removed = await db.deleteBlob(url);
      return res.status(200).json({ ok: true, deleted: removed });
    } catch (e) {
      return res.status(502).json({ error: 'Could not delete image from storage.' });
    }
  }

  // Storage must be configured for any upload to persist.
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(503).json({
      error: 'Image storage is not configured. Add BLOB_READ_WRITE_TOKEN in Vercel → Settings → Environment Variables.'
    });
  }

  let { filename, data, type, folder } = req.body;
  if (!data) return res.status(400).json({ error: 'No image data received.' });

  // Accept either raw base64 or a full data: URI.
  if (typeof data === 'string' && data.startsWith('data:')) {
    const comma = data.indexOf(',');
    const header = data.slice(5, comma);
    if (!type && header.includes(';')) type = header.split(';')[0];
    data = data.slice(comma + 1);
  }

  // Resolve extension from filename, falling back to MIME type.
  let ext = (String(filename || '').split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!ALLOWED_EXTS.includes(ext)) ext = EXT_FOR_TYPE[type] || '';
  if (!ALLOWED_EXTS.includes(ext)) {
    return res.status(400).json({ error: 'Unsupported image type. Use JPG, PNG, WebP, GIF or SVG.' });
  }
  if (type && !ALLOWED_TYPES.includes(type)) {
    return res.status(400).json({ error: 'Unsupported image MIME type: ' + type });
  }

  let buffer;
  try {
    buffer = Buffer.from(data, 'base64');
  } catch (e) {
    return res.status(400).json({ error: 'Image data was not valid base64.' });
  }
  if (!buffer.length) return res.status(400).json({ error: 'Decoded image was empty.' });
  if (buffer.length > MAX_DECODED_BYTES) {
    return res.status(413).json({
      error: 'Image is too large (' + Math.round(buffer.length / 1048576 * 10) / 10 + 'MB). Please use one under 3MB.'
    });
  }

  const safeFolder = sanitizeFolder(folder);
  const contentType = type || EXT_FOR_TYPE[ext] && ('image/' + (ext === 'jpg' ? 'jpeg' : ext)) || 'image/jpeg';
  const path = safeFolder + '/' + uid() + '.' + ext;

  let blob;
  try {
    blob = await put(path, buffer, {
      access: 'public',
      contentType,
      addRandomSuffix: false,
      allowOverwrite: true
    });
  } catch (err) {
    console.error('Blob put error:', err && err.message);
    return res.status(502).json({ error: 'Storage rejected the upload. Please try again.' });
  }

  const imgUrl = blob.url || blob.downloadUrl;

  // Record metadata (best-effort — never fail the upload over this).
  try {
    const meta = await db.getCollection('image-meta');
    meta.push({
      id: uid(), url: imgUrl, pathname: blob.pathname,
      originalName: String(filename || '').slice(0, 200),
      size: buffer.length, type: contentType, folder: safeFolder,
      uploadedBy: user.id, uploadedAt: new Date().toISOString()
    });
    await db.setCollection('image-meta', meta.slice(-500));
  } catch (e) { /* metadata is non-critical */ }

  return res.status(200).json({
    ok: true, url: imgUrl, pathname: blob.pathname,
    bytes: buffer.length, type: contentType, folder: safeFolder
  });
};
