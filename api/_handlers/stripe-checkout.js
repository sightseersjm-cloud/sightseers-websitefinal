/**
 * api/stripe-checkout.js
 * Creates a Stripe Checkout session for joining a live tour.
 * Requires env vars: STRIPE_SECRET_KEY
 */

const https = require('https');
const querystring = require('querystring');
const { sceneByPlaybackId } = require('../_lib/vt-scenes');

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

  const { tourName, priceUsd, playbackId, streamId, successUrl, cancelUrl, items } = req.body || {};

  // A cart checkout sends { items: [{ id, qty, option }] }. Prices are looked
  // up here, never taken from the browser: otherwise anyone could post a $1
  // price for an $1,800 experience and Stripe would happily charge it.
  let cartLines = null;
  if (Array.isArray(items) && items.length) {
    if (items.length > 20) return res.status(400).json({ error: 'Too many items in one checkout.' });
    let PRICES;
    try { PRICES = require('../_data/tour-prices.json'); }
    catch (e) { return res.status(500).json({ error: 'Tour price list is missing on the server.' }); }

    cartLines = [];
    for (const raw of items) {
      const entry = PRICES[String(raw && raw.id)];
      if (!entry) return res.status(400).json({ error: 'Unknown tour in cart: ' + (raw && raw.id) });
      if (entry.price === null) {
        return res.status(400).json({ error: '"' + entry.title + '" is quote-only and cannot be paid for online.' });
      }
      const qty = Math.max(1, Math.min(50, parseInt(raw && raw.qty, 10) || 1));
      // Only echo an option back if it is one this tour actually offers.
      const option = (entry.options || []).includes(raw && raw.option) ? raw.option : '';
      cartLines.push({ name: entry.title, price: entry.price, qty: qty, option: option });
    }
  }

  // Live V-Tour seats. The browser used to send its own tourName and priceUsd,
  // and they were billed as given — so a posted priceUsd of 1 charged $1 for an
  // $1,800 experience. The cart path was hardened against exactly this; this one
  // was not. The price now comes from the scene config keyed by playback id, and
  // anything the browser claims is ignored.
  let liveLine = null;
  if (!cartLines) {
    if (!playbackId) {
      return res.status(400).json({ error: 'playbackId required' });
    }
    const scene = sceneByPlaybackId(playbackId);
    if (!scene) {
      return res.status(400).json({ error: 'Unknown live session.' });
    }
    if (!(scene.price > 0)) {
      return res.status(400).json({ error: '"' + scene.title + '" has no online price set.' });
    }
    liveLine = { name: scene.title, price: scene.price };
  }

  const origin = req.headers.origin || 'https://sightseerscaribbean.com';
  // {CHECKOUT_SESSION_ID} is a Stripe template variable — replaced at redirect time
  const success = successUrl || `${origin}/?session=live&playbackId=${encodeURIComponent(playbackId||'')}&stripeSession={CHECKOUT_SESSION_ID}`;
  const cancel  = cancelUrl  || `${origin}/`;

  // No payment_method_types: automatic payment methods enable Apple Pay /
  // Google Pay in Stripe Checkout once the domain is verified in the
  // Stripe dashboard (Settings → Payment methods → Apple Pay → add domain).
  const params = {
    'mode': 'payment',
    'success_url': success,
    'cancel_url': cancel,
    'metadata[streamId]': streamId || '',
    'metadata[playbackId]': playbackId || ''
  };

  if (cartLines) {
    cartLines.forEach((line, i) => {
      params['line_items[' + i + '][price_data][currency]'] = 'usd';
      params['line_items[' + i + '][price_data][unit_amount]'] = String(Math.round(line.price * 100));
      params['line_items[' + i + '][price_data][product_data][name]'] = line.name.slice(0, 250);
      params['line_items[' + i + '][price_data][product_data][description]'] =
        (line.option ? line.option + ' — ' : '') + 'Sight Seers Caribbean Adventures';
      params['line_items[' + i + '][quantity]'] = String(line.qty);
    });
    params['metadata[kind]'] = 'tour-cart';
    params['metadata[tours]'] = cartLines.map(l => l.name + ' x' + l.qty).join(', ').slice(0, 480);
  } else {
    params['line_items[0][price_data][currency]'] = 'usd';
    params['line_items[0][price_data][unit_amount]'] = String(Math.round(liveLine.price * 100));
    params['line_items[0][price_data][product_data][name]'] = liveLine.name;
    params['line_items[0][price_data][product_data][description]'] = 'Sight Seers Caribbean Live Virtual Tour';
    params['line_items[0][quantity]'] = '1';
  }

  const result = await stripeRequest('POST', '/v1/checkout/sessions', params);

  if (result.status !== 200) {
    return res.status(502).json({ error: 'Stripe session creation failed', detail: result.body });
  }

  return res.status(200).json({ ok: true, url: result.body.url, sessionId: result.body.id });
};
