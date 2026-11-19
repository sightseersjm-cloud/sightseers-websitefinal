/* Operations automations: follow-ups, Calendly sync, payment/waiver/arrival/review emails and the morning summary, run against an in-memory store with a fixed clock. Run with:  npm run test:ops */
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
const H2 = { 'ops-auto': require(root + 'api/_handlers/ops-auto'), auth: require(root + 'api/_handlers/auth') };
let fails = 0; const ok = (name, cond, extra) => { console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); if (!cond) fails++; };
const to = a => sent.filter(m => (m.to || []).includes(a));
function callH(h, method, body, token) {
  return new Promise(r => {
    const res = { headers: {}, status(c) { this.code = c; return this; }, json(x) { r({ code: this.code, body: x }); }, end(x) { r({ code: this.code, body: x }); }, setHeader() {} };
    H2[h]({ method, url: '/api/' + h, query: {}, headers: { host: 'x', 'x-forwarded-for': '10.2.0.1', ...(token ? { authorization: 'Bearer ' + token } : {}) }, body: body || {} }, res);
  });
}
const NOW = new Date('2027-06-10T14:00:00Z');            /* 9 am in Jamaica */
const hoursAgo = h => new Date(NOW.getTime() - h * 3600000).toISOString();
const dayOffset = d => new Date(NOW.getTime() + d * 86400000).toISOString().slice(0, 10);

