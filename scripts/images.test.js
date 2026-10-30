/* Photos uploaded from the admin must work on a PRIVATE Blob store: they are saved privately and shown through /api/images?file=...
   Runs the real handlers against an in-memory store that refuses public access, as the live store does.
   Run with:  npm run test:images */
const Module = require('module');
const store = new Map();
const blob = {
  put: async (p, b, o) => { if (!o || o.access !== 'private') throw new Error('Vercel Blob: Cannot use public access on a private store. The store is configured with private access.'); store.set(p, { body: Buffer.from(b), type: o.contentType }); return { pathname: p, url: 'https://private.blob.test/' + p, downloadUrl: 'https://private.blob.test/' + p + '?download=1' }; },
  get: async p => store.has(p) ? { statusCode: 200, stream: new Response(store.get(p).body).body } : { statusCode: 404 },
  del: async p => { store.delete(String(p).replace('https://private.blob.test/', '')); },
  list: async ({ prefix }) => ({ blobs: [...store.keys()].filter(k => k.startsWith(prefix || '')).map(k => ({ url: 'https://private.blob.test/' + k, downloadUrl: 'https://private.blob.test/' + k + '?download=1', pathname: k, size: store.get(k).body.length, uploadedAt: '2026-10-30T00:00:00.000Z' })) })
};
const o = Module._load; Module._load = function (r, ...a) { return r === '@vercel/blob' ? blob : o.call(this, r, ...a); };
process.env.BLOB_READ_WRITE_TOKEN = 'x'; process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-12345';
process.env.OWNER_EMAIL = 'owner@example.com'; process.env.OWNER_PASSWORD = 'OwnerPass123!';
delete process.env.ADMIN_PASSCODE; delete process.env.RESEND_API_KEY;
const root = require('path').resolve(__dirname, '..') + '/';
const H = { auth: require(root + 'api/_handlers/auth'), images: require(root + 'api/_handlers/images'), backup: require(root + 'api/_handlers/backup'), settings: require(root + 'api/_handlers/settings') };
const siteImages = require(root + 'api/_lib/siteImages');
function call(h, method, url, body, token, query) {
  return new Promise(r => {
    const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(c) { this.code = c; return this; }, json(x) { r({ code: this.code, body: x, headers: this.headers }); }, end(x) { r({ code: this.code, body: x, headers: this.headers }); }, send(x) { r({ code: this.code, body: x, headers: this.headers }); } };
    H[h]({ method, url, headers: { host: 'www.sightseerscaribbean.com', 'x-forwarded-for': '9.9.9.9', ...(token ? { authorization: 'Bearer ' + token } : {}) }, body: body || {}, query: query || {} }, res);
  });
}
let fails = 0; const ok = (name, cond, extra) => { console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); if (!cond) fails++; };
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/pLvAAAAAElFTkSuQmCC';

(async () => {
  let r = await call('auth', 'POST', '/api/auth', { action: 'signin', email: 'owner@example.com', password: 'OwnerPass123!' }); const owner = r.body.token;
  r = await call('images', 'POST', '/api/images', { action: 'upload', filename: 'beach.png', data: PNG, folder: 'gallery' }, owner);
  ok('an upload works on a private store', r.code === 200 && r.body.ok, JSON.stringify(r.body).slice(0, 120));
  const url = r.body.url;
  ok('the photo gets an address on this site', /^\/api\/images\?file=gallery\/[0-9a-f-]{36}\.png$/.test(url), url);
  ok('the file is stored privately', [...store.keys()].some(k => k.startsWith('gallery/')));
  const file = decodeURIComponent(url.split('file=')[1]);
  let g = await call('images', 'GET', url, {}, null, { file });
  ok('anyone can open the photo through that address', g.code === 200 && g.headers['Content-Type'] === 'image/png' && Buffer.isBuffer(g.body) && g.body.length > 20);
  ok('it is cached for a year and cannot run script', /immutable/.test(g.headers['Cache-Control']) && /sandbox/.test(g.headers['Content-Security-Policy']));
  g = await call('images', 'GET', '/api/images?file=../ss-admin/settings.json', {}, null, { file: '../ss-admin/settings.json' });
  ok('other stored files cannot be read through it', g.code === 404);
  g = await call('images', 'GET', '/api/images', {}, null, { folder: 'gallery' });
  ok('the photo library lists it with the same address', g.code === 200 && g.body.images.some(x => x.url === url));
  ok('a visitor cannot upload', (await call('images', 'POST', '/api/images', { action: 'upload', filename: 'x.png', data: PNG }, null)).code === 401);
  const bad = await call('images', 'POST', '/api/images', { action: 'upload', filename: 'x.pdf', data: 'AAAA', type: 'application/pdf' }, owner);
  ok('an unsupported type is refused', bad.code === 400);
  // an SVG is served as a picture only
  const svg = 'data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>').toString('base64');
  r = await call('images', 'POST', '/api/images', { action: 'upload', filename: 'a.svg', data: svg, folder: 'logos' }, owner);
  const sf = decodeURIComponent(r.body.url.split('file=')[1]);
  g = await call('images', 'GET', r.body.url, {}, null, { file: sf });
  ok('an svg is served with a sandbox so its script cannot run', g.code === 200 && /sandbox/.test(g.headers['Content-Security-Policy']));
  // delete by the new address
  r = await call('images', 'POST', '/api/images', { action: 'delete', url }, owner);
  ok('a photo can be deleted by its address', r.code === 200 && ![...store.keys()].includes(file));
  // lighten: photos inside the settings move to files of their own, privately
  ok('the address helper reads back the path', siteImages.pathOf('/api/images?file=blog/11111111-2222-3333-4444-555555555555.jpg') === 'blog/11111111-2222-3333-4444-555555555555.jpg' && siteImages.pathOf('https://x.test/a.jpg') === '');
  console.log(fails ? '\n' + fails + ' FAILED' : '\nALL PASSED');
  process.exit(fails ? 1 : 0);
})();
