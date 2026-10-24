/**
 * api/_handlers/planning-request.js
 * The US$15 "Build My Custom Trip" flow (Travel Form and Start Planning pages).
 *
 *   POST { name, email, phone, source, summary }
 *        save the guest's trip preferences, email them to the team (and a copy to the guest),
 *        and return the Stripe payment link with the guest's email and this request's
 *        reference attached, so the paid deposit can be matched to the preferences.
 *   GET  (admin)  list stored requests
 *
 * When the deposit is paid, api/stripe-webhook.js finds the request by its reference, marks it
 * paid and emails the team and the guest.
 */

const db = require('../_lib/db');
const { uid, requireAdmin, requirePerm } = require('../_lib/auth');
const { sendEmail, BUSINESS_EMAIL } = require('../_lib/email');
const trip = require('../_lib/trip');

const COLLECTION = 'planning-requests';
const PAY_LINK = process.env.STRIPE_PLANNING_LINK || 'https://buy.stripe.com/cNifZi2n0eIL1yyana5kk06';
const SOURCES = { 'travel-form': 'Travel Form', 'start-planning': 'Start Planning' };
const FOOT = 'Sight Seers Caribbean Adventures · sightseerscaribbean.com';

function payUrl(rec) {
  return PAY_LINK + '?prefilled_email=' + encodeURIComponent(rec.email) + '&client_reference_id=' + encodeURIComponent(rec.ref);
}

function prefsBlock(summary) {
  return `<h3 style="color:#063a63;margin:4px 0 6px;font-size:16px">Trip preferences</h3>
    <div style="white-space:pre-wrap;background:#f6faf7;border-radius:10px;padding:12px 14px;color:#333;font-size:13px;line-height:1.7">${trip.esc(summary)}</div>`;
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method === 'GET') {
      const admin = await requirePerm(req, res, 'inbox');
      if (!admin) return;
      return res.status(200).json({ ok: true, requests: await db.getCollection(COLLECTION) });
    }

    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const b = req.body || {};
    const email = String(b.email || '').trim().toLowerCase().slice(0, 120);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return res.status(400).json({ error: 'Please add a valid email address.' });
    const summary = String(b.summary || '').trim().slice(0, 6000);
    if (!summary) return res.status(400).json({ error: 'Please add a few trip details first.' });

    const rec = {
      id: uid(),
      ref: trip.ref('PR'),
      source: SOURCES[b.source] ? b.source : 'travel-form',
      name: String(b.name || '').trim().slice(0, 80) || 'Website Visitor',
      email,
      phone: String(b.phone || '').trim().slice(0, 40),
      summary,
      status: 'awaiting-deposit',
      createdAt: new Date().toISOString()
    };
    await db.addToCollection(COLLECTION, rec);

    const url = payUrl(rec);
    const rows = [['Reference', rec.ref], ['Name', rec.name], ['Email', rec.email], ['Phone / WhatsApp', rec.phone], ['Sent from', SOURCES[rec.source]]];

    await Promise.all([
      sendEmail({
        replyTo: rec.email,
        subject: '[' + rec.ref + '] New custom trip request, awaiting US$15 deposit: ' + rec.name,
        html: trip.shell('New custom trip request',
          `<p>${trip.esc(rec.name)} sent their trip preferences and was taken to secure checkout for the US$15 planning deposit. You will get a second email if it is paid.</p>${trip.detailTable(rows)}${prefsBlock(summary)}`, FOOT)
      }),
      sendEmail({
        to: rec.email,
        replyTo: BUSINESS_EMAIL,
        subject: 'We received your trip request: ' + rec.ref,
        html: trip.shell('We received your trip request',
          `<p>Thank you, ${trip.esc(rec.name.split(' ')[0])}. We have your trip preferences. To start building your custom package, please complete the US$15 planning deposit. It is credited toward your booking.</p>
           <p style="margin:18px 0"><a href="${trip.esc(url)}" style="background:#ef8731;color:#fff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:999px;display:inline-block">Pay the US$15 deposit</a></p>
           <p style="font-size:12px">If you have already paid, you can ignore this link.</p>${trip.detailTable([['Reference', rec.ref]])}${prefsBlock(summary)}`, FOOT)
      })
    ]);

    return res.status(201).json({ ok: true, ref: rec.ref, payUrl: url });
  } catch (e) {
    console.error('planning-request error:', e && e.message);
    return res.status(500).json({ error: 'Could not save your request. Please try again.' });
  }
};

module.exports.COLLECTION = COLLECTION;
