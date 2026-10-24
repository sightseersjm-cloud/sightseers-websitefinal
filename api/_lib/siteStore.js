/* The live site's saved wording, photos and added sections: one private document that every visitor's browser reads
   through /api/settings. The old admin and the new admin both write here, so a change made in either shows on the site. */
const { put, get } = require('@vercel/blob');

const SETTINGS_PATH = 'ss-admin/settings.json';

/* read through the authenticated get(): a plain fetch of a private blob is refused and used to make saved edits vanish */
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

module.exports = { readSettings, writeSettings };
