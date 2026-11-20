/**
 * The public page a receipt's QR code opens: /verify/<code>.
 * Shows whether the receipt is valid or void and the few details needed to check a printed copy. No sign-in.
 * Kept out of search engines.
 */
const db = require('../_lib/db');
const R = require('../_lib/receipt');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return res.status(405).json({ error: 'Method not allowed' });
  let code = String((req.query && req.query.code) || '').trim().slice(0, 80);
  try { code = decodeURIComponent(code); } catch (e) { /* keep as typed */ }

  let rec = null;
  if (code) {
    let list = [];
    try { list = await db.getCollection('receipts'); } catch (e) { list = []; }
    rec = list.find(r => r.verifyCode === code) || null;
    /* receipts issued before this page existed still check out when storage has not picked them up yet */
    if (!rec) rec = R.LEGACY.find(r => r.verifyCode === code) || null;
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.setHeader('Cache-Control', 'no-store');
  return res.status(rec ? 200 : 404).end(R.verifyPageHtml(rec));
};
