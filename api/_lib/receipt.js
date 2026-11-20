/**
 * Receipts: numbering, money, balances, verification codes, the public verification page and the email wording.
 * Pure functions only; storage, the PDF and sending live elsewhere.
 */
const crypto = require('crypto');
const inv = require('./invoice');

const BIZ = {
  name: 'Sight Seers Caribbean Adventures',
  address: 'Turtle Beach Road, Ocho Rios, Jamaica',
  phones: ['+1 (876) 465-0630', '+1 (347) 291-6868'],
  email: 'info@sightseerscaribbean.com',
  site: 'sightseerscaribbean.com',
  origin: 'https://www.sightseerscaribbean.com',
  regNo: '6883/2024',
  signatory: 'Daineroy Allen',
  signatoryTitle: 'Managing Director, Sight Seers Caribbean Adventures'
};

const CURRENCIES = { JMD: 'J$', USD: 'US$' };
const METHODS = ['bank transfer', 'card', 'cash', 'cheque'];

/* receipts already issued outside the website, kept so their printed QR codes keep working */
const LEGACY = [{
  id: 'legacy-SS-2026-R0002',
  number: 'SS-2026-R0002',
  verifyCode: 'SS-2026-R0002.html',
  legacy: true,
  status: 'valid',
  bookingCode: 'SUM-SGS-0926',
  customerName: 'Sutherland Global Services',
  careOf: 'Kurt Stout',
  customerEmail: '',
  customerAddress: 'Hatfield, Mandeville\nManchester, Jamaica',
  title: 'The Summit Challenge: Corporate Team Event, St. Elizabeth · Team of 9',
  eventName: 'The Summit Challenge · Corporate Team Event',
  currency: 'JMD',
  items: [
    { description: 'Summit Challenge Activity Pass · Action Combo', detail: 'Wall climbing, laser tag, ATV convoy, farm train and team games', qty: 9, unit: 11500 },
    { description: 'Coach Pass', detail: 'Mandeville to St. Elizabeth and return', qty: 1, unit: 38000 },
    { description: 'Sight Seers Team Lead and guide', detail: 'Facilitation, scoring, logistics and liaison', qty: 1, unit: 15000 },
    { description: 'Branded team shirts', detail: '', qty: 9, unit: 1200 }
  ],
  discount: 0,
  amountReceived: 51000,
  previousPaid: 0,
  receivedOn: '2026-11-14',
  issuedOn: '2026-11-20',
  method: 'bank transfer',
  reference: '274931353606794',
  balanceNote: 'The balance is due 14 days before the event.',
  createdAt: '2026-11-20T18:00:00.000Z',
  createdBy: 'Daineroy Allen'
}];

