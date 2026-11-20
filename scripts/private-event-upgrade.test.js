/* An unedited Summit Challenge is brought up to the current wording, and one the owner edited is left alone.  Run with:  npm run test:private */
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
  const db = require(root + 'api/_lib/db');
  const seed = require(root + 'api/_lib/club-seed');
  const v1 = seed.SEEDS[0].previous[0];
  const base = { id: 'old1', createdAt: '2026-11-20T10:00:00Z', applicationId: null, slug: 'the-summit-challenge', title: 'The Summit Challenge', status: 'open', dateText: 'TBA, date to be announced', seatsTotal: 10, privateEvent: true, organizerName: 'Sight Seers Caribbean Adventures', showOrganizer: true };
  /* a copy created with the first wording and no record of it (as the first release left it) */
  await db.addToCollection('club-trips', Object.assign({}, base, v1));
  await db.setDoc('club-seeds', { done: ['summit-challenge'] });
  let r = await call('trips', 'GET', '/api/trips');
  let t = r.body.trips.find(x => x.slug === 'the-summit-challenge');
  ok('an unedited copy gets the richer wording', t && /turns a day out into a team sport/.test(t.description.join(' ')) && /Six scored team challenges/.test(t.included[0]));
  ok('the place, seats and leader are untouched', t.private === true && t.seats.total === 10 && t.destination === '' && t.organizer.name === 'Sight Seers Caribbean Adventures');
  /* the owner edits the text: a later upgrade must not overwrite it */
  const owner = (await call('auth', 'POST', '/api/auth', { action: 'signin', email: 'owner@example.com', password: 'OwnerPass123!' })).body.token;
  r = await call('trips', 'GET', '/api/trips?admin=1', null, owner);
  const cur = r.body.trips.find(x => x.slug === 'the-summit-challenge');
  r = await call('trips', 'POST', '/api/trips', { action: 'trip-save', id: cur.id, title: cur.title, slug: cur.slug, status: 'open', summary: cur.summary, description: 'My own words.', dateText: cur.dateText, included: cur.included.join('\n'), seatsTotal: 10, privateEvent: true, organizerName: cur.organizerName, showOrganizer: true }, owner);
  ok('the owner can save an edit', r.code === 200, JSON.stringify(r.body));
  seed.SEEDS[0].rev = 3; seed.resetForTests();
  r = await call('trips', 'GET', '/api/trips');
  t = r.body.trips.find(x => x.slug === 'the-summit-challenge');
  ok('an edited description is left alone', t && t.description.join(' ') === 'My own words.');
  console.log(fails ? '\n' + fails + ' FAILED' : '\nALL PASSED');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
