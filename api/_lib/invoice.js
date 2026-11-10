/**
 * Invoices: numbering, totals and the branded invoice and email wording.
 * Pure functions only; storage and sending live in the admin handler.
 */
const trip = require('./trip');

const LOGO = 'https://www.sightseerscaribbean.com/assets/inline/1ba92aa926.png';
const BIZ = { name: 'Sight Seers Caribbean Adventures', phone: '+1 (876) 465-0630', email: 'info@sightseerscaribbean.com', site: 'sightseerscaribbean.com' };

/* Bank details are shown on every invoice. Placeholders until the real details are added. */
function bankDetails() {
  try {
    const b = JSON.parse(process.env.INVOICE_BANK || 'null');
    if (b && typeof b === 'object') return b;
  } catch (e) { /* fall through to the placeholder */ }
  return { bank: '[Bank name to be added]', account: '[Account name to be added]', number: '[Account number to be added]', code: '[Routing or SWIFT code to be added]' };
}

/* SS-2026-0001, counting up for each year with no gaps or reuse */
function nextNumber(invoices, year) {
  const y = String(year || new Date().getFullYear());
  const used = (invoices || []).map(i => String(i.number || '')).filter(n => n.startsWith('SS-' + y + '-')).map(n => parseInt(n.slice(-4), 10)).filter(n => n > 0);
  const n = (used.length ? Math.max.apply(null, used) : 0) + 1;
  return 'SS-' + y + '-' + String(n).padStart(4, '0');
}

