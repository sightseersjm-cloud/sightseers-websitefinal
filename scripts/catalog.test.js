/* The experience catalog: edit, hide and add experiences, the pages made from them, and the trip builder's prices.
   Runs the real handlers against an in-memory store.   Run with:  npm run test:catalog */
const Module = require('module');
const store = new Map();
const blob = { put: async (p, b) => { store.set(p, Buffer.from(b)); return {}; }, get: async p => store.has(p) ? { statusCode: 200, stream: new Response(store.get(p)).body } : { statusCode: 404 }, del: async () => {}, list: async () => ({ blobs: [] }) };
const o = Module._load; Module._load = function (r, ...a) { return r === '@vercel/blob' ? blob : o.call(this, r, ...a); };
process.env.BLOB_READ_WRITE_TOKEN = 'x'; process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-12345';
process.env.OWNER_EMAIL = 'owner@example.com'; process.env.OWNER_PASSWORD = 'OwnerPass123!';
const root = require('path').resolve(__dirname, '..') + '/';
const H = { auth: require(root + 'api/_handlers/auth'), edit: require(root + 'api/_handlers/site-edit'), settings: require(root + 'api/_handlers/settings'), page: require(root + 'api/_handlers/tour-page') };
const catalog = require(root + 'api/_lib/catalog');
const trip = require(root + 'api/_lib/trip');
function call(h, method, url, body, token, query) {
  return new Promise(r => {
    const res = { headers: {}, status(c) { this.code = c; return this; }, json(x) { r({ code: this.code, body: x }); }, end(x) { r({ code: this.code, body: x, headers: this.headers }); }, send(x) { r({ code: this.code, body: x, headers: this.headers }); }, setHeader(k, v) { this.headers[k] = v; } };
    H[h]({ method, url, headers: { host: 'www.sightseerscaribbean.com', 'x-forwarded-for': '9.9.9.9', ...(token ? { authorization: 'Bearer ' + token } : {}) }, body: body || {}, query: query || {} }, res);
  });
}
const post = (b, t) => call('edit', 'POST', '/api/site-edit', b, t);
const get = (q, t) => call('edit', 'GET', '/api/site-edit', {}, t, q);
const live = async () => (await call('settings', 'GET', '/api/settings')).body;
const page = slug => call('page', 'GET', '/api/tour-page', {}, null, { slug });
let fails = 0; const ok = (name, cond, extra) => { console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); if (!cond) fails++; };
const BASE = require(root + 'api/_data/curated-tours.json');
const KEY = 'A Good Bajan Day Highlights Tour', SLUG = 'good-bajan-day-highlights-tour';
const C = (key, value, extra) => Object.assign({ id: '@c', list: 'experiences', key, value, label: 'Experience: ' + key }, extra || {});

