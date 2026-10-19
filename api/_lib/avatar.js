/**
 * api/_lib/avatar.js
 * Profile photos. The browser crops and shrinks the picture to a small square JPEG before sending it,
 * so what arrives here is a data URL of a few dozen KB. Only real JPEG, PNG or WebP bytes are accepted
 * (never SVG, which can carry script), and the old photo is removed when a new one replaces it.
 */
const { put } = require('@vercel/blob');
const db = require('./db');
const { uid } = require('./auth');

const MAX_BYTES = 700 * 1024;
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

async function saveAvatar(userId, dataUrl, oldUrl) {
  const d = decode(dataUrl);
  if (d.error) return d;
  if (!process.env.BLOB_READ_WRITE_TOKEN) return { error: 'Photo storage is not set up yet. Please try again later.' };
  /* the file name is random: the address is public, so it must not carry the account id */
  const path = 'avatars/' + uid() + '.' + d.kind.ext;
  const blob = await put(path, d.buf, { access: 'public', contentType: d.kind.type, addRandomSuffix: false });
  if (oldUrl && /\/avatars\//.test(oldUrl)) { try { await db.deleteBlob(oldUrl); } catch (e) { /* best effort */ } }
  return { url: blob.url };
}
async function removeAvatar(oldUrl) {
  if (oldUrl && /\/avatars\//.test(oldUrl)) { try { await db.deleteBlob(oldUrl); } catch (e) { /* best effort */ } }
}

module.exports = { saveAvatar, removeAvatar, decode, MAX_BYTES };
