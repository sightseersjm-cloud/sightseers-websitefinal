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
  ok('it is led by Sight Seers Caribbean Adventures, with no other leader names', t && t.organizer && t.organizer.name === 'Sight Seers Caribbean Adventures' && !t.organizer.coName && !/stout|ashley/i.test(JSON.stringify(t)));
  ok('no organizer reward line is shown for it', t && t.led === false);
  ok('it has its date, a Day by day entry, and no price is made up', t && t.priceText === '' && t.startDate === '2026-12-10' && t.dateText === 'December 10, 2026' && t.itinerary.length === 1);
  ok('what to bring reaches the trip page', t && t.arrival && /water bottle/.test(t.arrival.bring));
  ok('the public text never names the place', !/mandeville|st\.? elizabeth/i.test(JSON.stringify(r.body)));
  ok('the public text has no client names or prices', !/rohane|kurt|J\$|167,300|SS-2026/i.test(JSON.stringify(r.body)));
  r = await call('trips', 'GET', '/api/trips?slug=the-summit-challenge');
  ok('its own page loads', r.code === 200 && r.body.trip.private === true && r.body.trip.destination === '');
  r = await call('trips', 'GET', '/api/trips?admin=1', null, owner);
  const adm = (r.body.trips || []).find(x => x.slug === 'the-summit-challenge');
  ok('the owner still sees the stored place and can edit it', r.code === 200 && adm && adm.country === 'Jamaica' && adm.privateEvent === true);
  /* people join, the owner confirms them, and they appear on the roster with the columns the owner fills in */
  r = await call('trips', 'POST', '/api/trips', { action: 'interest', name: 'Ada Brown', email: 'ada@example.com', phone: '+1 876 555 0101', consent: true, tripSlug: 'the-summit-challenge', password: 'Summit2026pass' });
  ok('a guest can ask for a place on the Summit Challenge', r.code === 200 && r.body.ok && r.body.ref, JSON.stringify(r.body));
  r = await call('trips', 'POST', '/api/trips', { action: 'interest', name: 'Ada Brown', email: 'ada@example.com', consent: true, tripSlug: 'the-summit-challenge', password: 'Summit2026pass' });
  ok('asking twice does not add her twice', r.code === 200 && r.body.already === true);
  r = await call('trips', 'POST', '/api/trips', { action: 'interest', name: 'Ben Clarke', email: 'ben@example.com', consent: true, tripSlug: 'the-summit-challenge', password: 'Summit2026pass' });
  r = await call('trips', 'GET', '/api/trips');
  ok('a request alone does not take a place', r.body.trips.find(x => x.slug === 'the-summit-challenge').seats.left === 10);
  r = await call('trips', 'GET', '/api/trips?admin=1', null, owner);
  const reqs = r.body.interests.filter(i => i.tripSlug === 'the-summit-challenge');
  ok('the owner sees both requests as new', reqs.length === 2 && reqs.every(i => i.status === 'new'));
  const ada = reqs.find(i => i.email === 'ada@example.com');
  r = await call('trips', 'POST', '/api/trips', { action: 'interest-update', id: ada.id, status: 'confirmed', note: '', shirtSize: 'M', formsDone: true, notify: false }, owner);
  ok('the owner confirms her and records her shirt size and forms', r.code === 200 && r.body.interest.status === 'confirmed' && r.body.interest.shirtSize === 'M' && r.body.interest.formsDone === true);
  r = await call('trips', 'GET', '/api/trips');
  ok('a confirmed person takes a place', r.body.trips.find(x => x.slug === 'the-summit-challenge').seats.left === 9);
  const ben = reqs.find(i => i.email === 'ben@example.com');
  r = await call('trips', 'POST', '/api/trips', { action: 'interest-update', id: ben.id, status: 'confirmed', note: '', notify: false }, owner);
  ok('saving without the roster columns keeps what was there', r.code === 200 && r.body.interest.shirtSize === undefined);
  r = await call('trips', 'POST', '/api/trips', { action: 'interest-update', id: ada.id, status: 'confirmed', note: 'paid', notify: false }, owner);
  ok('and does not clear them', r.body.interest.shirtSize === 'M' && r.body.interest.formsDone === true);
  r = await call('trips', 'GET', '/api/trips?admin=1', null, owner);
  const roster = r.body.interests.filter(i => i.tripSlug === 'the-summit-challenge' && (i.status === 'confirmed' || i.status === 'booked'));
  ok('the roster is the confirmed people, with their details', roster.length === 2 && roster.some(i => i.name === 'Ada Brown' && i.phone && i.shirtSize === 'M' && i.formsDone));
  ok('nobody can read the roster without the owner sign-in', (await call('trips', 'GET', '/api/trips?admin=1')).code === 401);
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
  ok('a trip with requests is not deleted by accident', r.code === 409);
  r = await call('trips', 'POST', '/api/trips', { action: 'trip-delete', id: summit, force: true }, owner);
  ok('the owner can delete it', r.code === 200);
  require(root + 'api/_lib/club-seed').resetForTests();
  r = await call('trips', 'GET', '/api/trips');
  ok('a deleted event is not added again', !(r.body.trips || []).some(x => x.slug === 'the-summit-challenge'));
  console.log(fails ? '\n' + fails + ' FAILED' : '\nALL PASSED');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
