# Sub-Second Live Video Plan — WebRTC Tier for Live Shopping

**Goal:** make the live-shopping moments conversational. When the guide holds a
carving up to the camera, pushes a 3D scan, or hands cash to an artisan after a
sale, the traveler should see it in **under one second** — not the 5–30 seconds
HLS delivers today.

**Strategy in one sentence:** keep Mux HLS as the reliable broadcast tier,
add a managed WebRTC tier (LiveKit Cloud) for interactive viewers, feed both
from a single guide ingest, and drive the existing shop/vote/3D-scan UI over
the WebRTC data channel.

---

## 1. Why not "just WebRTC everything"

| Concern | Reality |
|---|---|
| Passive viewers | HLS is cheaper, more robust on weak networks, and already built (Mux + HLS.js). A viewer who never interacts doesn't need 300 ms latency. |
| 8K 360° | WebRTC realistically tops out around 4K. The X4's 5.7K/8K captures stay in the record→edit→panorama pipeline; live 360° streams at ≤4K. |
| Vercel constraints | Serverless can't host an SFU or persistent WebSocket signaling. A managed SFU + a stateless token-minting endpoint fits perfectly. |

So: **two tiers, one ingest.** Sub-second WebRTC for the people in the buying
moment; HLS for the crowd. Each viewer auto-negotiates down: WebRTC → HLS.

## 2. Provider choice: LiveKit Cloud (recommended)

| Provider | Verdict |
|---|---|
| **LiveKit Cloud** | **Pick.** Open-source core (self-host escape hatch later, same API), RTMP/WHIP Ingress, Egress restreaming to RTMP (feeds Mux → HLS unchanged), simulcast, built-in TURN, **DataChannel messaging** (drives the shop UI), JS SDK for web, **Swift SDK that runs on visionOS** (the Vision Pro app joins the same room), Node token minting works on Vercel serverless. |
| Daily.co | Excellent, similar shape; less clean self-host path. Solid runner-up. |
| Amazon IVS Real-Time | Good latency, AWS account/ops overhead, no visionOS SDK. |
| Dolby Millicast | Broadcast-grade WHIP/WHEP fan-out, weaker "room + data" interactivity. |
| Agora | Capable, pricing scales badly for long sessions. |
| Self-hosted (LiveKit OSS / MediaMTX / SRS) | Phase-3 cost optimization once volume justifies ops (TURN, scaling, monitoring). Not first. |

Pricing note: LiveKit Cloud bills roughly per participant-minute + egress
bandwidth, with a meaningful free tier. **Verify current pricing before
launch** — but the worked example below stays in the tens of dollars per
session at your scale, and the free tier likely covers the pilot outright.

## 3. Architecture

```
                       ┌────────────── ONE INGEST ──────────────┐
[Insta360 X4] → phone  │  RTMP (today)  or  WHIP (phase 2)      │
      + DJI mic  5G ──►│            LiveKit Ingress             │
                       └──────────────────┬─────────────────────┘
                                          │ publishes into room
                                   ┌──────▼──────┐
                                   │ LiveKit SFU │  (room = playbackId)
                                   └──┬───────┬──┘
                 WebRTC ≤ 500 ms      │       │      LiveKit Egress → RTMP
        ┌─────────────────────────────┘       └──────────────► Mux ─► HLS 5–30 s
        ▼                                                        ▼
  INTERACTIVE TIER                                        BROADCAST TIER
  • buyers in the shopping moment                         • passive viewers
  • group-vote participants                               • existing player code
  • Vision Pro app users                                  • DVR/replays (Mux)
        ▲
        │  DataChannel (sub-100 ms JSON events)
        │  {t:'scan3d'} → vtOpen3D()      {t:'vote'}  → vote card
        │  {t:'sold'}   → confetti+toast  {t:'scene'} → vtSwitchScene()
        └── the SAME UI functions the site already has
```

**Why this shape wins:** the guide still pushes one stream; the current
Mux/HLS player code keeps working untouched; the WebRTC tier is purely
additive; and if LiveKit is down, everyone silently lands on HLS.

## 4. Latency budget (honest numbers)

| Path | Expected glass-to-glass |
|---|---|
| Phase 1: X4 app → RTMP → LiveKit Ingress → WebRTC viewer | **~2–3 s** (RTMP ingest transcode dominates) — already 5–10× better than HLS |
| Phase 2: rig publishes WHIP/WebRTC directly (OBS 30+ WHIP, or Larix → SRT gateway) | **~300–600 ms** — true conversational |
| Broadcast tier (unchanged) | Mux standard HLS 15–30 s; enable Mux low-latency HLS for ~5–7 s |
| DataChannel events (scan push, votes, sold) | **< 100 ms** — instant regardless of video tier |

