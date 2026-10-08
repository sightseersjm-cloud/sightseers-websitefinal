# Page photos: transfers, yachts, Greek Life and School Tours

Reference for the photos on four pages, from the "Sight Seers Caribbean image handoff" file (7 October 2026).

## Read this first: reuse permission

The handoff says: *"Supplier photos and Viator previews are not a confirmed reuse license. Obtain authorized originals before production use and host them with the website; do not rely on third-party hotlinks."* The photos are hosted here (no hotlinks), but their sources are a US car dealership and a bus dealer (the two preferred vehicles), Aristo Kat Tours (yachts) and Viator listings (Greek Life and University). Confirm permission with each before relying on them. The Viator previews are 670 x 446 px, so ask for larger originals if any is used full width.

## How these pages are built

- The Yacht Charters and Transfers grids are drawn at page load by `renderYachtCards()` and `renderTransferCards()` in the `ss-admin-portal-extension-script` block of `Design_Reference.html`. They replace the static cards in the page HTML, so what visitors see comes from `defaultYachtData()` and `defaultTransferData()` (unless the admin portal has saved its own lists).
- A yacht row has an optional eighth field: gallery image URLs, comma separated. When present, the card shows the same thumbnail row and photo viewer as the Villas and Vacation Rentals page (the `stay-property-thumb` markup).
- The static five-card yacht section (Sunset Private Charter, Proposal / Special Moment, Island Group Cruise, Luxury Executive Charter, Elite Celebration Charter) is still in the page HTML and has been updated too, but visitors do not see it while the renderer runs.
- **Saved admin copies.** The admin portal keeps its own copy of the transfer and yacht card lists in each browser it is used in (`ss_admin_transfers_data_v1`, `ss_admin_yacht_data_v1`). That copy wins over the defaults, so a browser that saved the cards before the new photos were added kept showing the old stock photos. `upgradeSavedPhotos()` now swaps an untouched old stock photo for its new one when the lists are read, and leaves any image chosen in the admin portal alone. A browser can also hold per-image replacements made with the admin image tools (`ss_universal_image_admin_fix_v1`); those are kept on purpose, and the admin portal's Reset button on that image removes one.
- Greek Life and School Tours are static HTML, with the same thumbnail row and viewer added under the card text.
- **Senior Tours was merged into School Tours.** The Senior Tours page, its menu items, its admin editor section, its booking option ("Senior Excursion Package") and its sitemap entry were removed. The Senior package's two cards (Scenic Leisure Day and Relaxed Coastal Escape, with their photos and galleries and their text unchanged) are now the cards on the School Tours page, under the School Tours banner, and the old School Tours cards (Heritage & Discovery and Adventure Escape) were removed. The card text still describes "mature groups", which does not match a school audience and may need rewording. `/senior-tours` redirects to `/school-tours` (`vercel.json`), and `nav('senior-tours')`, the `#senior-tours` link and the old address are also sent to School Tours in the page script, so old links and search results keep working.

## Photos used

