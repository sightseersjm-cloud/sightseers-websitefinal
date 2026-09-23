/**
 * api/_lib/vt-scenes.js
 * Single source of truth for live V-Tour scenes: playback id, title and price.
 *
 * Read from the MUX_PLAYBACK_IDS environment variable so a scene can be added
 * or repriced without a deploy. Format is comma-separated entries of
 *   key:playbackId:Title:price
 * e.g. "blue-lagoon:AbC123:Water Park Tour:42,craft-market:DeF456:Market:38"
 *
 * Both /api/vt-config (which tells the browser what exists) and
 * /api/stripe-checkout (which decides what to charge) read this, so the price
 * shown and the price billed cannot drift apart.
 */

function muxScenes() {
  const raw = (process.env.MUX_PLAYBACK_IDS || '').trim();
  const scenes = {};
  if (!raw) return scenes;

  raw.split(',').forEach(entry => {
    const parts = entry.split(':').map(s => s.trim());
    const [key, playbackId, title, price] = parts;
    if (!key || !playbackId) return;
    scenes[key] = {
      playbackId,
      title: title || key,
      price: Number(price) || 0
    };
  });
  return scenes;
}

/**
 * Look a scene up by its Mux playback id — what the browser sends when someone
 * buys a seat. Returns null when the id is unknown, so the caller can refuse
 * rather than fall back to a price the browser supplied.
 */
function sceneByPlaybackId(playbackId) {
  if (!playbackId) return null;
  const scenes = muxScenes();
  for (const key of Object.keys(scenes)) {
    if (scenes[key].playbackId === playbackId) {
      return Object.assign({ key: key }, scenes[key]);
    }
  }
  return null;
}

module.exports = { muxScenes, sceneByPlaybackId };
