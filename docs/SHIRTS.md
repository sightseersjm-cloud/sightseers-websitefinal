# Shirts rack (home page)

A clothing rail on the home page (section `#p-shop`, "Shirts" in the menu and footer). Guests tap a shirt to bring it forward, flip Front/Back when both photos exist, and send a request. The request arrives in the admin Inbox as "Shirt request: <shirt> (<size> x <qty>)". No payment is taken; card checkout stays off until Stripe is authorized and refund terms are on the site.

## Adding or changing a shirt
Edit `api/_data/shirts.json`, then run `npm run sync:shirts` and `npm run build`.
- `name`, `blurb`, `colour` (hex), `tag` (the small hanging label), `tagColour` (optional).
- `front` and `back`: paths to photos, for example `/assets/shirts/travel-more-back.webp`. Use a PNG or WebP with a transparent background so the shirt hangs cleanly on the rail. If only one photo is given, the page shows just that side and hides the Front/Back switch. With no photos, a plain tee drawn in `colour` is used as a stand-in.
- `sizes` (top level) are the sizes in the request form. No prices are shown; add one only when you have set it.
- `npm run test:shop` checks the page matches the file.

Current shirt: the Sight Seers Travel Club "Travel More" tee (back photo supplied by the owner).
