/* Vercel's api/[...route].js answers one-segment addresses (/api/auth). An address with more parts, such as a profile photo
   (/api/auth/avatar/<file>) or Continue with Google (/api/auth/google/start), is answered by the platform with "NOT_FOUND"
   unless vercel.json rewrites it to the function. This checks each such address has its rewrite.
   Run with:  npm run test:routes */
const fs = require('fs');
const path = require('path');
const vercel = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'vercel.json'), 'utf8'));
let fails = 0;
const ok = (name, cond, extra) => { console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); if (!cond) fails++; };

function toRegex(source) {
  /* only the plain ":name" form is used for the addresses checked here */
  return new RegExp('^' + source.replace(/[.*+?^${}()|[\]\\]/g, m => (m === '(' || m === ')') ? m : '\\' + m).replace(/:[a-zA-Z]+/g, '[^/]+') + '/?$');
}
function rewriteFor(url) {
  return (vercel.rewrites || []).find(r => { try { return toRegex(r.source).test(url); } catch (e) { return false; } });
}
const needs = [
  '/api/auth/avatar/5d740838-46ec-446e-a19d-55fd59ae649d.jpg',
  '/api/auth/google/start', '/api/auth/google/callback',
  '/api/auth/microsoft/start', '/api/auth/microsoft/callback'
];
needs.forEach(u => { const r = rewriteFor(u); ok(u + ' is rewritten to the function', !!r && /^\/api\/auth$/.test(r.destination), r ? r.destination : 'no rewrite'); });
/* the one-segment addresses need nothing, and the page address rewrite must not swallow /api */
ok('/api/auth itself is not rewritten', !rewriteFor('/api/auth'));
console.log(fails ? '\n' + fails + ' FAILED' : '\nALL PASSED');
process.exit(fails ? 1 : 0);
