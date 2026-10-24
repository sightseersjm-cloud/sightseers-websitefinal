/**
 * api/_lib/avatar.js
 * Profile photos. The browser crops and shrinks the picture to a small square JPEG before sending it,
 * so what arrives here is a data URL of a few dozen KB. Only real JPEG, PNG or WebP bytes are accepted
 * (never SVG, which can carry script), and the old photo is removed when a new one replaces it.
 * The Blob store is private, so photos are saved privately and shown through /api/auth/avatar/<file>.
 */
const { put, get } = require('@vercel/blob');
const db = require('./db');
const { uid } = require('./auth');

const MAX_BYTES = 700 * 1024;
const URL_PREFIX = '/api/auth/avatar/';
const NAME_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/;
const KINDS = [
  { type: 'image/jpeg', ext: 'jpg', test: b => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { type: 'image/png', ext: 'png', test: b => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { type: 'image/webp', ext: 'webp', test: b => b.slice(0, 4).toString('ascii') === 'RIFF' && b.slice(8, 12).toString('ascii') === 'WEBP' }
];

function decode(dataUrl) {
  const s = String(dataUrl || '');
  const m = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=\s]+)$/.exec(s);
  if (!m) return { error: 'Send the photo as a JPG, PNG or WebP picture.' };
  let buf;
  try { buf = Buffer.from(m[2], 'base64'); } catch (e) { return { error: 'That picture could not be read.' }; }
  if (!buf.length) return { error: 'That picture was empty.' };
  if (buf.length > MAX_BYTES) return { error: 'That picture is too large. Please choose a smaller one.' };
  const kind = KINDS.find(k => k.test(buf));
  if (!kind) return { error: 'That file is not a JPG, PNG or WebP picture.' };
  return { buf, kind };
}

/* the blob path behind a stored photo address, or '' when it is not one of ours */
function pathOf(url) {
  const name = String(url || '').split('/').pop();
  return /\/avatars?\//.test(String(url || '')) && NAME_RE.test(name) ? 'avatars/' + name : '';
}

async function saveAvatar(userId, dataUrl, oldUrl) {
  const d = decode(dataUrl);
  if (d.error) return d;
  if (!process.env.BLOB_READ_WRITE_TOKEN) return { error: 'Photo storage is not set up yet. Please try again later.' };
  /* the file name is random: guests can open the address, so it must not carry the account id */
  const name = uid() + '.' + d.kind.ext;
  await put('avatars/' + name, d.buf, { access: 'private', contentType: d.kind.type, addRandomSuffix: false });
  await removeAvatar(oldUrl);
  return { url: URL_PREFIX + name };
}
async function removeAvatar(oldUrl) {
  const path = pathOf(oldUrl);
  if (path) { try { await db.deleteBlob(path); } catch (e) { /* best effort */ } }
}

/* GET /api/auth/avatar/<file>: anyone may view a photo, as guests see a leader's photo on the trip page */
async function serve(name, res) {
  const kind = NAME_RE.test(name || '') && KINDS.find(k => k.ext === name.split('.').pop());
  if (!kind) return res.status(404).json({ error: 'Not found' });
  let r = null;
  /* useCache: false so a photo that was only just saved is found straight away instead of a cached "not found" */
  try { r = await get('avatars/' + name, { access: 'private', useCache: false }); } catch (e) { r = null; }
  if (!r || r.statusCode !== 200 || !r.stream) return res.status(404).json({ error: 'Not found' });
  const buf = Buffer.from(await new Response(r.stream).arrayBuffer());
  res.setHeader('Content-Type', kind.type);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  /* a new photo always gets a new name, so a file never changes */
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  return res.status(200).end(buf);
}

module.exports = { saveAvatar, removeAvatar, serve, decode, pathOf, MAX_BYTES, URL_PREFIX };
