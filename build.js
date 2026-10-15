/**
 * build.js — Accepts Design_Reference.html OR site.html
 * Outputs: public/index.html with bridge.js injected + minified, plus one
 * public/<path>/index.html per route in SS_ROUTES (same app, route-specific <head>)
 */
const fs   = require('fs');
const path = require('path');
const vm   = require('vm');
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
 * Group trip builder: the server prices a trip from this catalog, never from anything the browser sends.
 * It is generated from the CURATED_TOURS list in Design_Reference.html (the same list the site shows)
 * plus the per-island transfer prices in api/_data/packages.json, so the two cannot drift apart.
 */
/** The CURATED_TOURS list from the source (the All Experiences catalog), parsed once for every generator that needs it. */
function parseCuratedTours(source) {
  const marker = 'const CURATED_TOURS = [';
  const start = source.indexOf(marker);
  if (start === -1) throw new Error('CURATED_TOURS not found - cannot read the experience catalog');
  const open = start + marker.length - 1;
  let depth = 0, end = -1, inStr = null, esc = false;
  for (let i = open; i < source.length; i++) {
    const c = source[i];
    if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === inStr) inStr = null; continue; }
    if (c === "'" || c === '"' || c === '`') { inStr = c; continue; }
    if (c === '[') depth++;
    else if (c === ']') { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end === -1) throw new Error('CURATED_TOURS is unterminated');
  try { return eval(source.slice(open, end + 1)); }
  catch (e) { throw new Error('CURATED_TOURS could not be parsed: ' + e.message); }
}

function writeBuilderCatalog(source) {
  const list = parseCuratedTours(source);

  const items = {};
  for (const t of list) {
    if (t.type !== 'water' && t.type !== 'land') continue;
    if (items[t.title]) throw new Error('Duplicate experience title in CURATED_TOURS: ' + t.title);
    items[t.title] = {
      country: t.country, area: t.area || '', type: t.type,
      price: (typeof t.priceValue === 'number' && t.priceValue > 0) ? t.priceValue : 0,
      per: t.per === 'group' ? 'group' : 'person',
      cap: t.cap || null
    };
  }
  const pk = require('./api/_data/packages.json');
  const transfers = {};
  for (const k of Object.keys(pk)) {
    const a = pk[k] && pk[k].addons && pk[k].addons.xfer;
    if (a) transfers[k] = { price: a.price, per: a.per };
  }
  const dir = path.join(__dirname, 'api', '_data');
  fs.writeFileSync(path.join(dir, 'builder-catalog.json'), JSON.stringify({ items, transfers }, null, 2) + '\n', 'utf8');
  console.log('\uD83E\uDDF3  Builder catalog: ' + Object.keys(items).length + ' experiences, ' + Object.keys(transfers).length + ' islands');
}

writeBuilderCatalog(html);

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

/**
 * Route pages.
 *
 * The site is one document that boots into whatever path it is asked for (vercel.json rewrites every
 * path to /index.html). Crawlers and link previews read the raw HTML before any script runs, and every
 * route used to return the homepage's title, description, og tags and canonical.
 *
 * For each route in SS_ROUTES this writes public/<path>/index.html: the same built document, with only
 * the head tags below replaced by that page's SS_META entry (the values ssSetMeta() applies at runtime).
 * The app is unchanged, so every route behaves exactly as before once the script runs.
 *
 * SS_ROUTES and SS_META are read from Design_Reference.html (the way TOURS is), so the table in the
 * source stays the only place routes and meta are edited. Any problem stops the build instead of
 * shipping a page with the wrong head.
 */
const SITE = 'https://www.sightseerscaribbean.com';
const ROUTE_SKIP = new Set(['home', 'vtours', 'club-admin', 'admin']);                    // '/' is the main document; V-Tours is hidden until launch
const ROUTE_RESERVED = new Set(['api', 'assets', 'logos', 'panos', 'models', 'vendor', 'virtual-tours']);
const ROUTE_MARKER = '<!-- ss-route-page ';                        // identifies files this step owns (safe to replace or remove)

/** Index of the bracket that closes the one at `open`, scanning past strings and comments. */
function scanBalanced(source, open, name) {
  const up = source[open], down = up === '{' ? '}' : ')';
  let depth = 0, inStr = null, esc = false;
  for (let i = open; i < source.length; i++) {
    const c = source[i], n = source[i + 1];
    if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === inStr) inStr = null; continue; }
    if (c === '/' && n === '/') { const e = source.indexOf('\n', i); if (e === -1) break; i = e; continue; }
    if (c === '/' && n === '*') { const e = source.indexOf('*/', i + 2); if (e === -1) break; i = e + 1; continue; }
    if (c === "'" || c === '"' || c === '`') { inStr = c; continue; }
    if (c === up) depth++;
    else if (c === down) { depth--; if (depth === 0) return i; }
  }
  throw new Error(name + ' is unterminated');
}

