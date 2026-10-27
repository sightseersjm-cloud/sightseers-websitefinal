const crypto = require('crypto');

const SECRET = process.env.JWT_SECRET || process.env.BLOB_READ_WRITE_TOKEN;
if (!SECRET) console.warn('SECURITY WARNING: JWT_SECRET not set — tokens cannot be created');

const ITERATIONS = 210000;

function hashPassword(password) {
  const salt = crypto.randomBytes(32).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, 64, 'sha512').toString('hex');
  return salt + ':' + hash;
}

function verifyPassword(password, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const check = crypto.pbkdf2Sync(password, salt, ITERATIONS, 64, 'sha512').toString('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(check, 'hex'));
  } catch {
    return false;
  }
}

function validatePassword(password) {
  if (!password || password.length < 8) return 'Password must be at least 8 characters';
  if (password.length > 128) return 'Password must be under 128 characters';
  if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain a number';
  return null;
}

function createToken(payload) {
  if (!SECRET) return null;
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({
    ...payload,
    iat: Date.now(),
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000
  })).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(header + '.' + body).digest('base64url');
  return header + '.' + body + '.' + sig;
}

function verifyToken(token) {
  if (!SECRET) return null;
  try {
    if (typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts;
    const expected = crypto.createHmac('sha256', SECRET).update(header + '.' + body).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (payload.exp && payload.exp < Date.now()) return null;
    /* the shared admin passcode sign-in has been removed: a sign-in it made earlier no longer works */
    if (payload.id === 'admin-passcode') return null;
    return payload;
  } catch { return null; }
}

function getUser(req) {
  const auth = (req.headers.authorization || '').trim();
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token || token.length > 2048) return null;
  return verifyToken(token);
}

function requireAuth(req, res) {
  const user = getUser(req);
  if (!user) { res.status(401).json({ error: 'Sign in required' }); return null; }
  return user;
}

function requireAdmin(req, res) {
  const user = getUser(req);
  if (!user) { res.status(401).json({ error: 'Sign in required' }); return null; }
  if (user.role !== 'admin') { res.status(403).json({ error: 'Admin access required' }); return null; }
  return user;
}

/* Content-management guard: full admins AND editors may publish
   site content (blog posts, etc.), but not read customer PII. */
function requireEditor(req, res) {
  const user = getUser(req);
  if (!user) { res.status(401).json({ error: 'Sign in required' }); return null; }
  if (user.role !== 'admin' && user.role !== 'editor') { res.status(403).json({ error: 'Editor or admin access required' }); return null; }
  return user;
}

/* ============================ roles and permissions ============================
   Owners are accounts with role 'admin' and can do everything. Team members are accounts with role 'staff'
   and a list of permissions. Their permissions are read from their account on every request, so changing or
   removing someone takes effect straight away. An older 'editor' account keeps its three content permissions. */
const PERMS = ['pages', 'catalog', 'blog', 'trips', 'inbox'];
const PRESETS = {
  content: { label: 'Content editor', perms: ['pages', 'catalog', 'blog'] },
  trips:   { label: 'Trips manager',  perms: ['trips', 'inbox'] },
  inbox:   { label: 'Inbox helper',   perms: ['inbox'] },
  blog:    { label: 'Blog writer',    perms: ['blog'] }
};
const cleanPerms = list => PERMS.filter(p => Array.isArray(list) && list.includes(p));

async function accountOf(id) {
  const db = require('./db');
  const users = await db.getCollection('users');
  return users.find(u => u.id === id) || null;
}

/* what this signed-in person may do right now */
async function permsOf(user) {
  if (!user) return [];
  if (user.role === 'editor') return ['pages', 'catalog', 'blog'];
  if (user.role === 'admin') {
    const acct = await accountOf(user.id);
    /* "sign out everywhere" ends older sign-ins; an owner is never locked out by a failed read of the account list */
    if (acct && (acct.sessionVersion || 0) !== (user.sv || 0)) return [];
    return PERMS.slice();
  }
  if (user.role === 'staff') {
    const acct = await accountOf(user.id);
    if (!acct || acct.role !== 'staff' || acct.disabled) return [];
    if ((acct.sessionVersion || 0) !== (user.sv || 0)) return [];
    return cleanPerms(acct.perms);
  }
  return [];
}

/* true when the signed-in person has at least one of the permissions */
async function can(user, ...need) {
  const have = await permsOf(user);
  return need.some(n => have.includes(n));
}

async function requirePerm(req, res, ...need) {
  const user = getUser(req);
  if (!user) { res.status(401).json({ error: 'Sign in required' }); return null; }
  const have = await permsOf(user);
  if (!need.some(n => have.includes(n))) {
    res.status(403).json({ error: 'You do not have access to this. Ask the owner to change your role.' });
    return null;
  }
  user.perms = have;
  return user;
}

/* may this person put a change on the live site straight away? Owners can. Team members can unless the owner has asked
   for their changes to be approved first (the default, so a new account is safe until the owner decides otherwise). */
