const { getUser, can, permsOf } = require('../_lib/auth');

const { readSettings, writeSettings } = require('../_lib/siteStore');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    /* Visitors get a copy that may be a few minutes old (it is cached at the edge and in the browser): the page asks for
       this on every load, and each fresh read counts against the storage allowance. A signed-in team member can ask for
       the latest with ?fresh=. */
    const q = Object.assign({}, req.query || {});
    const user = (req.headers && req.headers.authorization) ? getUser(req) : null;
    const staff = !!user && q.fresh && (await permsOf(user)).length > 0;
    const data = await readSettings(staff ? undefined : { cached: true });
    res.setHeader('Cache-Control', req.headers && req.headers.authorization ? 'no-store' : 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600');
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const user = getUser(req);
    const { key, value, batch } = req.body || {};

    const adminKeys = ['ss_site_settings', 'ss_page_editor_settings', 'ss_stay_page_settings', 'ss_customer_gallery', 'ss_master_tours_manager_v1', 'ss_dynamic_sections_v1', 'ss_blog_requests_v1', 'ss_ga4_id'];

    if (batch && typeof batch === 'object') {
      const keys = Object.keys(batch);
      for (const k of keys) {
        if (adminKeys.includes(k) && (!user || !(await can(user, 'pages', 'catalog', 'blog')))) {
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

    // Team members with the right access and the owner can write site content.
    if (adminKeys.includes(key) && (!user || !(await can(user, 'pages', 'catalog', 'blog')))) {
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
