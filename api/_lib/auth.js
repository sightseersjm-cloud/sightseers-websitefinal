const crypto = require('crypto');

const SECRET = process.env.JWT_SECRET || process.env.BLOB_READ_WRITE_TOKEN || 'ss-change-this-secret';
const ADMIN_CODE = process.env.ADMIN_PASSCODE || 'SightSeers2026!';

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return salt + ':' + hash;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const check = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(check, 'hex'));
}

function createToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({
    ...payload,
    iat: Date.now(),
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000
  })).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(header + '.' + body).digest('base64url');
  return header + '.' + body + '.' + sig;
}

function verifyToken(token) {
  try {
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
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  return token ? verifyToken(token) : null;
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

module.exports = { hashPassword, verifyPassword, createToken, verifyToken, getUser, requireAuth, requireAdmin, uid, ADMIN_CODE };
