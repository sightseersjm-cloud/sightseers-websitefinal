/* The admin's stylesheets must only reach the admin. A rule such as ".ex-wrap{...}" with no "#p-manage" in front of it also restyles any
   public page that happens to use the same class name (this once squeezed the Tours explorer into a narrow column). */
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'Design_Reference.html'), 'utf8');

let failed = 0;
function ok(name, cond, detail) { console.log((cond ? 'PASS ' : 'FAIL ') + name + (detail ? '  ' + detail : '')); if (!cond) failed++; }

/* the rule lists of a stylesheet, with @media blocks opened up */
function selectors(css) {
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const out = [];
  let i = 0;
  while (i < css.length) {
    const j = css.indexOf('{', i);
    if (j < 0) break;
    let depth = 1, k = j + 1;
    while (k < css.length && depth) { if (css[k] === '{') depth++; else if (css[k] === '}') depth--; k++; }
    const sel = css.slice(i, j).trim(), body = css.slice(j + 1, k - 1);
    if (/^@(media|supports)/.test(sel)) out.push(...selectors(body));
    else if (!sel.startsWith('@')) out.push(...sel.split(',').map(s => s.trim()).filter(Boolean));
    i = k;
  }
  return out;
}

/* things that belong to the admin by their own name, or only apply while the admin is open */
const OK = /^(#p-manage\b|#mgRoot\b|#mgIdleWarn\b|(html|body):has\(#p-manage\.on\))/;

const blocks = [...src.matchAll(/<style id="(manage[a-z-]*)">([\s\S]*?)<\/style>/g)];
ok('the admin has stylesheets to check', blocks.length >= 6, String(blocks.length));
blocks.forEach(m => {
  const bad = selectors(m[2]).filter(s => !OK.test(s));
  ok(m[1] + ' reaches only the admin', bad.length === 0, bad.slice(0, 5).join(' | '));
});

console.log(failed ? '\n' + failed + ' FAILED' : '\nALL PASSED');
process.exit(failed ? 1 : 0);
