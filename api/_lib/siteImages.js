/**
 * api/_lib/siteImages.js
 * Photos uploaded from the admin (gallery, tours, stays, blog, logos, section photos and so on).
 * The Blob store is private, so a photo cannot be opened from its storage address. Photos are saved privately and
 * shown through the site's own address, /api/images?file=<folder>/<name>, which reads them with the store's key.
 * The file name is random and never changes, so the address can be cached for a year.
 */
const { put, get, del } = require('@vercel/blob');
const { uid } = require('./auth');

const URL_PREFIX = '/api/images?file=';
const FOLDERS = ['site-images', 'logos', 'gallery', 'tours', 'stays', 'blog', 'partners', 'panos', 'models'];
const NAME_RE = new RegExp('^(' + FOLDERS.join('|') + ')/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(jpg|png|webp|gif|svg)$');
const TYPES = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml' };

const urlFor = pathname => URL_PREFIX + pathname;
/* the stored file path behind one of our photo addresses, or '' when it is not one */
function pathOf(url) {
  const s = String(url || '');
  const i = s.indexOf(URL_PREFIX);
  if (i === -1) return '';
  let p = s.slice(i + URL_PREFIX.length).split(/[&#]/)[0];
  try { p = decodeURIComponent(p); } catch (e) { return ''; }
  return NAME_RE.test(p) ? p : '';
}

async function save(folder, ext, buffer, contentType) {
  const pathname = folder + '/' + uid() + '.' + ext;
  await put(pathname, buffer, { access: 'private', contentType: contentType || TYPES[ext] || 'application/octet-stream', addRandomSuffix: false, allowOverwrite: false });
  return { pathname, url: urlFor(pathname) };
}

async function remove(urlOrPath) {
  const p = pathOf(urlOrPath) || String(urlOrPath || '');
  if (!p) return false;
  try { await del(p); return true; } catch (e) { return false; }
}

/* GET /api/images?file=<folder>/<name>: anyone may view a site photo */
async function serve(file, res) {
  const name = String(file || '');
  if (!NAME_RE.test(name)) return res.status(404).json({ error: 'Not found' });
  let r = null;
  try { r = await get(name, { access: 'private', useCache: false }); } catch (e) { r = null; }
  if (!r || r.statusCode !== 200 || !r.stream) return res.status(404).json({ error: 'Not found' });
  const buf = Buffer.from(await new Response(r.stream).arrayBuffer());
  const ext = name.split('.').pop();
  res.setHeader('Content-Type', TYPES[ext]);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  /* a picture file must never run script: an SVG is shown as a picture only */
  res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox");
  res.setHeader('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable');
  return res.status(200).end(buf);
}

module.exports = { save, remove, serve, pathOf, urlFor, URL_PREFIX, FOLDERS, NAME_RE };
