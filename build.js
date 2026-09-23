/**
 * build.js — Accepts Design_Reference.html OR site.html
 * Outputs: public/index.html with bridge.js injected + minified
 */
const fs   = require('fs');
const path = require('path');
const { minify } = require('html-minifier-terser');
const DEST = path.join(__dirname, 'public', 'index.html');

const CANDIDATES = ['site.html','Design_Reference.html','design_reference.html','source.html'];
let SRC = null;
for (const name of CANDIDATES) {
  const c = path.join(__dirname, name);
  if (fs.existsSync(c)) { SRC = c; break; }
}
if (!SRC) {
  console.error('\n❌  HTML file not found. Upload Design_Reference.html to the project root.\n');
  process.exit(1);
}
console.log(`📄  Source: ${path.basename(SRC)}`);

const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

let html = fs.readFileSync(SRC, 'utf8');
console.log(`📖  Read ${(html.length/1024).toFixed(0)} KB`);

/**
 * Tour prices for the checkout API are derived from the TOURS array here, so
 * the page and the server can never disagree about what a tour costs. The
 * browser sends only ids and quantities; api/_handlers/stripe-checkout.js
 * looks the price up in the file written below. Editing a price in
 * Design_Reference.html is therefore enough — this regenerates on every build.
 *
 * A failure here stops the build rather than shipping stale prices.
 */
function writeTourPrices(source) {
  const start = source.indexOf('const TOURS=[');
  if (start === -1) throw new Error('TOURS array not found — cannot generate tour prices');
  const open = source.indexOf('[', start);
  let depth = 0, end = -1;
  for (let i = open; i < source.length; i++) {
    const c = source[i];
    if (c === '[') depth++;
    else if (c === ']') { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end === -1) throw new Error('TOURS array is unterminated — cannot generate tour prices');

  let tours;
  try { tours = eval(source.slice(open, end + 1)); }
  catch (e) { throw new Error('TOURS array could not be parsed: ' + e.message); }
  if (!Array.isArray(tours) || !tours.length) throw new Error('TOURS array parsed empty');

  const seen = new Map();
  for (const t of tours) {
    if (t.id === undefined || t.id === null) throw new Error(`Tour "${t.title}" has no id`);
    if (seen.has(t.id)) {
      throw new Error(`Duplicate tour id ${t.id}: "${seen.get(t.id)}" and "${t.title}" — ` +
                      'ids must be unique or the wrong tour opens and the wrong price is charged');
    }
    seen.set(t.id, t.title);
  }

  const prices = {};
  for (const t of tours) {
    prices[String(t.id)] = {
      title: t.title,
      price: (typeof t.price === 'number' && t.price > 0) ? t.price : null,
      optionLabel: t.optionLabel || 'Option',
      options: Array.isArray(t.options) ? t.options : []
    };
  }
  const dir = path.join(__dirname, 'api', '_data');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'tour-prices.json'), JSON.stringify(prices, null, 2) + '\n', 'utf8');
  const buyable = Object.values(prices).filter(p => p.price !== null).length;
  console.log(`\uD83D\uDCB2  Tour prices: ${tours.length} tours (${buyable} purchasable, ${tours.length - buyable} quote-only)`);
}

writeTourPrices(html);

/**
 * The same experience can be priced in two places: the V-Tour session records
 * in Design_Reference.html, and tours-data.json, which generates the static
 * landing pages under public/virtual-tours/. Nothing kept them in step, so a
 * visitor could read one price on a landing page and be quoted another when
 * they joined the session.
 *
 * This reports disagreements rather than failing the build, because deciding
 * which figure is correct is a business call, not a build-time one. Set
 * STRICT_PRICES=1 to make a mismatch fail instead, once the data agrees.
 */
function checkPriceAgreement(html) {
  let tourData;
  try { tourData = require('./tours-data.json'); }
  catch (e) { return; }
  if (!Array.isArray(tourData)) return;

  const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const sessions = [];
  const re = /'([a-z0-9-]+)':\{title:'([^']+)'[^}]*?price:(\d+)/g;
  let m;
  while ((m = re.exec(html))) sessions.push({ title: m[2], price: Number(m[3]) });

  const clashes = [];
  for (const s of sessions) {
    const t = tourData.find(x => norm(x.title) === norm(s.title));
    if (t && typeof t.priceFrom === 'number' && t.priceFrom !== s.price) {
      clashes.push(`"${s.title}": session $${s.price} vs landing page $${t.priceFrom}`);
    }
  }
  if (!clashes.length) return;

  const msg = 'Price disagreement between session data and tours-data.json:\n' +
    clashes.map(c => '     - ' + c).join('\n');
  if (process.env.STRICT_PRICES === '1') throw new Error(msg);
  console.log('\u26A0\uFE0F   ' + msg);
}

checkPriceAgreement(html);

const BRIDGE = '\n  <!-- Vercel Bridge -->\n  <script src="/bridge.js" defer></script>';
html = html.includes('<head>') ? html.replace('<head>', '<head>' + BRIDGE) : BRIDGE + '\n' + html;

// Add loading="lazy" and decoding="async" to all images except hero
let lazyCount = 0;
html = html.replace(/<img\b(?![^>]*loading=)/gi, (match) => {
  lazyCount++;
  return match + ' loading="lazy" decoding="async"';
});
console.log(`🖼️  Added lazy loading to ${lazyCount} images`);

(async () => {
  try {
    const minified = await minify(html, {
      collapseWhitespace: true,
      removeComments: true,
      removeRedundantAttributes: true,
      removeEmptyAttributes: true,
      minifyCSS: true,
      minifyJS: {
        compress: { drop_console: false, passes: 1 },
        mangle: false
      },
      conservativeCollapse: true,
      preserveLineBreaks: false
    });
    fs.writeFileSync(DEST, minified, 'utf8');
    const savedPct = ((1 - minified.length / html.length) * 100).toFixed(1);
    console.log(`🚀  Built → public/index.html (${(fs.statSync(DEST).size/1024).toFixed(0)} KB, ${savedPct}% smaller)`);
  } catch (err) {
    console.warn(`⚠️  Minification failed, writing unminified: ${err.message}`);
    fs.writeFileSync(DEST, html, 'utf8');
    console.log(`🚀  Built → public/index.html (${(fs.statSync(DEST).size/1024).toFixed(0)} KB, unminified)`);
  }
})();
