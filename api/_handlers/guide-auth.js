/**
 * api/guide-auth.js
 * Guide login / logout / session check via Supabase Auth.
 * The frontend passes email + password; we verify with Supabase and return
 * the access_token for the client to store and use on future requests.
 *
 * Requires env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * (Service role key — NOT the anon key — so we can verify sessions server-side)
 */

const https = require('https');

function supabaseRequest(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const base = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
    const url = new URL(base + path);
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '',
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': 'Bearer ' + token } : { 'Authorization': 'Bearer ' + (process.env.SUPABASE_SERVICE_ROLE_KEY || '') }),
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    };
    const req = https.request(options, r => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => {
        try { resolve({ status: r.statusCode, body: JSON.parse(d) }); }
        catch (e) { resolve({ status: r.statusCode, body: d }); }
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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.SUPABASE_URL) {
    return res.status(500).json({ error: 'Supabase not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to Vercel env vars.' });
  }

  const { action, email, password, accessToken } = req.body || {};

  // ── Login ──────────────────────────────────────────────────────────────
  if (action === 'login') {
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });
    const result = await supabaseRequest('POST', '/auth/v1/token?grant_type=password', { email, password });
    if (result.status !== 200 || !result.body.access_token) {
      return res.status(401).json({ error: result.body.error_description || result.body.msg || 'Invalid credentials' });
    }
    const { access_token, refresh_token, user } = result.body;
    return res.status(200).json({
      ok: true,
      accessToken: access_token,
      refreshToken: refresh_token,
      user: { id: user.id, email: user.email, name: user.user_metadata?.full_name || user.email }
    });
  }

  // ── Verify session ─────────────────────────────────────────────────────
  if (action === 'verify') {
    if (!accessToken) return res.status(400).json({ error: 'accessToken required' });
    const result = await supabaseRequest('GET', '/auth/v1/user', null, accessToken);
    if (result.status !== 200 || !result.body.id) {
      return res.status(401).json({ error: 'Session expired or invalid' });
    }
    const user = result.body;
    return res.status(200).json({
      ok: true,
      user: { id: user.id, email: user.email, name: user.user_metadata?.full_name || user.email }
    });
  }

  // ── Logout ─────────────────────────────────────────────────────────────
  if (action === 'logout') {
    if (accessToken) {
      await supabaseRequest('POST', '/auth/v1/logout', {}, accessToken).catch(() => {});
    }
    return res.status(200).json({ ok: true });
  }

  return res.status(400).json({ error: 'Unknown action. Use login, verify, or logout.' });
};