const money = n => 'US$' + (Math.round((Number(n) || 0) * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function totals(items, discount) {
  const lines = (items || []).map(i => {
    const qty = Math.max(0, Number(i.qty) || 0), unit = Math.max(0, Number(i.unit) || 0);
    return { description: String(i.description || '').slice(0, 200), qty, unit, amount: Math.round(qty * unit * 100) / 100 };
  });
  const subtotal = Math.round(lines.reduce((s, l) => s + l.amount, 0) * 100) / 100;
  const disc = Math.min(subtotal, Math.max(0, Number(discount) || 0));
  return { lines, subtotal, discount: disc, total: Math.round((subtotal - disc) * 100) / 100 };
}

function esc(x) { return trip.esc(x); }

/* the invoice as a page: the same look as the tent rental agreement and the booking confirmations */
function invoiceHtml(inv, opts) {
  const o = opts || {};
  const t = totals(inv.items, inv.discount);
  const bank = bankDetails();
  const rows = t.lines.map((l, i) => `<tr style="background:${i % 2 ? '#f6faf7' : '#fff'}"><td style="padding:10px 12px;color:#333">${esc(l.description)}</td><td style="padding:10px 12px;text-align:right;color:#333">${l.qty}</td><td style="padding:10px 12px;text-align:right;color:#333">${money(l.unit)}</td><td style="padding:10px 12px;text-align:right;color:#063a63;font-weight:700">${money(l.amount)}</td></tr>`).join('');
  const pay = o.stripeUrl
    ? `<p style="margin:18px 0"><a href="${esc(o.stripeUrl)}" style="display:inline-block;background:#ef8731;color:#fff;text-decoration:none;font-weight:700;padding:13px 24px;letter-spacing:1px;text-transform:uppercase;font-size:13px">Pay ${money(t.total)} by card</a></p>`
    : '';
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Invoice ${esc(inv.number)}</title></head>
<body style="margin:0;background:#eef3f7;font-family:Raleway,Arial,sans-serif;color:#12293d">
<div style="max-width:720px;margin:24px auto;background:#fff;border:1px solid #dfe7ee;border-radius:0;box-shadow:0 18px 48px rgba(6,58,99,.10)">
  <div style="height:6px;background:linear-gradient(90deg,#70c257 62%,#ef8731 62%)"></div>
  <div style="padding:28px 32px 18px;display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap">
    <img src="${LOGO}" alt="Sight Seers Caribbean Adventures" width="170" style="display:block;width:170px;height:auto">
    <div style="text-align:right">
      <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#ef8731;font-weight:800">Invoice</div>
      <div style="font-family:Georgia,serif;font-size:26px;color:#063a63;font-weight:700">${esc(inv.number)}</div>
      <div style="font-size:12px;color:#5b6b7a;margin-top:4px">Issued ${esc(inv.issuedOn || '')}${inv.dueOn ? ' &middot; Due ' + esc(inv.dueOn) : ''}</div>
    </div>
  </div>
  <div style="padding:0 32px 8px;display:flex;justify-content:space-between;gap:24px;flex-wrap:wrap">
    <div><div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#70c257;font-weight:800;margin-bottom:4px">Billed to</div><div style="font-size:15px;font-weight:700">${esc(inv.customerName || '')}</div><div style="font-size:13px;color:#5b6b7a">${esc(inv.customerEmail || '')}</div>${inv.customerAddress ? `<div style="font-size:13px;color:#5b6b7a;white-space:pre-line">${esc(inv.customerAddress)}</div>` : ''}</div>
    <div style="text-align:right;font-size:13px;color:#5b6b7a">${esc(BIZ.name)}<br>${esc(BIZ.phone)}<br>${esc(BIZ.email)}</div>
  </div>
  ${inv.description ? `<p style="margin:14px 32px 0;font-size:14px;color:#33424f">${esc(inv.description)}</p>` : ''}
  <table style="width:calc(100% - 64px);margin:18px 32px 0;border-collapse:collapse;font-size:14px">
    <thead><tr style="background:#063a63;color:#fff"><th style="padding:10px 12px;text-align:left;font-size:11px;letter-spacing:1.2px;text-transform:uppercase;font-weight:700">Description</th><th style="padding:10px 12px;text-align:right;font-size:11px;letter-spacing:1.2px;text-transform:uppercase;font-weight:700">Qty</th><th style="padding:10px 12px;text-align:right;font-size:11px;letter-spacing:1.2px;text-transform:uppercase;font-weight:700">Price</th><th style="padding:10px 12px;text-align:right;font-size:11px;letter-spacing:1.2px;text-transform:uppercase;font-weight:700">Amount</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <table style="width:calc(100% - 64px);margin:8px 32px 0;font-size:14px">
    <tr><td style="padding:6px 12px;text-align:right;color:#5b6b7a">Subtotal</td><td style="padding:6px 12px;text-align:right;width:130px">${money(t.subtotal)}</td></tr>
    ${t.discount ? `<tr><td style="padding:6px 12px;text-align:right;color:#5b6b7a">Discount</td><td style="padding:6px 12px;text-align:right;width:130px">-${money(t.discount)}</td></tr>` : ''}
    <tr><td style="padding:12px 12px;text-align:right;font-weight:800;color:#063a63;font-size:16px">Total due</td><td style="padding:12px 12px;text-align:right;width:130px;font-family:Georgia,serif;font-size:20px;color:#063a63;font-weight:700">${money(t.total)}</td></tr>
  </table>
  <div style="margin:18px 32px 0;padding:16px 18px;background:#f3faf0;border-left:4px solid #70c257;font-size:13px;line-height:1.7;color:#33424f">
    <b style="color:#063a63">Pay by bank transfer</b><br>
    Bank: ${esc(bank.bank)}<br>Account name: ${esc(bank.account)}<br>Account number: ${esc(bank.number)}<br>Routing or SWIFT: ${esc(bank.code)}<br>
    Reference: <b>${esc(inv.number)}</b>
  </div>
  ${pay ? `<div style="margin:0 32px;text-align:center">${pay}</div>` : ''}
  ${inv.terms ? `<p style="margin:18px 32px 0;font-size:12px;line-height:1.6;color:#5b6b7a">${esc(inv.terms)}</p>` : ''}
  <div style="margin:22px 0 0;padding:14px 32px;background:#063a63;color:#fff;font-size:12px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px">
    <span>${esc(BIZ.name)} &middot; ${esc(BIZ.phone)} &middot; ${esc(BIZ.email)}</span><span>${esc(BIZ.site)}</span>
  </div>
</div></body></html>`;
}

/* the email body that goes with the invoice */
function emailParts(inv, opts) {
  const t = totals(inv.items, inv.discount);
  const first = String(inv.customerName || '').trim().split(/\s+/)[0] || 'there';
  const subject = 'Invoice ' + inv.number + ' from Sight Seers Caribbean Adventures';
  const text = [
    'Hello ' + first + ',',
    '',
    'Please find your invoice ' + inv.number + ' attached, for ' + money(t.total) + (inv.dueOn ? ', due ' + inv.dueOn : '') + '.',
    '',
    inv.description ? inv.description : '',
    '',
    opts && opts.stripeUrl ? 'Pay by card: ' + opts.stripeUrl : 'Pay by bank transfer, using the bank details on the invoice and the reference ' + inv.number + '.',
    '',
    'Please let us know if you have any questions. We look forward to hosting you.',
    '',
    BIZ.name,
    BIZ.phone + ' | ' + BIZ.email
  ].filter((l, i, a) => !(l === '' && a[i - 1] === '')).join('\n');
  const html = `<div style="font-family:Raleway,Arial,sans-serif;max-width:620px;margin:0 auto;color:#12293d">
  <div style="background:linear-gradient(135deg,#063a63,#0a5678);color:#fff;padding:24px;border-radius:0">
    <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#70c257;font-weight:800">Sight Seers Caribbean Adventures</div>
    <div style="font-family:Georgia,serif;font-size:22px;margin-top:6px">Invoice ${esc(inv.number)}</div>
  </div>
  <div style="border:1px solid #dfe7ee;border-top:none;padding:24px;font-size:14px;line-height:1.7;color:#33424f">
    <p style="margin:0 0 12px">Hello ${esc(first)},</p>
    <p style="margin:0 0 12px">Please find your invoice <b>${esc(inv.number)}</b> attached, for <b>${money(t.total)}</b>${inv.dueOn ? ', due <b>' + esc(inv.dueOn) + '</b>' : ''}.</p>
    ${inv.description ? `<p style="margin:0 0 12px">${esc(inv.description)}</p>` : ''}
    ${opts && opts.stripeUrl
      ? `<p style="margin:18px 0"><a href="${esc(opts.stripeUrl)}" style="display:inline-block;background:#ef8731;color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;text-transform:uppercase;font-size:13px;letter-spacing:1px">Pay ${money(t.total)} by card</a></p>`
      : `<p style="margin:0 0 12px">To pay by bank transfer, use the bank details on the invoice and quote the reference <b>${esc(inv.number)}</b>.</p>`}
    <p style="margin:0 0 12px">Please reply to this email if you have any questions. We look forward to hosting you.</p>
    <div style="margin-top:18px;padding:14px 16px;background:rgba(112,194,87,.08);font-size:13px;color:#063a63"><b>${esc(BIZ.name)}</b><br>${esc(BIZ.phone)} &middot; ${esc(BIZ.email)}</div>
  </div></div>`;
  return { subject, text, html };
}

module.exports = { nextNumber, totals, money, invoiceHtml, emailParts, bankDetails, BIZ };
