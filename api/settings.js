const { put, get } = require('@vercel/blob');
const { getUser } = require('./_lib/auth');

const SETTINGS_PATH = 'ss-admin/settings.json';

// Read the private settings doc through the authenticated get() API.
// A plain fetch() of a private blob URL is unauthorized and returns {},
// which is why admin edits previously never appeared on reload/other devices.
async function readSettings() {
  try {
    const result = await get(SETTINGS_PATH, { access: 'private', useCache: false });
    if (!result || !result.stream) return {};
    return await new Response(result.stream).json();
  } catch {
    return {};
  }
}

async function writeSettings(data) {
  await put(SETTINGS_PATH, JSON.stringify(data), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true
  });
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const data = await readSettings();
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const user = getUser(req);
    const { key, value, batch } = req.body || {};

    const adminKeys = ['ss_site_settings', 'ss_page_editor_settings', 'ss_stay_page_settings', 'ss_customer_gallery', 'ss_master_tours_manager_v1', 'ss_dynamic_sections_v1', 'ss_blog_requests_v1'];

    if (batch && typeof batch === 'object') {
      const keys = Object.keys(batch);
      for (const k of keys) {
        if (adminKeys.includes(k) && (!user || (user.role !== 'admin' && user.role !== 'editor'))) {
          return res.status(403).json({ error: 'Admin access required for this setting' });
        }
      }
      try {
        const current = await readSettings();
        for (const k of keys) current[k] = batch[k];
        await writeSettings(current);
        return res.status(200).json({ ok: true });
      } catch (err) {
        console.error('Settings batch write error:', err && err.message);
        return res.status(500).json({ error: 'Could not save settings' });
      }
    }

    if (!key) return res.status(400).json({ error: 'Key required' });

    // Content editors (passcode login) and full admins can write site content.
    if (adminKeys.includes(key) && (!user || (user.role !== 'admin' && user.role !== 'editor'))) {
      return res.status(403).json({ error: 'Admin access required for this setting' });
    }

    try {
      const current = await readSettings();
      current[key] = value;
      await writeSettings(current);
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('Settings write error:', err && err.message);
      return res.status(500).json({ error: 'Could not save setting' });
    }
  }

  return res.status(405).end();
};
