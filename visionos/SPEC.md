# Sight Seers Spatial Tour Portals — visionOS 26 Developer Specification

**Product:** Sight Seers Spatial Tour Portals (Apple Vision Pro)
**Content source:** `GET https://www.sightseerscaribbean.com/api/vtours` (live today)
**Companion web experience:** https://www.sightseerscaribbean.com/#vtours and /virtual-tours/
**Status:** Web experience shipped · this document + `SightSeersSpatial/` sources are the native scaffold

---

## 1. One-sentence goal

Let a user stand inside a Sight Seers Caribbean tour — look around a real 360° scene,
touch hotspots with gaze-and-pinch, build a trip board with friends, and hand a quote
request to a human planner — before they ever book.

## 2. Experience map

```
Shared Space (default)                    Full Space (immersive)
┌─────────────────────────────┐          ┌──────────────────────────────┐
│  Tour Gallery window        │  pinch   │  ImmersiveSpace:             │
│  (floating portal grid)     │ ───────▶ │  360° panorama sphere        │
│                             │          │  + hotspot entities          │
│  ┌───────────┐              │          │  + detail ornament (left)    │
│  │ TripBoard │ (2nd window) │  ◀────── │  + action dock ornament      │
│  └───────────┘              │  dismiss │    (bottom)                  │
└─────────────────────────────┘          └──────────────────────────────┘
```

### Layout inside the immersive scene (matches the product spec)

| Region        | Content                                                        |
|---------------|----------------------------------------------------------------|
| Center        | 360° tour portal (equirectangular sphere, user at origin)     |
| Left ornament | Tour detail card: title, location, duration, price, includes  |
| Bottom dock   | Explore · Ask · Add Tour · Invite · Quote · Save              |
| In-scene      | Hotspot entities at (pitch, yaw) from the API                 |
| Lower shelf   | Add-ons (hotspot products) surfaced after first interaction   |

## 3. Data contract (live API)

`GET /api/vtours` returns:

```jsonc
{
  "ok": true,
  "version": "2026-07-02",
  "count": 6,
  "tours": [{
    "id": "blue-lagoon-morning-walk",
    "slug": "blue-lagoon-morning-walk",
    "title": "Blue Lagoon Morning Walk",
    "location": "Port Antonio, Portland",
    "category": "Beaches & Lagoons",
    "intents": ["Relaxation", "Romance", "Photography"],
    "duration": "3 hours",
    "groupSize": "2–20 guests",
    "pricing": { "from": 65, "currency": "USD" },
    "shortDescription": "…",
    "overview": ["…", "…"],
    "included": ["…"],
    "itinerary": ["…"],
    "faq": [{ "question": "…", "answer": "…" }],
    "related": ["sunset-yacht-charter"],
    "media": {
      "hero": "https://…/panos/og-blue-lagoon.jpg",
      "og": "https://…/panos/og-blue-lagoon.jpg",
      "panorama": "https://…/panos/blue-lagoon.jpg"   // 4096×2048 equirect, null if not yet captured
    },
    "spatial": {                                        // null when no panorama exists yet
      "type": "equirectangular",
      "panorama": "https://…/panos/blue-lagoon.jpg",
      "initialView": { "yaw": 15, "pitch": -4, "hfov": 100 },
      "ambientAudioLabel": "Ocean Waves",
      "hotspots": [{
        "id": "hs1",
        "title": "Blue Mahoe Seedling",
        "type": "identify",          // identify | auction | product
        "pitch": 6, "yaw": -118,     // degrees, same convention as the web viewer
        "priceUSD": 35,
        "cta": "Learn & Buy"
      }]
    },
    "links": {
      "page": "https://…/virtual-tours/blue-lagoon-morning-walk/",
      "book": "https://…/#booking",
      "livePortal": "https://…/#vtours"
    }
  }]
}
```

`GET /api/vtours?slug=<slug>` returns `{ ok, version, tour }` for one tour.
CORS is open (`Access-Control-Allow-Origin: *`), responses are CDN-cached 5 min.

### Hotspot → world position

Hotspots use the web viewer's convention: yaw 0 = initial panorama center,
positive yaw → right; pitch positive → up. Convert to a unit-sphere position:

```
x = cos(pitch) * sin(yaw)
y = sin(pitch)
z = -cos(pitch) * cos(yaw)
position = normalize(x, y, z) * radius (e.g. 9.5 for a 10 m sphere)
```

(This is what `ImmersivePanoramaView.swift` implements.)

## 4. Interactions

| Input                          | Behavior                                              |
|--------------------------------|-------------------------------------------------------|
| Gaze at hotspot                | HoverEffectComponent highlight (system-provided)      |
| Pinch hotspot                  | Open hotspot card (title, price, CTA)                 |
| Pinch "Add Tour" in dock       | Append to TripPlanner, confirm with subtle haptic/audio |
| "Ask" in dock                  | Opens concierge sheet (prompt list → quote handoff)   |
| "Invite" in dock               | Starts `PlanTripTogether` GroupActivity (SharePlay)   |
| "Quote" in dock                | Quote form sheet → POST to /api/contact (existing)    |
| Digital Crown / dismiss        | Exit immersive space back to gallery                  |
| Siri: "Add this to my trip"    | `AddTourToTripIntent` (App Intents)                   |
| Siri: "Show me yacht tours"    | `OpenTourCategoryIntent` filters gallery              |

## 5. Milestones

1. **M1 — Portal gallery + immersive viewing (this scaffold).** Fetch tours,
   grid of portal cards, open `spatial` tours in the immersive sphere with
   hotspots. Tours without panoramas deep-link to the web live portal.
2. **M2 — Commerce.** Hotspot product cards, trip board persistence
   (App Storage → later account sync), quote form POST.
3. **M3 — Group planning.** SharePlay session sharing gallery + trip board
   state; group voting cards.
4. **M4 — Concierge.** Voice-first concierge (App Intents + server AI),
   handoff to human planner via existing contact/waitlist API.
5. **M5 — Live sessions.** HLS playback of the Mux live streams inside a
   spatial video screen; live chat via existing Supabase channel.

## 6. Technical notes

- **Targets:** visionOS 26 SDK, Swift 6, SwiftUI + RealityKit (no storyboard).
- **Sphere rendering:** `Entity` + `ModelComponent` with an inward-facing
  sphere (negatively scaled X) textured with the equirect JPEG; unlit material
  so the photo renders true-to-life.
- **Streaming panoramas:** current assets are 4096×2048 JPEG (~1 MB) — load
  with `URLSession` + `TextureResource(image:)`. If assets grow, move to
  ktx2/basis or tiled loading.
- **Accessibility:** every hotspot entity gets `AccessibilityComponent`
  (label = title, value = price); dock buttons are standard SwiftUI buttons,
  so VoiceOver and Dwell Control work out of the box.
- **No secrets in-app:** the API is public/read-only; quote submission uses
  the same public endpoints as the website.

## 7. Building

There is no `.xcodeproj` committed (Xcode generates user-specific project
state). To assemble:

1. Xcode 26 → New → App → visionOS → name `SightSeersSpatial`.
2. Delete the template's generated Swift files.
3. Drag the `SightSeersSpatial/` folder from this repo into the project
   (copy items, create groups).
4. Set Info.plist keys as noted in README, build & run in the visionOS
   simulator (or device with a developer account).
