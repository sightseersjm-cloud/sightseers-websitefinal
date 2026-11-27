/* Waivers for trips: signed from the Travel Club dashboard (tied to the member's trip request), the signed PDF is stored privately and
   opened from the admin portal, the roster's Forms tick, and the admin can email waiver links to typed addresses.
   Run with:  npm run test:waiver-trip */
const Module = require('module');
const store = new Map();
const blob = { put: async (p, b) => { store.set(p, Buffer.from(b)); return {}; }, get: async p => store.has(p) ? { statusCode: 200, stream: new Response(store.get(p)).body } : { statusCode: 404 }, del: async p => { store.delete(p); }, list: async () => ({ blobs: [...store.keys()].map(pathname => ({ pathname })) }) };
const o = Module._load; Module._load = function (r, ...a) { return r === '@vercel/blob' ? blob : o.call(this, r, ...a); };
Object.assign(process.env, { BLOB_READ_WRITE_TOKEN: 'x', JWT_SECRET: 'test-secret-test-secret-test-secret-12345', OWNER_EMAIL: 'owner@example.com', OWNER_PASSWORD: 'OwnerPass123!', RESEND_API_KEY: 'rk_test', BUSINESS_EMAIL: 'office@example.com' });
const sent = [];
global.fetch = async (url, opts) => { if (String(url).includes('resend.com')) { sent.push(JSON.parse(opts.body)); return { ok: true, status: 200, json: async () => ({ id: 'e' + sent.length }) }; } throw new Error('no network in tests: ' + url); };
const root = require('path').resolve(__dirname, '..') + '/';
const H = { auth: require(root + 'api/_handlers/auth'), trips: require(root + 'api/_handlers/trips'), waiver: require(root + 'api/_handlers/waiver') };
let n = 0;
function call(h, method, url, body, token) {
  return new Promise(r => {
    const res = { headers: {}, status(c) { this.code = c; return this; }, json(x) { r({ code: this.code, body: x }); }, end(x) { r({ code: this.code, body: x }); }, send(x) { r({ code: this.code, body: x, headers: this.headers }); }, setHeader(k, v) { this.headers[k] = v; } };
    const q = Object.fromEntries(new URL('http://x' + url).searchParams);
    H[h]({ method, url, query: q, headers: { host: 'www.sightseerscaribbean.com', 'x-forwarded-for': '10.0.1.' + (++n % 250), ...(token ? { authorization: 'Bearer ' + token } : {}) }, body: body || {} }, res);
  });
}
let fails = 0; const ok = (name, cond, extra) => { console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); if (!cond) fails++; };
const PDF = 'JVBERi0xLjMK' + 'A'.repeat(3000);
const sign = (o) => call('waiver', 'POST', '/api/waiver', Object.assign({ name: 'Ada Brown', email: 'ada@example.com', phone: '+1 876 555 0101', event: 'summit', agreed: true, over18: true, pdfBase64: PDF, version: 'draft-2' }, o || {}));

