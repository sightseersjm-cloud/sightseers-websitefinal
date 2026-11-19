/* Invoices: "save and email" creates the invoice and emails it to the customer in one step; a failed email keeps the draft. Run with:  npm run test:invoice-send-now */
const Module = require('module');
const store = new Map();
const blob = { put: async (p, b) => { store.set(p, Buffer.from(b)); return {}; }, get: async p => store.has(p) ? { statusCode: 200, stream: new Response(store.get(p)).body } : { statusCode: 404 }, del: async p => { store.delete(p); }, list: async () => ({ blobs: [] }) };
const o = Module._load; Module._load = function (r, ...a) { return r === '@vercel/blob' ? blob : o.call(this, r, ...a); };
Object.assign(process.env, { BLOB_READ_WRITE_TOKEN: 'x', JWT_SECRET: 'test-secret-test-secret-test-secret-12345', OWNER_EMAIL: 'owner@example.com', OWNER_PASSWORD: 'OwnerPass123!', RESEND_API_KEY: 'rk_test', BUSINESS_EMAIL: 'office@example.com' });
const sent = [];
global.fetch = async (url, opts) => { if (String(url).includes('resend.com')) { sent.push(JSON.parse(opts.body)); return { ok: true, status: 200, json: async () => ({ id: 'e' + sent.length }) }; } throw new Error('no network in tests: ' + url); };
const root = require('path').resolve(__dirname, '..') + '/';
const db = require(root + 'api/_lib/db');
const auth = require(root + 'api/_handlers/auth');
const invoices = require(root + 'api/_handlers/invoices');
let fails = 0; const ok = (name, cond) => { console.log((cond ? 'PASS ' : 'FAIL ') + name); if (!cond) fails++; };
function call(h, body, token) {
  return new Promise(r => {
    const res = { headers: {}, status(c) { this.code = c; return this; }, json(x) { r({ code: this.code, body: x }); }, end(x) { r({ code: this.code, body: x }); }, setHeader() {} };
    h({ method: 'POST', url: '/x', query: {}, headers: { host: 'x', 'x-forwarded-for': '10.4.0.1', ...(token ? { authorization: 'Bearer ' + token } : {}) }, body }, res);
  });
}
const base = { customerName: 'Jordan Lee', customerEmail: 'jordan@example.com', dueOn: '2027-07-01', items: [{ description: 'Leaders in Jamaica: deposit', qty: 1, unit: 500 }] };
(async () => {
  const tok = (await call(auth, { action: 'signin', email: 'owner@example.com', password: 'OwnerPass123!' })).body.token;
  let r = await call(invoices, Object.assign({ action: 'create' }, base), tok);
  ok('without "send" the invoice is only saved as a draft and nothing is emailed', r.code === 200 && r.body.invoice.status === 'draft' && sent.length === 0);

  sent.length = 0;
  r = await call(invoices, Object.assign({ action: 'create', send: true }, base), tok);
  const toCustomer = sent.filter(m => (m.to || []).includes('jordan@example.com'));
  ok('"save and email" creates the invoice and marks it sent', r.code === 200 && r.body.sent === true && r.body.invoice.status === 'sent' && r.body.invoice.sentTo === 'jordan@example.com');
  ok('the customer gets the invoice with the PDF attached, and the team gets a copy', toCustomer.length === 1 && toCustomer[0].attachments.length === 1 && sent.some(m => (m.to || []).includes('office@example.com')));

  /* a draft can be edited and emailed in one go */
  const draft = (await call(invoices, Object.assign({ action: 'create' }, base), tok)).body.invoice;
  sent.length = 0;
  r = await call(invoices, Object.assign({ action: 'update', id: draft.id, send: true }, base, { customerEmail: 'new@example.com' }), tok);
  ok('editing a draft with "save and email" sends it to the new address', r.code === 200 && r.body.invoice.status === 'sent' && sent.some(m => (m.to || []).includes('new@example.com')));

  /* when the email fails the work is not lost */
  const real = global.fetch;
  global.fetch = async (url, opts) => String(url).includes('resend.com') ? { ok: false, status: 500, json: async () => ({ message: 'down' }) } : real(url, opts);
  r = await call(invoices, Object.assign({ action: 'create', send: true }, base, { customerName: 'Fail Case' }), tok);
  ok('a failed email says so, and the invoice is kept as a draft', r.code === 502 && r.body.saved === true && r.body.invoice.status === 'draft' && /saved as a draft/.test(r.body.error));
  global.fetch = real;

  r = await call(invoices, Object.assign({ action: 'create', send: true }, base, { customerEmail: 'not-an-email' }), tok);
  ok('a bad email address is refused before anything is saved or sent', r.code === 400);
  r = await call(invoices, Object.assign({ action: 'create', send: true }, base), null);
  ok('only an admin can do this', r.code === 401 || r.code === 403);
  console.log(fails ? '\n' + fails + ' FAILED' : '\nALL PASSED');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
