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

let PACKAGES = {};
try { PACKAGES = require('./_data/packages.json'); } catch (e) { PACKAGES = {}; }

// Find which 5-day package (if any) a checkout's item string refers to.
function findPackage(itemsStr) {
  if (!itemsStr) return null;
  for (const key of Object.keys(PACKAGES)) {
    const p = PACKAGES[key];
    if (p && p.title && itemsStr.indexOf(p.title) !== -1) return p;
  }
  return null;
}

// Branded, GetYourGuide-style confirmation email for a package booking.
function packageConfirmationHtml(pkg, amount, ref) {
  const slot = s => s ? `<div style="color:#333;font-size:13px;margin:2px 0"><b style="color:#ef8731">${s.when}:</b> ${s.title}${s.place ? ' — <span style="color:#5a6d7e">' + s.place + '</span>' : ''}${s.meta ? ' <span style="color:#8a97a2">· ' + s.meta + '</span>' : ''}</div>` : '';
  const days = (pkg.days || []).map(d =>
    `<tr><td style="padding:10px 9px;border-bottom:1px solid #eef3f0;vertical-align:top;white-space:nowrap"><b style="color:#063a63">Day ${d.n}</b></td><td style="padding:10px 9px;border-bottom:1px solid #eef3f0">${slot(d.am)}${slot(d.pm)}${d.food ? '<div style="color:#4a8a2e;font-size:12px;font-weight:bold;margin-top:4px">Food stop: ' + d.food + '</div>' : ''}</td></tr>`
  ).join('');
  return `
  <div style="font-family:sans-serif;max-width:620px;margin:0 auto">
    <div style="background:linear-gradient(135deg,#063a63,#0a5678);color:#fff;padding:26px 24px;border-radius:16px 16px 0 0">
      <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#70c257;font-weight:800">Sight Seers Caribbean Adventures</div>
      <h2 style="margin:8px 0 0;font-size:22px">Booking confirmed 🎉</h2>
    </div>
    <div style="border:1px solid #e0e7e3;border-top:none;border-radius:0 0 16px 16px;padding:24px">
      <p style="color:#5a6d7e;font-size:15px;line-height:1.6">Thank you for booking the <b>${pkg.title}</b>. Your payment was received and your trip is confirmed — your full day-by-day itinerary and receipt are attached as a PDF.</p>
      <table style="border-collapse:collapse;width:100%;margin:10px 0 16px">
        <tr><td style="padding:8px 9px;font-weight:bold;width:150px;color:#063a63">Package</td><td style="padding:8px 9px;color:#333">${pkg.title}</td></tr>
        <tr style="background:#f6faf7"><td style="padding:8px 9px;font-weight:bold;color:#063a63">Booking reference</td><td style="padding:8px 9px;color:#333">${ref}</td></tr>
        <tr><td style="padding:8px 9px;font-weight:bold;color:#063a63">Amount paid</td><td style="padding:8px 9px;color:#333"><b>${amount}</b></td></tr>
        <tr style="background:#f6faf7"><td style="padding:8px 9px;font-weight:bold;color:#063a63">Suggested base</td><td style="padding:8px 9px;color:#333">${pkg.base || ''}</td></tr>
      </table>
      <h3 style="color:#063a63;margin:0 0 6px;font-size:16px">Your 5-day itinerary</h3>
      <table style="border-collapse:collapse;width:100%">${days}</table>
      <p style="color:#5a6d7e;font-size:12px;line-height:1.6;margin-top:14px">Pickups from your stay and local food stops are included where noted. Prices shown are per-person "from" guides; final tailoring (dates, group size, transfers and villa stays) is confirmed by our team, who will be in touch shortly.</p>
      <div style="margin-top:18px;padding:14px 16px;background:rgba(112,194,87,.08);border-radius:12px;color:#063a63;font-size:13px"><b>Sight Seers Caribbean Adventures</b><br>+1 (876) 465-0630 · info@sightseerscaribbean.com</div>
    </div>
    <p style="color:#9aa7b2;font-size:11px;text-align:center;margin-top:14px">Booking via sightseerscaribbean.com</p>
  </div>`;
}

