// Invoice email: the PDF is attached to the customer email and the team copy; the email body is right.
process.env.RESEND_API_KEY = 'rk_test';
process.env.BUSINESS_EMAIL = 'office@example.com';
const sent = [];
const realLog = console.log; console.log = () => {};
global.fetch = async (url, opts) => {
  if (String(url).includes('resend.com')) { sent.push(JSON.parse(opts.body)); return { ok: true, status: 200, json: async () => ({ id: 'e' }) }; }
  throw new Error('offline');
};
const { sendInvoice } = require('../api/_lib/invoice-send.js');
const s = { number: 'SS-2026-0001', issuedOn: '10 Nov 2026', dueOn: '10 Dec 2026', customerName: 'Jordan Lee', customerEmail: 'jordan@example.com', description: 'Leaders in Jamaica: deposit (30%)', items: [{ description: 'Leaders in Jamaica deposit (30%)', qty: 1, unit: 568.5 }], discount: 0 };
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; realLog('FAIL ' + m); } };
(async () => {
  const r = await sendInvoice(s);
  console.log = realLog;
  ok(r.ok === true, 'send reports success');
  ok(sent.length === 2, 'two emails: customer and team copy');
  const c = sent[0];
  ok(c.to[0] === 'jordan@example.com', 'customer is the recipient');
  ok(c.subject.startsWith('Invoice SS-2026-0001'), 'subject carries the invoice number');
  ok(Array.isArray(c.attachments) && c.attachments.length === 1, 'customer email has one attachment');
  const a = c.attachments[0];
  ok(a.filename === 'Invoice-SS-2026-0001.pdf', 'attachment filename');
  ok(Buffer.from(a.content, 'base64').slice(0, 5).toString() === '%PDF-', 'attachment is a real PDF');
  ok(sent[1].to[0] === 'office@example.com' && sent[1].attachments.length === 1, 'team copy carries the PDF');
  ok(c.html.includes('Here is your invoice') && c.text.includes('put the invoice number SS-2026-0001'), 'email body wording');
  realLog(fails ? fails + ' FAILED' : 'ALL PASSED');
  process.exit(fails ? 1 : 0);
})();
