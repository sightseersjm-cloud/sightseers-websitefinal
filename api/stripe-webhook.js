/**
 * api/stripe-webhook.js
 * Verifies Stripe webhook signatures and grants viewer access tokens
 * on successful checkout.session.completed events.
 *
 * Requires env vars: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
 * Set STRIPE_WEBHOOK_SECRET from: Stripe dashboard → Webhooks → your endpoint → Signing secret
 */

const https = require('https');
const crypto = require('crypto');
const db = require('./_lib/db');
const { sendEmail, BUSINESS_EMAIL } = require('./_lib/email');

function money(cents) { return '$' + ((cents || 0) / 100).toFixed(2); }

// Branded confirmation email, styled like the tent-rental / booking confirmations.
function confirmationHtml(title, itemsLine, amount) {
  return `
  <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
    <div style="background:linear-gradient(135deg,#063a63,#0a5678);color:#fff;padding:26px 24px;border-radius:16px 16px 0 0">
      <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#70c257;font-weight:800">Sight Seers Caribbean · V-Tours</div>
      <h2 style="margin:8px 0 0;font-size:22px">Booking confirmed 🎉</h2>
    </div>
    <div style="border:1px solid #e0e7e3;border-top:none;border-radius:0 0 16px 16px;padding:24px">
      <p style="color:#5a6d7e;font-size:15px;line-height:1.6">Thank you for booking your virtual tour experience! Your payment was received and your spot is confirmed.</p>
      <table style="border-collapse:collapse;width:100%;margin:14px 0">
        <tr><td style="padding:9px;font-weight:bold;width:130px;color:#063a63">Experience</td><td style="padding:9px;color:#333">${title}</td></tr>
        ${itemsLine ? `<tr style="background:#f6faf7"><td style="padding:9px;font-weight:bold;color:#063a63">Items</td><td style="padding:9px;color:#333">${itemsLine}</td></tr>` : ''}
        <tr><td style="padding:9px;font-weight:bold;color:#063a63">Amount paid</td><td style="padding:9px;color:#333"><b>${amount}</b></td></tr>
      </table>
      <p style="color:#5a6d7e;font-size:13px;line-height:1.6">We'll email you the join link and any details ahead of your session. Questions? Just reply to this email.</p>
      <div style="margin-top:20px;padding:14px 16px;background:rgba(112,194,87,.08);border-radius:12px;color:#063a63;font-size:13px"><b>Sight Seers Caribbean Adventures</b><br>+1 (876) 465-0630 · info@sightseerscaribbean.com</div>
    </div>
    <p style="color:#9aa7b2;font-size:11px;text-align:center;margin-top:14px">Virtual tour booking via sightseerscaribbean.com</p>
  </div>`;
}

// Stripe requires the RAW body for signature verification.
// Vercel sets bodyParser: false when we export a config object.
module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return res.status(500).json({ error: 'STRIPE_WEBHOOK_SECRET not configured' });
  }

  // Read raw body
  const rawBody = await new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });

  // Verify Stripe signature
  let event;
  try {
    event = verifyStripeSignature(rawBody, sig, webhookSecret);
  } catch (err) {
    return res.status(400).json({ error: 'Webhook signature verification failed: ' + err.message });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const playbackId = session.metadata && session.metadata.playbackId;
    const streamId   = session.metadata && session.metadata.streamId;
    const email      = session.customer_details && session.customer_details.email;
    const amountPaid = session.amount_total; // cents

    if (playbackId) {
      // Store a viewer access token so the client can prove they paid
      const token = crypto.randomBytes(32).toString('hex');
      const record = {
        id: session.id,
        token,
        playbackId,
        streamId: streamId || '',
        email: email || '',
        amountPaid,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString() // 12h
      };
      await db.addToCollection('viewer-tokens', record);
    }

    // Branded confirmation email for any V-Tours / tour purchase.
    try {
      const kind = (session.metadata && session.metadata.kind) || '';
      const items = (session.metadata && (session.metadata.items || session.metadata.tours)) || '';
      const title = (session.metadata && session.metadata.title) || items || 'Sight Seers Virtual Tour';
      if (email) {
        await sendEmail({
          to: email,
          subject: 'Your Sight Seers V-Tours booking is confirmed 🎉',
          html: confirmationHtml(title, items, money(amountPaid))
        });
      }
      // Notify the business too.
      await sendEmail({
        to: BUSINESS_EMAIL,
        subject: 'New V-Tours booking — ' + (items || title),
        html: `<div style="font-family:sans-serif"><h3 style="color:#063a63">New V-Tours booking</h3>
          <p><b>Items:</b> ${items || title}<br><b>Amount:</b> ${money(amountPaid)}<br><b>Customer:</b> ${email || '(no email)'}<br><b>Type:</b> ${kind || 'checkout'}</p></div>`
      });
    } catch (e) { console.error('V-Tours confirmation email error:', e && e.message); }
  }

  res.status(200).json({ received: true });
};

// Disable Vercel's automatic body parsing so we get the raw buffer
module.exports.config = { api: { bodyParser: false } };

// Manual Stripe signature verification (avoids adding the stripe npm package)
function verifyStripeSignature(payload, sigHeader, secret) {
  if (!sigHeader) throw new Error('Missing stripe-signature header');
  const parts = {};
  sigHeader.split(',').forEach(p => {
    const [k, v] = p.split('=');
    parts[k] = v;
  });
  const timestamp = parts['t'];
  const v1 = parts['v1'];
  if (!timestamp || !v1) throw new Error('Invalid signature header format');

  const signed = timestamp + '.' + payload.toString('utf8');
  const expected = crypto.createHmac('sha256', secret).update(signed).digest('hex');
  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1))) {
    throw new Error('Signature mismatch');
  }

  // Reject events older than 5 minutes
  const age = Math.floor(Date.now() / 1000) - parseInt(timestamp, 10);
  if (age > 300) throw new Error('Webhook timestamp too old');

  return JSON.parse(payload.toString('utf8'));
}
