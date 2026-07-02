# Sight Seers Caribbean — Revenue Playbook

Practical ways to generate more income from the website, ordered by
effort-to-impact. Items marked **[live]** already exist on the site and just
need to be operated; **[build]** items are future work.

## 1. Convert what already exists (operate, don't build)

| Lever | Status | Action |
|---|---|---|
| Paid live 360° sessions (Stripe checkout) | **[live]** | Schedule 2–3 recurring weekly sessions (Blue Lagoon morning, market walk, sunset). Recurring inventory converts far better than "sometimes live". Price $10–20/seat as a *preview product* that upsells the real tour. |
| In-Session Shop + live auctions | **[live]** | Stock 6–10 real craft items with the 3D-scan pipeline. The "guide pays the artisan on camera" moment is the single most shareable conversion asset the brand has — film it every session. |
| Quote requests (/#booking, tour pages) | **[live]** | Respond within 24h; the tour pages promise a planner. Slow quotes are the biggest silent revenue leak in group travel. |
| VIP lounge affiliate (Club Mobay via vipattractions) | **[live]** | Already an affiliate link in the footer and MBJ tour page. Add it to every booking confirmation email — arrival services attach at ~15–25% when offered post-booking. |
| Gift cards | **[live]** | Promote before Mother's Day/Christmas with a themed hero slide. |
| Funnel analytics (/api/track) | **[live]** | Review weekly (`GET /api/track?days=7`, admin login). Double down where hotspot clicks → cart adds actually happen. |

## 2. Highest-ROI additions (small builds)

1. **Deposit-based booking ($50–100 via Stripe)** on tour pages instead of
   quote-only. Groups commit when money moves; quotes evaporate. Reuse the
   existing Stripe checkout handler with a `deposit` line item.
2. **Email capture with a travel-planning lead magnet** ("Jamaica Group Trip
   Budget Sheet") + a 4-email drip (waitlist API already stores leads).
   Group trips have 2–6 month planning cycles — email is where they close.
3. **Per-seat group invoicing**: one organizer books, friends pay their own
   share via a shareable Stripe link. Removes the #1 group-travel blocker
   (fronting the money). Track shares through the trip-board invite.
4. **Session replays as paid content**: Mux already records live streams.
   Sell replay access ($5) or bundle "all replays free" into booking any
   real tour — replays remarket the destination for free.
5. **Tiered session pricing**: free 10-min preview → $15 full session with
   shop access → $50 private group session with a dedicated guide. The
   dashboard already models VIP/private sessions.

## 3. Structural (bigger, later)

- **Commission marketplace**: onboard other licensed Jamaican guides on the
  Guide Portal (Supabase auth + Mux streaming already built); take 15–20% of
  session and shop revenue. This turns the platform from a brand site into
  an inventory engine — the "Airbnb Experiences of the Caribbean" position.
- **Hotel/villa partnerships**: sell the live 360° preview as a service to
  villas on Turtle Beach Road ($200–500/property) using the Matterport/
  photogrammetry pipeline from docs/WEBRTC-PLAN.md Step 1.
- **Vision Pro app (visionos/ scaffold)**: launch-window App Store placement
  for a Caribbean travel spatial app is a PR event in itself — earned media
  drives bookings even if headset users are few.
- **Corporate/greek-life group packages**: the pages exist; run targeted
  outreach each semester (spring break, homecoming) with the group-voting
  live session as the sales demo.

## 4. Conversion hygiene (keeps money from leaking)

- Every panoramic scene should end in an action (already true: Add/Quote/
  Invite/Book on all surfaces) — keep it that way when adding scenes.
- Keep tour pages' from-prices honest and consistent with quotes.
- Add real reviews to tour pages as they come in (FAQ schema is already
  there; Review schema is the next SEO win).
- Watch /api/track weekly for the drop-off step and fix that step, not
  everything at once.