(async () => {
  const owner = (await call('auth', 'POST', '/api/auth', { action: 'signin', email: 'owner@example.com', password: 'OwnerPass123!' })).body.token;
  /* the waiver wording no longer gives the Summit place away */
  const { WAIVER } = require(root + 'api/_lib/waiver');
  const sm = WAIVER.events.find(e => e.id === 'summit');
  ok('the Summit waiver wording does not name the place', sm && !/elizabeth|jamaica/i.test(JSON.stringify(sm)));
  await call('trips', 'GET', '/api/trips');
  /* a member asks to join, then signs from the dashboard */
  let r = await call('trips', 'POST', '/api/trips', { action: 'interest', name: 'Ada Brown', email: 'ada@example.com', phone: '+1 876 555 0101', consent: true, tripSlug: 'the-summit-challenge', password: 'Summit2026pass' });
  ok('a member asks to join the Summit Challenge', r.code === 200 && r.body.ref, JSON.stringify(r.body));
  const ref = r.body.ref;
  r = await call('trips', 'GET', '/api/trips?admin=1', null, owner);
  const ada = r.body.interests.find(i => i.email === 'ada@example.com');
  await call('trips', 'POST', '/api/trips', { action: 'interest-update', id: ada.id, status: 'confirmed', note: '', notify: false }, owner);
  ok('forms are not done before she signs', !ada.formsDone);
  sent.length = 0;
  r = await sign({ tripSlug: 'the-summit-challenge', interestRef: ref });
  ok('she can sign her waiver for the trip', r.code === 201 && r.body.ok && r.body.guestCopy, JSON.stringify(r.body));
  ok('the signed copy is emailed to her', sent.some(m => (m.to || []).includes('ada@example.com') && m.attachments && m.attachments.length === 1));
  r = await call('trips', 'GET', '/api/trips?admin=1', null, owner);
  const after = r.body.interests.find(i => i.email === 'ada@example.com');
  ok('her roster Forms box is ticked automatically', after.formsDone === true);
  /* admin list and stored PDF */
  r = await call('waiver', 'GET', '/api/waiver?admin=1');
  ok('the waiver list is not public', r.code === 401 || r.code === 403);
  r = await call('waiver', 'GET', '/api/waiver?admin=1', null, owner);
  const w = r.body.waivers && r.body.waivers[0];
  ok('the admin sees the signed waiver with its trip', r.code === 200 && w && w.name === 'Ada Brown' && w.tripSlug === 'the-summit-challenge' && /Summit/.test(w.tripTitle) && w.hasPdf === true, JSON.stringify(r.body).slice(0, 300));
  ok('the list carries the trips and activities for the send form', r.body.trips.some(t => t.slug === 'the-summit-challenge') && r.body.events.some(e => e.id === 'summit'));
  r = await call('waiver', 'GET', '/api/waiver?id=' + w.id + '&pdf=1');
  ok('the stored PDF is not public', r.code === 401 || r.code === 403);
  r = await call('waiver', 'GET', '/api/waiver?id=' + w.id + '&pdf=1', null, owner);
  ok('the admin can download the stored signed PDF', r.code === 200 && Buffer.isBuffer(r.body) && r.body.toString('base64') === PDF && /pdf/.test(r.headers['Content-Type']));
  ok('the PDF is kept in the private store', [...store.keys()].some(k => /ss-data\/waivers\/.+\.pdf$/.test(k)));
  /* inviting typed emails */
  r = await call('waiver', 'POST', '/api/waiver', { action: 'invite', emails: 'x@example.com', event: 'general' });
  ok('only the team can send waiver links', r.code === 401 || r.code === 403);
  r = await call('waiver', 'POST', '/api/waiver', { action: 'invite', emails: 'not-an-email' }, owner);
  ok('a bad address is refused', r.code === 400);
  sent.length = 0;
  r = await call('waiver', 'POST', '/api/waiver', { action: 'invite', emails: 'ben@example.com, cara@example.com\nada@example.com', tripSlug: 'the-summit-challenge', note: 'Please sign this week.' }, owner);
  ok('links go to the typed addresses', r.code === 200 && r.body.sent === 2 && r.body.alreadySigned === 1, JSON.stringify(r.body));
  const mb = sent.find(m => (m.to || []).includes('ben@example.com'));
  ok('the email has a personal link for that trip and a note', mb && /waiver\?event=summit&trip=the-summit-challenge&email=ben%40example\.com/.test(mb.html) && /Please sign this week/.test(mb.html));
  ok('someone who already signed is not emailed again', !sent.some(m => (m.to || []).includes('ada@example.com')));
  /* a person who signs from the link (no dashboard request) is filed and the invite flips to signed */
  r = await sign({ name: 'Ben Clarke', email: 'ben@example.com', tripSlug: 'the-summit-challenge' });
  ok('he signs from the emailed link', r.code === 201);
  r = await call('waiver', 'GET', '/api/waiver?admin=1', null, owner);
  const bi = r.body.invites.find(i => i.email === 'ben@example.com'), ci = r.body.invites.find(i => i.email === 'cara@example.com');
  ok('his invite shows as signed and hers as waiting', bi && bi.signedAt && ci && !ci.signedAt);
  ok('both signed waivers are on file', r.body.waivers.length === 2);
  console.log(fails ? '\n' + fails + ' FAILED' : '\nALL PASSED');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
