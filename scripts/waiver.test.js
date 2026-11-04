/* Participant waivers: refused when incomplete, the signed PDF goes to the team AND to the guest, the Inbox record
   keeps no medical answers, a medical "yes" is flagged, the honeypot is ignored, and the page and the wording agree.
   Run with:  npm run test:waiver */
const Module = require('module');
const store = new Map();
const blob = { put: async (p, b) => { store.set(p, Buffer.from(b)); return {}; }, get: async p => store.has(p) ? { statusCode: 200, stream: new Response(store.get(p)).body } : { statusCode: 404 }, del: async p => { store.delete(p); }, list: async () => ({ blobs: [] }) };
const orig = Module._load; Module._load = function (r, ...a) { return r === '@vercel/blob' ? blob : orig.call(this, r, ...a); };
process.env.BLOB_READ_WRITE_TOKEN = 'x'; process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-12345';
process.env.RESEND_API_KEY = 'test';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const calls = [];
let failTo = null;
global.fetch = async (u, o) => { const b = JSON.parse(o.body); calls.push(b); const bad = failTo && b.to && b.to.includes(failTo); return bad ? { ok: false, status: 422, json: async () => ({ message: 'rejected' }) } : { ok: true, status: 200, json: async () => ({ id: 'e' + calls.length }) }; };
const handler = require(path.join(root, 'api/_handlers/waiver'));
const db = require(path.join(root, 'api/_lib/db'));
const { WAIVER, packageEventId } = require(path.join(root, 'api/_lib/waiver'));
let fails = 0;
const ok = (name, cond, extra) => { console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); if (!cond) fails++; };
const PDF = 'JVBERi0xLjMK' + 'A'.repeat(3000);
const send = (body, method) => new Promise(r => { const res = { status(c) { this.c = c; return this; }, json(x) { r({ code: this.c, body: x }); }, end() { r({ code: this.c }); } };
  handler({ method: method || 'POST', headers: {}, url: '/api/waiver', query: {}, body: Object.assign({ name: 'Ann Brown', email: 'Ann@Example.com', phone: '+1 876 555 0000', event: 'summit', ref: 'ss-2026-014', company: 'Acme Ltd', agreed: true, over18: true, medicalFlag: false, version: WAIVER.version, pdfBase64: PDF }, body || {}) }, res).catch(e => r({ code: 500, body: { error: String(e) } })); });

