/* The seven 5-Day Signature packages on the home page must add up. For each island:
   - the "from" price per person = the priced excursions per person + the airport pickup & drop-off share (per guest, or per vehicle of 6)
   - the airport pickup & drop-off is the only transport in the package, priced from the researched rate + 30%
   - the page, the embedded data, the structured data, the group builder catalog and the server's price list all agree
   Run with:  npm run test:packages */
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'Design_Reference.html'), 'utf8');
const pk = JSON.parse(fs.readFileSync(path.join(root, 'api/_data/packages.json'), 'utf8'));
const vp = JSON.parse(fs.readFileSync(path.join(root, 'api/_data/vtours-products.json'), 'utf8'));
const builder = JSON.parse(fs.readFileSync(path.join(root, 'api/_data/builder-catalog.json'), 'utf8'));
let fails = 0;
const ok = (name, cond, extra) => { console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); if (!cond) fails++; };
const round = x => Math.floor(x + 0.5);
/* researched round-trip airport rate (USD, before the 30% markup). Jamaica is the owner's own final rate: $55 per person for groups of 5 or more, with no markup added. */
const RESEARCHED = { Jamaica: { each: 55 }, Barbados: { rt: 160 }, 'Saint Lucia': { rt: 360 }, Curacao: { rt: 80 }, 'The Bahamas': { rt: 150 }, Belize: { rt: 125 }, 'Dominican Republic': { rt: 150 } };

const embedded = (() => { const i = html.indexOf('window.CARIB='); const j = html.indexOf(';\n', i); return JSON.parse(html.slice(i + 'window.CARIB='.length, j)); })();
ok('the data on the page is the same as api/_data/packages.json', JSON.stringify(embedded) === JSON.stringify(pk));
const ld = JSON.parse(/<script type="application\/ld\+json">(\{"@context":"https:\/\/schema\.org","@type":"TravelAgency".*?)<\/script>/.exec(html)[1]);
const offers = JSON.stringify(ld);

for (const [c, v] of Object.entries(pk)) {
  let acts = 0, pickups = 0;
  v.days.forEach(d => ['am', 'pm'].forEach(sl => { const it = d[sl]; if (!it) return; const m = /from \$([\d,.]+)/.exec(it.meta || ''); if (m) acts += parseFloat(m[1].replace(/,/g, '')); if (it.pickup) pickups++; }));
  acts = Math.round(acts * 100) / 100;
  const x = v.addons.xfer, r = RESEARCHED[c];
  const perGuest = /guest/i.test(x.per);
  const expectXfer = r.each ? r.each : round(r.rt * 1.3);
  ok(c + ': the excursion lines add up to ' + acts, v.acts === acts);
  ok(c + ': airport pickup & drop-off is ' + (r.each ? 'the owner rate' : 'the researched rate + 30%') + ' (' + expectXfer + ')', x.price === expectXfer && x.included === true, 'got ' + x.price);
  ok(c + ': the "from" price per person adds up (' + v.frm + ')', v.frm === round(acts + (perGuest ? x.price : x.price / 6)));
  ok(c + ': no excursion claims a pickup (only the airport is included)', pickups === 0);
  ok(c + ': the server charges the same excursion price and airport price', vp[v.title] === v.acts && vp[x.name] === x.price);
  ok(c + ': the group builder uses the same airport price', builder.transfers[c] && builder.transfers[c].price === x.price);
  ok(c + ': the card on the page shows from $' + v.frm.toLocaleString('en-US'), html.includes('<h3>' + v.title + '</h3><span class="dur">5 days · from $' + v.frm.toLocaleString('en-US') + ' per person</span>'));
  ok(c + ': the structured data shows the same price', new RegExp('"price":"' + v.frm + '"[^}]*"itemOffered":\\{[^}]*' + v.title.replace(/[()]/g, '')).test(offers) || offers.includes('"price":"' + v.frm + '"'));
  ok(c + ': the old separate "Private Transfers" price is gone from the server list', !(v.title + ': Private Transfers' in vp));
}
ok('the home page says airport pickup and drop-off is the only transport', /airport pickup and drop-off included\. It is the only transport in the package/.test(html));
ok('the dialog says no other transport is included', /airport pickup & drop-off included\. No other transport is included\./.test(html));
ok('the destinations description matches the lowest package', html.includes('5-day packages from US$' + Math.min(...Object.values(pk).map(v => v.frm))));
console.log(fails ? '\n' + fails + ' FAILED' : '\nALL PASSED');
process.exit(fails ? 1 : 0);