async function canPublishNow(user) {
  if (!user) return false;
  const have = await permsOf(user);
  if (!have.length) return false;
  if (user.role === 'admin') return true;
  if (user.role === 'staff') { const acct = await accountOf(user.id); return !!acct && acct.needsApproval === false; }
  return false;
}

/* owners only: the team, sign-in settings and anything that gives or takes away access */
async function requireOwner(req, res) {
  const user = getUser(req);
  if (!user) { res.status(401).json({ error: 'Sign in required' }); return null; }
  if (user.role !== 'admin' || !(await permsOf(user)).length) {
    res.status(403).json({ error: 'Only the owner can do this.' });
    return null;
  }
  return user;
}

/* a sign-in token for an account; "sv" ends older tokens when the person chooses "sign out everywhere" */
function tokenFor(u) {
  return createToken({ id: u.id, email: u.email, name: u.name, role: u.role, sv: u.sessionVersion || 0 });
}

/* an account as it may leave the server: never the password, reset code or two-step secret */
function publicUser(u) {
  const { passwordHash, resetCode, resetExpires, totpSecret, totpPending, ...rest } = u || {};
  return rest;
}

/* ============================ two-step sign-in (authenticator app codes, RFC 6238) ============================ */
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function b32encode(buf) {
  let bits = '', out = '';
  for (const b of buf) bits += b.toString(2).padStart(8, '0');
  for (let i = 0; i < bits.length; i += 5) out += B32[parseInt(bits.slice(i, i + 5).padEnd(5, '0'), 2)];
  return out;
}
function b32decode(str) {
  let bits = '';
  for (const c of String(str).replace(/=+$/, '').toUpperCase()) { const v = B32.indexOf(c); if (v < 0) return Buffer.alloc(0); bits += v.toString(2).padStart(5, '0'); }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}
function hotp(secretBuf, counter) {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const h = crypto.createHmac('sha1', secretBuf).update(msg).digest();
  const o = h[h.length - 1] & 0xf;
  const n = ((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(n % 1000000).padStart(6, '0');
}
function newTotpSecret() { return b32encode(crypto.randomBytes(20)); }
/* accepts the current code and the one either side, to allow for a slightly wrong clock */
function totpOk(secret, code, now) {
  const c = String(code || '').replace(/\s+/g, '');
  if (!/^\d{6}$/.test(c)) return false;
  const buf = b32decode(secret);
  if (!buf.length) return false;
  const step = Math.floor((now || Date.now()) / 30000);
  for (const d of [-1, 0, 1]) {
    const a = Buffer.from(hotp(buf, step + d)), b = Buffer.from(c);
    if (a.length === b.length && crypto.timingSafeEqual(a, b)) return true;
  }
  return false;
}
function totpKey() { return crypto.createHash('sha256').update('totp:' + (SECRET || 'x')).digest(); }
function sealSecret(plain) {
  const iv = crypto.randomBytes(12), c = crypto.createCipheriv('aes-256-gcm', totpKey(), iv);
  const enc = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
  return iv.toString('base64') + '.' + c.getAuthTag().toString('base64') + '.' + enc.toString('base64');
}
function openSecret(sealed) {
  try {
    const [iv, tag, enc] = String(sealed).split('.').map(x => Buffer.from(x, 'base64'));
    const d = crypto.createDecipheriv('aes-256-gcm', totpKey(), iv); d.setAuthTag(tag);
    return Buffer.concat([d.update(enc), d.final()]).toString('utf8');
  } catch { return ''; }
}

/* preview links: a short-lived signed reference to one waiting change, usable without signing in and good for nothing else */
function previewKey() { return crypto.createHash('sha256').update('preview:' + (SECRET || 'x')).digest(); }
function signPreview(draftId, days) {
  const body = Buffer.from(JSON.stringify({ d: draftId, exp: Date.now() + (days || 7) * 86400000 })).toString('base64url');
  return body + '.' + crypto.createHmac('sha256', previewKey()).update(body).digest('base64url');
}
function verifyPreview(token) {
  try {
    const [body, sig] = String(token || '').split('.');
    if (!body || !sig) return null;
    const want = crypto.createHmac('sha256', previewKey()).update(body).digest('base64url');
    if (sig.length !== want.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want))) return null;
    const p = JSON.parse(Buffer.from(body, 'base64url').toString());
    return p.exp > Date.now() && typeof p.d === 'string' ? p.d : null;
  } catch { return null; }
}

function uid() { return crypto.randomUUID(); }

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = { hashPassword, verifyPassword, validatePassword, createToken, verifyToken, getUser, requireAuth, requireAdmin, requireEditor, uid, escapeHtml,
  PERMS, PRESETS, cleanPerms, permsOf, can, canPublishNow, signPreview, verifyPreview, requirePerm, requireOwner, tokenFor, publicUser, newTotpSecret, totpOk, b32encode, sealSecret, openSecret };
