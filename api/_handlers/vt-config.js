/**
 * api/_handlers/vt-config.js
 * Public runtime configuration for the 360° V-Tours portal, plus a preflight
 * readiness report.
 *
 *   GET /api/vt-config
 *     → { ok, configured, config: {...}, checks: [...] }
 *
 * Why this exists: VT_CONFIG used to be a literal in Design_Reference.html, so
 * changing a Supabase key meant editing HTML and redeploying. Everything here
 * comes from Vercel environment variables instead — set once, no rebuild.
 *
 * SECURITY: only publishable/anon credentials are ever returned. The Supabase
 * service-role key, Stripe secret key, Mux token secret and JWT secret are
 * deliberately absent — they must never reach the browser. `checks` reports
 * whether a secret is *present*, never its value.
 */

const API_VERSION = '2026-08-13';

/* Mux playback IDs are public by design — playback is gated by signed viewer
   tokens, not by keeping the ID secret. Scene titles and prices stay here so a
   new scene can be added without touching the client bundle. */
function muxScenes() {
  const raw = (process.env.MUX_PLAYBACK_IDS || '').trim();
  const scenes = {};

  // Format: "blue-lagoon:PLAYBACKID:Blue Lagoon Live:42,craft-market:ID:Title:38"
  if (raw) {
    raw.split(',').forEach(entry => {
      const parts = entry.split(':').map(s => s.trim());
      const [key, playbackId, title, price] = parts;
      if (!key || !playbackId) return;
      scenes[key] = {
        playbackId,
        title: title || key,
        price: Number(price) || 0
      };
    });
  }
  return scenes;
}

function present(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const supabaseUrl     = process.env.SUPABASE_URL || '';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
  const stripePk        = process.env.STRIPE_PUBLISHABLE_KEY || '';
  const scenes          = muxScenes();

  /* Each check is one thing a person can act on, with the exact variable to
     set and what stops working until they do. */
  const checks = [
    {
      id: 'supabase',
      label: 'Live chat and guide sign-in',
      ready: present(supabaseUrl) && present(supabaseAnonKey),
      needs: ['SUPABASE_URL', 'SUPABASE_ANON_KEY'],
      blocks: 'Viewers cannot chat during a session and guides cannot sign in.'
    },
    {
      id: 'supabase-admin',
      label: 'Guide account management',
      ready: present(process.env.SUPABASE_SERVICE_ROLE_KEY),
      needs: ['SUPABASE_SERVICE_ROLE_KEY'],
      blocks: 'Guide accounts cannot be verified server-side.'
    },
    {
      id: 'mux',
      label: 'Live video streaming',
      ready: present(process.env.MUX_TOKEN_ID) && present(process.env.MUX_TOKEN_SECRET),
      needs: ['MUX_TOKEN_ID', 'MUX_TOKEN_SECRET'],
      blocks: 'Guides cannot start a stream and viewers see no video.'
    },
    {
      id: 'mux-scenes',
      label: 'Stream playback IDs',
      ready: Object.keys(scenes).length > 0,
      needs: ['MUX_PLAYBACK_IDS'],
      blocks: 'No scene is mapped to a playback ID, so nothing can be watched.'
    },
    {
      id: 'stripe',
      label: 'Taking payment for sessions',
      ready: present(process.env.STRIPE_SECRET_KEY) && present(stripePk),
      needs: ['STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY'],
      blocks: 'Checkout falls back to demo mode and no money is collected.'
    },
    {
      id: 'stripe-webhook',
      label: 'Granting access after payment',
      ready: present(process.env.STRIPE_WEBHOOK_SECRET),
      needs: ['STRIPE_WEBHOOK_SECRET'],
      blocks: 'Paid viewers are never issued a token, so they cannot join what they bought.'
    },
    {
      id: 'jwt',
      label: 'Viewer access tokens',
      ready: present(process.env.JWT_SECRET),
      needs: ['JWT_SECRET'],
      blocks: 'Tokens fall back to the blob storage token, which is not a signing secret.'
    }
  ];

  const configured = checks.every(c => c.ready);

  // Cache briefly at the edge: config changes rarely, but a stale answer after
  // setting a variable would be confusing during setup.
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=30, stale-while-revalidate=60');

  return res.status(200).json({
    ok: true,
    version: API_VERSION,
    configured,
    config: {
      supabase: { url: supabaseUrl, anonKey: supabaseAnonKey },
      stripe:   { publishableKey: stripePk },
      mux:      { scenes }
    },
    checks: checks.map(({ id, label, ready, needs, blocks }) => ({
      id, label, ready, needs, blocks: ready ? null : blocks
    }))
  });
};
