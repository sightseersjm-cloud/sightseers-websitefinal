/* Visitor numbers: what is counted, what is not. Run with:  npm run test:visits */
const Module = require('module');
const store = new Map();
const blob = { put: async (p, b) => { store.set(p, Buffer.from(b)); return {}; }, get: async p => store.has(p) ? { statusCode: 200, stream: new Response(store.get(p)).body } : { statusCode: 404 }, del: async p => { store.delete(p); }, list: async () => ({ blobs: [] }) };
const o = Module._load; Module._load = function (r, ...a) { return r === '@vercel/blob' ? blob : o.call(this, r, ...a); };
process.env.BLOB_READ_WRITE_TOKEN = 'x'; process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-12345'; process.env.OWNER_EMAIL = 'owner@example.com'; process.env.OWNER_PASSWORD = 'OwnerPass123!';
const root = require('path').resolve(__dirname, '..') + '/';
const H = { auth: require(root + 'api/_handlers/auth'), track: require(root + 'api/_handlers/track') };
function call(h, method, body, token, headers, query) {
  return new Promise(r => { const res = { headers: {}, status(c) { this.code = c; return this; }, json(x) { r({ code: this.code, body: x }); }, end(x) { r({ code: this.code, body: x }); }, setHeader() {} };
    H[h]({ method, url: '/api/' + h, headers: Object.assign({ host: 'x', 'x-forwarded-for': '9.9.9.9' }, token ? { authorization: 'Bearer ' + token } : {}, headers || {}), body: body || {}, query: query || {} }, res); });
}
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  ' + x : '')); if (!c) fails++; };
(async () => {
  const human = { 'user-agent': 'Mozilla/5.0 (iPhone) Safari', 'x-vercel-ip-country': 'us' };
  await call('track', 'POST', { events: [{ e: 'site_view', k: 'home' }, { e: 'site_visit' }, { e: 'site_ref', k: 'google.com' }, { e: 'site_dev', k: 'phone' }, { e: 'site_view', k: 'tours' }] }, null, human);
  await call('track', 'POST', { events: [{ e: 'site_view', k: 'home' }] }, null, human);
  await call('track', 'POST', { events: [{ e: 'site_view', k: 'home' }, { e: 'site_visit' }] }, null, { 'user-agent': 'Googlebot/2.1', 'x-vercel-ip-country': 'US' });
  await call('track', 'POST', { events: [{ e: 'site_ctry', k: 'ZZ' }, { e: 'evil', k: 'x' }, { e: 'site_view', k: '<b>x</b>' }] }, null, human);
  const r = await call('auth', 'POST', { action: 'signin', email: 'owner@example.com', password: 'OwnerPass123!' });
  const t = (await call('track', 'GET', {}, r.body.token, null, { days: '7' })).body.totals;
  ok('page views are counted per page', t['site_view|home'] === 2 && t['site_view|tours'] === 1, JSON.stringify(t));
  ok('a visit is counted once', t['site_visit'] === 1);
  ok('where it came from and the device are counted', t['site_ref|google.com'] === 1 && t['site_dev|phone'] === 1);
  ok('the country comes from the network edge', t['site_ctry|US'] === 1);
  ok('robots are not counted', t['site_view|home'] === 2 && t['site_visit'] === 1);
  ok('a browser cannot claim a country', !t['site_ctry|ZZ']);
  ok('unknown events are ignored', !Object.keys(t).some(k => k.startsWith('evil')));
  ok('markup in a key is stripped', !Object.keys(t).some(k => /[<>]/.test(k)));
  ok('only signed-in people see the numbers', (await call('track', 'GET', {}, null, null, { days: '7' })).code === 401);
  console.log(fails ? '\n' + fails + ' FAILED' : '\nALL PASSED'); process.exit(fails ? 1 : 0);
})();
