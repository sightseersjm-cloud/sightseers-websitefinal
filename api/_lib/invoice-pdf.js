/**
 * The invoice as a PDF, built on the server so it can be attached to the email.
 * Same content and look as the invoice page: logo, header band, customer, line items, totals, bank accounts, payment note.
 */
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const inv = require('./invoice');

const NAVY = '#063a63', GREEN = '#70c257', ORANGE = '#ef8731', INK = '#172a34', MUTED = '#5b6b76', SOFT = '#f4f9f6';

function logoBuffer() {
  const uri = fs.readFileSync(path.join(__dirname, 'invoice-logo.txt'), 'utf8').trim();
  return Buffer.from(uri.split(',')[1], 'base64');
}

function build(invoice) {
  const t = inv.totals(invoice.items, invoice.discount);
  const banks = inv.BANKS;
  const doc = new PDFDocument({ size: 'A4', margin: 40, info: { Title: 'Invoice ' + invoice.number, Author: inv.BIZ.name } });
  const chunks = [];
  doc.on('data', c => chunks.push(c));
  const done = new Promise((resolve, reject) => { doc.on('end', () => resolve(Buffer.concat(chunks))); doc.on('error', reject); });
  const W = doc.page.width, M = 40, CW = W - 2 * M;

  // accent bar and header
  doc.rect(0, 0, W * 0.62, 5).fill(GREEN);
  doc.rect(W * 0.62, 0, W * 0.38, 5).fill(ORANGE);
  doc.image(logoBuffer(), M, 28, { width: 150, height: 150 * 75 / 340 });
  doc.fillColor(ORANGE).font('Helvetica-Bold').fontSize(8).text('INVOICE', M, 30, { width: CW, align: 'right', characterSpacing: 1.5 });
  doc.fillColor(NAVY).font('Times-Bold').fontSize(22).text(invoice.number, M, 42, { width: CW, align: 'right' });
  doc.fillColor(MUTED).font('Helvetica').fontSize(9).text('Issued ' + (invoice.issuedOn || '') + (invoice.dueOn ? '   Due ' + invoice.dueOn : ''), M, 70, { width: CW, align: 'right' });

  // billed to and our details
  let y = 118;
  doc.fillColor(GREEN).font('Helvetica-Bold').fontSize(8).text('BILLED TO', M, y, { characterSpacing: 1.2 });
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(12).text(invoice.customerName || '', M, y + 14);
  doc.fillColor(MUTED).font('Helvetica').fontSize(9).text(invoice.customerEmail || '', M, y + 32);
  if (invoice.customerAddress) doc.text(invoice.customerAddress, M, y + 45, { width: 260 });
  doc.fillColor(MUTED).font('Helvetica').fontSize(9).text([inv.BIZ.name, inv.BIZ.phone, inv.BIZ.email].join('\n'), M, y, { width: CW, align: 'right' });

  // description
  y = 205;
  if (invoice.description) { doc.fillColor(INK).font('Helvetica').fontSize(10).text(invoice.description, M, y, { width: CW }); y = doc.y + 14; } else y += 6;

  // line items
  const cols = { desc: M + 10, qty: M + CW - 230, price: M + CW - 170, amt: M + CW - 80 };
  doc.rect(M, y, CW, 22).fill(NAVY);
  doc.fillColor('#fff').font('Helvetica-Bold').fontSize(8).text('DESCRIPTION', cols.desc, y + 7, { characterSpacing: 1 });
  doc.text('QTY', cols.qty, y + 7, { width: 40, align: 'right' });
  doc.text('PRICE', cols.price, y + 7, { width: 70, align: 'right' });
  doc.text('AMOUNT', cols.amt, y + 7, { width: 70, align: 'right' });
  y += 22;
  t.lines.forEach((l, i) => {
    if (i % 2 === 0) doc.rect(M, y, CW, 24).fill(SOFT);
    doc.fillColor(INK).font('Helvetica').fontSize(10).text(l.description, cols.desc, y + 7, { width: CW - 280 });
    doc.text(String(l.qty), cols.qty, y + 7, { width: 40, align: 'right' });
    doc.text(inv.money(l.unit), cols.price, y + 7, { width: 70, align: 'right' });
    doc.fillColor(NAVY).font('Helvetica-Bold').text(inv.money(l.amount), cols.amt, y + 7, { width: 70, align: 'right' });
    y += 24;
  });

  // totals
  y += 8;
  doc.fillColor(MUTED).font('Helvetica').fontSize(10).text('Subtotal', cols.price - 60, y, { width: 130, align: 'right' }).text(inv.money(t.subtotal), cols.amt, y, { width: 70, align: 'right' });
  y += 16;
  if (t.discount) { doc.text('Discount', cols.price - 60, y, { width: 130, align: 'right' }).text('-' + inv.money(t.discount), cols.amt, y, { width: 70, align: 'right' }); y += 16; }
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(12).text('Total due', cols.price - 60, y + 4, { width: 130, align: 'right' });
  doc.font('Times-Bold').fontSize(16).text(inv.money(t.total), cols.amt - 10, y + 2, { width: 80, align: 'right' });
  y += 34;

  // bank transfer box
  const boxTop = y;
  doc.rect(M, boxTop, CW, 10).fill(SOFT);
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(11).text('Pay by bank transfer', M + 12, boxTop + 12);
  doc.fillColor(INK).font('Helvetica').fontSize(9).text('Pay in the currency of your invoice, to either bank.', M + 12, doc.y + 4, { width: CW - 24 });
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(9).text('Payment note:', M + 12, doc.y + 6, { continued: true }).font('Helvetica').fillColor(INK).text(' when making your bank transfer, please put the invoice number ' + invoice.number + ' in the note (reference) of the transfer.', { width: CW - 24 });
  ['JMD', 'USD'].forEach(cur => {
    doc.moveDown(0.6);
    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(9).text(cur + ' accounts', M + 12, doc.y, { width: CW - 24 });
    const hdr = doc.y + 4;
    const cx = [M + 12, M + 98, M + 234, M + 352];
    doc.rect(M + 12, hdr, CW - 24, 16).fill(NAVY);
    doc.fillColor('#fff').font('Helvetica-Bold').fontSize(7.5);
    ['BANK', 'ACCOUNT NAME', 'ACCOUNT NUMBER', 'DETAILS'].forEach((h, i) => doc.text(h, cx[i] + 4, hdr + 5));
    let ry = hdr + 16;
    banks.filter(b => b.currency === cur).forEach(b => {
      const details = [b.type, b.branch, b.transit ? 'Transit ' + b.transit : '', b.swift ? 'SWIFT ' + b.swift : ''].filter(Boolean).join(' · ');
      doc.rect(M + 12, ry, CW - 24, 30).fill('#fff').strokeColor('#e1ebe4').lineWidth(0.5).rect(M + 12, ry, CW - 24, 30).stroke();
      doc.fillColor(INK).font('Helvetica').fontSize(8.5);
      doc.text(b.bank, cx[0] + 4, ry + 8, { width: 84 });
      doc.text(b.name + (b.business ? ' (business account)' : ''), cx[1] + 4, ry + 6, { width: 128 });
      doc.font('Helvetica-Bold').text(b.number, cx[2] + 4, ry + 8, { width: 112 }).font('Helvetica');
      doc.text(details, cx[3] + 4, ry + 8, { width: 134 });
      ry += 30;
    });
    doc.y = ry + 2;
  });

  // footer: drawn with the bottom margin cleared so it does not start a new page
  doc.page.margins.bottom = 0;
  const fy = doc.page.height - 40;
  doc.rect(0, fy - 8, W, 40).fill(NAVY);
  doc.rect(0, fy - 8, W * 0.62, 2).fill(GREEN);
  doc.rect(W * 0.62, fy - 8, W * 0.38, 2).fill(ORANGE);
  doc.fillColor('#fff').font('Helvetica').fontSize(8).text(inv.BIZ.name + '   |   ' + inv.BIZ.phone + '   |   ' + inv.BIZ.email, M, fy + 4, { width: CW - 120 });
  doc.text(inv.BIZ.site, M, fy + 4, { width: CW, align: 'right' });
  doc.page.margins.bottom = 40;

  doc.end();
  return done;
}

module.exports = { build };
