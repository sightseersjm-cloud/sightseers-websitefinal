/**
 * api/mux-stream.js
 * Handles Mux live stream creation, status, and deletion.
 * Requires env vars: MUX_TOKEN_ID, MUX_TOKEN_SECRET
 */

const https = require('https');

function muxRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(
      `${process.env.MUX_TOKEN_ID}:${process.env.MUX_TOKEN_SECRET}`
    ).toString('base64');
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.mux.com',
      path,
      method,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch (e) { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
    return res.status(500).json({ error: 'Mux credentials not configured. Add MUX_TOKEN_ID and MUX_TOKEN_SECRET to Vercel environment variables.' });
  }

  // POST /api/mux-stream — create a new live stream
  if (req.method === 'POST') {
    const { action, streamId, title, price } = req.body || {};

    if (action === 'create') {
      const result = await muxRequest('POST', '/video/v1/live-streams', {
        playback_policy: ['public'],
        new_asset_settings: { playback_policy: ['public'] },
        latency_mode: 'low',
        reconnect_window: 60,
        max_continuous_duration: 43200,
        meta: { title: title || 'Sight Seers Live Tour', price: String(price || 0) }
      });

      if (result.status !== 201) {
        return res.status(502).json({ error: 'Mux stream creation failed', detail: result.body });
      }

      const stream = result.body.data;
      return res.status(200).json({
        ok: true,
        streamId: stream.id,
        streamKey: stream.stream_key,
        rtmpUrl: 'rtmps://global-live.mux.com:443/app',
        playbackId: stream.playback_ids?.[0]?.id,
        hlsUrl: `https://stream.mux.com/${stream.playback_ids?.[0]?.id}.m3u8`,
        status: stream.status
      });
    }

    if (action === 'end' && streamId) {
      await muxRequest('PUT', `/video/v1/live-streams/${streamId}/complete`, null);
      return res.status(200).json({ ok: true });
    }

    if (action === 'disable' && streamId) {
      await muxRequest('PUT', `/video/v1/live-streams/${streamId}/disable`, null);
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'Unknown action' });
  }

  // GET /api/mux-stream?streamId=xxx — get stream status
  if (req.method === 'GET') {
    const { streamId } = req.query || {};
    if (!streamId) return res.status(400).json({ error: 'streamId required' });
    const result = await muxRequest('GET', `/video/v1/live-streams/${streamId}`, null);
    if (result.status !== 200) {
      return res.status(502).json({ error: 'Failed to get stream status', detail: result.body });
    }
    const stream = result.body.data;
    return res.status(200).json({
      ok: true,
      status: stream.status,
      playbackId: stream.playback_ids?.[0]?.id,
      hlsUrl: `https://stream.mux.com/${stream.playback_ids?.[0]?.id}.m3u8`
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