function money(n, currency) {
  const sym = CURRENCIES[currency] || 'J$';
  const v = Math.round((Number(n) || 0) * 100) / 100;
  return (v < 0 ? '-' : '') + sym + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const round = n => Math.round((Number(n) || 0) * 100) / 100;

/* SS-2026-R0001, counting up for each year with no gaps or reuse; receipts issued outside the site count too */
function nextNumber(receipts, year) {
  const y = String(year || new Date().getFullYear());
  const pre = 'SS-' + y + '-R';
  const used = (receipts || []).concat(LEGACY).map(r => String(r.number || '')).filter(n => n.startsWith(pre)).map(n => parseInt(n.slice(pre.length), 10)).filter(n => n > 0);
  const n = (used.length ? Math.max.apply(null, used) : 0) + 1;
  return pre + String(n).padStart(4, '0');
}

/* the verification address cannot be guessed from the receipt number alone */
function makeVerifyCode(number) {
  const abc = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(10);
  let k = '';
  for (let i = 0; i < 10; i++) k += abc[bytes[i] % abc.length];
  return number + '-' + k;
}

function verifyUrl(r) { return BIZ.origin + '/verify/' + encodeURIComponent(r.verifyCode); }

/* booking codes count up from the first one issued (SUM-SGS-0926): the number at the end goes up by one each time.
   Leave the code empty for SS-0927; type a prefix such as SUM-SGS for SUM-SGS-0927; type a full code (ending in a number)
   to record another payment against an existing booking. */
const BOOKING_START = 926;
function nextBookingCode(receipts, typed) {
  const t = String(typed || '').trim().toUpperCase().replace(/\s+/g, '-').replace(/[^A-Z0-9-]/g, '');
  if (/\d{3,}$/.test(t)) return t;
  const used = (receipts || []).concat(LEGACY).map(r => /(\d{3,})$/.exec(String(r.bookingCode || ''))).filter(Boolean).map(m => parseInt(m[1], 10));
  const n = Math.max(BOOKING_START - 1, used.length ? Math.max.apply(null, used) : 0) + 1;
  return (t ? t.replace(/-+$/, '') : 'SS') + '-' + String(n).padStart(4, '0');
}

/* valid receipts paid earlier against the same booking, in the same currency */
function previousPaid(all, rec) {
  if (!rec.bookingCode) return 0;
  return round((all || []).concat(LEGACY.filter(l => !(all || []).some(a => a.number === l.number)))
    .filter(r => r.id !== rec.id && r.status !== 'void' && r.bookingCode === rec.bookingCode && (r.currency || 'JMD') === (rec.currency || 'JMD') && String(r.createdAt || '') < String(rec.createdAt || '9'))
    .reduce((s, r) => s + (Number(r.amountReceived) || 0), 0));
}

/* every figure on the receipt, from its lines and payments */
function figures(rec) {
  const t = inv.totals(rec.items, rec.discount);
  const prev = round(rec.previousPaid);
  const received = round(rec.amountReceived);
  const balance = round(Math.max(0, t.total - prev - received));
  const overpaid = round(Math.max(0, prev + received - t.total));
  let label;
  if (rec.status === 'void') label = 'VOID';
  else if (balance <= 0) label = 'PAID IN FULL';
  else if (prev > 0) label = 'PAYMENT RECEIVED';
  else label = 'DEPOSIT RECEIVED';
  return { lines: t.lines, subtotal: t.subtotal, discount: t.discount, total: t.total, previous: prev, received, balance, overpaid, label };
}

function maskRef(ref) {
  const s = String(ref || '').replace(/\s+/g, '');
  if (!s) return '';
  return s.length <= 4 ? s : 'ending ' + s.slice(-4);
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
/* 2026-11-14 to "14 Nov 2026" (short) or "14 November 2026" (long); anything else is shown as typed */
function fmtDate(d, long) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(d || ''));
  if (!m) return String(d || '');
  const name = MONTHS[Number(m[2]) - 1] || '';
  return Number(m[3]) + ' ' + (long ? name : name.slice(0, 3)) + ' ' + m[1];
}

function cap(s) { s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); }

