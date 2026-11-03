# The 5-Day Signature packages (home page)

Source of truth: `api/_data/packages.json` (embedded in `Design_Reference.html` as `window.CARIB`; `npm run test:packages` keeps the two, the cards, the structured data, the group builder catalog and the server price list in step).

## How a package price is made
- **Excursions per person** (`acts`): the sum of the "from" prices of the excursions listed in the days. They are the tour prices in the Tours catalog (already +30%).
- **Airport pickup & drop-off** (`addons.xfer`): included on the Jamaica package only, round trip in Montego Bay. The owner's cost is $55 per person for groups of 5 or more, +30% = $71.50 per guest.
  - Saint Lucia: included, round trip between Hewanorra Airport (UVF) and the stay, $60 per guest with no markup (owner's decision, from a local operator's listed private transfer rate).
  - Every other island: not included (`included: false`, `price: null`, `per: "enquire"`). The page says "enquire with us for a rate"; there is no airport price in the server list or the group builder.
- **"From" price per person** (`frm`) = excursions per person, plus the airport rate on Jamaica ($71.50) and Saint Lucia ($60), rounded to the dollar.
- **Total for a group** = excursions x guests, plus the Jamaica airport line (per guest x guests).
- **Private driver day** (`addons.driver`) is optional and was not changed.
- The server charges the excursion price per person and the airport line from `api/_data/vtours-products.json`.

## Researched airport rates (reference only, not used in any package price)
One-way private transfers from the airport to the base, per vehicle. Sources are operator and guide pages, not quotes: confirm with suppliers.

| Island | Round trip, group of 6 | Basis |
|---|---|---|
| Jamaica | $55 per person (owner's cost) | Market listings: MBJ to Ocho Rios about $150 for 1 to 4 plus $25 per extra person each way |
| Barbados | $160 | Regulated airport taxi fares about $31 to $45 for up to 4; two taxis each way |
| Saint Lucia | $360 | Hewanorra to Rodney Bay about $90 and Soufriere about $80 per taxi; two taxis each way |
| Curacao | $80 | Fixed taxi rate about $25 to $35 to Willemstad and Jan Thiel, plus 25% for more than 4 passengers |
| The Bahamas | $150 | Nassau airport zone fares about $29 to $38 per taxi; two taxis each way |
| Belize | $240 | Two airport cabs about $25 each to the water taxi terminal, and the San Ignacio shuttle to the airport about $190 (another operator lists from $75). The water taxi to San Pedro is not included. |
| Dominican Republic | $150 | Punta Cana airport to Bavaro/Cap Cana: van for up to 10 about $150 round trip |
