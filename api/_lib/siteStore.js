/* The live site's saved wording, photos and added sections: one private document that every visitor's browser reads
   through /api/settings. The old admin and the new admin both write here, so a change made in either shows on the site. */
const { put, get } = require('@vercel/blob');

const SETTINGS_PATH = 'ss-admin/settings.json';

/* Reading the saved settings costs one storage read, and every visitor's page asks for them, so the public GET may reuse
   a copy held in memory for a minute. Anything that is about to change the settings reads fresh (the default). */
let held = null, heldAt = 0;
const HOLD_MS = 60000;

/* read through the authenticated get(): a plain fetch of a private blob is refused and used to make saved edits vanish */
async function readSettings(opts) {
  if (opts && opts.cached && held && Date.now() - heldAt < HOLD_MS) return JSON.parse(held);
  const data = await readFresh();
  held = JSON.stringify(data); heldAt = Date.now();
  return data;
}

async function readFresh() {
  try {
    const result = await get(SETTINGS_PATH, { access: 'private', useCache: false });
    if (!result || !result.stream) return {};
    return await new Response(result.stream).json();
  } catch {
    return {};
  }
}

async function writeSettings(data) {
  held = null;
  await put(SETTINGS_PATH, JSON.stringify(data), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true
  });
}

module.exports = { readSettings, writeSettings };
