// Receipts: numbering, booking codes, balances, verification page, email, and the PDF (built, signed, and refused when altered).
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const R = require('../api/_lib/receipt.js');
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('FAIL ' + m); } };

(async () => {
  // numbering: the receipt issued by hand (R0002) is counted, so the site carries on from R0003
  ok(R.nextNumber([], 2026) === 'SS-2026-R0003', 'first site receipt follows SS-2026-R0002 (got ' + R.nextNumber([], 2026) + ')');
  ok(R.nextNumber([{ number: 'SS-2026-R0009' }], 2026) === 'SS-2026-R0010', 'next number follows the highest');
  ok(R.nextNumber([], 2027) === 'SS-2027-R0001', 'numbering restarts each year');

  // booking codes count up from SUM-SGS-0926
  ok(R.nextBookingCode([], '') === 'SS-0927', 'empty booking code gives SS-0927 (got ' + R.nextBookingCode([], '') + ')');
  ok(R.nextBookingCode([], 'sum-sgs') === 'SUM-SGS-0927', 'a typed prefix gets the next number');
  ok(R.nextBookingCode([{ bookingCode: 'SS-0931' }], '') === 'SS-0932', 'counts up from the highest code used');
  ok(R.nextBookingCode([], 'SUM-SGS-0926') === 'SUM-SGS-0926', 'a full code is kept, to add a payment to an existing booking');

  // verification codes cannot be guessed from the number
  const c1 = R.makeVerifyCode('SS-2026-R0003'), c2 = R.makeVerifyCode('SS-2026-R0003');
  ok(c1 !== c2 && /^SS-2026-R0003-[A-Za-z0-9]{10}$/.test(c1), 'verification code is the number plus 10 random characters');
  ok(R.verifyUrl({ verifyCode: 'SS-2026-R0002.html' }) === 'https://www.sightseerscaribbean.com/verify/SS-2026-R0002.html', 'the printed QR of the hand-made receipt still resolves');

  // figures: the Sutherland receipt
  const leg = R.LEGACY[0];
  const f = R.figures(leg);
  ok(f.total === 167300 && f.received === 51000 && f.balance === 116300 && f.label === 'DEPOSIT RECEIVED', 'Sutherland figures: 167,300 total, 51,000 received, 116,300 balance (got ' + JSON.stringify(f) + ')');
  ok(R.money(116300, 'JMD') === 'J$116,300.00' && R.money(568.5, 'USD') === 'US$568.50', 'money in both currencies');
  ok(R.figures(Object.assign({}, leg, { previousPaid: 51000, amountReceived: 116300 })).label === 'PAID IN FULL', 'final payment is paid in full');
  ok(R.figures(Object.assign({}, leg, { previousPaid: 51000, amountReceived: 50000 })).label === 'PAYMENT RECEIVED', 'a middle payment is a payment received');
  ok(R.figures(Object.assign({}, leg, { status: 'void' })).label === 'VOID', 'a void receipt says VOID');
  ok(R.figures(Object.assign({}, leg, { discount: 17000 })).total === 150300, 'discount comes off the total');

  // earlier payments on the same booking are counted, void ones and other currencies are not
  const later = { id: 'x', bookingCode: 'SUM-SGS-0926', currency: 'JMD', createdAt: '2026-12-01T00:00:00Z' };
  ok(R.previousPaid([], later) === 51000, 'the hand-made deposit counts towards a later payment');
  ok(R.previousPaid([Object.assign({}, leg, { status: 'void' })], later) === 0, 'a voided receipt does not count');
  ok(R.previousPaid([], Object.assign({}, later, { currency: 'USD' })) === 0, 'other currencies do not count');

  ok(R.maskRef('274931353606794') === 'ending 6794', 'reference is masked on the public page');
  ok(R.fmtDate('2026-11-14') === '14 Nov 2026' && R.fmtDate('2026-11-14', true) === '14 November 2026', 'dates');

  // public page
  const page = R.verifyPageHtml(leg);
  ok(page.includes('Receipt verified') && page.includes('J$51,000.00') && page.includes('14 November 2026') && page.includes('ending 6794'), 'verification page shows the key details');
  ok(!page.includes('274931353606794') && !page.includes('Kurt') && !page.includes('116,300'), 'verification page leaves out the full reference, the contact and the balance');
  ok(page.includes('<a href="/" aria-label') && page.includes('noindex'), 'logo links home and the page is kept out of search');
  ok(R.verifyPageHtml(Object.assign({}, leg, { status: 'void', voidedAt: '2026-11-21T00:00:00Z' })).includes('This receipt is void'), 'a void receipt shows as void');
  ok(R.verifyPageHtml(null).includes('Receipt not found'), 'an unknown code says not found');

  // email
  const mail = R.emailParts(Object.assign({}, leg, { customerEmail: 'kurt@example.com' }));
  ok(mail.subject === 'Receipt SS-2026-R0002 from Sight Seers Caribbean Adventures' && mail.text.startsWith('Hello Kurt,') && mail.text.includes('/verify/SS-2026-R0002.html'), 'email subject, greeting and check link');
  ok(!/—|–/.test(page + mail.text + mail.html), 'no em or en dashes');

  // the PDF, unsigned and signed
  const pdf = require('../api/_lib/receipt-pdf.js');
  const raw = await pdf.build(leg);
  ok(raw.slice(0, 5).toString() === '%PDF-' && raw.length > 20000, 'unsigned receipt PDF builds');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rc-'));
  try {
    execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', path.join(tmp, 'k.pem'), '-out', path.join(tmp, 'c.pem'), '-days', '2', '-subj', '/CN=Sight Seers Caribbean Adventures'], { stdio: 'ignore' });
    execFileSync('openssl', ['pkcs12', '-export', '-inkey', path.join(tmp, 'k.pem'), '-in', path.join(tmp, 'c.pem'), '-passout', 'pass:test', '-out', path.join(tmp, 's.p12'), '-keypbe', 'PBE-SHA1-3DES', '-certpbe', 'PBE-SHA1-3DES', '-macalg', 'sha1'], { stdio: 'ignore' });
    process.env.RECEIPT_SIGN_P12 = fs.readFileSync(path.join(tmp, 's.p12')).toString('base64');
    process.env.RECEIPT_SIGN_PASSWORD = 'test';
    const signed = await pdf.build(leg);
    ok(signed.includes('/ByteRange') && signed.includes('/adbe.pkcs7.detached'), 'signed receipt carries a digital signature');
    const out = process.env.RECEIPT_PREVIEW_DIR;
    if (out) { fs.mkdirSync(out, { recursive: true }); fs.writeFileSync(path.join(out, 'receipt.pdf'), signed); fs.writeFileSync(path.join(out, 'receipt-void.pdf'), await pdf.build(Object.assign({}, leg, { status: 'void' }))); fs.writeFileSync(path.join(out, 'verify.html'), page); }
    process.env.RECEIPT_SIGN_PASSWORD = 'wrong';
    const fallback = await pdf.build(leg);
    ok(!fallback.includes('/ByteRange'), 'a signing problem still issues the receipt, unsigned');
  } catch (e) {
    ok(false, 'signing test could not run: ' + e.message);
  } finally {
    delete process.env.RECEIPT_SIGN_P12; delete process.env.RECEIPT_SIGN_PASSWORD;
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  // the router sends /verify/<code> to the public page
  const vercel = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'vercel.json'), 'utf8'));
  const rw = vercel.rewrites.findIndex(r => r.source === '/verify/:code');
  ok(rw >= 0 && rw < vercel.rewrites.length - 1, '/verify/:code is rewritten before the catch-all');

  console.log(fails ? fails + ' FAILED' : 'ALL PASSED');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
