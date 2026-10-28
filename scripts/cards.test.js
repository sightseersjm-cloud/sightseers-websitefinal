/* The yacht and transfer cards written out on the page must be exactly what the data makes (api/_lib/cards.js).
   Run with:  npm run test:cards */
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'Design_Reference.html'), 'utf8');
const cards = require(path.join(root, 'api/_lib/cards'));
let fails = 0;
const ok = (name, cond, extra) => { console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); if (!cond) fails++; };

const dataText = src.slice(src.indexOf('window.SS_CARD_DATA='), src.indexOf('};', src.indexOf('window.SS_CARD_DATA=')) + 1).replace('window.SS_CARD_DATA=', '');
const data = new Function('return ' + dataText)();

/* the same markup whatever the quotes or the spacing */
const norm = h => h.replace(/\s+/g, ' ').replace(/> </g, '><').replace(/'/g, '"').replace(/&#39;/g, '"').trim();
function articles(page, cls) {
  const a = src.indexOf('id="' + page + '"');
  const b = src.indexOf('<div class="page"', a + 10);
  const seg = src.slice(a, b > 0 ? b : undefined);
  return seg.match(new RegExp('<article class="' + cls + '[\\s\\S]*?</article>', 'g')) || [];
}

const yp = articles('p-yacht-charters', 'yacht-luxe-card');
ok('the page has the yacht cards the data describes', yp.length === data.yachts.length && yp.length === 5, yp.length + ' on the page, ' + data.yachts.length + ' in the data');
data.yachts.forEach((c, i) => ok('yacht card ' + (i + 1) + ' (' + c.name + ') is exactly what the data makes', norm(cards.yachtCard(c)) === norm(yp[i] || ''), norm(cards.yachtCard(c)) === norm(yp[i] || '') ? '' : '\n   data: ' + norm(cards.yachtCard(c)).slice(0, 400) + '\n   page: ' + norm(yp[i] || '').slice(0, 400)));
const tp = articles('p-transfers', 'transfer-card');
ok('the page has the transfer cards the data describes', tp.length === data.transfers.length && tp.length === 3, tp.length + ' on the page, ' + data.transfers.length + ' in the data');
data.transfers.forEach((c, i) => ok('transfer card ' + (i + 1) + ' (' + c.name + ') is exactly what the data makes', norm(cards.transferCard(c)) === norm(tp[i] || ''), norm(cards.transferCard(c)) === norm(tp[i] || '') ? '' : '\n   data: ' + norm(cards.transferCard(c)).slice(0, 400) + '\n   page: ' + norm(tp[i] || '').slice(0, 400)));

/* a name with a quote or an ampersand cannot break the page */
const odd = cards.yachtCard({ category: 'group', img: '/a.jpg', name: 'Captain\'s "Best" & Crew <3', sub: 'x', pills: [], blurb: 'b', bullets: ['<b>'], price: 'p', gallery: ['/a.jpg', '/b.jpg', '/c.jpg', '/d.jpg', '/e.jpg'] });
ok('quotes, ampersands and angle brackets in a name are escaped', !/<3|<b>/.test(odd) && odd.indexOf("openYachtBooking('Captain\\'s &quot;Best&quot; &amp; Crew &lt;3'") > -1 && odd.indexOf('&lt;b&gt;') > -1, odd.slice(odd.indexOf('onclick'), odd.indexOf('onclick') + 110));
ok('more than four photos show "+N More" on the fourth', /data-more="\+2 More"/.test(odd));

console.log(fails ? '\n' + fails + ' FAILED' : '\nALL PASSED');
process.exit(fails ? 1 : 0);