| Id | Page | Where | File | Original image | Source page | Size |
|---|---|---|---|---|---|---|
| T2 | Transfers | Airport Pickup & Drop-Off card | transfers/airport-sprinter.jpg | [image](https://www.bus-stuff.com/2025grechlusso_tms2511041125-12.jpg) | [page](https://www.bus-stuff.com/2025GrechLusso_TMS2511041125.html) | 1000x667 |
| T1 | Transfers | Executive Transfers card | transfers/executive-escalade.jpg | [image](https://www.autocollectionofmurfreesboro.com/imagetag/20292/main/l/Used-2025-Cadillac-Escalade-Sport-Platinum-w-ONYX-PKG-CONSOLE-REFRIGERATOR-1776307650.jpg) | [page](https://www.autocollectionofmurfreesboro.com/used-vehicle-2025-cadillac-escalade-sport-platinum-w-onyx-pkg-console-refrigerator-c-20292/) | 1200x900 |
| Y3.1 | Yacht Charters | Island Group Cruise: card photo and gallery 1 | yachts/sofisti-kat-exterior.jpg | [image](https://aristokattours.com/wp-content/uploads/2024/07/MS-Sofisti-Kat-8-scaled.jpg) | [page](https://aristokattours.com/our-fleet/ms-sofisti-kat/) | 1200x829 |
| Y3.2 | Yacht Charters | Island Group Cruise: gallery 2 | yachts/sofisti-kat-covered-lounge.jpg | [image](https://aristokattours.com/wp-content/uploads/2024/07/MS-Sofisti-Kat-9-scaled.jpg) | [page](https://aristokattours.com/our-fleet/ms-sofisti-kat/) | 1200x802 |
| Y3.3 | Yacht Charters | Island Group Cruise: gallery 3 | yachts/sofisti-kat-outdoor-dining.jpg | [image](https://aristokattours.com/wp-content/uploads/2024/07/MS-Sofisti-Kat-5-scaled.jpg) | [page](https://aristokattours.com/our-fleet/ms-sofisti-kat/) | 1200x802 |
| Y3.4 | Yacht Charters | Island Group Cruise: gallery 4 | yachts/sofisti-kat-dining-salon.jpg | [image](https://aristokattours.com/wp-content/uploads/2024/07/MS-Sofisti-Kat-2-scaled.jpg) | [page](https://aristokattours.com/our-fleet/ms-sofisti-kat/) | 1200x802 |
| Y2.1 | Yacht Charters | Executive Sea Experience: card photo and gallery 1 (landscape crop of the portrait original) | yachts/empress-kool-runnings-aerial.jpg | [image](https://aristokattours.com/wp-content/uploads/2024/07/Empress-Kool-Runnings-1-scaled.jpg) | [page](https://aristokattours.com/our-fleet/empress-kool-runnings/) | 828x1200 |
| Y2.2 | Yacht Charters | Executive Sea Experience: gallery 2 | yachts/empress-kool-runnings-bow-guests.jpg | [image](https://aristokattours.com/wp-content/uploads/2024/07/Empress-Kool-Runnings-5-scaled.jpg) | [page](https://aristokattours.com/our-fleet/empress-kool-runnings/) | 1200x801 |
| Y2.3 | Yacht Charters | Executive Sea Experience: gallery 3 | yachts/empress-kool-runnings-salon.jpg | [image](https://aristokattours.com/wp-content/uploads/2024/07/Empress-Kool-Runnings-2-scaled.jpg) | [page](https://aristokattours.com/our-fleet/empress-kool-runnings/) | 1200x801 |
| Y2.4 | Yacht Charters | Executive Sea Experience: gallery 4 | yachts/empress-kool-runnings-lounge.jpg | [image](https://aristokattours.com/wp-content/uploads/2024/07/Empress-Kool-Runnings-3-scaled.jpg) | [page](https://aristokattours.com/our-fleet/empress-kool-runnings/) | 1200x801 |
| Y1.1 | Yacht Charters | Elite Celebration Charter (static page only): card photo and gallery 1 | yachts/fancy-kat-exterior.jpg | [image](https://aristokattours.com/wp-content/uploads/2024/07/Fancy-Kat-scaled.jpg) | [page](https://aristokattours.com/our-fleet/fancy-kat/) | 1200x802 |
| Y1.2 | Yacht Charters | Elite Celebration Charter (static page only): gallery 2 | yachts/fancy-kat-bow-seating.jpg | [image](https://aristokattours.com/wp-content/uploads/2024/07/Fancy-Kat-3-scaled.jpg) | [page](https://aristokattours.com/our-fleet/fancy-kat/) | 1200x802 |
| Y1.3 | Yacht Charters | Elite Celebration Charter (static page only): gallery 3 | yachts/fancy-kat-forward-deck.jpg | [image](https://aristokattours.com/wp-content/uploads/2024/07/Fancy-Kat-4-scaled.jpg) | [page](https://aristokattours.com/our-fleet/fancy-kat/) | 1200x802 |
| Y1.4 | Yacht Charters | Elite Celebration Charter (static page only): gallery 4 | yachts/fancy-kat-dining-lounge.jpg | [image](https://aristokattours.com/wp-content/uploads/2024/07/Fancy-Kat-2-scaled.jpg) | [page](https://aristokattours.com/our-fleet/fancy-kat/) | 1200x802 |
| U1 | School Tours | Scenic Leisure Day: card photo and gallery 1 | university/rio-bueno-river-tubing.jpg | [image](https://media.tacdn.com/media/attractions-splice-spp-674x446/12/27/0c/89.jpg) | [page](https://www.viator.com/tours/Montego-Bay/Jamaica-River-Tubing-Adventure-on-the-Rio-Bueno/d432-5545RIVER) | 670x446 |
| U2 | School Tours | Scenic Leisure Day: gallery 2 | university/rio-bueno-outdoor-experience.jpg | [image](https://media.tacdn.com/media/attractions-splice-spp-674x446/0f/67/1b/ad.jpg) | [page](https://www.viator.com/tours/Montego-Bay/Jamaica-River-Tubing-Adventure-on-the-Rio-Bueno/d432-5545RIVER) | 670x446 |
| U3 | School Tours | Relaxed Coastal Escape: card photo and gallery 1 | university/bob-marley-museum.jpg | [image](https://media.tacdn.com/media/attractions-splice-spp-674x446/13/70/63/55.jpg) | [page](https://www.viator.com/tours/Kingston/Bob-Marley-Museum-Devon-House-and-Downtown-Tour-from-Kingston/d22634-434025P1) | 674x446 |
| U4 | School Tours | Relaxed Coastal Escape: gallery 2 | university/national-gallery-of-jamaica.jpg | [image](https://media.tacdn.com/media/attractions-splice-spp-674x446/12/33/12/22.jpg) | [page](https://www.viator.com/tours/Kingston/Bob-Marley-Museum-Devon-House-and-Downtown-Tour-from-Kingston/d22634-434025P1) | 674x446 |
| G2 | Greek Life | Gallery 1 under the main card | greek-life/montego-bay-boat-day.jpg | [image](https://media.tacdn.com/media/attractions-splice-spp-674x446/13/18/41/0c.jpg) | [page](https://www.viator.com/tours/Montego-Bay/Catamaran-cruise-party-and-snorkeling-Montego-Bay/d432-329783P36) | 669x446 |
| G3 | Greek Life | Gallery 2 under the main card | greek-life/negril-atv-adventure.jpg | [image](https://media.tacdn.com/media/attractions-splice-spp-674x446/06/e6/af/34.jpg) | [page](https://www.viator.com/tours/Negril/Negril-ATV-and-Zipline-Combo/d433-31073P9) | 674x446 |
| G4 | Greek Life | Gallery 3 under the main card | greek-life/dunns-river-falls-climb.jpg | [image](https://media.tacdn.com/media/attractions-splice-spp-674x446/11/cc/2a/fd.jpg) | [page](https://www.viator.com/tours/Montego-Bay/Chukka-Island-Experience-Snorkel-and-Party-Cruise-with-Dunns-Climb/d432-3991P67) | 674x446 |

## Not used

- **G1** (Greek Life main card composition reference): the supplied photo is only 210 x 118 px. Get the full-size original from the supplier first.
- **T3 and T4** (Jamaica listing versions of the Escalade and the Sprinter): alternatives to T1 and T2. The handoff says to choose one pair. T1 and T2 were used because they are the preferred 2025 models. Neither pair is verified as the vehicles actually offered, and neither is labelled with a model year on the page.
- **Sunset charter photo from the handoff:** none exists for a matching vessel. The Sunset Escape Charter card uses a photo the owner supplied instead (see below).
- The handoff lists exteriors only for the two vehicles, so there are no vehicle interior photos yet.

## Photos supplied by the owner

| File | Where | Notes |
|---|---|---|
| `transfers/group-coach-53-seater.jpg` | Transfers: Group Transfers card | The 53-seater coach. Cropped from a square 1080 x 1080 original to 1080 x 720 so the whole bus is in frame. |
| `yachts/sunset-cruise.jpg` | Yacht Charters: Sunset Escape Charter card (and Sunset Private Charter in the static page) | 674 x 446, unmodified. The vessel and the original source are not recorded, and the handoff's vessel match is still pending, so the page does not name a vessel. |
| `mba/seven-shores-feature.jpg` | Home page: "Seven Shores: MBA Caribbean Voyages" feature photo | 1000 x 998, converted from WebP to JPEG, no other edits. Replaces the sailing yacht stock photo in that feature only. The same stock photo is still used in the matching blog gallery and in the MBA Lifestyle Voyage entries. |
| Greek Life banner | Greek Life page | The photo banner (tag, title, subtitle) above the card description was removed at the owner's request. `/assets/experiences/greek-life-group.jpg` is no longer referenced there. |
