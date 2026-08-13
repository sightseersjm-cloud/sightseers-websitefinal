# V-Tours: going live

Everything the 360° live portal needs is read from Vercel environment variables
at runtime via `/api/vt-config`. **You never edit HTML or redeploy to change a
key** — set the variable in Vercel, redeploy once, and the portal picks it up.

Until the variables are set the portal runs in **preview mode**: the session
chat shows a short sample script, clearly labelled *"Preview — sample
activity"*, and no real credentials are needed. The moment a real chat channel
connects, all sample activity stops automatically.

---

## 1. Check where you stand

Open the site, press F12 for the browser console, and run:

```js
vtDiagnostics()
```

It prints each integration, whether it is ready, the exact variable names to
set, and what stays broken until you do. Run it again after each step.

You can also hit `https://www.sightseerscaribbean.com/api/vt-config` directly —
it returns the same readiness report as JSON. It never returns secret values,
only whether they are present.

---

## 2. Set the variables

In Vercel: **Project → Settings → Environment Variables**. Add each to
Production (and Preview if you want staging to work too), then redeploy.

### Supabase — live chat and guide sign-in

1. Create a project at [supabase.com](https://supabase.com).
2. Go to **Project Settings → API**.

| Variable | Where to find it | Sensitive |
|---|---|---|
| `SUPABASE_URL` | Project URL, e.g. `https://abcd.supabase.co` | No |
| `SUPABASE_ANON_KEY` | Project API keys → `anon` `public` | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Project API keys → `service_role` | **Yes — server only** |

The anon key is safe in the browser; that is what it is designed for. The
service-role key must never be exposed — `/api/vt-config` deliberately does not
return it.

**Create your guide accounts** under **Authentication → Users → Add user**. The
guide portal signs in with these.

### Mux — live video

1. Create a live stream at [dashboard.mux.com](https://dashboard.mux.com)
   (**Video → Live Streams → Create**).
2. Copy the **Stream Key** (for OBS) and the **Playback ID**.

| Variable | Where to find it |
|---|---|
| `MUX_TOKEN_ID` | Settings → Access Tokens |
| `MUX_TOKEN_SECRET` | Shown once when the token is created |
| `MUX_PLAYBACK_IDS` | See format below |

`MUX_PLAYBACK_IDS` maps scenes to streams, comma-separated, each entry
`key:playbackId:Title:price`:

```
blue-lagoon:AbC123xyz:Blue Lagoon Live:42,craft-market:DeF456uvw:Craft Market Live:38
```

Adding a scene later is an edit to this one variable — no code change.

### Stripe — taking payment

| Variable | Where to find it | Sensitive |
|---|---|---|
| `STRIPE_PUBLISHABLE_KEY` | Developers → API keys → Publishable (`pk_live_…`) | No |
| `STRIPE_SECRET_KEY` | Developers → API keys → Secret (`sk_live_…`) | **Yes** |
| `STRIPE_WEBHOOK_SECRET` | See below (`whsec_…`) | **Yes** |

Register the webhook: **Developers → Webhooks → Add endpoint**

- URL: `https://www.sightseerscaribbean.com/api/stripe-webhook`
- Event: `checkout.session.completed`

Copy the signing secret it gives you into `STRIPE_WEBHOOK_SECRET`. Without it,
people who pay are never issued a viewing token — they are charged and cannot
get in. Do not skip this one.

### Signing secret

| Variable | Value |
|---|---|
| `JWT_SECRET` | A random 32+ character string |

Generate one with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Setting this invalidates existing sessions once; everyone signs in again.

---

## 3. Rehearse before you sell a ticket

Do this end-to-end at least once. It is the only way to know the chain holds.

1. **Confirm config.** Run `vtDiagnostics()` — every line should read `ready`.
2. **Start the stream.** In OBS: Settings → Stream → Custom, server
   `rtmp://global-live.mux.com:5222/app`, stream key from Mux. Hit *Start
   Streaming* and wait for Mux to show **Active**.
3. **Guide signs in** to the guide portal with the Supabase account you made.
4. **Join as a viewer on a second device** — a phone on mobile data, not your
   own laptop, so you are testing what a customer actually gets.
5. **Check the video plays** and note the delay. HLS runs roughly 10–30 seconds
   behind; that is normal and it is why chat questions lag the picture.
6. **Send a chat message from the viewer.** It should appear for the guide, and
   the *"Preview — sample activity"* label should be gone. If you still see that
   label, chat is not connected — re-run `vtDiagnostics()`.
7. **Buy a seat with a real card** on a session priced at a token amount. Check
   that the Stripe webhook fires (Stripe dashboard → Webhooks → recent
   deliveries, expect `200`) and that the viewer can join afterwards.
8. **Refund that test purchase** in Stripe.

If any step fails, stop and fix it before announcing a session. A guest who
pays and cannot get in is far more expensive than a delayed launch.

---

## 4. Running a session

**Before** — start the Mux stream 10 minutes early and confirm the picture in
the portal. Check upload speed: 5 Mbps sustained is the practical floor for
360°. Have a phone hotspot ready as a backup.

**During** — the guide sees viewer chat in the portal. Answer by voice, not by
typing. Remember viewers are 10–30 seconds behind you.

**If the stream drops** — viewers keep the page open; the player retries.
Restart OBS and the same playback ID resumes. Say what happened in chat when
you are back.

**After** — end the stream in Mux so the session stops showing as live.

---

## What is still simulated

Be aware of what is *not* wired to real data yet, so you do not present it as
though it is:

- **Viewer counts** shown in preview mode are generated, not real. They stop
  once a chat backend is connected, but presence-based real counts are not yet
  implemented — the number is simply not shown as live data.
- **Replay clips** ("Blue Lagoon Best Moments") are placeholders; there is no
  recording pipeline yet.
- **The in-session shop** posts to the cart but stock levels are not tracked.

Sample chat carries no purchase claims by design. If you extend
`vtAutoChatMsgs`, keep it that way — simulated buying pressure shown to real
visitors is treated as a deceptive practice by the FTC and the UK CMA.
