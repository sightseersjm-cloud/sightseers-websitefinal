/* When the website's storage is suspended, the API must still answer in JSON with a plain message.
   Run with:  npm run test:paused */
const Module = require('module');
class Suspended extends Error { constructor() { super('Vercel Blob: This store has been suspended.'); this.name = 'BlobStoreSuspendedError'; } }
const blob = { put: async () => { throw new Suspended(); }, get: async () => { throw new Suspended(); }, del: async () => { throw new Suspended(); }, list: async () => { throw new Suspended(); } };
const o = Module._load; Module._load = function (r, ...a) { return r === '@vercel/blob' ? blob : o.call(this, r, ...a); };
process.env.BLOB_READ_WRITE_TOKEN = 'x'; process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-12345'; process.env.OWNER_EMAIL = 'owner@example.com'; process.env.OWNER_PASSWORD = 'OwnerPass123!';
const router = require(require('path').resolve(__dirname, '..') + '/api/[...route].js');
function call(url, body) { return new Promise(r => { const res = { headers: {}, status(c) { this.code = c; return this; }, json(x) { r({ code: this.code, body: x }); }, end(x) { r({ code: this.code, body: x }); }, setHeader() {} }; router({ method: 'POST', url, headers: { host: 'x', 'x-forwarded-for': '9.9.9.9' }, body, query: {} }, res); }); }
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  ' + x : '')); if (!c) fails++; };
(async () => {
  const r = await call('/api/auth', { action: 'signin', email: 'owner@example.com', password: 'OwnerPass123!' });
  ok('sign-in answers in JSON when storage is paused (not a crash)', r.code === 503 && r.body && /storage is paused/i.test(r.body.error) && r.body.code === 'storage-paused', JSON.stringify(r));
  const r2 = await call('/api/contact', { action: 'send', name: 'A', email: 'a@example.com', message: 'hello there' });
  ok('a contact form answers in JSON too', r2.body && typeof r2.body.error === 'string', JSON.stringify(r2).slice(0, 160));
  console.log(fails ? '\n' + fails + ' FAILED' : '\nALL PASSED'); process.exit(fails ? 1 : 0);
})();
