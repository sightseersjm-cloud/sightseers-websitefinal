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

/* Trip requests and accounts: a guest who asks to join gets a Sight Seers account on their email, so the request is
   on their profile. Run with:  npm run test:trip-account */
(async () => {
  const ownerPost = (b, t) => post(b, t);
  const owner = (await call('auth', 'POST', '/api/auth', { action: 'signin', email: 'owner@example.com', password: 'OwnerPass123!' })).body.token;
  const leader = (await call('auth', 'POST', '/api/auth', { action: 'signup', name: 'Lea Lead', email: 'lea@example.com', password: 'Leader12345!' })).body.token;
  let r = await ownerPost({ action: 'trip-save', title: 'Ocho Rios Weekend', slug: 'ocho-rios-weekend', status: 'open', summary: 'A weekend in Ocho Rios with friends.', dateText: '1 to 3 May 2027', organizerName: 'Lea Lead' }, owner);
  ok('a leader sets up an open trip', r.code === 200, r.body && r.body.error);

  sent.length = 0;
  r = await post({ action: 'interest', tripSlug: 'ocho-rios-weekend', name: 'Maya Guest', email: 'maya@example.com', consent: true, password: 'Guest-Pass-2027' });
  ok('a guest with no account asks to join', r.code === 200, r.body && r.body.error);
  ok('a new account is created for the guest', r.body.account === 'created');
  ok('the guest is signed in when they choose a password', typeof r.body.token === 'string' && r.body.token.length > 20 && r.body.user && r.body.user.email === 'maya@example.com');
  ok('the guest is sent an account email', mailsTo('maya@example.com').some(m => /account is ready/i.test(m.subject)));
  const mayaToken = r.body.token;
  r = await call('trips', 'GET', '/api/trips?mine=1', null, mayaToken);
  ok('the request is on the guest\'s profile', r.body.interests && r.body.interests.some(i => i.tripSlug === 'ocho-rios-weekend'), JSON.stringify(r.body).slice(0, 120));

  r = await post({ action: 'interest', tripSlug: 'ocho-rios-weekend', name: 'Jon Guest', email: 'jon@example.com', consent: true });
  ok('a guest without a password gets an account too, with a set-password email', r.code === 200 && r.body.account === 'created' && !r.body.token);
  ok('that email tells them to set a password', mailsTo('jon@example.com').some(m => /Forgot password/i.test(m.html || m.text || '')));

  const pre = (await call('auth', 'POST', '/api/auth', { action: 'signup', name: 'Ria Member', email: 'ria@example.com', password: 'Member-Pass-2027' })).body.token;
  r = await post({ action: 'interest', tripSlug: 'ocho-rios-weekend', name: 'Ria Member', email: 'ria@example.com', consent: true });
  ok('an existing member keeps their account (no duplicate)', r.code === 200 && r.body.account === 'linked');
  r = await call('trips', 'GET', '/api/trips?mine=1', null, pre);
  ok('the existing member sees the request on their profile', r.body.interests && r.body.interests.some(i => i.tripSlug === 'ocho-rios-weekend'));

  r = await post({ action: 'interest', tripSlug: 'ocho-rios-weekend', name: 'Weak Pass', email: 'weak@example.com', consent: true, password: 'short' });
  ok('a short password is refused with a clear message', r.code === 400 && /password/i.test(r.body.error || ''), r.body && r.body.error);

  console.log(fails ? fails + ' FAILED' : 'ALL PASSED');
  process.exit(fails ? 1 : 0);
})();
