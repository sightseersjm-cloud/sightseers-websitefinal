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
const H = { auth: require(root + 'api/_handlers/auth'), trips: require(root + 'api/_handlers/trips'), bookings: require(root + 'api/_handlers/bookings'), 'ai-calls': require(root + 'api/_handlers/ai-calls') };
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

/* AI calls: only people who agreed to be called, with every safeguard enforced. The voice provider and the clock are
   faked, so no real call is made.  Run with:  npm run test:ai-calls */
const ai = require(root + 'api/_lib/ai-calls');
Object.assign(process.env, { VAPI_API_KEY: 'k', VAPI_ASSISTANT_ID: 'a', VAPI_PHONE_NUMBER_ID: 'p', AI_CALL_WEBHOOK_SECRET: 'hook-secret-123' });

const RealDate = Date;
function useTime(iso) {
  if (!iso) { global.Date = RealDate; return; }
  const fixed = new RealDate(iso).getTime();
  global.Date = class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(fixed); } static now() { return fixed; } };
}
const TUE_11AM_JM = '2027-06-01T16:00:00Z';   /* Tuesday 11:00 in Jamaica */
const SUN_11AM_JM = '2027-06-06T16:00:00Z';   /* Sunday */
const NIGHT_JM = '2027-06-01T03:00:00Z';      /* Monday 10 pm in Jamaica */

const baseFetch = global.fetch; const vapi = [];
global.fetch = async (url, opts) => {
  if (String(url).startsWith('https://api.vapi.ai/')) { vapi.push(JSON.parse(opts.body)); return { ok: true, status: 201, json: async () => ({ id: 'prov-' + vapi.length }) }; }
  return baseFetch(url, opts);
};
function callH(h, method, url, body, token, headers) {
  return new Promise(r => {
    const res = { headers: {}, status(c) { this.code = c; return this; }, json(x) { r({ code: this.code, body: x }); }, end(x) { r({ code: this.code, body: x }); }, setHeader() {} };
    const q = Object.fromEntries(new URL('http://x' + url).searchParams);
    H[h]({ method, url, query: q, headers: Object.assign({ host: 'www.sightseerscaribbean.com', 'x-forwarded-for': '10.1.0.' + (++n % 250) }, token ? { authorization: 'Bearer ' + token } : {}, headers || {}), body: body || {} }, res);
  });
}

