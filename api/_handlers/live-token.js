/**
 * api/_handlers/live-token.js
 * LiveKit access-token minting for the sub-second live tier
 * (architecture: docs/WEBRTC-PLAN.md).
 *
 *   GET /api/live-token?probe=1
 *     → { ok, configured }  — lets the player decide whether to attempt
 *       the WebRTC tier at all. Never errors.
 *
 *   GET /api/live-token?room=<id>&identity=<display-name>
 *     → { ok, url, token } — subscriber token: join + subscribe +
 *       receive data only. 10-minute TTL.
 *
 *   GET /api/live-token?room=<id>&identity=<name>&role=publisher
 *     → publisher token (publish + data). Requires the guide's Supabase
 *       access token in the Authorization header — same auth the guide
 *       dashboard already uses. 4-hour TTL to cover a full session.
 *
 * Tokens are standard LiveKit HS256 JWTs minted with node:crypto —
 * no SDK dependency. Configure via Vercel env vars:
 *   LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET
 */

const crypto = require('crypto');

const SUBSCRIBER_TTL_S = 10 * 60;
const PUBLISHER_TTL_S = 4 * 60 * 60;

function b64url(buf) {
  return Buffer.from(buf).toString('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function mintToken({ apiKey, apiSecret, identity, room, publisher }) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    iss: apiKey,
    sub: identity,
    name: identity,
    nbf: now - 10,
    exp: now + (publisher ? PUBLISHER_TTL_S : SUBSCRIBER_TTL_S),
    video: {
      room,
      roomJoin: true,
      canSubscribe: true,
      canPublish: !!publisher,
      canPublishData: !!publisher
    }
  };
  const signingInput = b64url(JSON.stringify(header)) + '.' + b64url(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', apiSecret).update(signingInput).digest();
  return signingInput + '.' + b64url(sig);
}

async function verifyGuide(req) {
  // Same trust model as guide-auth: a Supabase access token proves the
  // caller is a signed-in guide. Validate it against Supabase's user
  // endpoint; any 200 = authenticated guide.
  const auth = req.headers['authorization'] || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  const url = process.env.SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY;
  if (!token || !url || !anon) return false;
  try {
    const r = await fetch(`${url}/auth/v1/user`, {
      headers: { apikey: anon, Authorization: `Bearer ${token}` }
    });
    return r.status === 200;
  } catch (e) {
    return false;
  }
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { probe, room, identity, role } = req.query || {};
  const url = process.env.LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const configured = !!(url && apiKey && apiSecret);

  res.setHeader('Cache-Control', 'no-store');

  if (probe) return res.status(200).json({ ok: true, configured });

  if (!configured) {
    return res.status(503).json({
      ok: false,
      configured: false,
      error: 'Live WebRTC tier not configured. Set LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET.'
    });
  }

  const roomName = String(room || '').trim();
  const who = String(identity || '').trim().slice(0, 64);
  if (!roomName || !who) {
    return res.status(400).json({ error: 'room and identity are required' });
  }
  if (!/^[\w:.-]{1,128}$/.test(roomName)) {
    return res.status(400).json({ error: 'invalid room name' });
  }

  const wantsPublish = role === 'publisher';
  if (wantsPublish && !(await verifyGuide(req))) {
    return res.status(401).json({ error: 'Publisher tokens require a signed-in guide' });
  }

  const token = mintToken({ apiKey, apiSecret, identity: who, room: roomName, publisher: wantsPublish });
  return res.status(200).json({
    ok: true,
    url,
    token,
    role: wantsPublish ? 'publisher' : 'subscriber',
    expiresIn: wantsPublish ? PUBLISHER_TTL_S : SUBSCRIBER_TTL_S
  });
};
