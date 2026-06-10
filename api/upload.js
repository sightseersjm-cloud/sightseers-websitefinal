const { put } = require('@vercel/blob');
const { getUser } = require('./_lib/auth');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = getUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const { filename, data, type } = req.body;
    if (!filename || !data) return res.status(400).json({ error: 'Filename and data required' });

    const buffer = Buffer.from(data, 'base64');
    const blob = await put('site-images/' + filename, buffer, {
      access: 'public',
      contentType: type || 'image/jpeg'
    });

    return res.status(200).json({ ok: true, url: blob.url });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
