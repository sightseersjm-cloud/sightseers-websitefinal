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
