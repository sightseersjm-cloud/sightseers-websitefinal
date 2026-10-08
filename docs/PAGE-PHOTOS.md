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
| `about/about-story.jpg` | About page: main "Our Story" photo | Smiling guest with a giraffe, 1284 x 1011 reduced to 1200 wide, no other edits. Replaces the scuba photo as the main image. The scuba photo (`about/scuba-divers.webp`) now sits as a smaller photo in the bottom-right corner of the same block. |

## Discover Jamaica parish photos

Each of the 14 parish cards uses a set of three files in `public/assets/discover-jamaica/`: a desktop WebP (`jamaica-<parish>-desktop.webp`, 2:1),
a phone WebP (`jamaica-<parish>-mobile-600.webp`, 4:3) and a 600 x 300 JPEG fallback (`jamaica-<parish>-card-600.jpg`). The cards are drawn from
`DISCOVER_JAMAICA_PARISHES` in `Design_Reference.html`; the `image`, `imageMobile`, `imageCard` and `imageAlt` fields hold the photo set, and the card
frame is 2:1 on desktop and 4:3 on phones (`discover-jm-photo-fit` style block). Filters, airport distances, links and card text were not changed.

**Reuse permission:** these are reference selections from the sites linked below. They are not a transfer of commercial image rights. Get permission or
licensed originals from each source before relying on them. Several originals are smaller than 1200 px wide, so their desktop file is at native size and
was not enlarged (St. Thomas 800 px, Trelawny 700 px, Westmoreland 718 px, Clarendon 940 px, Portland 990 px, St. Mary 1040 px, St. Ann 1024 px); ask the
source for a larger original to get a sharper result.

Placement notes: the Kingston photo shows Downtown Kingston rather than the wider attractions in its card title; St. Thomas shows Bath Fountain rather than
Reach Falls; St. Catherine shows Hellshire, which its card already names.

