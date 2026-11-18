/* Travel Club co-leaders: the main leader invites one, the invitee accepts, the owner approves; only then can the
   co-leader help run the trip. Only the main leader deletes the trip or changes the co-leader, and the reward stays
   with the main leader. Runs the real handlers against an in-memory store.  Run with:  npm run test:coleader */
const Module = require('module');
const store = new Map();
const blob = { put: async (p, b) => { store.set(p, Buffer.from(b)); return {}; }, get: async p => store.has(p) ? { statusCode: 200, stream: new Response(store.get(p)).body } : { statusCode: 404 }, del: async p => { store.delete(p); }, list: async () => ({ blobs: [] }) };
const o = Module._load; Module._load = function (r, ...a) { return r === '@vercel/blob' ? blob : o.call(this, r, ...a); };
Object.assign(process.env, { BLOB_READ_WRITE_TOKEN: 'x', JWT_SECRET: 'test-secret-test-secret-test-secret-12345', OWNER_EMAIL: 'owner@example.com', OWNER_PASSWORD: 'OwnerPass123!', RESEND_API_KEY: 'rk_test', BUSINESS_EMAIL: 'office@example.com' });
const sent = [];
global.fetch = async (url, opts) => { if (String(url).includes('resend.com')) { sent.push(JSON.parse(opts.body)); return { ok: true, status: 200, json: async () => ({ id: 'e' + sent.length }) }; } throw new Error('no network in tests: ' + url); };
const root = require('path').resolve(__dirname, '..') + '/';
const H = { auth: require(root + 'api/_handlers/auth'), trips: require(root + 'api/_handlers/trips'), bookings: require(root + 'api/_handlers/bookings') };
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

/* Booking requests and accounts: a guest who sends a booking request gets a Sight Seers account on their email, so the
   booking is on their profile. Run with:  npm run test:booking-account */
(async () => {
  const bookingPost = (b, t) => call('bookings', 'POST', '/api/bookings', b, t);
  let r = await bookingPost({ action: 'create', name: 'Ben Booker', email: 'ben@example.com', tourName: 'Blue Hole Escape', date: '2027-05-02', guests: 5, notes: 'Birthday weekend' });
  ok('a guest with no account sends a booking request', r.code === 201, r.body && r.body.error);
  ok('an account is linked to the booking', r.body.account === 'linked' && !!r.body.booking.userId);
  ok('no session is returned without a password', !r.body.token);
  ok('the guest is sent an account email with a set-password link', mailsTo('ben@example.com').some(m => /Forgot password/i.test(m.html || m.text || '')));

  r = await bookingPost({ action: 'create', name: 'Pia Booker', email: 'pia@example.com', tourName: 'Blue Hole Escape', date: '2027-05-03', guests: 2, password: 'Pia-Pass-2027' });
  ok('a guest who sets a password is signed in', r.code === 201 && typeof r.body.token === 'string' && r.body.user.email === 'pia@example.com');
  const piaToken = r.body.token;
  r = await call('bookings', 'GET', '/api/bookings', null, piaToken);
  ok('the booking shows on the guest\'s profile', r.body.bookings && r.body.bookings.some(b => b.tourName === 'Blue Hole Escape'), JSON.stringify(r.body).slice(0, 120));

  await call('auth', 'POST', '/api/auth', { action: 'signup', name: 'Mo Member', email: 'mo@example.com', password: 'Mo-Pass-2027' });
  r = await bookingPost({ action: 'create', name: 'Mo Member', email: 'mo@example.com', tourName: 'Land Experiences', date: '2027-06-01', guests: 3 });
  ok('an existing member keeps their account', r.code === 201 && r.body.account === 'linked');
  const moToken = (await call('auth', 'POST', '/api/auth', { action: 'signin', email: 'mo@example.com', password: 'Mo-Pass-2027' })).body.token;
  r = await call('bookings', 'GET', '/api/bookings', null, moToken);
  ok('the existing member sees the booking', r.body.bookings && r.body.bookings.some(b => b.tourName === 'Land Experiences'));

  r = await bookingPost({ action: 'create', name: 'Weak Pass', email: 'weak2@example.com', tourName: 'X', password: 'short' });
  ok('a short password is refused', r.code === 400 && /password/i.test(r.body.error || ''), r.body && r.body.error);

  console.log(fails ? fails + ' FAILED' : 'ALL PASSED');
  process.exit(fails ? 1 : 0);
})();