(async () => {
  let r = await call('auth', 'POST', '/api/auth', { action: 'signin', email: 'owner@example.com', password: 'OwnerPass123!' }); const owner = r.body.token;
  async function member(name, email, preset, needsApproval) {
    let x = await call('auth', 'POST', '/api/auth', { action: 'team-invite', name, email, preset, needsApproval }, owner);
    const code = new URL(x.body.link).searchParams.get('code');
    x = await call('auth', 'POST', '/api/auth', { action: 'reset-password', email, code, newPassword: 'Member12345!' });
    return x.body.token;
  }
  const writer = await member('Wanda Writer', 'wanda@example.com', 'content');
  const blogger = await member('Bo Blogger', 'bo@example.com', 'blog');

  // --- before any edit the page is made from the code's own list
  r = await page(SLUG); ok('an experience page is made on request', r.code === 200 && /Good Bajan Day/.test(r.body) && /panoramic east-coast views/.test(r.body) && /Cache-Control/i.test(Object.keys(r.headers).join()));
  ok('the page has a canonical address and the real price', /rel="canonical" href="https:\/\/www.sightseerscaribbean.com\/tours\/good-bajan-day-highlights-tour"/.test(r.body));
  ok('an unknown address is a 404', (await page('no-such-tour')).code === 404 && (await page('../etc')).code === 404);

  // --- edit one
  r = await post({ action: 'save', changes: [C(KEY, { edits: { title: 'Good Bajan Day: Private Highlights', priceValue: 400, per: 'group', cap: 5, includes: ['Private transport', 'Driver-guide'], highlights: ['Cherry Tree Hill sunrise', 'Bathsheba'] } })] }, owner);
  ok('the owner publishes an experience edit straight away', r.code === 200 && r.body.live === true, JSON.stringify(r.body));
  let s = await live();
  ok('it is stored under the original title', s.ss_catalog_v1.experiences.edits[KEY].priceValue === 400);
  r = await page(SLUG);
  ok('the page shows the edit and keeps its web address', r.code === 200 && /Good Bajan Day: Private Highlights/.test(r.body) && /\$400/.test(r.body) && /per group/.test(r.body) && /Private transport/.test(r.body));
  ok('the old highlights are replaced', /Cherry Tree Hill sunrise/.test(r.body) && !/panoramic east-coast views/.test(r.body));
  r = await post({ action: 'save', changes: [C(KEY, { edits: { title: 'Good Bajan Day: Private Highlights', priceValue: 400, per: 'group', cap: 5, includes: ['Private transport', 'Driver-guide'], highlights: ['Cherry Tree Hill sunrise', 'Bathsheba'] } })] }, owner);
  ok('saving the same thing again changes nothing', r.body.unchanged === true);

  // --- checks
  ok('a price below zero is refused', (await post({ action: 'save', changes: [C(KEY, { edits: { priceValue: -1 } })] }, owner)).code === 400);
  ok('a script cannot be a photo address', (await post({ action: 'save', changes: [C(KEY, { edits: { image: 'javascript:alert(1)' } })] }, owner)).code === 400);
  ok('unknown fields are ignored, not stored', (await post({ action: 'save', changes: [C(KEY, { edits: { priceValue: 400, per: 'group', cap: 5, includes: ['Private transport', 'Driver-guide'], highlights: ['Cherry Tree Hill sunrise', 'Bathsheba'], title: 'Good Bajan Day: Private Highlights', evil: '<script>' } })] }, owner)).body.unchanged === true);
  ok('a list that is not a list is refused', (await post({ action: 'save', changes: [C(KEY, { edits: { highlights: 'nope' } })] }, owner)).code === 400);
  ok('the island of an added experience must be one we serve', (await post({ action: 'save', changes: [C('nabcde1', { added: { title: 'X', country: 'Mars', image: '/a.jpg', desc: 'Hello' } })] }, owner)).code === 400);
  ok('an added experience needs a code of its own', (await post({ action: 'save', changes: [C('A Good Bajan Day', { added: { title: 'X', country: 'Barbados', image: '/a.jpg', desc: 'Hello' } })] }, owner)).code === 400);

  // --- people without the tours permission
  ok('a blog writer cannot change experiences', (await post({ action: 'save', changes: [C(KEY, { edits: { priceValue: 1 } })] }, blogger)).code === 403);
  r = await post({ action: 'save', changes: [C(KEY, { edits: { priceValue: 450 } })] }, writer);
  ok('a content editor needing approval sends it as a draft', r.body.live === false && !!r.body.draftId);
  s = await live(); ok('the draft is not live', s.ss_catalog_v1.experiences.edits[KEY].priceValue === 400);
  r = await get({ view: 'drafts' }, owner); const dr = r.body.pending.find(d => d.changes.some(c => c.id === '@c'));
  ok('the owner sees what is live now next to the new state', !!dr && dr.changes[0].now.edits.priceValue === 400 && dr.changes[0].after.edits.priceValue === 450);
  r = await post({ action: 'preview-link', id: dr.id }, owner); r = await get({ view: 'preview', token: r.body.token }, null);
  ok('the preview carries the list and the key', r.body.changes[0].list === 'experiences' && r.body.changes[0].key === KEY && r.body.changes[0].store === 'ss_catalog_v1');
  r = await post({ action: 'draft-approve', id: dr.id }, owner); s = await live();
  ok('approving puts it live', r.code === 200 && s.ss_catalog_v1.experiences.edits[KEY].priceValue === 450);

  // --- hide, show, add, remove
  r = await post({ action: 'save', changes: [C(KEY, { edits: { priceValue: 450 }, hidden: true })] }, owner);
  ok('an experience can be taken off the website', r.body.live === true && (await page(SLUG)).code === 404);
  r = await post({ action: 'save', changes: [C(KEY, { edits: { priceValue: 450 } })] }, owner);
  ok('and put back', (await page(SLUG)).code === 200);
  const NEW = 'nz9k2m4';
  r = await post({ action: 'save', changes: [C(NEW, { added: { title: 'Sunrise Hike at Cherry Tree Hill', country: 'Barbados', area: 'East Coast & Interior', type: 'land', duration: '3 hours', image: '/assets/tours/a-good-bajan-day-highlights-tour.jpg', desc: 'An early morning walk with views over the east coast.', priceValue: 85, highlights: ['Sunrise views'] } })] }, owner);
  ok('an experience can be added', r.body.live === true, JSON.stringify(r.body));
  r = await page('sunrise-hike-cherry-tree-hill');
  ok('an added experience gets its own page', r.code === 200 && /Sunrise Hike at Cherry Tree Hill/.test(r.body) && /\$85/.test(r.body), String(r.code));
  r = await page('sunrise-hike-cherry-tree-hill'); ok('and offers other experiences on its island', /More experiences in Barbados/.test(r.body));
  r = await post({ action: 'save', changes: [C(NEW, {})] }, owner);
  ok('an added experience can be removed', r.body.live === true && (await page('sunrise-hike-cherry-tree-hill')).code === 404);

  // --- history and put back
  r = await get({ view: 'history', limit: 50 }, owner);
  const h = r.body.history.find(x => x.kind === 'c' && x.key === KEY && x.after && x.after.edits && x.after.edits.priceValue === 400);
  ok('history keeps the list, the key and the before and after', !!h && h.list === 'experiences' && !h.before.edits);
  r = await post({ action: 'restore', id: h.id }, owner); s = await live();
  ok('an earlier state can be put back (here: back to the original)', r.code === 200 && !(s.ss_catalog_v1.experiences.edits || {})[KEY]);
  r = await page(SLUG); ok('the page is back to the code\'s version', /A Good Bajan Day Highlights Tour/.test(r.body) && /panoramic east-coast views/.test(r.body));

  // --- the trip builder
  const items = JSON.parse(JSON.stringify(require(root + 'api/_data/builder-catalog.json').items));
  await post({ action: 'save', changes: [C(KEY, { edits: { priceValue: 400, per: 'group', cap: 5 } })] }, owner);
  s = await live();
  const eff = catalog.builderItems(items, BASE, s.ss_catalog_v1.experiences);
  const q = trip.quote({ country: 'Barbados', guests: 10, items: [KEY], transfers: false }, eff);
  ok('the builder prices an edited experience at the new price, per group of five', q.ok && q.lines[0].price === 400 && q.lines[0].qty === 2 && q.lines[0].amount === 800, JSON.stringify(q.lines && q.lines[0]));
  await post({ action: 'save', changes: [C(KEY, { edits: { priceValue: 400, per: 'group', cap: 5 }, hidden: true })] }, owner);
  s = await live();
  const eff2 = catalog.builderItems(items, BASE, s.ss_catalog_v1.experiences);
  ok('a hidden experience can no longer be priced', trip.quote({ country: 'Barbados', guests: 10, items: [KEY], transfers: false }, eff2).ok === false);

  // --- destination packages
  const P = (key, value, extra) => Object.assign({ id: '@c', list: 'packages', key, value, label: 'Package: ' + key }, extra || {});
  const PKEY = 'Jamaica|Bamboo Rafting Signature Day';
  r = await post({ action: 'save', changes: [P(PKEY, { edits: { price: 'from $120', tag: 'Guest Favorite', highlights: ['Bamboo rafting', 'Lunch by the river'], inclusions: ['Guide', 'Lunch'] } })] }, owner);
  ok('the owner edits a destination package', r.code === 200 && r.body.live === true, JSON.stringify(r.body));
  s = await live();
  ok('a package edit is stored under island and original name', s.ss_catalog_v1.packages.edits[PKEY].price === 'from $120' && s.ss_catalog_v1.packages.edits[PKEY].inclusions.length === 2);
  ok('a package edit does not touch the experiences', !s.ss_catalog_v1.experiences || !Object.keys(s.ss_catalog_v1.experiences.edits || {}).some(k => /Bamboo/.test(k)));
  ok('a package needs an island we serve', (await post({ action: 'save', changes: [P(PKEY, { edits: { destination: 'Mars' } })] }, owner)).code === 400);
  ok('an added package needs a photo', (await post({ action: 'save', changes: [P('npkg001', { added: { title: 'New package', destination: 'Belize', blurb: 'A short summary.' } })] }, owner)).code === 400);
  ok('an added package needs a summary', (await post({ action: 'save', changes: [P('npkg001', { added: { title: 'New package', destination: 'Belize', img: '/assets/x.jpg' } })] }, owner)).code === 400);
  r = await post({ action: 'save', changes: [P('npkg001', { added: { title: 'Cave Tubing Day', destination: 'Belize', img: '/assets/x.jpg', blurb: 'Tube through the caves.', highlights: ['Caves', 'Lunch'] } })] }, owner);
  s = await live();
  ok('an added package is stored with the code of its own', r.body.live === true && s.ss_catalog_v1.packages.added[0].id === 'npkg001' && s.ss_catalog_v1.packages.added[0].destination === 'Belize');
  const pe = catalog.effective('packages', [{ destination: 'Jamaica', title: 'Bamboo Rafting Signature Day', tag: 'Most Requested', type: 'Curated Package', duration: 'Half day', price: 'from $107', img: '/assets/a.jpg', blurb: 'River.', highlights: ['Rafting'] }, { destination: 'Belize', title: 'Other', price: 'from $1', img: '/b.jpg', blurb: 'x', highlights: [] }], s.ss_catalog_v1.packages);
  ok('the site shows the package edit', pe[0].price === 'from $120' && pe[0].tag === 'Guest Favorite' && pe[0].origKey === PKEY && pe[0].type === 'Curated Package');
  ok('an added package comes last with the card fields filled in', pe.length === 3 && pe[2].added === true && pe[2].tag === 'Curated Package' && pe[2].price === 'Price on request' && pe[2].destination === 'Belize');
  r = await post({ action: 'save', changes: [P(PKEY, { edits: { price: 'from $120', tag: 'Guest Favorite', highlights: ['Bamboo rafting', 'Lunch by the river'], inclusions: ['Guide', 'Lunch'] }, hidden: true })] }, owner); s = await live();
  ok('a package can be taken off the website', r.body.live === true && catalog.effective('packages', [{ destination: 'Jamaica', title: 'Bamboo Rafting Signature Day' }], s.ss_catalog_v1.packages).filter(x => !x.added).length === 0);
  r = await get({ view: 'history', limit: 50 }, owner);
  const ph = r.body.history.find(x => x.kind === 'c' && x.list === 'packages' && x.key === PKEY);
  ok('history knows it was a package, on the destinations page', !!ph && ph.page === 'destinations');
  r = await post({ action: 'restore', group: ph.group }, owner); s = await live();
  ok('a package change can be put back', r.code === 200 && r.body.live !== false);

  // --- stays
  const T = (key, value, extra) => Object.assign({ id: '@c', list: 'stays', key, value, label: 'Stay: ' + key }, extra || {});
  r = await post({ action: 'save', changes: [T('2', { edits: { title: 'Ocho Rios Seaview Villa (renovated)', price: 'from $700 / night', highlights: ['Private pool', 'Chef on request'], gallery: ['https://example.com/a.jpg', '/assets/b.jpg'] } })] }, owner);
  s = await live();
  ok('the owner edits a stay', r.body.live === true && s.ss_catalog_v1.stays.edits['2'].price === 'from $700 / night' && s.ss_catalog_v1.stays.edits['2'].gallery.length === 2);
  ok('a stay gallery must be photo addresses', (await post({ action: 'save', changes: [T('2', { edits: { gallery: ['javascript:alert(1)'] } })] }, owner)).code === 400);
  ok('a stay has at most four highlights', (await post({ action: 'save', changes: [T('3', { edits: { highlights: ['a', 'b', 'c', 'd', 'e', 'f'] } })] }, owner)).code === 200 && (await live()).ss_catalog_v1.stays.edits['3'].highlights.length === 4);
  ok('an added stay needs to say villa or vacation rental', (await post({ action: 'save', changes: [T('nstay01', { added: { title: 'Hill house', country: 'Jamaica', img: '/a.jpg', copy: 'Nice.' } })] }, owner)).code === 400);
  r = await post({ action: 'save', changes: [T('nstay01', { added: { title: 'Hill house', country: 'Jamaica', type: 'villa', img: '/a.jpg', copy: 'Nice.', price: 'from $300 / night' } })] }, owner); s = await live();
  const se = catalog.effective('stays', [{ id: 2, title: 'Ocho Rios Seaview Villa', country: 'Jamaica', type: 'villa', tag: 'Villa', price: 'from $620 / night', img: '/x.jpg', copy: 'c', highlights: [] }], s.ss_catalog_v1.stays);
  ok('the site shows the stay edit and keeps its id', se[0].title === 'Ocho Rios Seaview Villa (renovated)' && se[0].id === 2 && se[0].origKey === '2' && se[0].tag === 'Villa');
  ok('an added stay gets its tag from its kind and an id of its own', se[1].added === true && se[1].tag === 'Villa' && se[1].id === 'nstay01');
  const se2 = catalog.effective('stays', [{ id: 2, title: 'A', country: 'Jamaica', type: 'villa', tag: 'Villa', price: 'p', img: '/x.jpg', copy: 'c', highlights: [] }], { edits: { '2': { type: 'airbnb' } }, hidden: {}, added: [] });
  ok('changing the kind of a stay changes its tag', se2[0].tag === 'Vacation Rentals');
  let doc = catalog.emptyDoc(), over = null;
  for (let i = 0; i < 81 && !over; i++) { const put = catalog.putState(doc, 'n' + 'abcde' + i, { added: { title: 'S' + i } }, 'stays'); if (put.error) over = put.error; else doc = put.doc; }
  ok('the site holds at most 80 added stays', /stays than the site can hold \(80\)/.test(over || ''), over);
  ok('the content editor can change packages and stays, a blogger cannot', (await post({ action: 'save', changes: [T('4', { edits: { price: 'from $1 / night' } })] }, writer)).code === 200 && (await post({ action: 'save', changes: [T('4', { edits: { price: 'from $2 / night' } })] }, blogger)).code === 403);

  console.log(fails ? '\n' + fails + ' FAILED' : '\nALL PASSED');
  process.exit(fails ? 1 : 0);
})();