(async () => {
  let r = await send({ name: '' }); ok('a name is required', r.code === 400);
  r = await send({ email: 'nope' }); ok('a valid email is required', r.code === 400);
  r = await send({ phone: '' }); ok('a phone number is required', r.code === 400);
  r = await send({ agreed: false }); ok('the guest must agree', r.code === 400);
  r = await send({ over18: false }); ok('the guest must confirm they are 18 or older', r.code === 400);
  r = await send({ pdfBase64: '' }); ok('the signed PDF is required', r.code === 400);
  r = await send({ pdfBase64: 'bm90IGEgcGRm' + 'A'.repeat(3000) }); ok('a file that is not a PDF is refused', r.code === 400);
  ok('nothing was emailed for refused requests', calls.length === 0);
  r = await send({ website: 'http://spam.example' }); ok('the hidden spam field is ignored without sending anything', r.code === 200 && calls.length === 0);

  r = await send({});
  const toGuest = calls.find(c => c.to && c.to.includes('ann@example.com')), toTeam = calls.find(c => !(c.to && c.to.includes('ann@example.com')));
  ok('a complete waiver is accepted', r.code === 201 && r.body.ok && r.body.teamCopy && r.body.guestCopy, JSON.stringify(r.body));
  ok('the guest gets their own signed copy', !!toGuest && toGuest.attachments && toGuest.attachments.length === 1 && /\.pdf$/.test(toGuest.attachments[0].filename) && /Ann/.test(toGuest.html));
  ok('the team gets the signed PDF too', !!toTeam && toTeam.attachments && toTeam.attachments[0].content === PDF && /ss-2026-014/i.test(toTeam.html));
  ok('the booking reference is saved in capitals', (await db.getCollection('signed-waivers')).some(w => w.ref === 'SS-2026-014'));
  const inbox = (await db.getCollection('contact-messages')).find(m => /Signed waiver: Ann Brown/.test(m.subject));
  ok('it appears in the Inbox without any medical answers', !!inbox && !/pregnan|medication|allerg/i.test(inbox.message) && /Medical flag: no/.test(inbox.message));

  calls.length = 0; r = await send({ name: 'Bob Green', email: 'bob@example.com', medicalFlag: true });
  ok('a medical "yes" is flagged for the team', r.code === 201 && calls.some(c => /YES/.test(c.html || '')));

  calls.length = 0; failTo = 'carl@example.com'; r = await send({ name: 'Carl Dee', email: 'carl@example.com' });
  ok('if only the guest copy fails, the team still has it and the guest is told', r.code === 201 && r.body.teamCopy === true && r.body.guestCopy === false);
  failTo = null;

  const all = await db.getCollection('signed-waivers');
  ok('the waivers sent so far were kept (spam and refused ones were not)', all.filter(w => /Ann Brown|Bob Green|Carl Dee/.test(w.name)).length === 3);
  const get = await send({}, 'GET'); ok('listing waivers needs the Inbox permission', get.code === 401 || get.code === 403, String(get.code));

  // every package has its own waiver, built from the package's real activities
  const PK = require(path.join(root, 'api/_data/packages.json'));
  Object.keys(PK).forEach(k => {
    const e = WAIVER.events.find(x => x.id === packageEventId(k));
    const titles = []; PK[k].days.forEach(d => ['am', 'pm'].forEach(sl => { const it = d[sl]; if (it && it.meta && !/at leisure|included/i.test(it.meta)) titles.push(it.title); }));
    ok(k + ': has its own waiver naming the package and its activities', !!e && e.activities.includes(PK[k].title) && titles.every(t => e.activities.includes(t)));
  });
  calls.length = 0; r = await send({ name: 'Dee Lee', email: 'dee@example.com', event: packageEventId('Jamaica'), ref: 'ss-j-1' });
  ok('a package waiver is accepted and filed under that package', r.code === 201 && (await db.getCollection('signed-waivers')).some(w => w.name === 'Dee Lee' && w.event === 'pkg-jamaica') && calls.some(c => /Jamaica 5-Day Signature package/.test(c.html || '')));
  ok('the booking confirmation email links each traveller to their package waiver', /\/waiver\?event=/.test(fs.readFileSync(path.join(root, 'api/stripe-webhook.js'), 'utf8')) && /Sign your waiver/.test(fs.readFileSync(path.join(root, 'api/stripe-webhook.js'), 'utf8')));

  // the page, the wording file and the build agree
  const html = fs.readFileSync(path.join(root, 'Design_Reference.html'), 'utf8');
  const i = html.indexOf('window.WAIVER='), j = html.indexOf(';\n', i);
  ok('the wording on the page is the wording in api/_data/waiver.json', JSON.stringify(JSON.parse(html.slice(i + 'window.WAIVER='.length, j))) === JSON.stringify(WAIVER));
  ok('no lawyer placeholders appear in the wording guests read', !/\[[^\]]*(lawyer|confirm)[^\]]*\]/i.test(JSON.stringify(WAIVER.clauses)));
  ok('the page is a route and is linked from the menu and the footer', /'waiver':'\/waiver'/.test(html) && (html.match(/nav\('waiver'\)/g) || []).length >= 3);
  ok('each medical question has its own details box that opens on Yes', html.includes('wvmdBox') && html.includes('wvMedToggle') && !html.includes('wvMedDetails'));
  ok('the waiver has no progress bar', !html.includes('wvProg') && !html.includes('ss-prog'));
  ok('the package route line and animated total respect reduced motion', html.includes('cpkg-draw') && html.includes('prefers-reduced-motion') && html.includes('__cpkgPrev'));
  ok('the waiver page sits with the other pages, before the footer (otherwise it opens below the footer)', html.indexOf('id="p-waiver"') > 0 && html.indexOf('id="p-waiver"') < html.indexOf('<footer class="footer">'));
  ok('the built page exists at /waiver', fs.existsSync(path.join(root, 'public/waiver/index.html')));
  console.log(fails ? '\n' + fails + ' FAILED' : '\nALL PASSED');
  process.exit(fails ? 1 : 0);
})();
