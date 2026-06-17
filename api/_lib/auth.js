const crypto = require('crypto');

const SECRET = process.env.JWT_SECRET || process.env.BLOB_READ_WRITE_TOKEN;
const ADMIN_CODE = process.env.ADMIN_PASSCODE;

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

function uid() { return crypto.randomUUID(); }

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = { hashPassword, verifyPassword, validatePassword, createToken, verifyToken, getUser, requireAuth, requireAdmin, uid, escapeHtml, ADMIN_CODE };
