/* Re-embeds the merged waiver wording (api/_lib/waiver.js) in Design_Reference.html as window.WAIVER.
   Run with:  npm run sync:waiver   (then npm run build). `npm run test:waiver` fails if they differ. */
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');
const { WAIVER } = require(path.join(root, 'api/_lib/waiver'));
const file = path.join(root, 'Design_Reference.html');
let s = fs.readFileSync(file, 'utf8');
const i = s.indexOf('window.WAIVER='), j = s.indexOf(';\n', i);
if (i < 0) throw new Error('window.WAIVER not found');
s = s.slice(0, i) + 'window.WAIVER=' + JSON.stringify(WAIVER) + s.slice(j);
fs.writeFileSync(file, s);
console.log('window.WAIVER updated: ' + WAIVER.events.length + ' activities');
