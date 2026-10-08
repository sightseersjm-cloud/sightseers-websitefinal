# Island Routes partner excursions

Internal reference. These 20 experiences in the All Experiences catalog are Island Routes tours sold under Sight Seers names.
Visitors inquire on the site, then the booking is made through our Island Routes partnership
(co-brand link: https://www.islandroutes.com/reseller/622f6d9aeb2f4f00198617b3/622f6d9aeb2f4f00198617b8).

## How the price is set

- Our "from" price = Island Routes' published "starting from" price x 1.30 (a 30% markup), rounded to the cent. Whole-dollar results are shown
  without cents (for example $221). It is a markup on the supplier price, never the old retail price x 1.30.
- Source: the Discover Jamaica / Island Routes handoff dated 7 Oct 2026, built from the starting prices shown on Island Routes' public tour pages.
  These are not verified reseller net costs and not date-specific checkout quotes. Currency is assumed to be USD. No coupon, extra tax,
  payment fee or additional transfer charge is included. Confirm the booked pickup, party and date against the partner price list before relying on a price.
- The Punta Cana row is unchanged ($77) until a supplier quote is confirmed. Do not work its price out from $77.
- Variants to confirm before quoting: Dolphin Splash & Waterfall Climb (Ocho Rios and Montego Bay products both list $200),
  Tiered Falls & Rum Distillery (a South Coast pickup product lists $136.36, which would be $177.27 after the markup),
  Reggae Roots & Waterfall (price depends on the pickup region), Twin Peaks Sunset Sail (hotel pickup), Island Beats (adults only, 18+),
  Yacht Beach Escape (shared yacht, 18+) and Dirt, Sand & Swimming Pigs (ATV passenger set-up).
- Earlier pricing (Oct 2026, before this change) was the listed price x 1.20 rounded to the dollar.

## Mapping (Sight Seers name -> Island Routes tour)

| Sight Seers name | Country | Island Routes tour | Their listed price (per person) | Our "from" price |
|---|---|---|---|---|
| Sky Ride & Zipline Thrill, Ocho Rios | Jamaica | Mystic Mountain Sky Explorer & Zipline Experience | $109.09 | $141.82 |
| Dirt Trails & Sea Breeze: ATV and Beach Horseback Day | Jamaica | ATV Adventure & Horseback Beach Ride Ocho Rios | $156.36 | $203.27 |
| Dolphin Splash & Waterfall Climb Day | Jamaica | Dolphin Encounter & Dunn’s River Falls Experience | $200.00 | $260 |
| Tiered Falls & Rum Distillery Day | Jamaica | YS Falls & Appleton Estate Rum Tour | $135.45 | $176.09 |
| Reggae Roots & Waterfall Day | Jamaica | Bob Marley Culture & Dunn’s River Falls Experience | $170.00 | $221 |
| Family Catamaran Sail to the Falls | Jamaica | Dunn’s River Falls Catamaran Cruise for the Family | $117.27 | $152.45 |
| Golden Hour Sail & Reef Snorkel | Barbados | Sunset Catamaran & Snorkeling Cruise at Carlisle Bay | $106.67 | $138.67 |
| Captain’s Table Catamaran & Snorkel | Barbados | Luxury Catamaran, Snorkel & Dining Experience | $253.33 | $329.33 |
| Cavern Tram & Zipline Adventure, Barbados | Barbados | Harrison’s Cave & Zipline Experience | $133.33 | $173.33 |
| Barbados Back-Roads 4x4 Day | Barbados | 4x4 Best of Barbados Jeep Experience | $204.44 | $265.77 |
| Twin Peaks Sunset Sail & Snorkel | Saint Lucia | Piton Sunset Snorkel Cruise | $100.00 | $130 |
| Soufrière Coast Sea Adventure | Saint Lucia | Soufrière Adventure Cruise | $131.82 | $171.37 |
| Lagoon Island Dolphin Swim Day | The Bahamas | Blue Lagoon Island Dolphin Swim Experience | $267.27 | $347.45 |
| Pig Beach Catamaran Day | The Bahamas | Rose Island Catamaran & Pig Interaction | $327.27 | $425.45 |
| Island Beats Sail & Snorkel | The Bahamas | Reggae Catamaran & Snorkeling Cruise Nassau | $140.91 | $183.18 |
| Dirt, Sand & Swimming Pigs: ATV Day | The Bahamas | Nassau ATV & Pig Interaction | $409.09 | $531.82 |
| Little Curacao Sail & Beach Day | Curacao | Klein Curacao Catamaran Cruise & Beach Break | $151.38 | $196.79 |
| Yacht Beach Escape to the Little Island | Curacao | Klein Curacao Super Yacht Beach Experience | $201.83 | $262.38 |
| Blue Room & Beach-Hop Catamaran Day | Curacao | Wonders of Curacao Swim & Snorkel Cruise | $155.05 | $201.57 |
| Punta Cana Golden Coast Sunset Sail | Dominican Republic | Punta Cana Sunset Catamaran Cruise | $64.00 | $77 |

## Changing this later

The entries live in the `CURATED_TOURS` array in `Design_Reference.html` (look for the "Island Routes partner excursions" comment).
Running `node build.js` regenerates `api/_data/builder-catalog.json`, which the group-trip builder prices from, so edit the array and rebuild.
Belize has no Island Routes entries yet; no Belize tours were found for it.
