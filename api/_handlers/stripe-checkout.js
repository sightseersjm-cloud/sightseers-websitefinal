/**
 * api/stripe-checkout.js
 * Creates a Stripe Checkout session for joining a live tour.
 * Requires env vars: STRIPE_SECRET_KEY
 */

const https = require('https');
const querystring = require('querystring');

function stripeRequest(method, path, params) {
  return new Promise((resolve, reject) => {
    const payload = params ? querystring.stringify(params) : null;
    const options = {
      hostname: 'api.stripe.com',
      path,
      method,
      headers: {
        'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch (e) { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe not configured. Add STRIPE_SECRET_KEY to Vercel environment variables.' });
  }

  const { tourName, priceUsd, playbackId, streamId, successUrl, cancelUrl } = req.body || {};
  if (!tourName || !priceUsd) return res.status(400).json({ error: 'tourName and priceUsd required' });

  const origin = req.headers.origin || 'https://sightseerscaribbean.com';
  // {CHECKOUT_SESSION_ID} is a Stripe template variable — replaced at redirect time
  const success = successUrl || `${origin}/?session=live&playbackId=${encodeURIComponent(playbackId||'')}&stripeSession={CHECKOUT_SESSION_ID}`;
  const cancel  = cancelUrl  || `${origin}/`;

  // No payment_method_types: automatic payment methods enable Apple Pay /
  // Google Pay in Stripe Checkout once the domain is verified in the
  // Stripe dashboard (Settings → Payment methods → Apple Pay → add domain).
  const result = await stripeRequest('POST', '/v1/checkout/sessions', {
    'line_items[0][price_data][currency]': 'usd',
    'line_items[0][price_data][unit_amount]': String(Math.round(Number(priceUsd) * 100)),
    'line_items[0][price_data][product_data][name]': tourName,
    'line_items[0][price_data][product_data][description]': 'Sight Seers Caribbean Live Virtual Tour',
    'line_items[0][quantity]': '1',
    'mode': 'payment',
    'success_url': success,
    'cancel_url': cancel,
    'metadata[streamId]': streamId || '',
    'metadata[playbackId]': playbackId || ''
  });

  if (result.status !== 200) {
    return res.status(502).json({ error: 'Stripe session creation failed', detail: result.body });
  }

  return res.status(200).json({ ok: true, url: result.body.url, sessionId: result.body.id });
};
