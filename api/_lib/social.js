/**
 * api/_lib/social.js
 * "Continue with Google" and "Continue with Microsoft" (Hotmail, Outlook, Live) for the member sign-in.
 * A plain OAuth 2.0 / OpenID Connect authorization-code flow:
 *
 *   GET /api/auth/<provider>/start      sends the visitor to the provider
 *   GET /api/auth/<provider>/callback   the provider sends them back here; we sign them in and return to /account
 *   GET /api/auth?providers=1           which buttons to show (only providers whose credentials are set)
 *
 * Credentials live only in the host environment: GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET and
 * MICROSOFT_CLIENT_ID / MICROSOFT_CLIENT_SECRET. Microsoft is limited to personal accounts (the "consumers"
 * tenant), whose email addresses Microsoft has verified. An account is only created or signed in when the
 * provider says the email address is verified.
 */
const crypto = require('crypto');

const SITE = () => (process.env.SITE_URL || 'https://www.sightseerscaribbean.com').replace(/\/+$/, '');
const PROVIDERS = {
  google: {
    id: () => process.env.GOOGLE_CLIENT_ID, secret: () => process.env.GOOGLE_CLIENT_SECRET,
    authorize: 'https://accounts.google.com/o/oauth2/v2/auth', token: 'https://oauth2.googleapis.com/token',
    scope: 'openid email profile', extra: { prompt: 'select_account' }
  },
  microsoft: {
    id: () => process.env.MICROSOFT_CLIENT_ID, secret: () => process.env.MICROSOFT_CLIENT_SECRET,
    authorize: 'https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize', token: 'https://login.microsoftonline.com/consumers/oauth2/v2.0/token',
    scope: 'openid email profile', extra: { prompt: 'select_account' }
  }
};
const COOKIE = 'ss_oauth';

function enabled(name) { const p = PROVIDERS[name]; return !!(p && p.id() && p.secret()); }
function providers() { return { google: enabled('google'), microsoft: enabled('microsoft') }; }
function redirectUri(name) { return SITE() + '/api/auth/' + name + '/callback'; }
function sign(s) { return crypto.createHmac('sha256', process.env.JWT_SECRET || '').update(s).digest('base64url'); }
function same(a, b) { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); }
function cookieOf(req, name) {
  const m = String((req.headers && req.headers.cookie) || '').split(/;\s*/).map(c => c.split('=')).find(c => c[0] === name);
  return m ? m.slice(1).join('=') : '';
}
function redirect(res, url, cookie) {
  if (cookie) res.setHeader('Set-Cookie', cookie);
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Location', url);
  return res.status(302).end();
}
function back(res, kind, value) {
  return redirect(res, '/account#' + kind + '=' + encodeURIComponent(value), COOKIE + '=; Path=/api/auth; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
}

function start(name, res) {
  if (!enabled(name)) return back(res, 'sso_error', 'That sign-in option is not available yet.');
  const p = PROVIDERS[name], nonce = crypto.randomBytes(16).toString('hex');
  const payload = Buffer.from(JSON.stringify({ n: nonce, p: name, exp: Date.now() + 10 * 60 * 1000 })).toString('base64url');
  const state = payload + '.' + sign(payload);
  const q = new URLSearchParams(Object.assign({ client_id: p.id(), redirect_uri: redirectUri(name), response_type: 'code', scope: p.scope, state }, p.extra));
  return redirect(res, p.authorize + '?' + q.toString(), COOKIE + '=' + nonce + '; Path=/api/auth; HttpOnly; Secure; SameSite=Lax; Max-Age=600');
}

function claimsOf(idToken) {
  try { return JSON.parse(Buffer.from(String(idToken).split('.')[1], 'base64url').toString('utf8')); } catch (e) { return null; }
}

async function callback(name, req, res, q, deps) {
  if (!enabled(name)) return back(res, 'sso_error', 'That sign-in option is not available yet.');
  if (q.error) return back(res, 'sso_error', 'Sign-in was cancelled.');
  const code = String(q.code || ''), state = String(q.state || '');
  const [payload, sig] = state.split('.');
  let st = null;
  try { st = payload && sig && same(sig, sign(payload)) ? JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) : null; } catch (e) { st = null; }
  if (!code || !st || st.p !== name || st.exp < Date.now() || !st.n || !same(st.n, cookieOf(req, COOKIE))) {
    return back(res, 'sso_error', 'That sign-in link expired. Please try again.');
  }
  const p = PROVIDERS[name];
  let claims = null;
  try {
    const r = await fetch(p.token, {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code, client_id: p.id(), client_secret: p.secret(), redirect_uri: redirectUri(name), grant_type: 'authorization_code' }).toString()
    });
    const d = await r.json();
    if (!r.ok || !d.id_token) throw new Error(d.error_description || d.error || 'token exchange failed');
    claims = claimsOf(d.id_token);
  } catch (e) {
    console.error('social token', name, e && e.message);
    return back(res, 'sso_error', 'We could not complete that sign-in. Please try again.');
  }
  const email = String((claims && (claims.email || (name === 'microsoft' && /@/.test(claims.preferred_username || '') ? claims.preferred_username : ''))) || '').trim().toLowerCase();
  const verified = name === 'google' ? (claims && (claims.email_verified === true || claims.email_verified === 'true')) : !!email;
  if (!email || !verified) return back(res, 'sso_error', 'That account has no verified email address, so we cannot sign you in with it.');

  const { db, createToken, hashPassword, uid, sendEmail, BUSINESS_EMAIL } = deps;
  const users = await db.getCollection('users');
  let user = users.find(u => u.email === email);
  if (!user) {
    user = {
      id: uid(), name: String((claims && claims.name) || email.split('@')[0]).trim().slice(0, 100), email,
      passwordHash: hashPassword(crypto.randomBytes(18).toString('hex') + 'Aa1'), phone: '', style: 'Adventure', role: 'guest',
      provider: name, createdAt: new Date().toISOString()
    };
    users.push(user);
    await db.setCollection('users', users);
    sendEmail({ to: BUSINESS_EMAIL, subject: 'New member signup: ' + user.name + ' (' + user.email + ')', html: '<p><strong>' + deps.escapeHtml(user.name) + '</strong> created an account with ' + (name === 'google' ? 'Google' : 'Microsoft') + '.</p><p>Email: ' + deps.escapeHtml(user.email) + '</p>' }).catch(() => {});
  }
  const token = createToken({ id: user.id, email: user.email, name: user.name, role: user.role });
  if (!token) return back(res, 'sso_error', 'Sign-in is not configured on the server.');
  return back(res, 'sso', token);
}

module.exports = { providers, start, callback, PROVIDERS, redirectUri };
