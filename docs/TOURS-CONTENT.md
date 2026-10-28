# Tours content revision (27 October 2026)

The wording, durations and prices of all 130 tours in `CURATED_TOURS` (in `Design_Reference.html`) were replaced from the revised content file
"Sight Seers Caribbean website content, revised 27 October 2026" (141 pages: 130 package pages, then an internal pricing review and a sources page).
All 130 titles were kept; every title matched a tour already on the site.

## What changed, per tour

| Field | From the file |
|---|---|
| `desc` | the package summary |
| `highlights` | "Activities & highlights" |
| `hero` (the line under the title) | the first three highlights joined with " · " (the file has no tagline, and a tagline made from the description would repeat it) |
| `area`, `duration` | "Location" (without the island, which is shown beside it) and "Duration"; the ten planning packages (Essential Escape to Family Adventure Package) have no area |
| `priceValue`, `priceLabel` | the website price + 30% (see below) |
| `includes` | "What's included" (water and land experiences only, the ones that have a page) |
| `more` | sections "What's not included", "Pickup and drop-off", "Confirm before booking" and "Request a quote" |
| `facts` | "Minimum booking" (5 guests; the four private boats and Good Bajan Day have none) |

Spelling follows the file (Caribbean English: snorkelling, personalised, programme). Apostrophes are typographic and the accents the file dropped
(Soufrière, Samaná, Bávaro, Chavón, Café) are put back.

## Prices

- 121 tours have a number price. Each is the previous site price × 1.30, exactly as the file's pricing review calculates it (the file's "website base"
  equals the site's previous price for all 121). 80 of them have cents, shown as `$193.70`. The nine "Price on request" entries are unchanged.
- The four private boats (Private Yacht, Private Catamaran Sunset Cruise, Private 4-Hour Charter, Private Party Boat with Water Slide) stay priced
  **per group**: the previous group price × 1.30 ($1,560, $1,670.50, $2,080, $1,040). The file turns them into per-person prices based on five
  guests; that was not used because it would misprice other group sizes in the trip builder.
- Prices flow from `CURATED_TOURS` to the tour pages, the Tours explorer, the group trip builder and the server's price list
  (`api/_data/curated-tours.json`, `api/_data/builder-catalog.json`), which `build.js` regenerates. Money is shown with two decimals only when it
  has cents (`tour-pages.js`, `api/_lib/catalog.js`, `api/_lib/trip.js` and the explorer and builder in the page).

## Kept as they were

- **A Good Bajan Day Highlights Tour** keeps the supplier-based detail it already had (route, extras, "Airport pickup", "What to bring",
  "Before you book", group size and pickup facts) because the file's version of it is thinner. Its description, highlights and area are from the file.
- Photos, labels, `best` and `aud` are unchanged.

## Not published

The "Internal pricing review" pages and the "Website-based package draft" footers in the file are working notes for the owner, not customer copy.
The file asks for supplier scope, per-person rates, currency, transfer coverage, minimum group size and cancellation terms to be confirmed before
publishing; that confirmation is the owner's.

## Packages that quote tour prices (follow-up, 28 October 2026)

- The seven 5-day island itineraries (`api/_data/packages.json`, copied into the page as `window.CARIB`, and written out again in the `bdos-itin-card`
  markup) list tours day by day with a "from $X" price. 25 of those lines are one of the 130 tours by exact title; each now shows that tour's new
  price. The three places must stay identical: change `packages.json`, then rewrite `window.CARIB=` from it and the card lines to match.
- Left as they were: "Turtle Bay Snorkel & Blue Room Style Escape" ("from $99" in Curaçao's itinerary; the tour itself is now "Price on request"),
  lines that are a variant of a tour rather than the tour (for example "Transfer to Ocho Rios + ATV, River & Blue Hole Combo, from $229"), and each
  itinerary's own "from $718"-style total.
- Three Destinations-page packages that mirror a tour follow its new price: 3 Islands Pigs, Snorkel & Turtles ($165.10), Private Beach Club & Snorkel
  Day ($180.70) and Catamaran Snorkel Cruise with Lunch ($149.50). The other 25 Destinations packages are their own products and keep their prices.
