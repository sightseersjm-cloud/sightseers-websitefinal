# Sight Seers Spatial Tour Portals — Apple Vision Pro app

Native visionOS scaffold for the Sight Seers Caribbean spatial tour experience.
The full product/technical specification is in [`SPEC.md`](./SPEC.md).

**What this is:** Swift/RealityKit source for milestone M1 — the floating tour
portal gallery, the immersive 360° panorama viewer with gaze-and-pinch
hotspots, the glass detail ornament + action dock, the trip board window,
SharePlay activity, and Siri App Intents. It consumes the live production API
(`https://www.sightseerscaribbean.com/api/vtours`) — no server work needed to run it.

**What this is not:** a committed Xcode project. Xcode owns project files;
assemble it locally in about two minutes:

## Build steps (Xcode 26, macOS with visionOS SDK)

1. **Xcode → File → New → Project → visionOS → App.**
   - Product name: `SightSeersSpatial`
   - Initial scene: Window · Immersive space renderer: RealityKit
2. Delete the template's generated `.swift` files (keep the asset catalog).
3. Drag the `SightSeersSpatial/` folder from this repo into the project
   navigator — check "Copy items if needed" and "Create groups".
4. Signing & Capabilities:
   - Add **Group Activities** (for SharePlay / Invite).
5. No Info.plist additions are required for M1 (the API is HTTPS).
6. Run on the **visionOS Simulator** (or a Vision Pro with a developer
   account). The gallery loads the six live tours; "Blue Lagoon Morning
   Walk" and "Falmouth Market Stall Walk" open fully immersive 360° scenes
   with interactive hotspots.

## Source layout

```
SightSeersSpatial/
├── SightSeersSpatialApp.swift      # scenes: gallery window, trip board window, immersive space
├── Models/Tour.swift               # Codable contract for /api/vtours
├── Services/TourService.swift      # TourStore: fetch, trip board persistence
├── Views/TourGalleryView.swift     # floating portal grid
├── Views/ImmersivePanoramaView.swift  # 360° sphere, hotspots, ornaments, dock
├── Views/TourDetailView.swift      # glass detail panel (leading ornament)
├── Views/TripBoardView.swift       # itinerary board + quote handoff
├── Shared/GroupPlanningActivity.swift # SharePlay "Plan a Trip Together"
├── Intents/TourIntents.swift       # Siri: "Add this to my trip", "Show me yacht tours"
├── Views/SpatialPhotoView.swift    # visionOS 26 spatial scenes from 2D tour photos
├── Views/LagoonEnvironmentView.swift # Blue Lagoon resting Environment (progressive immersion)
└── Widgets/SightSeersWidgets.swift # spatial widgets (separate Widget Extension target)
```

## Content pipeline

The app renders whatever the API serves. To add a spatial tour:

1. Capture/source a 4096×2048 equirectangular JPEG → `public/panos/<name>.jpg`
2. Add the tour (with `spatial.view` + `spatial.hotspots`) to `tours-data.json`
3. `node build-tours.js` (regenerates the web landing pages)
4. Deploy — the app picks it up on next launch, no App Store update needed.

## Roadmap

M1 gallery + immersive viewing (this scaffold) → M2 commerce → M3 SharePlay
state sync + group voting → M4 voice concierge → M5 live Mux sessions in a
spatial screen. Details in SPEC.md §5.
