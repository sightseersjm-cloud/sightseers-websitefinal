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
  'club-cron':       require('./_handlers/club-cron'),
  'content':         require('./_handlers/content'),
  'gallery':         require('./_handlers/gallery'),
  'group-trip':      require('./_handlers/group-trip'),
  'guide-auth':      require('./_handlers/guide-auth'),
  'images':          require('./_handlers/images'),
  'inbox':           require('./_handlers/inbox'),
  'live-token':      require('./_handlers/live-token'),
  'mux-stream':      require('./_handlers/mux-stream'),
  'newsletter':      require('./_handlers/newsletter'),
  'passport':        require('./_handlers/passport'),
  'planning-request': require('./_handlers/planning-request'),
  'sections':        require('./_handlers/sections'),
  'settings':        require('./_handlers/settings'),
  'site-edit':       require('./_handlers/site-edit'),
  'stays':           require('./_handlers/stays'),
  'stripe-checkout': require('./_handlers/stripe-checkout'),
  'tours':           require('./_handlers/tours'),
  'tour-page':       require('./_handlers/tour-page'),
  'trips':           require('./_handlers/trips'),
  'track':           require('./_handlers/track'),
  'verify-token':    require('./_handlers/verify-token'),
  'vt-config':       require('./_handlers/vt-config'),
  'vtours':          require('./_handlers/vtours'),
  'waitlist':        require('./_handlers/waitlist'),
};

module.exports = async function router(req, res) {
  // Normalize the body once for every handler: undefined → {},
  // JSON-looking strings → parsed object (handlers destructure req.body).
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    if (typeof req.body === 'string') {
      try { req.body = JSON.parse(req.body); } catch (e) { req.body = {}; }
    }
    if (req.body == null || typeof req.body !== 'object') req.body = {};
  }

  const path = (req.url || '').split('?')[0];
  let segment = path.replace(/^\/api\/?/, '').split('/')[0];
  /* /tours/<slug> is rewritten to this function (see vercel.json); the request keeps the address that was asked for */
  const tourPage = /^\/tours\/([^/]+)\/?$/.exec(path);
  if (tourPage) {
    segment = 'tour-page';
    let slug = tourPage[1]; try { slug = decodeURIComponent(slug); } catch (e) { /* keep as is */ }
    req.query = Object.assign({}, req.query || {}, { slug });
  }
  const handler = handlers[segment];

  if (!handler) {
    return res.status(404).json({ error: 'Not found' });
  }

  /* a failure inside a handler must still answer in JSON, so the page can show a real message instead of "not valid JSON" */
  try {
    return await handler(req, res);
  } catch (e) {
    const stopped = e && (e.name === 'BlobStoreSuspendedError' || /suspended|limits? exceeded|quota/i.test(String(e.message || '')));
    console.error('api error', segment, e && e.name, e && e.message);
    if (res.headersSent) return;
    if (stopped) return res.status(503).json({ error: 'The website storage is paused at the moment, so this could not be saved. Please try again later, or contact us if it keeps happening.', code: 'storage-paused' });
    return res.status(500).json({ error: 'Something went wrong on our side. Please try again in a moment.' });
  }
};