The killer insight: **even in Phase 1, the shopping *events* are instant.**
The 3D scan modal, the vote card, and the "sold — artisan paid" confetti ride
the data channel, so interactivity feels live before the video itself is
sub-second.

## 5. What's already built in this repo (groundwork, shipped)

1. **`GET /api/live-token`** — LiveKit access-token minting in the existing
   catch-all router (function count stays 2). Plain `crypto` HS256 JWT — no
   new dependencies.
   - `?probe=1` → `{ configured: false }` until env vars are set (the UI uses
     this to stay HLS-only).
   - `?room=<id>&identity=<name>` → subscriber token (10 min TTL, join +
     subscribe + data only).
   - `?role=publisher` requires the existing guide session (Authorization
     header, verified against Supabase like guide-auth) → publish token.
2. **`vtRTC` client layer** in the session player — inert until the probe
   says configured, then: on `vtActivateLivePlayer`, it races a LiveKit join
   with a 4 s timeout; on success swaps the video track in and pauses HLS;
   on any failure stays on HLS. DataChannel messages dispatch to
   `vtOpen3D`, the crowd-vote card, `vtLaunchConfetti`, and `vtSwitchScene`.
   SDK (`livekit-client` UMD) lazy-loads only when needed.

## 6. Go-live checklist (when you're ready)

1. Create a LiveKit Cloud project → copy `wss://` URL, API key, API secret.
2. Vercel → Project → Settings → Environment Variables:
   - `LIVEKIT_URL=wss://<project>.livekit.cloud`
   - `LIVEKIT_API_KEY=...`
   - `LIVEKIT_API_SECRET=...`
3. Redeploy. `/api/live-token?probe=1` now returns `configured: true` and the
   player starts attempting the fast tier automatically.
4. In LiveKit dashboard, create an **Ingress** (RTMP) per guide → give the
   guide that RTMP URL/key alongside (or instead of) the Mux key.
5. Create an **Egress** rule: room composite → RTMP → the existing Mux stream
   key. HLS tier now mirrors the room.
6. Test matrix: Chrome desktop, iPhone Safari, Quest browser, Vision Pro
   Safari, and a 3G-throttled session (must land on HLS gracefully).

## 7. Worked cost example (verify current pricing)

Pilot session: 60 min, 1 guide publishing 1080p, 40 interactive WebRTC
viewers, 200 HLS viewers.

- LiveKit participant-minutes: 41 × 60 ≈ 2,460 min → free tier or single-digit $
- LiveKit egress→Mux: one 1080p stream × 60 min → ~2–3 GB → cents-to-$
- Mux delivery for 200 HLS viewers: unchanged from today's bill
- **Marginal cost of the fast tier: roughly the price of one patty run.**

At 10× that scale, revisit: simulcast caps for mobile viewers, and the
phase-3 self-host math (LiveKit OSS on two 8-core VPSs + TURN ≈ fixed
~$80–150/mo replacing usage billing).

## 8. Data channel event protocol (v1)

```jsonc
{ "t": "scan3d", "item": { "name": "Handwoven Market Basket", "glb": "/models/basket-01.glb", "usdz": null, "priceUSD": 28 } }
{ "t": "vote",   "q": "Where next?", "options": ["Waterfall trail", "Craft market", "Beach sunset"] }
{ "t": "sold",   "item": "Carved Blue Mahoe Bird", "buyer": "Sarah A." }
{ "t": "scene",  "id": "market" }
```

Rules: publisher-only origin (tokens enforce it), ≤ 4 KB per message,
unknown `t` ignored (forward compatibility). The Vision Pro app (visionos/)
consumes the identical protocol via the LiveKit Swift SDK — M5 in SPEC.md.

## 9. Phased rollout

| Phase | Scope | Exit criteria |
|---|---|---|
| **P0 (done)** | Token endpoint + client fallback layer shipped dark | Probe returns `configured:false`, zero impact on today's flow |
| **P1** | LiveKit project, RTMP ingress, egress→Mux; internal test sessions | 2–3 s interactive tier stable on 5G from Ocho Rios market |
| **P2** | WHIP publishing from the rig; DataChannel shopping events in production sessions | < 600 ms glass-to-glass; a live 3D-scan push converts a sale |
| **P3** | Vision Pro app joins rooms (LiveKit Swift SDK, SPEC M5); evaluate self-host economics | Same session, headset + web + phone simultaneously |
