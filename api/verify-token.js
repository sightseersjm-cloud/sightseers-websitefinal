/**
 * api/verify-token.js
 * Validates a viewer access token issued after Stripe payment.
 * Returns the playbackId so the client can start the HLS stream.
 *
 * POST { token, playbackId }
 * → { ok: true, hlsUrl }  |  { error: '...' }
 */

const db = require('./_lib/db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { token, playbackId } = req.body || {};
  if (!token || !playbackId) return res.status(400).json({ error: 'token and playbackId required' });

  const tokens = await db.getCollection('viewer-tokens');
  const record = tokens.find(t => t.token === token && t.playbackId === playbackId);

  if (!record) return res.status(403).json({ error: 'Invalid or expired token' });
  if (new Date(record.expiresAt) < new Date()) {
    return res.status(403).json({ error: 'Token expired' });
  }

  return res.status(200).json({
    ok: true,
    hlsUrl: `https://stream.mux.com/${playbackId}.m3u8`,
    playbackId
  });
};
