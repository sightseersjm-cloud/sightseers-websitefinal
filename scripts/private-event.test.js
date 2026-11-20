/* The private Summit Challenge event: it ships with the site, shows in the departures with 10 places and its leaders, and the
   location is never public. Runs the real handlers against an in-memory store.  Run with:  npm run test:private */
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
  let r = await call('trips', 'GET', '/api/trips');
  const t = (r.body.trips || []).find(x => x.slug === 'the-summit-challenge');
  ok('the Summit Challenge is in the departures list', r.code === 200 && !!t);
  ok('it is a private event with ten places', t && t.private === true && t.seats && t.seats.total === 10 && t.seats.left === 10);
  ok('the place is not shown to the public', t && t.destination === '' && t.country === '');
  ok('the leaders are K. Stout and R. Ashley', t && t.organizer && t.organizer.name === 'K. Stout & R. Ashley' && t.organizer.mainName === 'K. Stout' && t.organizer.coName === 'R. Ashley');
  ok('no organizer reward line is shown for it', t && t.led === false);
  ok('no price and no dates are made up', t && t.priceText === '' && t.startDate === '' && /TBA/.test(t.dateText));
  ok('what to bring reaches the trip page', t && t.arrival && /water bottle/.test(t.arrival.bring));
  ok('the public text never names the place', !/mandeville|st\.? elizabeth/i.test(JSON.stringify(r.body)));
  ok('the public text has no client names or prices', !/rohane|kurt|J\$|167,300|SS-2026/i.test(JSON.stringify(r.body)));
  r = await call('trips', 'GET', '/api/trips?slug=the-summit-challenge');
  ok('its own page loads', r.code === 200 && r.body.trip.private === true && r.body.trip.destination === '');
  r = await call('trips', 'GET', '/api/trips?admin=1', null, owner);
  const adm = (r.body.trips || []).find(x => x.slug === 'the-summit-challenge');
  ok('the owner still sees the stored place and can edit it', r.code === 200 && adm && adm.country === 'Jamaica' && adm.privateEvent === true);
  /* a normal trip shows its place; turning private on hides it and turning it off brings it back */
  r = await call('trips', 'POST', '/api/trips', { action: 'trip-save', title: 'Negril Weekend', slug: 'negril-weekend', status: 'open', summary: 'A weekend.', dateText: 'May 2027', destination: 'Negril', country: 'Jamaica', seatsTotal: 12 }, owner);
  const id = r.body.trip.id;
  r = await call('trips', 'GET', '/api/trips');
  let n = r.body.trips.find(x => x.slug === 'negril-weekend');
  ok('a normal trip shows its place', n && n.destination === 'Negril' && n.country === 'Jamaica' && n.private === false);
  await call('trips', 'POST', '/api/trips', { action: 'trip-save', id, title: 'Negril Weekend', slug: 'negril-weekend', status: 'open', summary: 'A weekend.', dateText: 'May 2027', destination: 'Negril', country: 'Jamaica', seatsTotal: 12, privateEvent: true }, owner);
  r = await call('trips', 'GET', '/api/trips'); n = r.body.trips.find(x => x.slug === 'negril-weekend');
  ok('turning on private hides the place', n && n.private === true && n.destination === '' && n.country === '');
  await call('trips', 'POST', '/api/trips', { action: 'trip-save', id, title: 'Negril Weekend', slug: 'negril-weekend', status: 'open', summary: 'A weekend.', dateText: 'May 2027', destination: 'Negril', country: 'Jamaica', seatsTotal: 12 }, owner);
  r = await call('trips', 'GET', '/api/trips'); n = r.body.trips.find(x => x.slug === 'negril-weekend');
  ok('saving without the setting keeps it private', n && n.private === true);
  await call('trips', 'POST', '/api/trips', { action: 'trip-save', id, title: 'Negril Weekend', slug: 'negril-weekend', status: 'open', summary: 'A weekend.', dateText: 'May 2027', destination: 'Negril', country: 'Jamaica', seatsTotal: 12, privateEvent: false }, owner);
  r = await call('trips', 'GET', '/api/trips'); n = r.body.trips.find(x => x.slug === 'negril-weekend');
  ok('turning it off brings the place back', n && n.private === false && n.destination === 'Negril');
  /* deleting the event: it is not put back */
  const summit = adm.id;
  r = await call('trips', 'POST', '/api/trips', { action: 'trip-delete', id: summit }, owner);
  ok('the owner can delete it', r.code === 200);
  require(root + 'api/_lib/club-seed').resetForTests();
  r = await call('trips', 'GET', '/api/trips');
  ok('a deleted event is not added again', !(r.body.trips || []).some(x => x.slug === 'the-summit-challenge'));
  console.log(fails ? '\n' + fails + ' FAILED' : '\nALL PASSED');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