// Branded PDF receipt + itinerary (returned as base64 for a Resend attachment).
async function buildItineraryPdf(pkg, session, amountStr) {
  const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const navy = rgb(6/255,58/255,99/255), orange = rgb(239/255,135/255,49/255), grey = rgb(.42,.46,.5), dark = rgb(.09,.16,.24);
  const W = 595.28, H = 841.89;
  let page = doc.addPage([W,H]);
  page.drawRectangle({ x:0, y:H-70, width:W, height:70, color:navy });
  try {
    const r = await fetch('https://www.sightseerscaribbean.com/assets/inline/1ba92aa926.png');
    if (r.ok) { const png = await doc.embedPng(new Uint8Array(await r.arrayBuffer())); const sc = 46/png.height; page.drawImage(png, { x:40, y:H-60, width:png.width*sc, height:46 }); }
  } catch (e) {}
  page.drawText('Sight Seers Caribbean Adventures', { x:W-300, y:H-40, size:11, font:bold, color:rgb(1,1,1) });
  let y = H-100;
  page.drawText('Booking Confirmation', { x:40, y, size:20, font:bold, color:navy }); y -= 20;
  page.drawText(pkg.title, { x:40, y, size:13, font, color:dark }); y -= 12;
  page.drawRectangle({ x:40, y, width:W-80, height:2, color:orange }); y -= 22;
  const email = (session.customer_details && session.customer_details.email) || '';
  const ref = (session.id || '').slice(-10).toUpperCase();
  [['Booking reference', ref], ['Amount paid', amountStr], ['Guest email', email], ['Suggested base', pkg.base || '']].forEach(([k,v]) => {
    page.drawText(k, { x:40, y, size:9, font:bold, color:navy });
    page.drawText(String(v || ''), { x:180, y, size:10, font, color:dark }); y -= 18;
  });
  y -= 6;
  page.drawText('Your 5-day itinerary', { x:40, y, size:14, font:bold, color:navy }); y -= 8;
  page.drawRectangle({ x:40, y, width:W-80, height:1, color:rgb(.87,.91,.89) }); y -= 18;
  const slotLine = (s) => {
    if (!s) return;
    if (y < 80) { page = doc.addPage([W,H]); y = H-60; }
    page.drawText(s.when + ':', { x:58, y, size:9, font:bold, color:orange });
    page.drawText((s.title + (s.place ? '  —  ' + s.place : '')).slice(0,74), { x:108, y, size:10, font, color:dark }); y -= 13;
    const meta = (s.meta || '') + (s.pickup ? '   •   ' + s.pickup : '');
    if (meta) { page.drawText(meta.slice(0,92), { x:108, y, size:8.5, font, color:grey }); y -= 15; } else { y -= 3; }
  };
  (pkg.days || []).forEach(d => {
    if (y < 116) { page = doc.addPage([W,H]); y = H-60; }
    page.drawText('Day ' + d.n, { x:40, y, size:11, font:bold, color:navy }); y -= 15;
    slotLine(d.am); slotLine(d.pm);
    if (d.food) { page.drawText(('Food stop: ' + d.food).slice(0,92), { x:58, y, size:8.5, font:bold, color:rgb(.29,.54,.18) }); y -= 14; }
    y -= 7;
  });
  if (y < 120) { page = doc.addPage([W,H]); y = H-60; }
  y -= 4; page.drawRectangle({ x:40, y, width:W-80, height:1, color:rgb(.87,.91,.89) }); y -= 16;
  page.drawText('Pickups from your stay and food stops included where noted. Prices are per-person "from"', { x:40, y, size:8.5, font, color:grey }); y -= 12;
  page.drawText('guides; final tailoring (dates, group size, transfers and villa stays) is confirmed by our team.', { x:40, y, size:8.5, font, color:grey }); y -= 20;
  page.drawText('Sight Seers Caribbean Adventures  ·  +1 (876) 465-0630  ·  info@sightseerscaribbean.com', { x:40, y, size:9, font:bold, color:navy });
  const bytes = await doc.save();
  return Buffer.from(bytes).toString('base64');
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
      const pkg = findPackage(items);
      if (pkg && email) {
        // 5-day package booking: branded receipt + itinerary PDF to the guest.
        const ref = (session.id || '').slice(-10).toUpperCase();
        let attachments = [];
        try {
          const b64 = await buildItineraryPdf(pkg, session, money(amountPaid));
          attachments = [{ filename: 'SightSeers-' + pkg.title.replace(/[^A-Za-z0-9]+/g, '-') + '.pdf', content: b64 }];
        } catch (e) { console.error('Itinerary PDF build error:', e && e.message); }
        await sendEmail({
          to: email,
          subject: 'Your Sight Seers booking is confirmed — ' + pkg.title,
          html: packageConfirmationHtml(pkg, money(amountPaid), ref),
          attachments
        });
      } else if (email) {
        await sendEmail({
          to: email,
          subject: 'Your Sight Seers V-Tours booking is confirmed 🎉',
          html: confirmationHtml(title, items, money(amountPaid))
        });
      }
      // Notify the business too.
      await sendEmail({
        to: BUSINESS_EMAIL,
        subject: 'New booking — ' + (pkg ? pkg.title : (items || title)),
        html: `<div style="font-family:sans-serif"><h3 style="color:#063a63">New booking</h3>
          <p><b>Item:</b> ${pkg ? pkg.title : (items || title)}<br><b>Amount:</b> ${money(amountPaid)}<br><b>Customer:</b> ${email || '(no email)'}<br><b>Type:</b> ${pkg ? 'package' : (kind || 'checkout')}</p></div>`
      });
    } catch (e) { console.error('confirmation email error:', e && e.message); }
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
