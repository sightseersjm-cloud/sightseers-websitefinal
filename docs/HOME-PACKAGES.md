# The 5-Day Signature packages (home page)

Source of truth: `api/_data/packages.json` (embedded in `Design_Reference.html` as `window.CARIB`; `npm run test:packages` keeps the two, the cards, the structured data, the group builder catalog and the server price list in step).

## How a package price is made
- **Excursions per person** (`acts`): the sum of the "from" prices of the excursions listed in the days. They are the tour prices in the Tours catalog (already +30%).
- **Airport pickup & drop-off** (`addons.xfer`, `included: true`): the only transport in the package. Round trip. Researched then +30% for every island except Jamaica.
  - Jamaica: the owner's own final rate, $55 per person for groups of 5 or more (no markup added).
  - Other islands: a researched round-trip rate for a vehicle of up to 6 guests, +30%.
- **"From" price per person** (`frm`) = excursions + the airport share (per guest, or per vehicle ÷ 6), rounded to the dollar.
- **Total for a group** = excursions × guests + airport (per guest × guests, or per vehicle × vehicles of 6).
- **Private driver day** (`addons.driver`) is optional and was not changed.
- The server charges the excursion price per person and the airport line from `api/_data/vtours-products.json`.

## Researched airport rates (October 2026, USD, before +30%)
One-way private transfers from the airport to the base, per vehicle. Sources are operator and guide pages, not quotes: confirm with suppliers.

| Island | Round trip, group of 6 | Basis |
|---|---|---|
| Jamaica | $55 per person (owner) | Market listings: MBJ to Ocho Rios about $150 for 1 to 4 plus $25 per extra person each way |
| Barbados | $160 | Regulated airport taxi fares about $31 to $45 for up to 4; two taxis each way |
| Saint Lucia | $360 | Hewanorra to Rodney Bay about $90 and Soufriere about $80 per taxi; two taxis each way |
| Curacao | $80 | Fixed taxi rate about $25 to $35 to Willemstad and Jan Thiel, plus 25% for more than 4 passengers |
| The Bahamas | $150 | Nassau airport zone fares about $29 to $38 per taxi; two taxis each way |
| Belize | $125 | Airport cabs about $25 to the water taxi terminal (two), and San Ignacio to the airport from about $75 |
| Dominican Republic | $150 | Punta Cana airport to Bavaro/Cap Cana: van for up to 10 about $150 round trip |
