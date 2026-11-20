/**
 * The receipt as a PDF: the same layout as the receipts Sight Seers issues by hand.
 * Logo and receipt number, who paid, a strip with the booking code and payment details, the line items, the totals and
 * payment, a thank-you note, a QR code that opens the verification page, the business stamp and the signature line.
 * The finished file is digitally signed when a signing certificate is set up (see receipt-sign.js).
 */
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const R = require('./receipt');
const { sign } = require('./receipt-sign');

const NAVY = '#063a63', GREEN = '#70c257', ORANGE = '#ef8731', INK = '#172a34', MUTED = '#5b6b76', LINE = '#e3e8ec', SOFT = '#f5f8f6', RED = '#c0392b';

function logoBuffer() {
  const uri = fs.readFileSync(path.join(__dirname, 'invoice-logo.txt'), 'utf8').trim();
  return Buffer.from(uri.split(',')[1], 'base64');
}
const STAMP = path.join(__dirname, 'receipt-stamp.png');

async function render(rec) {
  const f = R.figures(rec);
  const cur = rec.currency || 'JMD';
  const m = n => R.money(n, cur);
  const qr = await QRCode.toBuffer(R.verifyUrl(rec), { errorCorrectionLevel: 'M', margin: 1, width: 360, color: { dark: NAVY, light: '#ffffff' } });

  const doc = new PDFDocument({ size: 'A4', margin: 38, info: { Title: 'Receipt ' + rec.number, Author: R.BIZ.name, Subject: 'Receipt ' + rec.number + (rec.bookingCode ? ' · Booking ' + rec.bookingCode : '') } });
  const chunks = [];
  doc.on('data', c => chunks.push(c));
  const done = new Promise((resolve, reject) => { doc.on('end', () => resolve(Buffer.concat(chunks))); doc.on('error', reject); });
  const W = doc.page.width, H = doc.page.height, M = 38, CW = W - 2 * M;
  const FOOT = 34;

  function footer() {
    const keep = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    const fy = H - FOOT;
    doc.rect(0, fy, W, FOOT).fill(NAVY);
    doc.rect(0, fy, W * 0.62, 3).fill(GREEN);
    doc.rect(W * 0.62, fy, W * 0.38, 3).fill(ORANGE);
    doc.fillColor('#fff').font('Helvetica').fontSize(7.8).text([R.BIZ.name].concat(R.BIZ.phones, [R.BIZ.email]).join('  |  '), M, fy + 14, { width: CW - 95, lineBreak: false });
    doc.text(R.BIZ.site, M, fy + 14, { width: CW, align: 'right', lineBreak: false });
    doc.page.margins.bottom = keep;
  }
  function topBar() {
    doc.rect(0, 0, W * 0.62, 4).fill(GREEN);
    doc.rect(W * 0.62, 0, W * 0.38, 4).fill(ORANGE);
  }
  /* a new page when the next block will not fit above the footer */
  function ensure(y, need) {
    if (y + need <= H - FOOT - 16) return y;
    footer();
    doc.addPage();
    topBar();
    return 40;
  }

  topBar();

  // header: logo, receipt number, issue date and status
  doc.image(logoBuffer(), M, 24, { width: 150, height: 150 * 75 / 340 });
  doc.fillColor(ORANGE).font('Helvetica-Bold').fontSize(8).text('RECEIPT', M, 26, { width: CW, align: 'right', characterSpacing: 2.4 });
  doc.fillColor(NAVY).font('Times-Bold').fontSize(22).text(rec.number, M, 38, { width: CW, align: 'right' });
  doc.fillColor(MUTED).font('Helvetica').fontSize(9).text('Issued ' + R.fmtDate(rec.issuedOn), M, 66, { width: CW, align: 'right' });
  doc.font('Helvetica-Bold').fontSize(8);
  const pill = f.label, pw = doc.widthOfString(pill, { characterSpacing: 1.6 }) + 20;
  const pc = rec.status === 'void' ? RED : '#3f8f2c', pb = rec.status === 'void' ? RED : GREEN;
  doc.roundedRect(W - M - pw, 82, pw, 17, 3).lineWidth(1.2).strokeColor(pb).stroke();
  doc.fillColor(pc).text(pill, W - M - pw, 87, { width: pw, align: 'center', characterSpacing: 1.6 });

  // who paid, and our details
  let y = 124;
  doc.fillColor(GREEN).font('Helvetica-Bold').fontSize(8).text('RECEIVED FROM', M, y, { characterSpacing: 2.2 });
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(12).text(rec.customerName || '', M, y + 14, { width: 280 });
  let ly = doc.y + 3;
  doc.fillColor(MUTED).font('Helvetica').fontSize(9);
  const left = [rec.careOf ? 'c/o ' + rec.careOf : ''].concat(String(rec.customerAddress || '').split(/\n/).map(s => s.trim())).filter(Boolean);
  if (rec.customerEmail) left.push(rec.customerEmail);
  left.forEach(l => { doc.text(l, M, ly, { width: 280 }); ly = doc.y + 1.5; });
  doc.text([R.BIZ.name, R.BIZ.address].concat(R.BIZ.phones, [R.BIZ.email]).join('\n'), M, y, { width: CW, align: 'right', lineGap: 1.5 });
  y = Math.max(ly, doc.y) + 14;

  // booking code, payment method, transaction reference and date received
  const metaH = 40, colW = CW / 4;
  doc.roundedRect(M, y, CW, metaH, 4).fillAndStroke(SOFT, LINE);
  [['BOOKING CODE', rec.bookingCode || 'N/A'], ['PAYMENT METHOD', R.cap(rec.method || 'bank transfer')], ['TRANSACTION REF', rec.reference || 'N/A'], ['DATE RECEIVED', R.fmtDate(rec.receivedOn)]].forEach(([k, v], i) => {
    const x = M + i * colW;
    if (i) doc.moveTo(x, y).lineTo(x, y + metaH).lineWidth(0.8).strokeColor(LINE).stroke();
    doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(6.6).text(k, x + 10, y + 9, { width: colW - 20, characterSpacing: 1.1, lineBreak: false });
    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(v.length > 16 ? 8.4 : 9.5).text(v, x + 10, y + 21, { width: colW - 16, lineBreak: false, ellipsis: true });
  });
  y += metaH + 16;

  // what the payment is for
  if (rec.title) { doc.fillColor(INK).font('Helvetica').fontSize(10).text(rec.title, M, y, { width: CW }); y = doc.y + 8; }

  // line items
  const cx = { desc: M + 10, qty: M + CW - 230, price: M + CW - 170, amt: M + CW - 90 };
  doc.rect(M, y, CW, 22).fill(NAVY);
  doc.fillColor('#fff').font('Helvetica-Bold').fontSize(7.5).text('DESCRIPTION', cx.desc, y + 8, { characterSpacing: 1.6 });
  doc.text('QTY', cx.qty, y + 8, { width: 40, align: 'right', characterSpacing: 1.6 });
  doc.text('PRICE', cx.price, y + 8, { width: 75, align: 'right', characterSpacing: 1.6 });
  doc.text('AMOUNT', cx.amt, y + 8, { width: 80, align: 'right', characterSpacing: 1.6 });
  y += 22;
  f.lines.forEach((l, i) => {
    const detail = String((rec.items[i] && rec.items[i].detail) || '');
    const rh = detail ? 32 : 24;
    y = ensure(y, rh);
    doc.fillColor(INK).font('Helvetica').fontSize(9.5).text(l.description, cx.desc, y + 7, { width: CW - 270, lineBreak: false, ellipsis: true });
    if (detail) doc.fillColor(MUTED).fontSize(7.6).text(detail, cx.desc, y + 19, { width: CW - 270, lineBreak: false, ellipsis: true });
    const my = y + (rh / 2) - 4;
    doc.fillColor(INK).font('Helvetica').fontSize(9.5).text(String(l.qty), cx.qty, my, { width: 40, align: 'right' });
    doc.text(m(l.unit), cx.price, my, { width: 75, align: 'right' });
    doc.fillColor(NAVY).font('Helvetica-Bold').text(m(l.amount), cx.amt, my, { width: 80, align: 'right' });
    y += rh;
    doc.moveTo(M, y).lineTo(M + CW, y).lineWidth(0.8).strokeColor(LINE).stroke();
  });

  // totals and payment
  y = ensure(y + 8, 140);
  const sx = M + CW - 250, sw = 250;
  const srow = (label, value, opt) => {
    const o = opt || {};
    doc.fillColor(o.color || MUTED).font(o.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9.5);
    doc.text(label, sx + 10, y, { width: 150 });
    doc.text(value, sx + 10, y, { width: sw - 20, align: 'right' });
    y += 18;
  };
  srow('Subtotal', m(f.subtotal));
  if (f.discount) srow('Discount', '-' + m(f.discount), { color: '#3f8f2c', bold: true });
  doc.moveTo(sx, y - 3).lineTo(sx + sw, y - 3).lineWidth(0.8).strokeColor(LINE).stroke();
  y += 3;
  srow(f.discount ? 'Package total after discount' : 'Package total', m(f.total), { color: INK, bold: true });
  if (f.previous) srow('Previously received', '-' + m(f.previous));
  y += 2;
  doc.roundedRect(sx, y, sw, 34, 3).fill(NAVY);
  doc.fillColor('#fff').font('Helvetica').fontSize(9.5).text('Amount received', sx + 10, y + 12);
  doc.font('Times-Bold').fontSize(17).text(m(f.received), sx + 10, y + 9, { width: sw - 20, align: 'right' });
  y += 44;
  if (f.balance > 0) srow('Balance due', m(f.balance), { color: ORANGE, bold: true });
  else srow(f.overpaid ? 'Paid in full · credit' : 'Paid in full', f.overpaid ? m(f.overpaid) : m(0), { color: '#3f8f2c', bold: true });

  // thank-you note
  const say = 'This receipt confirms payment of ' + m(f.received) + ' by ' + (rec.method || 'bank transfer') + ' on ' + R.fmtDate(rec.receivedOn, true) +
    (rec.reference ? ' (reference ' + rec.reference + ')' : '') + (rec.bookingCode ? ' towards booking ' + rec.bookingCode : '') + '. ' +
    (f.discount ? 'A discount of ' + m(f.discount) + ' has been applied. ' : '') +
    'The package total is ' + m(f.total) + (f.balance > 0 ? ' and the balance of ' + m(f.balance) + ' remains outstanding.' + (rec.balanceNote ? ' ' + rec.balanceNote : '') : ', and the booking is paid in full.') +
    (rec.bookingCode && f.balance > 0 ? ' Please quote the booking code when making your next payment.' : '');
  doc.font('Helvetica').fontSize(9);
  const sayH = doc.heightOfString(say, { width: CW - 28, lineGap: 2 });
  y = ensure(y + 6, sayH + 44);
  doc.roundedRect(M, y, CW, sayH + 36, 4).fill(SOFT);
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(11).text(rec.status === 'void' ? 'This receipt has been voided' : 'Payment received with thanks', M + 14, y + 12);
  doc.fillColor(INK).font('Helvetica').fontSize(9).text(say, M + 14, y + 28, { width: CW - 28, lineGap: 2 });
  y += sayH + 50;
  doc.fillColor(MUTED).font('Helvetica').fontSize(9).text('Thank you for choosing ' + R.BIZ.name + '. We look forward to welcoming you.', M, y, { width: CW });
  y = doc.y + 14;

  // QR code, stamp and signature
  y = ensure(y, 100);
  doc.image(qr, M, y, { width: 62, height: 62 });
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(8).text('VERIFY THIS RECEIPT', M + 72, y + 12, { characterSpacing: 0.8 });
  doc.fillColor(MUTED).font('Helvetica').fontSize(7.4).text('Scan to check this receipt on our website.' + (process.env.RECEIPT_SIGN_P12 ? ' This PDF is digitally signed, so any change after signing shows as invalid.' : ''), M + 72, y + 24, { width: 128, lineGap: 1.5 });
  const sigX = W - M - 200, sigY = y + 22;
  doc.moveTo(sigX, sigY).lineTo(W - M, sigY).lineWidth(1).strokeColor(INK).stroke();
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(9).text(R.BIZ.signatory, sigX, sigY + 6);
  doc.font('Helvetica').fontSize(8.5).text(R.BIZ.signatoryTitle, sigX, doc.y + 1, { width: 200 });
  if (fs.existsSync(STAMP)) {
    doc.save();
    doc.opacity(0.93);
    doc.image(STAMP, sigX - 116, sigY - 50, { width: 116, height: 116 });
    doc.restore();
  }

  // a voided receipt carries the word across the page
  if (rec.status === 'void') {
    doc.save();
    doc.rotate(-30, { origin: [W / 2, H / 2] });
    doc.fillColor(RED).opacity(0.18).font('Helvetica-Bold').fontSize(130).text('VOID', 0, H / 2 - 70, { width: W, align: 'center' });
    doc.restore();
  }

  footer();
  doc.end();
  return done;
}

/* the finished receipt: rendered, then signed when a certificate is set up */
async function build(rec) {
  const raw = await render(rec);
  return sign(raw, rec);
}

module.exports = { build, render };
