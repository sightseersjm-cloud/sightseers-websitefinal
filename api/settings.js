const { put, list } = require('@vercel/blob');
const { getUser, requireAdmin } = require('./_lib/auth');

const SETTINGS_PATH = 'ss-admin/settings.json';

async function readSettings() {
  try {
    const { blobs } = await list({ prefix: 'ss-admin/' });
    const blob = blobs.find(b => b.pathname === SETTINGS_PATH);
    if (!blob) return {};
    const res = await fetch(blob.url + '?t=' + Date.now());
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
}

async function writeSettings(data) {
  await put(SETTINGS_PATH, JSON.stringify(data), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false
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
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ error: 'Key required' });

    const adminKeys = ['ss_site_settings', 'ss_page_editor_settings', 'ss_stay_page_settings', 'ss_customer_gallery'];
    if (adminKeys.includes(key) && (!user || user.role !== 'admin')) {
      return res.status(403).json({ error: 'Admin access required for this setting' });
    }

    const current = await readSettings();
    current[key] = value;
    await writeSettings(current);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
};
