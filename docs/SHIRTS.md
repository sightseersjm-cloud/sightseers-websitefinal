# Shirts rack (home page)

A 3D clothing store on its own page, `/shirts` (page `#p-shirts`, "Shirts" in the menu and footer). The older "Coming Soon" shop page (`#p-shop`) is separate and unchanged. Shirts hang side-on from a black rail and turn on their hangers to face you on hover. A click brings the shirt forward with its description, price and sizes; Front/Back spins it on the hanger when both photos exist. Guests then send a request. The request arrives in the admin Inbox as "Shirt request: <shirt> (<size> x <qty>)". No payment is taken; card checkout stays off until Stripe is authorized and refund terms are on the site.

## Adding or changing a shirt
Edit `api/_data/shirts.json`, then run `npm run sync:shirts` and `npm run build`.
- `name`, `blurb`, `colour` (hex), `tag` (the small hanging label), `tagColour` (optional).
- `front` and `back`: paths to photos, for example `/assets/shirts/travel-more-back.webp`. Use a PNG or WebP with a transparent background so the shirt hangs cleanly on the rail. If only one photo is given, the page shows just that side and hides the Front/Back switch. With no photos, a plain tee drawn in `colour` is used as a stand-in.
- `price`: a number such as `35` (shown as `currency` + price, for example US$35), or `null` to show "Price on request". `sizes` (top level, or per shirt) are the sizes shown and offered in the form.
- `npm run test:shop` checks the page matches the file.

Current shirt: the Sight Seers Travel Club "Travel More" tee (back photo supplied by the owner).
