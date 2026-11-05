/* The Shirts rack section on the home page: the embedded data matches api/_data/shirts.json, every shirt is complete,
   and the section is linked from the menus and footer. Run with:  npm run test:shop */
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'Design_Reference.html'), 'utf8');
const data = require(path.join(root, 'api/_data/shirts.json'));
let fails = 0;
const ok = (name, cond, extra) => { console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); if (!cond) fails++; };
const i = html.indexOf('window.SHIRTS='), j = html.indexOf(';\n', i);
ok('the shirts on the page are the shirts in api/_data/shirts.json', i > 0 && JSON.stringify(JSON.parse(html.slice(i + 'window.SHIRTS='.length, j))) === JSON.stringify(data));
ok('there is at least one shirt', data.items.length >= 1);
data.items.forEach(it => ok(it.name + ': has an id, a name, a colour and a short description', !!(it.id && it.name && /^#[0-9a-f]{6}$/i.test(it.colour) && it.blurb)));
ok('shirt ids are unique', new Set(data.items.map(x => x.id)).size === data.items.length);
ok('sizes are listed', Array.isArray(data.sizes) && data.sizes.length >= 3);
ok('a shirt without a price says Price on request', data.items.every(x => x.price === null || typeof x.price === 'number') && html.includes('Price on request'));
ok('the shirts store is its own page at /shirts, with the other pages before the footer', html.includes("'shirts':'/shirts'") && html.indexOf('id="p-shirts"') > 0 && html.indexOf('id="p-shirts"') < html.indexOf('<footer class="footer">'));
ok('it is not on the home page any more', html.indexOf('id="p-shirts"') > html.indexOf('<!-- FEATURED BLOG -->'));
ok('the old Coming Soon shop page is untouched', html.includes('<div class="page" id="p-shop">'));
ok('Shirts is linked from the menu, the mobile menu and the footer', (html.match(/nav\('shirts'\)/g) || []).length >= 3);
ok('the request goes to the inbox (no online payment)', html.includes("subject:'Shirt request: '") && !/stripe/i.test(html.slice(html.indexOf('id="p-shirts"'), html.indexOf('window.SHIRTS=') + 20000)));
ok('motion is switched off for guests who reduce motion', html.slice(html.indexOf('id="p-shirts"'), html.indexOf('window.SHIRTS=') + 20000).includes('prefers-reduced-motion'));
console.log(fails ? '\n' + fails + ' FAILED' : '\nALL PASSED');
process.exit(fails ? 1 : 0);
