// Invoices: numbering, totals, bank placeholders, branded page and email body.
const fs = require('fs');
const path = require('path');
const inv = require('../api/_lib/invoice.js');
let fails = 0;
const mailLogo = h => h.includes('data:image/png;base64,');
const ok = (c, m) => { if (!c) { fails++; console.log('FAIL ' + m); } };

ok(inv.nextNumber([], 2026) === 'SS-2026-0001', 'first invoice of the year is 0001');
ok(inv.nextNumber([{ number: 'SS-2026-0007' }, { number: 'SS-2026-0003' }], 2026) === 'SS-2026-0008', 'next number follows the highest, no reuse');
ok(inv.nextNumber([{ number: 'SS-2025-0040' }], 2026) === 'SS-2026-0001', 'numbering restarts per year');

const t = inv.totals([{ description: 'Deposit', qty: 1, unit: 568.5 }, { description: 'Driver day', qty: 2, unit: 120 }], 40);
ok(t.subtotal === 808.5 && t.discount === 40 && t.total === 768.5, 'totals: 808.50 less 40 = 768.50 (got ' + JSON.stringify(t) + ')');
ok(inv.totals([{ qty: 3, unit: 0.1 }], 0).total === 0.3, 'no floating point drift');
ok(inv.totals([{ qty: 1, unit: 50 }], 999).total === 0, 'discount cannot exceed subtotal');
ok(inv.money(1895) === 'US$1,895.00', 'money format');

const sample = { number: 'SS-2026-0001', issuedOn: '10 Nov 2026', dueOn: '10 Dec 2026', customerName: 'Jordan Lee', customerEmail: 'jordan@example.com', customerAddress: '12 Harbour Rd, Miami', description: 'Leaders in Jamaica: deposit (30%)', items: [{ description: 'Leaders in Jamaica deposit (30%)', qty: 1, unit: 568.5 }], discount: 0, terms: 'Payment is due by the date shown.' };
const page = inv.invoiceHtml(sample, { stripeUrl: 'https://checkout.example/c/abc' });
ok(page.includes('SS-2026-0001') && page.includes('US$568.50') && page.includes('Pay US$568.50 by card'), 'invoice page shows number, total and card button');
ok(page.includes('data:image/png;base64,') && page.includes('alt="Sight Seers Caribbean Adventures"'), 'invoice page has the embedded Sight Seers logo');
ok(inv.emailParts(sample).html.includes('https://www.sightseerscaribbean.com/assets/logo-wordmark.png'), 'email uses the logo hosted on the site');
ok(inv.invoiceHtml(sample).indexOf('by card') === -1, 'card button is optional (off when no link)');
ok(page.includes('put the invoice number <b>SS-2026-0001</b> in the note'), 'customer is asked to put the invoice number in the transfer note');
const pg2 = inv.invoiceHtml(sample);
ok(inv.BANKS.length === 4 && ['006400205846','006400205915','1002405782','1002407476'].every(n => pg2.includes(n)), 'all four bank accounts are on the invoice');
ok(pg2.includes('CIBC') && pg2.includes('09746') && pg2.includes('FCIBJMKN') && pg2.includes('CCMKJMKN') && pg2.includes('PNBPUS3NNYC') && pg2.includes('IRVTUS3N') && pg2.includes('026005092') && pg2.includes('021000018') && pg2.includes('890-1338-729'), 'CIBC and JMMB USD SWIFT codes shown');
ok(!/\[.*to be added\]/.test(pg2), 'no placeholder bank text left');
const mail = inv.emailParts(sample, { stripeUrl: 'https://checkout.example/c/abc' });
ok(mail.subject === 'Invoice SS-2026-0001 from Sight Seers Caribbean Adventures', 'email subject');
ok(mail.text.startsWith('Hello Jordan,') && mail.text.includes('US$568.50') && mail.text.includes('Pay by card'), 'email text body');
ok(mail.html.includes('Hello Jordan') && mail.html.includes('Pay US$568.50 by card'), 'email html body');
const bank = inv.emailParts(Object.assign({}, sample, { customerName: 'Sam' }));
ok(bank.text.includes('bank transfer') && !bank.text.includes('Pay by card'), 'bank-only email has no card line');
ok(!/—|–/.test(page + mail.text + mail.html), 'no em or en dashes in the invoice or email');

// write previews for a visual check
const out = process.env.INVOICE_PREVIEW_DIR;
if (out) { fs.mkdirSync(out, { recursive: true }); fs.writeFileSync(path.join(out, 'invoice.html'), page); fs.writeFileSync(path.join(out, 'invoice-email.html'), mail.html); }

console.log(fails ? fails + ' FAILED' : 'ALL PASSED');
process.exit(fails ? 1 : 0);
