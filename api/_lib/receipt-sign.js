/**
 * Digitally signs a receipt PDF, so any change made after it was issued shows as an invalid signature in a PDF reader.
 *
 * The certificate is never stored in the code. Set two environment variables in Vercel:
 *   RECEIPT_SIGN_P12       the .p12 certificate file, base64 encoded
 *   RECEIPT_SIGN_PASSWORD  its password
 * Without them receipts are still issued, just unsigned.
 */
const { plainAddPlaceholder } = require('@signpdf/placeholder-plain');
const { P12Signer } = require('@signpdf/signer-p12');
const signpdf = require('@signpdf/signpdf').default;

function configured() { return !!process.env.RECEIPT_SIGN_P12; }

async function sign(pdf, rec) {
  if (!configured()) return pdf;
  try {
    const p12 = Buffer.from(String(process.env.RECEIPT_SIGN_P12).replace(/\s+/g, ''), 'base64');
    const withSpace = plainAddPlaceholder({
      pdfBuffer: pdf,
      reason: 'Official receipt ' + (rec && rec.number ? rec.number : '') + ' issued by Sight Seers Caribbean Adventures',
      contactInfo: 'info@sightseerscaribbean.com',
      name: 'Daineroy Allen, Managing Director',
      location: 'Ocho Rios, Jamaica',
      signatureLength: 16384
    });
    const signer = new P12Signer(p12, { passphrase: process.env.RECEIPT_SIGN_PASSWORD || '' });
    return await signpdf.sign(withSpace, signer);
  } catch (e) {
    /* a signing problem must never stop a receipt being issued; it goes out unsigned and the error is logged */
    console.error('receipt signing failed', e && e.message);
    return pdf;
  }
}

module.exports = { sign, configured };
