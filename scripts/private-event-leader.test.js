/* The Summit Challenge takes its leader from the Legend Escape Weekend trip, so the same account runs both.  Run with:  npm run test:private */
const Module = require('module');
const store = new Map();
const blob = { put: async (p, b) => { store.set(p, Buffer.from(b)); return {}; }, get: async p => store.has(p) ? { statusCode: 200, stream: new Response(store.get(p)).body } : { statusCode: 404 }, del: async p => { store.delete(p); }, list: async () => ({ blobs: [] }) };
const o = Module._load; Module._load = function (r, ...a) { return r === '@vercel/blob' ? blob : o.call(this, r, ...a); };
Object.assign(process.env, { BLOB_READ_WRITE_TOKEN: 'x', JWT_SECRET: 'test-secret-test-secret-test-secret-12345', OWNER_EMAIL: 'owner@example.com', OWNER_PASSWORD: 'OwnerPass123!', RESEND_API_KEY: 'rk_test', BUSINESS_EMAIL: 'office@example.com' });
const sent = [];
global.fetch = async (url, opts) => { if (String(url).includes('resend.com')) { sent.push(JSON.parse(opts.body)); return { ok: true, status: 200, json: async () => ({ id: 'e' + sent.length }) }; } throw new Error('no network in tests: ' + url); };
const root = require('path').resolve(__dirname, '..') + '/';
const H = { auth: require(root + 'api/_handlers/auth'), trips: require(root + 'api/_handlers/trips') };
let n = 0;
function call(h, method, url, body, token) {
  return new Promise(r => {
    const res = { headers: {}, status(c) { this.code = c; return this; }, json(x) { r({ code: this.code, body: x }); }, end(x) { r({ code: this.code, body: x }); }, setHeader() {} };
    const q = Object.fromEntries(new URL('http://x' + url).searchParams);
    H[h]({ method, url, query: q, headers: { host: 'www.sightseerscaribbean.com', 'x-forwarded-for': '10.0.0.' + (++n % 250), ...(token ? { authorization: 'Bearer ' + token } : {}) }, body: body || {} }, res);
  });
}
let fails = 0; const ok = (name, cond, extra) => { console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); if (!cond) fails++; };
const mailsTo = addr => sent.filter(m => (m.to || []).includes(addr));
const post = (b, t) => call('trips', 'POST', '/api/trips', b, t);

(async () => {
  const owner = (await call('auth', 'POST', '/api/auth', { action: 'signin', email: 'owner@example.com', password: 'OwnerPass123!' })).body.token;
  const lead = (await call('auth', 'POST', '/api/auth', { action: 'signup', name: 'Sight Seers Crew', email: 'crew@example.com', password: 'Leader12345!' })).body.token;
  let r = await call('trips', 'POST', '/api/trips', { action: 'trip-save', title: 'Legend Escape Weekend: Jamaica', slug: 'legend-escape-weekend-jamaica', status: 'open', summary: 'A weekend.', dateText: 'April 9-11, 2027', destination: 'Jamaica', country: 'Jamaica', seatsTotal: 30, organizerName: 'Sight Seers Crew', organizerEmail: 'crew@example.com', organizerCommunity: 'Sight Seers', showOrganizer: false }, owner);
  ok('the Legend Escape Weekend trip exists with its leader', r.code === 200, r.body.error);
  r = await call('trips', 'GET', '/api/trips');
  const t = r.body.trips.find(x => x.slug === 'the-summit-challenge');
  ok('the Summit Challenge shows the same leader', t && t.organizer && t.organizer.name === 'Sight Seers Crew');
  r = await call('trips', 'GET', '/api/trips?admin=1', null, owner);
  const adm = r.body.trips.find(x => x.slug === 'the-summit-challenge');
  ok('it is stored with the same leader account details', adm && adm.organizerEmail === 'crew@example.com' && adm.organizerName === 'Sight Seers Crew');
  r = await call('trips', 'GET', '/api/trips?mine=1', null, lead);
  ok('that account sees both trips as ones they lead', r.code === 200 && (r.body.trips || []).some(x => x.slug === 'the-summit-challenge') && (r.body.trips || []).some(x => x.slug === 'legend-escape-weekend-jamaica'));
  ok('the place is still hidden and there is still no reward line', t.private === true && t.destination === '' && t.led === false);
  console.log(fails ? '\n' + fails + ' FAILED' : '\nALL PASSED');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
