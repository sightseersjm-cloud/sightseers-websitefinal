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
