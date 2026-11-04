/* Re-embeds api/_data/shirts.json in Design_Reference.html as window.SHIRTS (the shop page reads it).
   Run with:  npm run sync:shirts   (then npm run build). `npm run test:shop` fails if they differ. */
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');
const data = require(path.join(root, 'api/_data/shirts.json'));
const file = path.join(root, 'Design_Reference.html');
let s = fs.readFileSync(file, 'utf8');
const i = s.indexOf('window.SHIRTS='), j = s.indexOf(';\n', i);
if (i < 0) throw new Error('window.SHIRTS not found');
s = s.slice(0, i) + 'window.SHIRTS=' + JSON.stringify(data) + s.slice(j);
fs.writeFileSync(file, s);
console.log('window.SHIRTS updated: ' + data.items.length + ' shirts');
