/**
 * Admin receipts: issue a receipt (on its own or from an invoice), download it as a signed PDF, email it, and void it.
 * A receipt is a record of money received, so it is never edited: a mistake is voided and a new receipt issued.
 * Admin accounts only. The public check that a QR code opens lives in receipt-verify.js.
 */
const db = require('../_lib/db');
const { requireAdmin, uid } = require('../_lib/auth');
const R = require('../_lib/receipt');
const pdf = require('../_lib/receipt-pdf');
const { sendEmail, BUSINESS_EMAIL } = require('../_lib/email');
const { configured: signingOn } = require('../_lib/receipt-sign');

const COLL = 'receipts';
const text = (v, n) => String(v == null ? '' : v).trim().slice(0, n);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const num = v => Math.max(0, Math.round((Number(v) || 0) * 100) / 100);

/* receipts issued outside the website are added once, so they show in the list and their numbers are never reused */
async function all() {
  const list = await db.getCollection(COLL);
  const missing = R.LEGACY.filter(l => !list.some(r => r.number === l.number));
  if (missing.length) {
    const merged = list.concat(missing.map(l => Object.assign({}, l)));
    try { await db.setCollection(COLL, merged); } catch (e) { /* listing still works when the write fails */ }
    return merged;
  }
  return list;
}

function clean(body) {
  const items = (Array.isArray(body.items) ? body.items : []).slice(0, 30).map(i => ({
    description: text(i.description, 200), detail: text(i.detail, 200), qty: num(i.qty), unit: num(i.unit)
  })).filter(i => i.description);
  const method = R.METHODS.indexOf(String(body.method || '').toLowerCase()) >= 0 ? String(body.method).toLowerCase() : 'bank transfer';
  return {
    invoiceId: text(body.invoiceId, 80),
    bookingCode: text(body.bookingCode, 40).toUpperCase(),
    customerName: text(body.customerName, 120),
    careOf: text(body.careOf, 120),
    customerEmail: text(body.customerEmail, 160).toLowerCase(),
    customerAddress: text(body.customerAddress, 300),
    title: text(body.title, 200),
    eventName: text(body.eventName || body.title, 120),
    currency: body.currency === 'USD' ? 'USD' : 'JMD',
    items,
    discount: num(body.discount),
    amountReceived: num(body.amountReceived),
    receivedOn: text(body.receivedOn, 10),
    method,
    reference: text(body.reference, 60),
    balanceNote: text(body.balanceNote, 200)
  };
}

function check(f) {
  if (!f.customerName) return 'Add who the payment was received from.';
  if (f.customerEmail && !EMAIL.test(f.customerEmail)) return 'The email address does not look right.';
  if (!f.items.length) return 'Add at least one line item.';
  if (!f.items.every(i => i.qty > 0)) return 'Every line needs a quantity above zero.';
  if (!(f.amountReceived > 0)) return 'Enter the amount received.';
  if (!DATE.test(f.receivedOn)) return 'Choose the date the payment was received.';
  return '';
}

function view(r) {
  const f = R.figures(r);
  return Object.assign({}, r, { total: f.total, balance: f.balance, label: f.label, verifyUrl: R.verifyUrl(r) });
}

async function emailNow(rec) {
  if (!rec.customerEmail) return { ok: false, error: 'This receipt has no email address. Download the PDF and send it yourself.' };
  const buf = await pdf.build(rec);
  const parts = R.emailParts(rec);
  const attachments = [{ filename: 'Receipt-' + rec.number + '.pdf', content: buf.toString('base64') }];
  const sent = await sendEmail({ to: rec.customerEmail, replyTo: R.BIZ.email, subject: parts.subject, html: parts.html, text: parts.text, attachments });
  if (sent && sent.ok === false) return { ok: false, error: 'The receipt email did not go through.' };
  await sendEmail({ to: BUSINESS_EMAIL, replyTo: R.BIZ.email, subject: 'Copy: ' + parts.subject + ' (to ' + rec.customerEmail + ')', html: parts.html, text: parts.text, attachments });
  const up = await db.updateInCollection(COLL, rec.id, { sentAt: new Date().toISOString(), sentTo: rec.customerEmail });
  return { ok: true, receipt: up || rec };
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'OPTIONS') return res.status(200).end();
    const user = requireAdmin(req, res);
    if (!user) return;

    if (req.method === 'GET') {
      const list = await all();
      /* ?pdf=ID downloads the receipt as a PDF */
      const id = req.query && req.query.pdf;
      if (id) {
        const r = list.find(x => x.id === id);
        if (!r) return res.status(404).json({ error: 'That receipt was not found.' });
        const buf = await pdf.build(r);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="Receipt-' + r.number + '.pdf"');
        return res.status(200).end(buf);
      }
      const sorted = list.slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
      return res.status(200).json({ ok: true, receipts: sorted.map(view), signing: signingOn(), methods: R.METHODS });
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const body = req.body || {};
    const action = body.action || 'create';
    const list = await all();

    if (action === 'create') {
      const f = clean(body);
      const err = check(f);
      if (err) return res.status(400).json({ error: err });
      const issued = DATE.test(text(body.issuedOn, 10)) ? text(body.issuedOn, 10) : new Date().toISOString().slice(0, 10);
      const number = R.nextNumber(list, Number(issued.slice(0, 4)) || new Date().getFullYear());
      const r = Object.assign(f, {
        id: uid(), number, verifyCode: R.makeVerifyCode(number), status: 'valid', issuedOn: issued,
        bookingCode: R.nextBookingCode(list, f.bookingCode),
        createdAt: new Date().toISOString(), createdBy: text(user.name || user.email, 120)
      });
      r.previousPaid = R.previousPaid(list, r);
      await db.addToCollection(COLL, r);
      if (body.send === true) {
        const sent = await emailNow(r);
        if (!sent.ok) return res.status(502).json({ error: 'The receipt was issued, but the email did not go through. ' + (sent.error || '') + ' Press Email to customer to try again.', saved: true, receipt: view(r) });
        return res.status(200).json({ ok: true, sent: true, receipt: view(sent.receipt) });
      }
      return res.status(200).json({ ok: true, receipt: view(r) });
    }

    const cur = list.find(x => x.id === text(body.id, 80));
    if (!cur) return res.status(404).json({ error: 'That receipt was not found.' });

    if (action === 'send') {
      if (cur.status === 'void') return res.status(400).json({ error: 'A void receipt cannot be sent.' });
      const sent = await emailNow(cur);
      if (!sent.ok) return res.status(502).json({ error: sent.error });
      return res.status(200).json({ ok: true, receipt: view(sent.receipt) });
    }

    if (action === 'void') {
      if (cur.status === 'void') return res.status(400).json({ error: 'This receipt is already void.' });
      const reason = text(body.reason, 200);
      const up = await db.updateInCollection(COLL, cur.id, { status: 'void', voidedAt: new Date().toISOString(), voidReason: reason, voidedBy: text(user.name || user.email, 120) });
      return res.status(200).json({ ok: true, receipt: view(up) });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (err) {
    console.error('receipts error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};