/** Returns the {...} literal that follows `var NAME =` in the source. */
function readObjectLiteral(source, name) {
  const m = new RegExp('\\bvar\\s+' + name + '\\s*=\\s*\\{').exec(source);
  if (!m) throw new Error(name + ' not found in the source');
  const open = m.index + m[0].length - 1;
  return source.slice(open, scanBalanced(source, open, name) + 1);
}

/** Returns the source text of `function NAME(...) {...}`, so the build can run the very function the app runs. */
function readFunction(source, name) {
  const m = new RegExp('\\bfunction\\s+' + name + '\\s*\\(').exec(source);
  if (!m) throw new Error('function ' + name + ' not found in the source');
  const params = m.index + m[0].length - 1;
  const body = source.indexOf('{', scanBalanced(source, params, name));
  return source.slice(m.index, scanBalanced(source, body, name) + 1);
}

function parseRoutePages(source) {
  let routes, meta;
  try {
    routes = vm.runInNewContext('(' + readObjectLiteral(source, 'SS_ROUTES') + ')', Object.create(null));
    meta   = vm.runInNewContext('(' + readObjectLiteral(source, 'SS_META') + ')', Object.create(null));
  } catch (e) { throw new Error('Route pages: SS_ROUTES / SS_META could not be read: ' + e.message); }

  // A section hidden with data-ss-<id>-hidden on <html> renders the home page, so a page baked for it would describe something the app does not show.
  const htmlTag = (/<html\b[^>]*>/i.exec(source) || [''])[0];
  const hidden = new Set([...htmlTag.matchAll(/\bdata-ss-([a-z0-9-]+)-hidden\b/g)].map(m => m[1]));

  const pages = [], seen = new Map();
  for (const id of Object.keys(routes)) {
    const route = routes[id];
    if (route === '/' || ROUTE_SKIP.has(id) || hidden.has(id)) continue;
    if (typeof route !== 'string' || !/^\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(route)) {
      throw new Error(`Route pages: route "${id}" has an unsupported path ${JSON.stringify(route)} (one lowercase segment, e.g. "/greek-life-travel")`);
    }
    const dir = route.slice(1);
    if (ROUTE_RESERVED.has(dir)) throw new Error(`Route pages: route "${id}" (${route}) collides with the static folder /${dir}/`);
    if (seen.has(route)) throw new Error(`Route pages: "${seen.get(route)}" and "${id}" both use ${route}`);
    seen.set(route, id);
    const m = meta[id];
    if (!Array.isArray(m) || typeof m[0] !== 'string' || typeof m[1] !== 'string' || !m[0].trim() || !m[1].trim()) {
      throw new Error(`Route pages: SS_META has no title and description for route "${id}" (${route})`);
    }
    pages.push({ id, path: route, dir, title: m[0], description: m[1] });
  }
  if (!pages.length) throw new Error('Route pages: SS_ROUTES produced no pages');
  pages.hidden = [...hidden];
  return pages;
}

const routePages = parseRoutePages(html);

/** Experience pages (/tours/<slug>): the slug function is the app's own, read from the source and run here. */
const tourPages = require('./tour-pages');
const tourSlug = vm.runInNewContext('(' + readFunction(html, 'ssTourSlug') + ')', Object.create(null));
const curatedTours = parseCuratedTours(html);
const tourPlan = tourPages.planTourPages(curatedTours, tourSlug);   // validates every slug before anything is written

