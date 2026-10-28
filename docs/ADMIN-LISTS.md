# Experiences, packages, stays, yacht charters, transfers and gallery photos in the admin (/manage)

Six lists are written in `Design_Reference.html` and can be changed from the admin without a deploy. The owner (or a team member with the
"Tours and stays" permission) edits, hides or adds items; the website shows the result straight away.

| List | Admin screen | Written in the code as | Shown on |
|---|---|---|---|
| `experiences` | Tours and experiences | `CURATED_TOURS` | Tours page, the explorer, each `/tours/<name>` page, the group trip builder |
| `packages` | Destination packages | `DESTINATION_PACKAGE_DATA` (a list per island) | Destinations page, the package page |
| `stays` | Villas and stays | `STAYS` | Villas and Stays pages |
| `yachts` | Yacht charters | the cards on the Yacht Charters page (`SS_CARD_DATA.yachts`) | Yacht Charters page |
| `transfers` | Transfers | the cards on the Airport Transfers page (`SS_CARD_DATA.transfers`) | Airport Transfers page |
| `gallery` | Island Memories | `ALBUM_DATA` in the Island Memories script (one album per island, read as one list through `window.ssMemory`) | Gallery page |

## How it is stored

One value in the settings document, `ss_catalog_v1`, holds one entry per list: `{ edits, hidden, added }`.

- `edits`: only the fields that were changed, kept under the item's original key. The key is the title for an experience, `Island|title` for a
  package, the id for a stay, the name for a yacht charter or transfer, and `Island|photo address` for a gallery photo. Renaming something does
  not change its key.
- `hidden`: items taken off the website, under the same keys.
- `added`: items the owner made. Each has an id of its own (`n` and a few letters). Limits: 120 experiences, 60 packages, 80 stays, 20 yacht charters, 12 transfers, 150 gallery photos.

`api/_lib/catalog.js` is the one file that knows the fields, their limits and how a list is worked out (`effective`). The admin checks changes with
it, the server checks and stores them with it, and the browser lays them over the lists in the code with it (`public/ss-catalog.js` is a copy that
`build.js` makes). Nothing is stored for a field that was not changed, so putting everything back returns to the code's own list.

## Yacht and transfer cards

These cards are written out in full in the page (so they are there before any script runs, and for search engines) and are also kept as data in
`SS_CARD_DATA`. `api/_lib/cards.js` (copied to `public/ss-cards.js`) makes the same markup from that data. When the owner has changed, hidden or
added a card, the browser redraws the grid from the edited list; with no changes the written-out cards are left alone. `npm run test:cards` checks
that every card written in the page is exactly what the data makes, so the two cannot drift apart. If you change a card's wording or layout in
`Design_Reference.html`, change `SS_CARD_DATA` (and, for a new kind of field, `cards.js`) to match.

The photo description, the transfer's kind and the planning note that a card carried when it was written follow the card's name and kind once
either is edited.

## Not covered

The guest-moments grid that `renderCustomerGallery` fills (`#customerGalleryGrid` and two others) has no markup on any page today, so there is
nothing to edit; Island Memories is the guest photo gallery that visitors see.

## Saving, approval and history

Every save goes through `/api/site-edit` as a change with `id: '@c'`, `list`, `key` and the new state. The owner publishes at once. A team member
who needs approval sends it to the owner (Pages and sections > Waiting for approval, where it reads in words, for example "Price: from $120"). Each
change is recorded in Change history and can be put back, one field at a time or a whole save at once.

## Good to know

- A package edit can move it to another island (the Island field).
- A stay can have up to 8 photos of its own ("More photos"). With none, the website shows a standard set of stock photos under every stay.
- The stays pages read the list in the code. Listings saved by the old admin in `ss_stay_page_settings` are no longer used; the page wording
  around them (the hub lead, the country page title and lead) still is.
- The package page ("View Package") shows only what is written for the package. Before this was fixed it showed placeholder text and an invented
  price and length for every package.

Tests: `npm run test:catalog` (server), `npm run test:cards` (the yacht and transfer cards match their data) and `npm run test:css` (the admin's
styles must not reach the public pages).
