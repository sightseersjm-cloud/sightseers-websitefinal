const { put } = require('@vercel/blob');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { filename, data, type } = req.body;

    const buffer = Buffer.from(data, 'base64');

    const blob = await put('site-images/' + filename, buffer, {
      access: 'public',
      contentType: type || 'image/jpeg'
    });

    return res.status(200).json({
      ok: true,
      url: blob.url
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