const escText = x => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = x => escText(x).replace(/"/g, '&quot;');
const headTags = [
  // [label, pattern, replacement, required]  (twitter tags are not touched by ssSetMeta, but a preview reads them from the raw HTML too)
  ['title',               /<title>[^<]*<\/title>/g,                                  p => `<title>${escText(p.title)}</title>`, true],
  ['meta description',    /<meta name="description" content="[^"]*">/g,              p => `<meta name="description" content="${escAttr(p.description)}">`, true],
  ['og:title',            /<meta property="og:title" content="[^"]*">/g,             p => `<meta property="og:title" content="${escAttr(p.title)}">`, true],
  ['og:description',      /<meta property="og:description" content="[^"]*">/g,       p => `<meta property="og:description" content="${escAttr(p.description)}">`, true],
  ['og:url',              /<meta property="og:url" content="[^"]*">/g,               p => `<meta property="og:url" content="${SITE}${p.path}">`, true],
  ['canonical',           /<link rel="canonical" href="[^"]*">/g,                    p => `<link rel="canonical" href="${SITE}${p.path}">`, true],
  ['twitter:title',       /<meta name="twitter:title" content="[^"]*">/g,            p => `<meta name="twitter:title" content="${escAttr(p.title)}">`, false],
  ['twitter:description', /<meta name="twitter:description" content="[^"]*">/g,      p => `<meta name="twitter:description" content="${escAttr(p.description)}">`, false]
];

function writeRoutePages(pages, built) {
  const headEnd = built.indexOf('</head>');
  if (headEnd === -1) throw new Error('no </head> in the built document');
  if (!/^<!doctype html>/i.test(built)) throw new Error('the built document does not start with a doctype');
  const head = built.slice(0, headEnd), rest = built.slice(headEnd);

  // Every tag must exist exactly once in the head, or a page could ship with a mix of homepage and route values.
  for (const [label, re, , required] of headTags) {
    const n = (head.match(re) || []).length;
    if (n > 1 || (n === 0 && required)) throw new Error(`expected exactly one ${label} tag in the <head>, found ${n}`);
  }

  const made = new Set();
  for (const page of pages) {
    let h = head;
    for (const [, re, make] of headTags) h = h.replace(re, () => make(page));
    const out = (h + rest).replace(/^<!doctype html>/i, m => m + ROUTE_MARKER + page.path + ': generated by build.js from SS_ROUTES and SS_META, do not edit -->');
    const dir = path.join(publicDir, page.dir), file = path.join(dir, 'index.html');
    if (fs.existsSync(file) && !isRoutePage(file)) {
      throw new Error(`${path.relative(__dirname, file)} exists and was not generated by this step; refusing to overwrite it`);
    }
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, out, 'utf8');
    made.add(page.dir);
  }

  // A route that was removed or renamed leaves its old page behind and Vercel would keep serving it, so remove pages this step wrote earlier.
  let removed = 0;
  for (const ent of fs.readdirSync(publicDir, { withFileTypes: true })) {
    if (!ent.isDirectory() || made.has(ent.name)) continue;
    const file = path.join(publicDir, ent.name, 'index.html');
    if (fs.existsSync(file) && isRoutePage(file)) {
      fs.unlinkSync(file);
      if (!fs.readdirSync(path.join(publicDir, ent.name)).length) fs.rmdirSync(path.join(publicDir, ent.name));
      removed++;
    }
  }
  console.log(`🧭  Route pages: ${made.size} written under public/<path>/index.html` + (removed ? `, ${removed} stale removed` : '') +
              ` (skipped: ${[...new Set([...ROUTE_SKIP, ...(pages.hidden || [])])].join(', ')})`);
}

function isRoutePage(file) {
  const fd = fs.openSync(file, 'r');
  try { const b = Buffer.alloc(400); const n = fs.readSync(fd, b, 0, 400, 0); return b.toString('utf8', 0, n).includes(ROUTE_MARKER); }
  finally { fs.closeSync(fd); }
}

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
  let built;
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
    built = minified;
    const savedPct = ((1 - minified.length / html.length) * 100).toFixed(1);
    console.log(`🚀  Built → public/index.html (${(fs.statSync(DEST).size/1024).toFixed(0)} KB, ${savedPct}% smaller)`);
  } catch (err) {
    console.warn(`⚠️  Minification failed, writing unminified: ${err.message}`);
    fs.writeFileSync(DEST, html, 'utf8');
    built = html;
    console.log(`🚀  Built → public/index.html (${(fs.statSync(DEST).size/1024).toFixed(0)} KB, unminified)`);
  }

  // Outside the try above: a problem here must fail the build, not fall back to an unminified page.
  try { writeRoutePages(routePages, built); }
  catch (err) { console.error(`\n❌  Route pages: ${err.message}\n`); process.exit(1); }
  try {
    const r = tourPages.writeTourPages({ curated: curatedTours, slugOf: tourSlug, publicDir, today: new Date().toISOString().slice(0, 10) });
    console.log(`\uD83E\uDDED  Experience pages: ${r.written} written under public/tours/<slug>/index.html, ${r.written} URLs in public/sitemap.xml` + (r.removed ? `, ${r.removed} stale removed` : ''));
  } catch (err) { console.error(`\n❌  Experience pages: ${err.message}\n`); process.exit(1); }
})();
