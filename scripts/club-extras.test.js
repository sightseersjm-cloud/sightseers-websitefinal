/* Travel Club extras: reviews (only after a finished trip, approved before shown), referrals (cookie link, reward after the friend travels) and the stamp book. Run with:  npm run test:club-extras */
const Module = require('module');
const store = new Map();
const blob = { put: async (p, b) => { store.set(p, Buffer.from(b)); return {}; }, get: async p => store.has(p) ? { statusCode: 200, stream: new Response(store.get(p)).body } : { statusCode: 404 }, del: async p => { store.delete(p); }, list: async () => ({ blobs: [] }) };
const o = Module._load; Module._load = function (r, ...a) { return r === '@vercel/blob' ? blob : o.call(this, r, ...a); };
Object.assign(process.env, { BLOB_READ_WRITE_TOKEN: 'x', JWT_SECRET: 'test-secret-test-secret-test-secret-12345', OWNER_EMAIL: 'owner@example.com', OWNER_PASSWORD: 'OwnerPass123!', RESEND_API_KEY: 'rk_test', BUSINESS_EMAIL: 'office@example.com' });
const sent = [];
global.fetch = async (url, opts) => { if (String(url).includes('resend.com')) { sent.push(JSON.parse(opts.body)); return { ok: true, status: 200, json: async () => ({ id: 'e' + sent.length }) }; } throw new Error('no network in tests: ' + url); };
const root = require('path').resolve(__dirname, '..') + '/';
const db = require(root + 'api/_lib/db');
const ops = require(root + 'api/_lib/ops-auto');
const member = require(root + 'api/_lib/member');
const H = { bookings: require(root + 'api/_handlers/bookings'), trips: require(root + 'api/_handlers/trips'), auth: require(root + 'api/_handlers/auth'), reviews: require(root + 'api/_handlers/reviews'), member: require(root + 'api/_handlers/member') };
let fails = 0, n = 0; const ok = (name, cond) => { console.log((cond ? 'PASS ' : 'FAIL ') + name); if (!cond) fails++; };
function call(h, method, body, token, query, headers) {
  return new Promise(r => {
    const res = { headers: {}, status(c) { this.code = c; return this; }, json(x) { r({ code: this.code, body: x }); }, end(x) { r({ code: this.code, body: x }); }, setHeader() {} };
    H[h]({ method, url: '/api/' + h, query: query || {}, headers: Object.assign({ host: 'x', 'x-forwarded-for': '10.6.0.' + (++n % 250) }, token ? { authorization: 'Bearer ' + token } : {}, headers || {}), body: body || {} }, res);
  });
}
const day = d => new Date(Date.now() + d * 86400000).toISOString().slice(0, 10);
const signup = async (name, email, headers) => (await call('auth', 'POST', { action: 'signup', name, email, password: 'Passw0rd!x1' }, null, null, headers)).body;
(async () => {
  const owner = (await call('auth', 'POST', { action: 'signin', email: 'owner@example.com', password: 'OwnerPass123!' })).body.token;

  /* two travellers: Cara has a finished booking and a finished Travel Club trip; Zed has only an upcoming booking */
  const cara = await signup('Cara Club', 'cara@example.com'), zed = await signup('Zed Later', 'zed@example.com');
  await db.setCollection('bookings', [
    { id: 'b1', userId: cara.user.id, email: 'cara@example.com', tourName: 'Blue Hole Escape', status: 'confirmed', date: day(-9), endDate: day(-7), createdAt: new Date().toISOString() },
    { id: 'b2', userId: zed.user.id, email: 'zed@example.com', tourName: 'Rafting', status: 'confirmed', date: day(12), createdAt: new Date().toISOString() }
  ]);
  await db.setCollection('club-trips', [{ id: 't1', slug: 'negril-crew', title: 'Negril Crew Week', country: 'Jamaica', startDate: day(-30), endDate: day(-24) }]);
  await db.setCollection('club-interests', [{ id: 'i1', tripId: 't1', email: 'cara@example.com', status: 'booked', tripTitle: 'Negril Crew Week' }]);

  /* the stamp book */
  let r = await call('member', 'GET', null, cara.token);
  ok('the stamp book has one stamp for each finished trip, newest first', r.code === 200 && r.body.stamps.length === 2 && r.body.stamps[0].title === 'Blue Hole Escape' && r.body.stamps[1].country === 'Jamaica');
  r = await call('member', 'GET', null, zed.token);
  ok('a member with no finished trip has an empty stamp book', r.body.stamps.length === 0);
  r = await call('member', 'GET', null, null);
  ok('the stamp book needs a sign-in', r.code === 401);

  /* reviews */
  r = await call('reviews', 'GET', null, cara.token, { mine: '1' });
  ok('a traveller sees the finished trips they can review', r.code === 200 && r.body.eligible.length === 2);
  const keyClub = r.body.eligible.find(e => /^club:/.test(e.refKey)).refKey, keyBook = r.body.eligible.find(e => /^booking:/.test(e.refKey)).refKey;
  r = await call('reviews', 'GET', null, zed.token, { mine: '1' });
  ok('someone with only an upcoming trip has nothing to review yet', r.body.eligible.length === 0);
  r = await call('reviews', 'POST', { action: 'create', refKey: 'booking:b2', rating: 5, text: 'Cannot wait for this one!' }, zed.token);
  ok('an upcoming trip cannot be reviewed', r.code === 403);
  r = await call('reviews', 'POST', { action: 'create', refKey: 'booking:b1', rating: 5, text: 'Great day.' }, zed.token);
  ok('nobody can review a trip that is not theirs', r.code === 403);
  r = await call('reviews', 'POST', { action: 'create', refKey: keyClub, rating: 0, text: 'Lovely week with a great group.' }, cara.token);
  ok('a rating from 1 to 5 is required', r.code === 400);
  r = await call('reviews', 'POST', { action: 'create', refKey: keyClub, rating: 5, text: 'short' }, cara.token);
  ok('a real sentence is required', r.code === 400);
  sent.length = 0;
  r = await call('reviews', 'POST', { action: 'create', refKey: keyClub, rating: 5, text: 'Lovely week with a great group, everything was smooth.' }, cara.token);
  ok('a finished trip can be reviewed and waits for approval', r.code === 201 && r.body.review.status === 'pending' && sent.some(m => /review to approve/.test(m.subject || '')));
  r = await call('reviews', 'POST', { action: 'create', refKey: keyClub, rating: 4, text: 'Trying to review the same trip twice.' }, cara.token);
  ok('a trip can only be reviewed once', r.code === 409);
  r = await call('reviews', 'GET', null, null, { trip: 'negril-crew' });
  ok('a pending review is not shown to the public', r.code === 200 && r.body.count === 0);
  const id = (await call('reviews', 'GET', null, owner, { admin: '1' })).body.reviews[0].id;
  r = await call('reviews', 'POST', { action: 'moderate', id, status: 'approved' }, cara.token);
  ok('only an admin can approve a review', r.code === 401 || r.code === 403);
  r = await call('reviews', 'POST', { action: 'moderate', id, status: 'approved' }, owner);
  ok('an admin can approve a review', r.code === 200 && r.body.review.status === 'approved');
  r = await call('reviews', 'GET', null, null, { trip: 'negril-crew' });
  ok('an approved review shows on the trip with a short public name and the average', r.body.count === 1 && r.body.average === 5 && r.body.reviews[0].name === 'Cara C.' && r.body.reviews[0].verified === true && !('userId' in r.body.reviews[0]));
  r = await call('reviews', 'GET', null, null, { recent: '1' });
  ok('the latest reviews list works without signing in', r.code === 200 && r.body.reviews.length === 1);
  await call('reviews', 'POST', { action: 'moderate', id, status: 'hidden' }, owner);
  r = await call('reviews', 'GET', null, null, { trip: 'negril-crew' });
  ok('a hidden review disappears again', r.body.count === 0);

  /* referrals */
  const code = member.referralCode({ id: cara.user.id });
  const friend = await signup('Fay Friend', 'fay@example.com', { cookie: 'a=1; ss_ref=' + code });
  const users = await db.getCollection('users');
  ok('a signup with the invite cookie is tied to the friend who invited them', users.find(u => u.email === 'fay@example.com').referredBy === cara.user.id);
  const self = await signup('Cara Again', 'cara2@example.com', { cookie: 'ss_ref=' + member.referralCode({ id: 'nobody' }) });
  ok('a code that belongs to no one ties nothing', !(await db.getCollection('users')).find(u => u.email === 'cara2@example.com').referredBy);
  r = await call('member', 'GET', null, cara.token);
  ok('the inviter sees their link and that one friend joined', r.body.referral.joined === 1 && r.body.referral.link.indexOf('?ref=' + code) > -1 && r.body.referral.rewarded === 0);

  /* nothing is paid until the switch is on and the friend has travelled */
  let s = await ops.runDaily({ now: new Date() });
  ok('no points while the switch is off', !(await db.getCollection('users')).find(u => u.email === 'cara@example.com').bonusPoints);
  await ops.saveSettings({ referrals: true, referralPoints: 120 });
  s = await ops.runDaily({ now: new Date() });
  ok('no points until the friend has finished a trip', s.referrals.length === 0);
  await db.setCollection('bookings', (await db.getCollection('bookings')).concat([{ id: 'b3', userId: friend.user.id, email: 'fay@example.com', tourName: 'Catamaran', status: 'completed', date: day(-3), createdAt: new Date().toISOString() }]));
  sent.length = 0;
  s = await ops.runDaily({ now: new Date() });
  const after = await db.getCollection('users');
  ok('after the friend travels, both get the points', s.referrals.length === 1 && after.find(u => u.email === 'cara@example.com').bonusPoints === 120 && after.find(u => u.email === 'fay@example.com').bonusPoints === 120);
  ok('both get an email about it', sent.filter(m => /earned 120 Travel Points/.test(m.subject || '')).length === 2);
  sent.length = 0;
  await ops.runDaily({ now: new Date() });
  ok('the reward is paid only once', (await db.getCollection('users')).find(u => u.email === 'cara@example.com').bonusPoints === 120 && sent.length === 0);
  const me = await call('auth', 'POST', { action: 'me' }, cara.token);
  ok('the points show on the account as a bonus', me.body.user.pointsFloor === 120);

  /* the showcase account */
  const demo = await signup('Daine Demo', 'daine.allenn@gmail.com');
  let dm = await call('member', 'GET', null, demo.token);
  ok('the demo account shows sample stamps, points and referrals', dm.code === 200 && dm.body.demo === true && dm.body.stamps.length === 16 && new Set(dm.body.stamps.map(x => x.country)).size >= 7 && dm.body.bonusPoints === 800 && dm.body.referral.joined === 3);
  const dme = await call('auth', 'POST', { action: 'me' }, demo.token);
  ok('the demo account is verified with Pioneer-level points', dme.body.user.verifiedTraveller === true && dme.body.user.pointsFloor >= 800 && dme.body.user.tripsCompleted === 16);
  let dr = await call('reviews', 'GET', null, demo.token, { mine: '1' });
  ok('the demo account has sample reviews and one trip to review', dr.body.demo === true && dr.body.mine.length === 2 && dr.body.eligible.length === 1);
  const before = (await db.getCollection('reviews')).length;
  dr = await call('reviews', 'POST', { action: 'create', refKey: dr.body.eligible[0].refKey, rating: 5, text: 'Trying the review form on the demo account.' }, demo.token);
  ok('a demo review works on screen but saves nothing', dr.code === 201 && dr.body.demo === true && (await db.getCollection('reviews')).length === before);
  const pubAll = await call('reviews', 'GET', null, null, { recent: '1' });
  ok('demo reviews never appear on the public pages', !JSON.stringify(pubAll.body).includes('demo-r'));
  const dbk = await call('bookings', 'GET', null, demo.token);
  ok('the demo account has a sample trip history: finished, coming up and just sent', dbk.code === 200 && dbk.body.demo === true && dbk.body.bookings.length >= 18 && ['completed', 'confirmed', 'pending'].every(s => dbk.body.bookings.some(b => b.status === s)));
  const dgt = await call('trips', 'GET', null, demo.token, { mine: '1' });
  ok('the demo account leads sample trips with travellers who joined', dgt.code === 200 && dgt.body.trips.length === 2 && dgt.body.trips[0].travelers.length >= 5 && dgt.body.applications[0].status === 'approved' && dgt.body.interests.length === 2);
  const zbk = await call('bookings', 'GET', null, zed.token);
  ok('other accounts see only their own bookings', zbk.body.demo === undefined && zbk.body.bookings.length === 1);
  ok('other accounts are not affected', (await call('member', 'GET', null, zed.token)).body.demo === undefined);
  console.log(fails ? '\n' + fails + ' FAILED' : '\nALL PASSED');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
