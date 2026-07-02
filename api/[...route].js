/**
 * api/[...route].js
 * Consolidated API router.
 *
 * Vercel's Hobby plan allows at most 12 serverless functions per deployment,
 * so every endpoint is dispatched through this single catch-all function.
 * Handler modules live in api/_handlers/ (underscore-prefixed directories
 * are not deployed as functions).
 *
 * stripe-webhook.js remains a separate top-level function because it needs
 * `bodyParser: false` to verify Stripe signatures against the raw body —
 * exact file matches take precedence over this catch-all.
 */

const handlers = {
  'auth':            require('./_handlers/auth'),
  'blog':            require('./_handlers/blog'),
  'bookings':        require('./_handlers/bookings'),
  'contact':         require('./_handlers/contact'),
  'content':         require('./_handlers/content'),
  'gallery':         require('./_handlers/gallery'),
  'guide-auth':      require('./_handlers/guide-auth'),
  'images':          require('./_handlers/images'),
  'live-token':      require('./_handlers/live-token'),
  'mux-stream':      require('./_handlers/mux-stream'),
  'sections':        require('./_handlers/sections'),
  'settings':        require('./_handlers/settings'),
  'stays':           require('./_handlers/stays'),
  'stripe-checkout': require('./_handlers/stripe-checkout'),
  'tours':           require('./_handlers/tours'),
  'track':           require('./_handlers/track'),
  'verify-token':    require('./_handlers/verify-token'),
  'vtours':          require('./_handlers/vtours'),
  'waitlist':        require('./_handlers/waitlist'),
};

module.exports = async function router(req, res) {
  const path = (req.url || '').split('?')[0];
  const segment = path.replace(/^\/api\/?/, '').split('/')[0];
  const handler = handlers[segment];

  if (!handler) {
    return res.status(404).json({ error: 'Not found' });
  }

  return handler(req, res);
};
