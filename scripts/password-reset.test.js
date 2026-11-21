const Module = require('module'); const store = new Map();
const blob = { put: async (p, b) => { store.set(p, Buffer.from(b)); return {}; }, get: async p => { if (global.blobFail) throw new Error('storage busy'); return store.has(p) ? { statusCode: 200, stream: new Response(store.get(p)).body } : { statusCode: 404 }; }, del: async p => { store.delete(p); }, list: async () => ({ blobs: [] }) };
const o = Module._load; Module._load = function (r, ...a) { return r === '@vercel/blob' ? blob : o.call(this, r, ...a); };
Object.assign(process.env, { BLOB_READ_WRITE_TOKEN: 'x', JWT_SECRET: 'test-secret-test-secret-test-secret-12345', RESEND_API_KEY: 'rk' });
const sent = []; global.fetch = async (u, op) => { sent.push(JSON.parse(op.body)); return { ok: true, status: 200, json: async () => ({ id: 'x' }) }; };
const h = require('/home/user/sightseers-websitefinal/api/_handlers/auth');
const call = (body) => new Promise(r => { const res = { status(c) { this.c = c; return this; }, json(x) { r({ c: this.c, b: x }); }, setHeader() {}, end() { r({}); } }; h({ method: 'POST', url: '/api/auth', query: {}, headers: { host: 'x', 'x-forwarded-for': '1.1.1.1' }, body }, res); });
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  ' + x : '')); if (!c) fails++; };
(async () => {
  let r = await call({ action: 'signup', name: 'Daine Allen', email: 'Daine.Allenn@Gmail.com', password: 'Passw0rdTest1', phone: '1' }); ok('an account exists', r.c === 201);
  sent.length = 0;
  r = await call({ action: 'request-reset', email: ' DAINE.ALLENN@gmail.com ' });
  ok('a reset code is emailed, even with capitals and spaces', r.b.sent === true && sent.some(m => /reset code/.test(m.subject) && (m.to || []).includes('daine.allenn@gmail.com')), JSON.stringify(r.b));
  const code = (sent.find(m => /reset code/.test(m.subject)).subject.match(/(\d{6})/) || [])[1];
  r = await call({ action: 'reset-password', email: 'daine.allenn@gmail.com', code, newPassword: 'NewPassw0rdTest9' });
  ok('the code sets a new password and signs them in', r.c === 200 && !!r.b.token, JSON.stringify(r.b).slice(0, 120));
  r = await call({ action: 'signin', email: 'daine.allenn@gmail.com', password: 'NewPassw0rdTest9' }); ok('the new password works', r.c === 200);
  r = await call({ action: 'request-reset', email: 'nobody@example.com' }); ok('an unknown email is told so', r.b.noAccount === true && r.b.sent === false);
  r = await call({ action: 'signup', name: 'Dup', email: '  DAINE.Allenn@gmail.com ', password: 'Passw0rdTest1' }); ok('sign-up refuses the same email typed differently', r.c === 409);

  /* a guest known only from a trip request (no row in users) can open their account with a code */
  const db = require('/home/user/sightseers-websitefinal/api/_lib/db');
  await db.addToCollection('club-interests', { id: 'i1', ref: 'TC-1', name: 'Trip Guest', email: 'trip.guest@example.com', phone: '876', status: 'new', createdAt: new Date().toISOString() });
  sent.length = 0;
  r = await call({ action: 'request-reset', email: ' Trip.Guest@Example.com' });
  ok('a guest with a trip request but no account is sent a code', r.b.sent === true && r.b.newAccount === true && sent.some(m => (m.to || []).includes('trip.guest@example.com')), JSON.stringify(r.b));
  ok('asking for the code does not create the account yet', !(await db.getCollection('users')).some(u => u.email === 'trip.guest@example.com'));
  const gcode = (sent.find(m => /code/.test(m.subject)).subject.match(/(\d{6})/) || [])[1];
  const wrong = gcode === '111111' ? '222222' : '111111';
  r = await call({ action: 'reset-password', email: 'trip.guest@example.com', code: wrong, newPassword: 'GuestPassw0rd9' });
  ok('a wrong code does not open the account', r.c === 400 && !(await db.getCollection('users')).some(u => u.email === 'trip.guest@example.com'));
  r = await call({ action: 'reset-password', email: 'TRIP.guest@example.com ', code: gcode, newPassword: 'GuestPassw0rd9' });
  ok('the right code opens the account and signs them in', r.c === 200 && r.b.created === true && !!r.b.token && r.b.user.name === 'Trip Guest' && !r.b.user.passwordHash, JSON.stringify(r.b).slice(0, 160));
  ok('exactly one account, stored trimmed and in lower case', (await db.getCollection('users')).filter(u => u.email === 'trip.guest@example.com').length === 1);
  r = await call({ action: 'reset-password', email: 'trip.guest@example.com', code: gcode, newPassword: 'Another0Pass9' }); ok('the code works only once', r.c === 400);
  r = await call({ action: 'signin', email: 'Trip.Guest@example.com', password: 'GuestPassw0rd9' }); ok('they can sign in with the new password', r.c === 200);
  ok('the first account survived (nothing overwritten)', (await db.getCollection('users')).some(u => u.email === 'daine.allenn@gmail.com'));

  /* too many wrong codes stop the code working */
  sent.length = 0;
  await db.addToCollection('bookings', { id: 'b1', name: 'Book Guest', email: 'book.guest@example.com', createdAt: new Date().toISOString() });
  r = await call({ action: 'request-reset', email: 'book.guest@example.com' }); ok('a guest known from a booking gets a code too', r.b.sent === true && r.b.newAccount === true);
  const bcode = (sent.find(m => /code/.test(m.subject)).subject.match(/(\d{6})/) || [])[1];
  const bad = bcode === '333333' ? '444444' : '333333';
  for (let i = 0; i < 5; i++) await call({ action: 'reset-password', email: 'book.guest@example.com', code: bad, newPassword: 'GuestPassw0rd9' });
  r = await call({ action: 'reset-password', email: 'book.guest@example.com', code: bcode, newPassword: 'GuestPassw0rd9' }); ok('after 5 wrong codes even the right one needs a new request', r.c === 400 && /new code/i.test(r.b.error), JSON.stringify(r.b));

  /* a storage read that fails must never let a new account overwrite every other account */
  const before = (await db.getCollection('users')).length;
  global.blobFail = true;
  let threw = false; try { await db.addToCollection('users', { id: 'x', email: 'x@example.com' }); } catch (e) { threw = true; }
  global.blobFail = false;
  ok('a failed read stops the write instead of wiping the accounts', threw && (await db.getCollection('users')).length === before);

  global.fetch = async () => ({ ok: false, status: 422, json: async () => ({ message: 'bad' }) });
  r = await call({ action: 'request-reset', email: 'daine.allenn@gmail.com' }); ok('a failed email is reported, not hidden', r.b.emailFailed === true && r.b.sent === false);
  console.log(fails ? '\n' + fails + ' FAILED' : '\nALL PASSED'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