| Parish | Photo | Files | Desktop size | Source page | Original |
|---|---|---|---|---|---|
| Kingston | Downtown Kingston mural | `discover-jamaica/jamaica-kingston-*` | 1200x600 (original 2736x1824) | [page](https://www.visitjamaica.com/blog/post/how-to-spend-48-hours-in-kingston/) | [image](https://assets.simpleviewinc.com/simpleview/image/upload/v1/clients/jamaica/016_JTB_Culture_Heritage_Kingston_WaterLane_Downtown_Toots_Mural_3f741eb9-4e3b-49f2-9d18-ac23bddd67f8.jpg) |
| St. Andrew | Holywell forest trail | `discover-jamaica/jamaica-andrew-*` | 1200x600 (original 1500x1000) | [page](https://www.visitjamaica.com/blog/post/family-friendly-adventures-at-holywell/) | [image](https://assets.simpleviewcms.com/simpleview/image/upload/v1/clients/jamaica/Holywell_ecaa7574-f981-42b8-beb5-864b56c1ac95.jpg) | Joshua Cogan, via Visit Jamaica
| St. Thomas | Bath Fountain Hotel exterior | `discover-jamaica/jamaica-thomas-*` | 800x400 (original 800x534) | [page](https://exoticexcursion.com/hotel_accomodation/bath-fountain-hotel-spa-jamaica/) | [image](https://exoticexcursion.com/wp-content/uploads/2018/08/Exterior-Bath-Fountain-Spa-Jamaica.jpg) |
| Portland | Frenchman’s Cove | `discover-jamaica/jamaica-portland-*` | 990x495 (original 990x660) | [page](https://www.visitjamaica.com/blog/post/a-day-at-the-beach-in-port-antonio/) | [image](https://res.cloudinary.com/simpleview/image/upload/v1528394806/clients/jamaica/Frenchman_s_Cove_Beach_54_990x660_201404232313_5d8a8221-a269-4df2-b6e2-70c2e553f3b3.png) |
| St. Mary | James Bond Beach, Oracabessa | `discover-jamaica/jamaica-mary-*` | 1040x520 (original 1040x580) | [page](https://www.expedia.com.au/James-Bond-Beach-Oracabessa.d6086267.Attraction) | [image](https://a.travel-assets.com/findyours-php/viewfinder/images/res70/60000/60380-James-Bond-Beach.jpg?h=580&impolicy=fcrop&q=mediumHigh&w=1040) |
| St. Ann | Dunn’s River Falls | `discover-jamaica/jamaica-ann-*` | 1024x512 (original 1024x683) | [page](https://letstravelcaribbean.com/blog/play/dunns-river-adds-nature-walk/) | [image](https://observer-travel.s3.us-east-2.amazonaws.com/2022/03/sm-Dunns-River-Falls-upper-portion-1024x683.jpeg) |
| Trelawny | Luminous Lagoon, Falmouth | `discover-jamaica/jamaica-trelawny-*` | 700x350 (original 700x470) | [page](https://royalton.nexustours.com/en/services/jamaica/falmouth-laguna-luminosa/2023-06-26/2023-07-02/SGN%C2%A5TKT%C2%A57301%C2%A5108913) | [image](https://www.nexustours.com/images/upload/services/Falmouth_Laguna_Luminosa_/MAIN-Falmouth-Mystic-Lagoon-7301-dncysj.JPG) |
| St. James | Rose Hall Great House | `discover-jamaica/jamaica-james-*` | 1200x600 (original 4288x2848) | [page](https://www.visitjamaica.com/blog/post/great-house-great-wedding/) | [image](https://res.cloudinary.com/simpleview/image/upload/v1529446098/clients/jamaica/mb_rgh_09_002_b652f6f3-c788-4e7e-871f-c0966c89146b.jpg) |
| Hanover | Tryall Water Wheel | `discover-jamaica/jamaica-hanover-*` | 1200x600 (original 1600x1200) | [page](https://airial.travel/attractions/jamaica/tryall-water-wheel-eBd25-No) | [image](https://coinventmediastorage.blob.core.windows.net/media-storage-container/gphoto_ChIJRUBLcWiC2Y4RaGFr37ph8KI_0.jpg) |
| Westmoreland | Seven Mile Beach, Negril | `discover-jamaica/jamaica-westmoreland-*` | 718x359 (original 719x480) | [page](https://www.pelago.com/en-SG/activity/pa3a3i2fw-negril-day-trip-to-seven-mile-beach-rick-s-cafe-with-admission-from-falmouth-trelawny/) | [image](https://www.pelago.com/img/products/JM-Jamaica/negril-day-trip-to-seven-mile-beach-rick-s-cafe-with-admission-from-falmouth/b05f8dd3-6fc3-4165-a75c-ad5602f4b24d_negril-day-trip-to-seven-mile-beach-rick-s-cafe-with-admission-from-falmouth.jpg) |
| St. Elizabeth | YS Falls | `discover-jamaica/jamaica-elizabeth-*` | 1200x600 (original 1280x853) | [page](https://www.world-of-waterfalls.com/waterfalls/caribbean-ys-falls/) | [image](https://images.world-of-waterfalls.com/YS_Falls_057_12302011.jpg) |
| Manchester | Mandeville Courthouse | `discover-jamaica/jamaica-manchester-*` | 1200x600 (original 1200x802) | [page](https://jamaica-gleaner.com/article/art-leisure/20251214/mandevilles-oldest-landmark) | [image](https://jamaica-gleaner.com/sites/default/files/media/article_images/2025/12/14/3302881/8415415.jpg) |
| Clarendon | Milk River Mineral Bath Hotel & Spa | `discover-jamaica/jamaica-clarendon-*` | 940x470 (original 940x788) | [page](https://wellnessinja.com/taxonomy/term/64?page=1) | [image](https://wellnessinja.com/sites/default/files/listings/Pics_4.png) |
| St. Catherine | Hellshire Bay Beach | `discover-jamaica/jamaica-catherine-*` | 1200x600 (original 1200x900) | [page](https://www.bigupwibeachja.org/beaches/details/15/115-hellshire-bay-beach) | [image](https://www.bigupwibeachja.org/images/beach-photos/YpQcvrtp9kL3.jpg) |