function esc(x) {
  return String(x == null ? '' : x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* the public page a QR scan opens: only what is needed to check a printed receipt */
function verifyPageHtml(rec) {
  const found = !!rec;
  const f = found ? figures(rec) : null;
  const isVoid = found && rec.status === 'void';
  const head = !found
    ? { cls: 'bad', icon: '!', h: 'Receipt not found', p: 'We could not find a receipt for this code. Please contact us to check it.', badge: 'NOT VERIFIED' }
    : isVoid
      ? { cls: 'bad', icon: '!', h: 'This receipt is void', p: 'This receipt was cancelled by Sight Seers Caribbean Adventures and is no longer valid.', badge: 'VOID' }
      : { cls: 'ok', icon: 'tick', h: 'Receipt verified', p: 'This receipt was issued by Sight Seers Caribbean Adventures and matches our records.', badge: 'VALID · ' + f.label };
  const row = (k, v, big) => `<div class="row"><dt>${esc(k)}</dt><dd${big ? ' class="big"' : ''}>${v}</dd></div>`;
  const rows = found ? [
    row('Receipt number', esc(rec.number)),
    rec.bookingCode ? row('Booking code', esc(rec.bookingCode)) : '',
    row('Received from', esc(rec.customerName)),
    rec.eventName ? row('For', esc(rec.eventName)) : '',
    row('Amount received', esc(money(f.received, rec.currency)), true),
    row('Date received', esc(fmtDate(rec.receivedOn, true))),
    row('Payment method', esc(cap(rec.method || 'bank transfer')) + (rec.reference ? ' · ref ' + esc(maskRef(rec.reference)) : '')),
    row('Date issued', esc(fmtDate(rec.issuedOn, true))),
    isVoid && rec.voidedAt ? row('Voided on', esc(fmtDate(String(rec.voidedAt).slice(0, 10), true))) : '',
    row('Issued by', esc(BIZ.name) + `<br><span class="sub">Reg. No. ${esc(BIZ.regNo)}</span>`)
  ].join('') : '';
  const tick = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  const bang = '<span style="color:#fff;font-weight:800;font-size:28px;line-height:1">!</span>';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Receipt Verification · ${esc(BIZ.name)}</title>
<link rel="icon" href="/favicon-32.png">
<style>
:root{--navy:#063a63;--green:#70c257;--orange:#ef8731;--red:#c0392b;--ink:#172a34;--muted:#5b6b76;--line:#e3e8ec;--soft:#f5f8f6}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Helvetica,Arial,sans-serif;background:var(--soft);color:var(--ink);min-height:100vh;display:flex;flex-direction:column}
.bar{height:5px;background:linear-gradient(90deg,var(--green) 62%,var(--orange) 62%)}
main{flex:1;width:100%;max-width:560px;margin:0 auto;padding:28px 16px 40px}
.logo{display:block;height:46px;margin:6px auto 22px}
.card{background:#fff;border:1px solid var(--line);border-radius:14px;overflow:hidden;box-shadow:0 6px 24px rgba(6,58,99,.08)}
.top{background:var(--navy);color:#fff;padding:22px 22px 20px;text-align:center}
.top.bad{background:#5a1f1a}
.icon{width:52px;height:52px;border-radius:50%;background:var(--green);display:flex;align-items:center;justify-content:center;margin:0 auto 12px}
.bad .icon{background:var(--red)}
.top h1{font-size:21px}
.top p{font-size:13.5px;color:#c9d6e3;margin-top:6px;line-height:1.5}
.badge{display:inline-block;margin-top:12px;background:rgba(112,194,87,.18);color:#9be083;border:1px solid rgba(112,194,87,.5);border-radius:20px;padding:5px 12px;font-size:11px;font-weight:700;letter-spacing:.14em}
.bad .badge{background:rgba(255,255,255,.1);color:#ffb3aa;border-color:rgba(255,179,170,.5)}
dl{padding:6px 22px 8px}
.row{display:flex;justify-content:space-between;gap:16px;padding:12px 0;border-bottom:1px solid var(--line)}
.row:last-child{border-bottom:0}
dt{font-size:11px;font-weight:700;letter-spacing:.14em;color:var(--muted);text-transform:uppercase;padding-top:2px;flex:none;max-width:42%}
dd{font-size:14.5px;font-weight:700;color:var(--navy);text-align:right}
dd.big{font-family:"Times New Roman",Times,serif;font-size:22px}
.void dd{text-decoration:line-through;color:var(--muted)}
.sub{font-weight:400;color:var(--muted);font-size:12.5px}
.note{padding:16px 22px 20px;background:var(--soft);border-top:1px solid var(--line);font-size:12.5px;line-height:1.6;color:var(--muted)}
.note b{color:var(--ink)}
footer{background:var(--navy);color:#fff;font-size:12px;text-align:center;padding:16px;line-height:1.7;position:relative}
footer:before{content:"";position:absolute;left:0;right:0;top:0;height:3px;background:linear-gradient(90deg,var(--green) 62%,var(--orange) 62%)}
footer a{color:#fff}
</style>
</head>
<body>
<div class="bar"></div>
<main>
<a href="/" aria-label="${esc(BIZ.name)} home page"><img class="logo" src="/assets/logo-wordmark.png" alt="${esc(BIZ.name)}"></a>
<div class="card">
<div class="top ${head.cls}">
<div class="icon">${head.icon === 'tick' ? tick : bang}</div>
<h1>${esc(head.h)}</h1>
<p>${esc(head.p)}</p>
<span class="badge">${esc(head.badge)}</span>
</div>
${found ? `<dl${isVoid ? ' class="void"' : ''}>${rows}</dl>` : ''}
<div class="note"><b>Check the details:</b> if the receipt you have shows a different amount, date or receipt number, it may have been altered. Please contact us before relying on it.</div>
</div>
</main>
<footer>${esc(BIZ.name)} · ${esc(BIZ.address)}<br>${BIZ.phones.map(p => `<a href="tel:${esc(p.replace(/[^+\d]/g, ''))}">${esc(p)}</a>`).join(' · ')} · <a href="mailto:${esc(BIZ.email)}">${esc(BIZ.email)}</a></footer>
</body>
</html>`;
}

/* the email that goes with a receipt */
function emailParts(rec) {
  const f = figures(rec);
  const first = String(rec.careOf || rec.customerName || '').trim().split(/\s+/)[0] || 'there';
  const subject = 'Receipt ' + rec.number + ' from ' + BIZ.name;
  const balLine = f.balance > 0 ? 'The balance of ' + money(f.balance, rec.currency) + ' remains' + (rec.balanceNote ? '. ' + rec.balanceNote : '.') : 'This booking is now paid in full.';
  const text = [
    'Hello ' + first + ',',
    '',
    'Thank you for your payment. Attached is receipt ' + rec.number + ' for ' + money(f.received, rec.currency) + ', received on ' + fmtDate(rec.receivedOn, true) + (rec.bookingCode ? ' towards booking ' + rec.bookingCode : '') + '.',
    '',
    balLine,
    '',
    'You can check this receipt at any time: ' + verifyUrl(rec),
    '',
    'Please let us know if you have any questions.',
    '',
    BIZ.name,
    BIZ.phones.join(' | ') + ' | ' + BIZ.email
  ].join('\n');
  const EMAIL_LOGO = BIZ.origin + '/assets/logo-wordmark.png';
  const html = `<div style="font-family:Raleway,Arial,sans-serif;max-width:620px;margin:0 auto;color:#12293d">
  <div style="background:linear-gradient(135deg,#063a63,#0a5678);color:#fff;padding:24px">
    <img src="${EMAIL_LOGO}" alt="${esc(BIZ.name)}" width="170" height="38" style="display:block;width:170px;height:38px;border:0;margin:0 0 14px">
    <div style="font-family:Georgia,serif;font-size:22px;margin-top:6px">Receipt ${esc(rec.number)}</div>
  </div>
  <div style="border:1px solid #dfe7ee;border-top:none;padding:24px;font-size:14px;line-height:1.7;color:#33424f">
    <p style="margin:0 0 12px">Hello ${esc(first)},</p>
    <p style="margin:0 0 12px">Thank you for your payment. Attached is receipt <b>${esc(rec.number)}</b> for <b>${esc(money(f.received, rec.currency))}</b>, received on <b>${esc(fmtDate(rec.receivedOn, true))}</b>${rec.bookingCode ? ' towards booking <b>' + esc(rec.bookingCode) + '</b>' : ''}.</p>
    <p style="margin:0 0 12px">${esc(balLine)}</p>
    <p style="margin:18px 0"><a href="${esc(verifyUrl(rec))}" style="display:inline-block;background:#063a63;color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;text-transform:uppercase;font-size:13px;letter-spacing:1px">Check this receipt</a></p>
    <p style="margin:0 0 12px">Please reply to this email if you have any questions.</p>
    <div style="margin-top:18px;padding:14px 16px;background:rgba(112,194,87,.08);font-size:13px;color:#063a63"><b>${esc(BIZ.name)}</b><br>${esc(BIZ.phones.join(' · '))} &middot; ${esc(BIZ.email)}</div>
  </div></div>`;
  return { subject, text, html };
}

module.exports = { BIZ, CURRENCIES, METHODS, LEGACY, money, nextNumber, makeVerifyCode, verifyUrl, nextBookingCode, previousPaid, figures, maskRef, fmtDate, cap, esc, verifyPageHtml, emailParts };
