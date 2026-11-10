/**
 * Admin invoices: create, edit drafts, send (PDF attached), mark paid, and download the PDF.
 * Admin accounts only.
 */
const db = require('../_lib/db');
const { requireAdmin, uid } = require('../_lib/auth');
const inv = require('../_lib/invoice');
const { sendInvoice } = require('../_lib/invoice-send');
const pdf = require('../_lib/invoice-pdf');

const COLL = 'invoices';
const text = (v, n) => String(v == null ? '' : v).trim().slice(0, n);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function clean(body) {
  const items = (Array.isArray(body.items) ? body.items : []).slice(0, 30).map(i => ({
    description: text(i.description, 200), qty: Math.max(0, Number(i.qty) || 0), unit: Math.max(0, Number(i.unit) || 0)
  })).filter(i => i.description);
  return {
    customerName: text(body.customerName, 120),
    customerEmail: text(body.customerEmail, 160).toLowerCase(),
    customerAddress: text(body.customerAddress, 300),
    description: text(body.description, 400),
    issuedOn: text(body.issuedOn, 20),
    dueOn: text(body.dueOn, 20),
    discount: Math.max(0, Number(body.discount) || 0),
    items,
    terms: text(body.terms, 600),
    cardPayment: body.cardPayment === true
  };
}

function check(f) {
  if (!f.customerName) return 'Add the customer name.';
  if (!EMAIL.test(f.customerEmail)) return 'Add a valid customer email address.';
  if (!f.items.length) return 'Add at least one line item.';
  if (!f.items.every(i => i.qty > 0)) return 'Every line needs a quantity above zero.';
  if (!f.dueOn) return 'Choose a due date.';
  return '';
}

function view(i) {
  const t = inv.totals(i.items, i.discount);
  return Object.assign({}, i, { total: t.total, subtotal: t.subtotal, discountApplied: t.discount });
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'OPTIONS') return res.status(200).end();
    const user = requireAdmin(req, res);
    if (!user) return;

    if (req.method === 'GET') {
      /* ?pdf=ID downloads the invoice as a PDF */
      const id = req.query && req.query.pdf;
      if (id) {
        const i = (await db.getCollection(COLL)).find(x => x.id === id);
        if (!i) return res.status(404).json({ error: 'That invoice was not found.' });
        const buf = await pdf.build(i);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="Invoice-' + i.number + '.pdf"');
        return res.status(200).end(buf);
      }
      const list = (await db.getCollection(COLL)).slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
      return res.status(200).json({ ok: true, invoices: list.map(view), bank: inv.BANKS });
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const body = req.body || {};
    const action = body.action || 'create';
    const all = await db.getCollection(COLL);

    if (action === 'create') {
      const f = clean(body);
      const err = check(f);
      if (err) return res.status(400).json({ error: err });
      const issued = f.issuedOn || new Date().toISOString().slice(0, 10);
      const i = Object.assign(f, { id: uid(), number: inv.nextNumber(all, Number(issued.slice(0, 4)) || new Date().getFullYear()), issuedOn: issued, status: 'draft', createdAt: new Date().toISOString(), createdBy: text(user.name || user.email, 120) });
      await db.addToCollection(COLL, i);
      return res.status(200).json({ ok: true, invoice: view(i) });
    }

    const cur = all.find(x => x.id === text(body.id, 80));
    if (!cur) return res.status(404).json({ error: 'That invoice was not found.' });

    if (action === 'update') {
      if (cur.status !== 'draft') return res.status(400).json({ error: 'A sent invoice cannot be changed. Create a new one instead.' });
      const f = clean(body);
      const err = check(f);
      if (err) return res.status(400).json({ error: err });
      const up = await db.updateInCollection(COLL, cur.id, f);
      return res.status(200).json({ ok: true, invoice: view(up) });
    }

    if (action === 'send') {
      if (cur.status === 'paid') return res.status(400).json({ error: 'This invoice is already paid.' });
      const r = await sendInvoice(cur, { stripeUrl: '' });
      if (!r.ok) return res.status(502).json({ error: r.error || 'The invoice email did not go through. Try again.' });
      const up = await db.updateInCollection(COLL, cur.id, { status: cur.status === 'draft' ? 'sent' : cur.status, sentAt: new Date().toISOString(), sentTo: cur.customerEmail });
      return res.status(200).json({ ok: true, invoice: view(up) });
    }

    if (action === 'mark-paid') {
      const method = body.method === 'card' ? 'card' : 'bank transfer';
      const up = await db.updateInCollection(COLL, cur.id, { status: 'paid', paidAt: new Date().toISOString(), paidBy: method });
      return res.status(200).json({ ok: true, invoice: view(up) });
    }

    if (action === 'delete') {
      if (cur.status !== 'draft') return res.status(400).json({ error: 'Only a draft can be deleted. Sent invoices are kept as a record.' });
      await db.removeFromCollection(COLL, cur.id);
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (err) {
    console.error('invoices error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};
