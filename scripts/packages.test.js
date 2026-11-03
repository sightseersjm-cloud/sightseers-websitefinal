/* The seven 5-Day Signature packages on the home page must add up.
   - the "from" price per person = the priced excursions per person (+ the airport pickup & drop-off on the Jamaica package)
   - Jamaica (Montego Bay: the owner's $55 per guest + 30% = $71.50) and Saint Lucia ($60 per guest round trip, no markup) include airport pickup & drop-off;
     on every other island the airport transfer is not included and guests enquire for a rate
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
const JAMAICA_AIRPORT = Math.round(55 * 1.3 * 100) / 100;
const STLUCIA_AIRPORT = 60; // round trip per guest, no markup (set by the owner)

const embedded = (() => { const i = html.indexOf('window.CARIB='); const j = html.indexOf(';\n', i); return JSON.parse(html.slice(i + 'window.CARIB='.length, j)); })();
ok('the data on the page is the same as api/_data/packages.json', JSON.stringify(embedded) === JSON.stringify(pk));
const ld = JSON.parse(/<script type="application\/ld\+json">(\{"@context":"https:\/\/schema\.org","@type":"TravelAgency".*?)<\/script>/.exec(html)[1]);
const offers = JSON.stringify(ld);

for (const [c, v] of Object.entries(pk)) {
  let acts = 0, pickups = 0;
  v.days.forEach(d => ['am', 'pm'].forEach(sl => { const it = d[sl]; if (!it) return; const m = /from \$([\d,.]+)/.exec(it.meta || ''); if (m) acts += parseFloat(m[1].replace(/,/g, '')); if (it.pickup) pickups++; }));
  acts = Math.round(acts * 100) / 100;
  const x = v.addons.xfer, jam = c === 'Jamaica', stl = c === 'Saint Lucia', inc = jam || stl, rate = jam ? JAMAICA_AIRPORT : STLUCIA_AIRPORT;
  ok(c + ': the excursion lines add up to ' + acts, v.acts === acts);
  if (inc) ok(c + ': airport pickup & drop-off is included at ' + rate + ' per guest', x.included === true && x.price === rate && /guest/i.test(x.per) && !!x.where, 'got ' + x.price);
  else ok(c + ': airport pickup & drop-off is not included; guests enquire for a rate', x.included === false && x.price === null && x.per === 'enquire');
  ok(c + ': the "from" price per person adds up (' + v.frm + ')', v.frm === round(acts + (inc ? x.price : 0)));
  ok(c + ': no excursion claims a pickup', pickups === 0);
  ok(c + ': the server charges the same excursion price' + (inc ? ' and airport price' : ' and has no airport line'), vp[v.title] === v.acts && (inc ? vp[x.name] === x.price : !(x.name in vp)));
  ok(c + ': the group builder ' + (inc ? 'uses the same airport price' : 'offers no airport price'), builder.transfers[c] && builder.transfers[c].price === (inc ? x.price : null));
  ok(c + ': the card on the page shows from $' + v.frm.toLocaleString('en-US'), html.includes('<h3>' + v.title + '</h3><span class="dur">5 days · from $' + v.frm.toLocaleString('en-US') + ' per person</span>'));
  ok(c + ': the structured data shows the same price', offers.includes('"price":"' + v.frm + '"'));
}
ok('the home page says Jamaica includes Montego Bay airport transport and others enquire', /Jamaica \(Montego Bay\) and Saint Lucia packages include round-trip airport pickup and drop-off\. For other locations, enquire with us for a rate\./.test(html));
ok('the dialog says what is and is not included', /round-trip airport pickup & drop-off \("\+\(_x\.where\|\|""\)\+"\) included\. No other transport is included\./.test(html) && /airport pickup & drop-off is not included: enquire with us for a rate\./.test(html));
ok('the destinations description matches the lowest package', html.includes('5-day packages from US$' + Math.min(...Object.values(pk).map(v => v.frm))));
// every server file must at least parse (a stray quote once broke the Stripe webhook without any test noticing)
const { spawnSync } = require('child_process');
const apiFiles = [path.join(root, 'api/stripe-webhook.js'), path.join(root, 'api/[...route].js')]
  .concat(['_handlers', '_lib'].flatMap(d => fs.readdirSync(path.join(root, 'api', d)).filter(f => f.endsWith('.js')).map(f => path.join(root, 'api', d, f))));
const broken = apiFiles.filter(f => spawnSync(process.execPath, ['--check', f]).status !== 0);
ok('every server file parses (' + apiFiles.length + ' checked)', broken.length === 0, broken.join(', '));
console.log(fails ? '\n' + fails + ' FAILED' : '\nALL PASSED');
process.exit(fails ? 1 : 0);
