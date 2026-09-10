const { put, get, BlobNotFoundError, BlobPreconditionFailedError } = require('@vercel/blob');
const { requireEditor } = require('../_lib/auth');

const SETTINGS_PATH = 'ss-admin/settings.json';
const SETTINGS_KEYS = new Set(require('../_lib/settings-keys.json'));

async function readSettings() {
  try {
    const result = await get(SETTINGS_PATH, { access: 'private', useCache: false });
    if (!result) return { data: {}, etag: null };
    if (!result.stream) throw new Error('Settings storage returned no content');
    const data = await new Response(result.stream).json();
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid settings document');
    return { data, etag: result.blob.etag };
  } catch (err) {
    // A failed read must never turn into an empty document and erase saved edits.
    if (err instanceof BlobNotFoundError) return { data: {}, etag: null };
    throw err;
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') {
    try { return res.status(200).json((await readSettings()).data); }
    catch (err) { console.error('Settings read failed:', err.message); return res.status(503).json({error:'Could not load published settings. Please try again.'}); }
  }
  if (req.method !== 'POST') return res.status(405).end();
  if (!requireEditor(req, res)) return;

  const { key, value, batch } = req.body || {};
  const updates = batch === undefined ? (typeof key === 'string' ? {[key]:value} : null) : batch;
  if (!updates || typeof updates !== 'object' || Array.isArray(updates) || !Object.keys(updates).length) {
    return res.status(400).json({error:'A non-empty settings batch is required'});
  }
  if (Object.keys(updates).some(k => !SETTINGS_KEYS.has(k))) {
    return res.status(400).json({error:'Unknown site setting'});
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const current = await readSettings();
      await put(SETTINGS_PATH, JSON.stringify({...current.data, ...updates}), {
        access:'private', contentType:'application/json', addRandomSuffix:false,
        allowOverwrite:!!current.etag, ...(current.etag ? {ifMatch:current.etag} : {})
      });
      return res.status(200).json({ok:true});
    } catch (err) {
      if (err instanceof BlobPreconditionFailedError && attempt < 2) continue;
      console.error('Settings save failed:', err.message);
      return res.status(err instanceof BlobPreconditionFailedError ? 409 : 503).json({error:'Could not save changes. Your edits are still in this browser; please try again.'});
    }
  }
};