(async () => {
  /* nothing happens until a switch is on */
  await db.setCollection('bookings', [
    { id: 'b1', name: 'Cara Quiet', email: 'cara@example.com', tourName: 'Blue Hole Escape', status: 'pending', createdAt: hoursAgo(30), guests: 6 },
    { id: 'b2', name: 'Ben Booked', email: 'ben@example.com', tourName: 'Villa weekend', status: 'pending', createdAt: hoursAgo(30), callBookedAt: hoursAgo(2) },
    { id: 'b3', name: 'Old Lead', email: 'old@example.com', tourName: 'ATV day', status: 'pending', createdAt: hoursAgo(110) },
    { id: 'b4', name: 'Fresh Lead', email: 'fresh@example.com', tourName: 'Rafting', status: 'pending', createdAt: hoursAgo(3) },
    { id: 'b5', name: 'Stop Sam', email: 'sam@example.com', tourName: 'Rafting', status: 'pending', createdAt: hoursAgo(30) },
    { id: 'b6', name: 'Week Wendy', email: 'wendy@example.com', tourName: 'Dunn River', status: 'confirmed', date: dayOffset(7), endDate: dayOffset(7), createdAt: hoursAgo(500), guests: 2 },
    { id: 'b7', name: 'Soon Sally', email: 'sally@example.com', tourName: 'Bamboo rafting', status: 'confirmed', date: dayOffset(3), createdAt: hoursAgo(500), guests: 2 },
    { id: 'b8', name: 'Back Barry', email: 'barry@example.com', tourName: 'Catamaran', status: 'confirmed', date: dayOffset(-4), endDate: dayOffset(-2), createdAt: hoursAgo(900), guests: 2 },
    { id: 'b9', name: 'Signed Sue', email: 'sue@example.com', tourName: 'Dunn River', status: 'confirmed', date: dayOffset(7), createdAt: hoursAgo(500), guests: 1 }
  ]);
  await db.setCollection('signed-waivers', [{ id: 'w1', name: 'Sue', email: 'sue@example.com', createdAt: hoursAgo(10) }]);
  await db.setCollection('ops-optout', [{ id: 'o1', email: 'sam@example.com' }]);
  await db.setCollection('invoices', [
    { id: 'i1', number: 'SS-2027-001', status: 'sent', customerName: 'Pat Payer', customerEmail: 'pat@example.com', dueOn: dayOffset(3), items: [{ description: 'Trip', qty: 1, unit: 1250 }], discount: 0, issuedOn: dayOffset(-10) },
    { id: 'i2', number: 'SS-2027-002', status: 'sent', customerName: 'Dee Due', customerEmail: 'dee@example.com', dueOn: dayOffset(0), items: [{ description: 'Trip', qty: 1, unit: 500 }], discount: 0, issuedOn: dayOffset(-10) },
    { id: 'i3', number: 'SS-2027-003', status: 'sent', customerName: 'Lee Late', customerEmail: 'lee@example.com', dueOn: dayOffset(-3), items: [{ description: 'Trip', qty: 1, unit: 800 }], discount: 0, issuedOn: dayOffset(-20) },
    { id: 'i4', number: 'SS-2027-004', status: 'paid', customerName: 'Paid Pam', customerEmail: 'pam@example.com', dueOn: dayOffset(0), items: [{ description: 'Trip', qty: 1, unit: 100 }], discount: 0, paidAt: hoursAgo(5) }
  ]);

  let s = await ops.runDaily({ now: NOW });
  ok('with every switch off nothing is sent', sent.length === 0 && Object.values(s.counts).every(v => v === 0));

  /* a preview shows what would go out without sending it */
  s = await ops.runDaily({ now: NOW, dryRun: true, force: true });
  ok('a preview lists the follow-ups but sends nothing', sent.length === 0 && s.followups.length === 2 && s.followups.some(f => f.email === 'cara@example.com'));
  ok('a lead who booked a call, a fresh lead and an opted-out guest get no follow-up', !s.followups.some(f => ['ben@example.com', 'fresh@example.com', 'sam@example.com'].includes(f.email)));

  /* follow-ups */
  await ops.saveSettings({ followups: true });
  s = await ops.runDaily({ now: NOW });
  ok('a quiet lead gets the first follow-up with the booking link', to('cara@example.com').length === 1 && /calendly\.com\/sightseersjm\/30min/.test(to('cara@example.com')[0].html) && /Blue Hole Escape/.test(to('cara@example.com')[0].subject));
  ok('a lead four days old gets the second, softer nudge', to('old@example.com').length === 1 && /Still thinking/.test(to('old@example.com')[0].subject));
  ok('the guest email tells them how to stop', /STOP/.test(to('cara@example.com')[0].html));
  ok('no one else is emailed', to('ben@example.com').length + to('fresh@example.com').length + to('sam@example.com').length === 0);
  const n1 = sent.length;
  await ops.runDaily({ now: NOW });
  ok('running the job again sends nothing twice', sent.length === n1);

  /* payments */
  await ops.saveSettings({ payments: true });
  sent.length = 0;
  s = await ops.runDaily({ now: NOW });
  ok('an invoice due in three days gets a reminder with the PDF', to('pat@example.com').length === 1 && (to('pat@example.com')[0].attachments || []).length === 1 && /US\$1,250\.00/.test(to('pat@example.com')[0].html));
  ok('an invoice due today gets the due-today note', to('dee@example.com').length === 1 && /due today/.test(to('dee@example.com')[0].subject));
  ok('an invoice three days late gets the past-due note', to('lee@example.com').length === 1 && /past due/.test(to('lee@example.com')[0].subject));
  ok('a paid invoice gets nothing', to('pam@example.com').length === 0);

  /* waivers, arrival, review */
  await ops.saveSettings({ waivers: true, arrival: true, review: true });
  sent.length = 0;
  s = await ops.runDaily({ now: NOW });
  ok('a traveller a week out with no waiver is reminded', to('wendy@example.com').length === 1 && /waiver/i.test(to('wendy@example.com')[0].subject));
  ok('a traveller who already signed is not reminded', to('sue@example.com').length === 0);
  ok('a traveller three days out gets the getting-ready email', to('sally@example.com').some(m => /Getting ready/.test(m.subject)));
  ok('a traveller two days after the trip gets the thank-you', to('barry@example.com').length === 1 && /Thank you/.test(to('barry@example.com')[0].subject) && /reply and tell us/.test(to('barry@example.com')[0].html));
  await ops.saveSettings({ reviewLink: 'https://g.page/r/example/review' });
  const rv = await ops.previewMail('review', 'a@b.co', await ops.getSettings());
  ok('a saved review link appears in the thank-you', /g\.page\/r\/example\/review/.test(rv.html));
  ok('a link that is not https is refused', (await ops.saveSettings({ reviewLink: 'javascript:alert(1)' })).reviewLink === '');

  /* a verified returning traveller gets a welcome-back line */
  await db.setCollection('bookings', (await db.getCollection('bookings')).concat([{ id: 'v1', name: 'Vera Verified', email: 'vera@example.com', tourName: 'Catamaran', status: 'completed', date: dayOffset(-30), createdAt: hoursAgo(900) }, { id: 'v2', name: 'Vera Verified', email: 'vera@example.com', tourName: 'Rafting', status: 'pending', createdAt: hoursAgo(30) }]));
  sent.length = 0;
  await ops.runDaily({ now: NOW });
  ok('a verified guest gets the welcome-back line in a follow-up', to('vera@example.com').length === 1 && /Welcome back/.test(to('vera@example.com')[0].html) && !/Welcome back/.test(to('cara@example.com').map(m => m.html).join('')));
  /* the morning summary */
  await ops.saveSettings({ digest: true });
  sent.length = 0;
  s = await ops.runDaily({ now: NOW });
  const d = to('office@example.com').find(m => /Your Sight Seers day/.test(m.subject));
  ok('the team gets one morning summary', !!d && s.digest === true);
  ok('it lists overdue and upcoming items', d && /Overdue invoices/.test(d.html) && /Lee Late/.test(d.html) && /no signed waiver/.test(d.html) && /Wendy|Week Wendy/.test(d.html));

  /* Calendly sync */
  process.env.CALENDLY_API_TOKEN = 'cal-token';
  const base = global.fetch;
  global.fetch = async (url, opts) => {
    const u = String(url);
    if (u === 'https://api.calendly.com/users/me') return { ok: true, json: async () => ({ resource: { uri: 'https://api.calendly.com/users/U1' } }) };
    if (u.startsWith('https://api.calendly.com/scheduled_events?')) return { ok: true, json: async () => ({ collection: [{ uri: 'https://api.calendly.com/scheduled_events/E1', start_time: '2027-06-12T15:00:00Z' }] }) };
    if (u.startsWith('https://api.calendly.com/scheduled_events/E1/invitees')) return { ok: true, json: async () => ({ collection: [{ email: 'Fresh@Example.com', status: 'active' }, { email: 'old@example.com', status: 'canceled' }] }) };
    return base(url, opts);
  };
  await ops.saveSettings({ calendly: true });
  s = await ops.runDaily({ now: NOW });
  const fresh = (await db.getCollection('bookings')).find(b => b.id === 'b4');
  ok('a lead who booked on Calendly is marked as booked', s.calendly.booked.length === 1 && fresh.callBookedFor === '2027-06-12T15:00:00Z' && !!fresh.callBookedAt);
  ok('a cancelled booking is ignored', !(await db.getCollection('bookings')).find(b => b.id === 'b3').callBookedFor);
  global.fetch = base; delete process.env.CALENDLY_API_TOKEN;

  /* the admin screen's endpoint */
  const tok = (await callH('auth', 'POST', { action: 'signin', email: 'owner@example.com', password: 'OwnerPass123!' })).body.token;
  let r = await callH('ops-auto', 'GET', null, null);
  ok('the admin screen needs a sign-in', r.code === 401 || r.code === 403);
  r = await callH('ops-auto', 'GET', null, tok);
  ok('an admin sees the switches, wording and saved replies', r.code === 200 && r.body.settings.followups === true && r.body.templates.followup1 && r.body.replies.length >= 3);
  r = await callH('ops-auto', 'POST', { action: 'settings-save', followups: false, templates: { followup1: { subject: 'Hello {first}', body: 'Custom words for {trip}.' } } }, tok);
  ok('an admin can switch one off and change the wording', r.code === 200 && r.body.settings.followups === false && r.body.settings.templates.followup1.subject === 'Hello {first}');
  sent.length = 0;
  r = await callH('ops-auto', 'POST', { action: 'preview', kind: 'followup1' }, tok);
  ok('a sample goes only to the admin', r.code === 200 && sent.length === 1 && /\[Sample\]/.test(sent[0].subject) && sent[0].to[0] === 'owner@example.com');
  r = await callH('ops-auto', 'POST', { action: 'optout-add', email: 'x@example.com' }, tok);
  r = await callH('ops-auto', 'GET', null, tok);
  ok('an opt-out is saved and shown', r.body.optouts.some(x => x.email === 'x@example.com'));
  r = await callH('ops-auto', 'POST', { action: 'reply-save', title: 'Hello', body: 'Hi {name}' }, tok);
  ok('a saved reply can be added', r.code === 200 && r.body.replies.some(x => x.title === 'Hello'));
  r = await callH('ops-auto', 'POST', { action: 'settings-save' }, null);
  ok('settings cannot be changed without signing in', r.code === 401 || r.code === 403);

  console.log(fails ? '\n' + fails + ' FAILED' : '\nALL PASSED');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
