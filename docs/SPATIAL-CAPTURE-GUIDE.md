# Spatial Capture Guide — feeding the V-Tours pipeline

What the team captures on the island, and exactly where each file goes.
Everything below lights up features that are already built and shipped.

## 1. 3D item scans → rotate-in-hand + AR placement

- **Capture:** Polycam or Luma AI on an iPhone 15 Pro+ (LiDAR). Walk slowly
  around the item; 60–100 photos.
- **Export BOTH formats:** `GLB` (web viewer) and `USDZ` (Apple AR Quick Look).
- **Drop files:** `public/models/<item-slug>.glb` and `.usdz`.
- **Wire up:** in the In-Session Shop item, call
  `vtOpen3D('Item Name', '/models/<slug>.glb', PRICE, '/models/<slug>.usdz')`.
  With a USDZ present, iPhone/iPad/Vision Pro users get an **AR button**
  that places the item life-size in their room. In `tours-data.json`,
  set the hotspot's `glb`/`usdz` fields so the Vision Pro app gets it too.

## 2. 360° panoramas → web viewer + headset scenes

- **Capture:** Insta360 X4, 360 photo mode, tripod chest-height, HDR on.
- **Export:** equirectangular JPEG, resize to **4096×2048**, ~80% quality.
- **Drop file:** `public/panos/<scene>.jpg`; add the scene/tour to
  `tours-data.json` (`spatial.view`, `spatial.hotspots`) and run
  `node build-tours.js`.

## 3. 360° video → immersive video in the headset

- **Capture:** X4 in 360 video mode (5.7K), 1–3 minute loops of the best
  moment of each tour (dock walk, market pass-through, catamaran bow).
- **Export:** equirectangular MP4 (H.264/H.265), 4K, ≤80 MB, or host on
  Mux and use the HLS URL.
- **Wire up:** set `video360` on the scene in `vtPanoScenes` (session
  player) and `spatial.video360` in `tours-data.json`. Headset users
  entering VR then get moving video wrapped around them instead of a
  still; the live Mux stream already takes priority automatically when
  a guide is live.

## 4. Spatial (3D depth) photos & video — Apple-native wow

- **Capture:** iPhone 15 Pro+ → Camera → Spatial mode. Shoot the hero
  moment of each tour; also shoot ordinary photos generously.
- **Use:** visionOS 26 turns ordinary 2D photos into depth "spatial
  scenes" automatically — the app scaffold's `SpatialPhotoView` already
  renders any tour hero photo this way, no extra processing.
- Spatial *videos* are for the native app (M5) and social (Vision Pro
  users get real depth playback).

## 5. Checklist per new tour

1. 360 pano JPEG → `public/panos/` ✅ scene in viewer + headset
2. 2–4 item scans (GLB+USDZ) → `public/models/` ✅ shop + AR
3. 1 min 360 video → hosted → `video360` ✅ immersive video
4. Tour entry in `tours-data.json` → `node build-tours.js` ✅ landing
   page + API + Vision Pro app, all at once