(async () => {
  /* the rules themselves */
  ok('phone numbers are tidied to one format', ai.normalizePhone('(876) 465-0630') === '+18764650630' && ai.normalizePhone('+44 7359 121835') === '+447359121835' && ai.normalizePhone('18764650630') === '+18764650630');
  ok('unclear numbers are refused', ai.normalizePhone('123') === '' && ai.normalizePhone('') === '' && ai.normalizePhone('abc') === '');
  ok('calling hours: Tuesday morning is open', ai.inCallWindow(new RealDate(TUE_11AM_JM)) === true);
  ok('calling hours: Sunday and night are closed', ai.inCallWindow(new RealDate(SUN_11AM_JM)) === false && ai.inCallWindow(new RealDate(NIGHT_JM)) === false);

  let admin = (await callH('auth', 'POST', '/api/auth', { action: 'signin', email: 'owner@example.com', password: 'OwnerPass123!' })).body.token;
  /* moving the fake clock also ages the sign-in, so sign in again at each new time */
  const at = async (iso) => { useTime(iso); admin = (await callH('auth', 'POST', '/api/auth', { action: 'signin', email: 'owner@example.com', password: 'OwnerPass123!' })).body.token; };
  const bk = (b) => callH('bookings', 'POST', '/api/bookings', Object.assign({ action: 'create', tourName: 'Blue Hole Escape', date: '2027-07-01', endDate: '2027-07-06', guests: 6 }, b));
  const list = async () => (await callH('ai-calls', 'GET', '/api/ai-calls', null, admin)).body;

  /* who gets queued */
  await bk({ name: 'No Consent', email: 'nc@example.com', phone: '(876) 111-2222' });
  await bk({ name: 'Cara Consent', email: 'cara@example.com', phone: '(876) 465-0630', callConsent: true });
  await bk({ name: 'Bad Phone', email: 'bp@example.com', phone: '12', callConsent: true });
  let st = await list();
  ok('a request without the consent box is never queued', !st.calls.some(c => c.email === 'nc@example.com'));
  ok('a request with consent and a good number is queued, with the time they agreed', st.calls.length === 1 && st.calls[0].phone === '+18764650630' && !!st.calls[0].consentAt && st.calls[0].status === 'pending');
  ok('a consent with an unusable number is not queued', !st.calls.some(c => c.email === 'bp@example.com'));
  ok('only an admin can see the queue', (await callH('ai-calls', 'GET', '/api/ai-calls')).code === 401);
  const cara = st.calls[0];

  /* the safeguards, one by one */
  await at(TUE_11AM_JM);
  let r = await callH('ai-calls', 'POST', '/api/ai-calls', { action: 'start', id: cara.id }, admin);
  ok('it is off by default: nothing is dialled', r.code === 400 && /switched off/.test(r.body.error) && vapi.length === 0);
  await callH('ai-calls', 'POST', '/api/ai-calls', { action: 'settings-save', enabled: true, dailyCap: 1, maxAttempts: 2 }, admin);

  await at(SUN_11AM_JM);
  r = await callH('ai-calls', 'POST', '/api/ai-calls', { action: 'start', id: cara.id }, admin);
  ok('no calls on a Sunday', r.code === 400 && /Monday to Saturday/.test(r.body.error) && vapi.length === 0);
  await at(NIGHT_JM);
  r = await callH('ai-calls', 'POST', '/api/ai-calls', { action: 'start', id: cara.id }, admin);
  ok('no calls at night', r.code === 400 && vapi.length === 0);

  await at(TUE_11AM_JM);
  const saved = { ...process.env }; delete process.env.VAPI_API_KEY;
  r = await callH('ai-calls', 'POST', '/api/ai-calls', { action: 'start', id: cara.id }, admin);
  ok('no provider keys: a clear message, nothing dialled', r.code === 400 && /not connected/.test(r.body.error) && vapi.length === 0);
  process.env.VAPI_API_KEY = saved.VAPI_API_KEY;

  r = await callH('ai-calls', 'POST', '/api/ai-calls', { action: 'start', id: cara.id }, admin);
  ok('inside hours, switched on, consented: the call is placed', r.code === 200 && r.body.call.status === 'calling' && r.body.call.attempts === 1 && vapi.length === 1);
  ok('the provider is sent the number, the assistant and our call id', vapi[0].customer.number === '+18764650630' && vapi[0].assistantId === 'a' && vapi[0].metadata.callId === cara.id);
  ok('the agent is told only the first name and the trip details', vapi[0].assistantOverrides.variableValues.name === 'Cara' && /Blue Hole/.test(vapi[0].assistantOverrides.variableValues.trip));
  r = await callH('ai-calls', 'POST', '/api/ai-calls', { action: 'start', id: cara.id }, admin);
  ok('a call already in progress cannot be started again', r.code === 400 && /in progress/.test(r.body.error) && vapi.length === 1);

  /* the provider reports back */
  r = await callH('ai-calls', 'POST', '/api/ai-calls?webhook=1', { callId: cara.id, outcome: 'interested', summary: 'Wants 6 people in July.' }, null, { 'x-webhook-secret': 'wrong' });
  ok('a report with the wrong secret is refused', r.code === 401);
  sent.length = 0;
  r = await callH('ai-calls', 'POST', '/api/ai-calls?webhook=1', { callId: cara.id, outcome: 'interested', summary: 'Wants 6 people in July.' }, null, { 'x-webhook-secret': 'hook-secret-123' });
  ok('a real report is accepted', r.code === 200);
  st = await list();
  ok('the outcome and summary are saved', st.calls[0].status === 'completed' && st.calls[0].outcome === 'interested' && /July/.test(st.calls[0].summary));
  ok('the team is emailed when someone is interested', sent.some(m => /AI call result/.test(m.subject || '')));
  const g = sent.find(m => /Pick a time/.test(m.subject || ''));
  ok('the guest gets the booking link by email', g && JSON.stringify(g.to).includes('cara@example.com') && /calendly\.com\/sightseersjm\/30min/.test(g.html));
  sent.length = 0;
  await callH('ai-calls', 'POST', '/api/ai-calls?webhook=1', { callId: cara.id, outcome: 'interested', summary: 'again' }, null, { 'x-webhook-secret': 'hook-secret-123' });
  ok('the link is not sent twice', !sent.some(m => /Pick a time/.test(m.subject || '')));

  /* the daily cap */
  await bk({ name: 'Dan Daily', email: 'dan@example.com', phone: '(876) 333-4444', callConsent: true });
  const dan = (await list()).calls.find(c => c.email === 'dan@example.com');
  r = await callH('ai-calls', 'POST', '/api/ai-calls', { action: 'start', id: dan.id }, admin);
  ok('the daily limit stops further calls', r.code === 400 && /daily limit/.test(r.body.error) && vapi.length === 1);

  /* limit on tries per person (new day) */
  await at('2027-06-02T16:00:00Z');
  r = await callH('ai-calls', 'POST', '/api/ai-calls', { action: 'start', id: cara.id }, admin);
  ok('a second try is allowed the next day', r.code === 200 && vapi.length === 2);
  await callH('ai-calls', 'POST', '/api/ai-calls?webhook=1', { callId: cara.id, outcome: 'voicemail' }, null, { 'x-webhook-secret': 'hook-secret-123' });
  await at('2027-06-03T16:00:00Z');
  r = await callH('ai-calls', 'POST', '/api/ai-calls', { action: 'start', id: cara.id }, admin);
  ok('a third try is refused', r.code === 400 && /already been called 2 times/.test(r.body.error) && vapi.length === 2);

  /* do not call */
  r = await callH('ai-calls', 'POST', '/api/ai-calls', { action: 'start', id: dan.id }, admin);
  ok('Dan can now be called (new day)', r.code === 200);
  await callH('ai-calls', 'POST', '/api/ai-calls?webhook=1', { callId: dan.id, outcome: 'do_not_call', summary: 'Asked us to stop.' }, null, { 'x-webhook-secret': 'hook-secret-123' });
  st = await list();
  ok('saying do-not-call on a call puts the number on the list at once', st.dnc.some(x => x.phone === '+18763334444'));
  await bk({ name: 'Dan Again', email: 'dan2@example.com', phone: '876-333-4444', callConsent: true });
  ok('a new request from a do-not-call number is not queued', !(await list()).calls.some(c => c.email === 'dan2@example.com'));
  await callH('ai-calls', 'POST', '/api/ai-calls', { action: 'dnc-add', phone: '(876) 465-0630', reason: 'asked by email' }, admin);
  await callH('ai-calls', 'POST', '/api/ai-calls', { action: 'skip', id: cara.id }, admin);
  st = await list();
  ok('an admin can add a number to the do-not-call list', st.dnc.some(x => x.phone === '+18764650630'));
  ok('an admin can skip a lead', st.calls.find(c => c.id === cara.id).status === 'skipped');
  ok('provider and hours status are shown to the admin', st.providerReady === true && typeof st.inWindow === 'boolean');

  useTime(null);
  console.log(fails ? fails + ' FAILED' : 'ALL PASSED');
  process.exit(fails ? 1 : 0);
})();
