/* Verified traveller badge: earned after a finished confirmed booking or Travel Club trip, never for upcoming, pending or cancelled ones. Run with:  npm run test:verified */
const Module = require('module');
const store = new Map();
const blob = { put: async (p, b) => { store.set(p, Buffer.from(b)); return {}; }, get: async p => store.has(p) ? { statusCode: 200, stream: new Response(store.get(p)).body } : { statusCode: 404 }, del: async p => { store.delete(p); }, list: async () => ({ blobs: [] }) };
const o = Module._load; Module._load = function (r, ...a) { return r === '@vercel/blob' ? blob : o.call(this, r, ...a); };
Object.assign(process.env, { BLOB_READ_WRITE_TOKEN: 'x', JWT_SECRET: 'test-secret-test-secret-test-secret-12345', OWNER_EMAIL: 'owner@example.com', OWNER_PASSWORD: 'OwnerPass123!', RESEND_API_KEY: 'rk_test', BUSINESS_EMAIL: 'office@example.com' });
const sent = [];
global.fetch = async (url, opts) => { if (String(url).includes('resend.com')) { sent.push(JSON.parse(opts.body)); return { ok: true, status: 200, json: async () => ({ id: 'e' + sent.length }) }; } throw new Error('no network in tests: ' + url); };
const root = require('path').resolve(__dirname, '..') + '/';
const db = require(root + 'api/_lib/db');
const verified = require(root + 'api/_lib/verified');
const auth = require(root + 'api/_handlers/auth');
let fails = 0; const ok = (name, cond) => { console.log((cond ? 'PASS ' : 'FAIL ') + name); if (!cond) fails++; };
const NOW = new Date('2027-06-10T14:00:00Z');
const day = d => new Date(NOW.getTime() + d * 86400000).toISOString().slice(0, 10);
function call(body, token) {
  return new Promise(r => {
    const res = { headers: {}, status(c) { this.code = c; return this; }, json(x) { r({ code: this.code, body: x }); }, end(x) { r({ code: this.code, body: x }); }, setHeader() {} };
    auth({ method: 'POST', url: '/api/auth', query: {}, headers: { host: 'x', 'x-forwarded-for': '10.3.0.1', ...(token ? { authorization: 'Bearer ' + token } : {}) }, body }, res);
  });
}
(async () => {
  const u = (id, email) => ({ id, email, name: id });
  await db.setCollection('bookings', [
    { id: 'a', userId: 'u1', email: 'one@example.com', status: 'confirmed', date: day(-5), endDate: day(-3) },
    { id: 'b', userId: 'u2', email: 'two@example.com', status: 'confirmed', date: day(5) },
    { id: 'c', userId: 'u3', email: 'three@example.com', status: 'pending', date: day(-9) },
    { id: 'd', userId: 'u4', email: 'four@example.com', status: 'cancelled', date: day(-9) },
    { id: 'e', userId: null, email: 'FIVE@example.com', status: 'completed', date: day(-1) },
    { id: 'f', userId: 'u6', email: 'six@example.com', status: 'confirmed', date: day(0), endDate: day(0) }
  ]);
  await db.setCollection('club-trips', [{ id: 't1', startDate: day(-20), endDate: day(-15) }, { id: 't2', startDate: day(20), endDate: day(25) }]);
  await db.setCollection('club-interests', [
    { id: 'i1', tripId: 't1', email: 'club@example.com', status: 'confirmed' },
    { id: 'i2', tripId: 't2', email: 'later@example.com', status: 'confirmed' },
    { id: 'i3', tripId: 't1', email: 'wait@example.com', status: 'waitlist' }
  ]);
  let r = await verified.statusFor(u('u1', 'one@example.com'), NOW);
  ok('a finished confirmed booking earns the badge', r.verifiedTraveller && r.tripsCompleted === 1 && r.firstTripOn === day(-3));
  ok('an upcoming booking does not', !(await verified.statusFor(u('u2', 'two@example.com'), NOW)).verifiedTraveller);
  ok('a pending booking does not', !(await verified.statusFor(u('u3', 'three@example.com'), NOW)).verifiedTraveller);
  ok('a cancelled booking does not', !(await verified.statusFor(u('u4', 'four@example.com'), NOW)).verifiedTraveller);
  ok('a booking the team marked completed counts, matched by email', (await verified.statusFor(u('u5', 'five@example.com'), NOW)).verifiedTraveller);
  ok('a trip that ends today has not finished yet', !(await verified.statusFor(u('u6', 'six@example.com'), NOW)).verifiedTraveller);
  ok('a finished Travel Club trip counts', (await verified.statusFor(u('u7', 'club@example.com'), NOW)).verifiedTraveller);
  ok('an upcoming Travel Club trip and a waitlist spot do not', !(await verified.statusFor(u('u8', 'later@example.com'), NOW)).verifiedTraveller && !(await verified.statusFor(u('u9', 'wait@example.com'), NOW)).verifiedTraveller);
  const house = await verified.statusFor(u('h1', 'info@sightseerscaribbean.com'), NOW);
  ok("Sight Seers' own account is verified and starts at 250 points (Voyager)", house.verifiedTraveller && house.pointsFloor === 250);
  ok('an ordinary account has no points floor', (await verified.statusFor(u('u1', 'one@example.com'), NOW)).pointsFloor === 0);
  ok('no account, no badge', !(await verified.statusFor(null, NOW)).verifiedTraveller);

  /* the sign-in and "me" answers carry it */
  /* the handler uses the real clock, so give this person a trip that finished before today */
  const real = new Date(Date.now() - 10 * 86400000).toISOString().slice(0, 10);
  await db.addToCollection('club-trips', { id: 't3', startDate: real, endDate: real });
  await db.addToCollection('club-interests', { id: 'i4', tripId: 't3', email: 'club@example.com', status: 'booked' });
  const signup = await call({ action: 'signup', name: 'Cara Club', email: 'club@example.com', password: 'Passw0rd!x1' });
  const tok = signup.body && signup.body.token;
  ok('an account for that email can be created', !!tok);
  const me = await call({ action: 'me' }, tok);
  ok('the account answer says verified, with a trip count', me.code === 200 && me.body.user.verifiedTraveller === true && me.body.user.tripsCompleted >= 1);
  console.log(fails ? '\n' + fails + ' FAILED' : '\nALL PASSED');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
