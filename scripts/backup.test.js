/* Backups, restore, the enquiries export and the site check (owner only). Runs the real handlers against an in-memory store.
   Run with:  npm run test:backup */
const Module = require('module');
const store = new Map();       // pathname -> { body, at }
let tick = 0;
const URLBASE = 'https://blob.test/';
const blob = {
  put: async (p, b, o) => { if (o && o.allowOverwrite === false && store.has(p)) throw new Error('exists'); store.set(p, { body: Buffer.from(b), at: new Date(Date.UTC(2026, 9, 1, 0, 0, ++tick)).toISOString(), access: o && o.access, type: o && o.contentType }); return { url: URLBASE + p, pathname: p, downloadUrl: URLBASE + p }; },
  get: async p => store.has(p) ? { statusCode: 200, stream: new Response(store.get(p).body).body } : { statusCode: 404 },
  del: async url => { const p = String(url).replace(URLBASE, ''); store.delete(p); },
  list: async ({ prefix }) => ({ blobs: [...store.keys()].filter(k => k.startsWith(prefix || '')).map(k => ({ url: URLBASE + k, pathname: k, size: store.get(k).body.length, uploadedAt: store.get(k).at })) })
};
const o = Module._load; Module._load = function (r, ...a) { return r === '@vercel/blob' ? blob : o.call(this, r, ...a); };
process.env.BLOB_READ_WRITE_TOKEN = 'x'; process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-12345';
process.env.OWNER_EMAIL = 'owner@example.com'; process.env.OWNER_PASSWORD = 'OwnerPass123!';
delete process.env.ADMIN_PASSCODE; delete process.env.RESEND_API_KEY;
const root = require('path').resolve(__dirname, '..') + '/';
const H = { auth: require(root + 'api/_handlers/auth'), edit: require(root + 'api/_handlers/site-edit'), settings: require(root + 'api/_handlers/settings'), backup: require(root + 'api/_handlers/backup') };
const db = require(root + 'api/_lib/db');
function call(h, method, url, body, token, query) {
  return new Promise(r => {
    const res = { headers: {}, status(c) { this.code = c; return this; }, json(x) { r({ code: this.code, body: x }); }, end(x) { r({ code: this.code, body: x, headers: this.headers }); }, send(x) { r({ code: this.code, body: x, headers: this.headers }); }, setHeader(k, v) { this.headers[k] = v; } };
    H[h]({ method, url, headers: { host: 'www.sightseerscaribbean.com', 'x-forwarded-for': '9.9.9.9', ...(token ? { authorization: 'Bearer ' + token } : {}) }, body: body || {}, query: query || {} }, res);
  });
}
const post = (b, t) => call('backup', 'POST', '/api/backup', b, t);
const get = (q, t) => call('backup', 'GET', '/api/backup', {}, t, q);
const live = async () => (await call('settings', 'GET', '/api/settings')).body;
const edit = (changes, t) => call('edit', 'POST', '/api/site-edit', { action: 'save', changes }, t);
let fails = 0; const ok = (name, cond, extra) => { console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); if (!cond) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/pLvAAAAAElFTkSuQmCC';

(async () => {
  let r = await call('auth', 'POST', '/api/auth', { action: 'signin', email: 'owner@example.com', password: 'OwnerPass123!' }); const owner = r.body.token;
  async function member(name, email, preset) {
    let x = await call('auth', 'POST', '/api/auth', { action: 'team-invite', name, email, preset, needsApproval: false }, owner);
    const code = new URL(x.body.link).searchParams.get('code');
    x = await call('auth', 'POST', '/api/auth', { action: 'reset-password', email, code, newPassword: 'Member12345!' });
    return x.body.token;
  }
  const writer = await member('Wanda Writer', 'wanda@example.com', 'content');

  // --- only the owner
  ok('a visitor cannot use backups', (await get({ action: 'check' })).code === 401);
  ok('a team member cannot use backups, even a content editor', (await get({ action: 'check' }, writer)).code === 403 && (await post({ action: 'save' }, writer)).code === 403);

  // --- some live content: a catalog change, a changed wording and a photo stored inside the settings
  r = await edit([{ id: '@c', list: 'yachts', key: 'Sunset Private Charter', value: { edits: { price: 'Starting from $400 USD' } }, label: 'Yacht: Sunset' }], owner);
  ok('the owner saves a yacht price', r.code === 200 && r.body.live === true);
  await call('settings', 'POST', '/api/settings', { batch: { ss_site_settings: { brandName: 'Sight Seers', heroImg2: 'data:image/png;base64,' + PNG, aboutImage: '/assets/about.jpg' } } }, owner);
  await db.setCollection('contact-messages', [{ id: 'c1', name: '=HYPERLINK("http://evil.example","x")', email: 'a@example.com', subject: 'Hello', message: 'Line one\nLine, two "quoted"', createdAt: '2026-10-01T10:00:00Z' }]);
  await db.setCollection('blog-posts', [{ id: 'b1', title: 'A post' }]);

  // --- the site check
  r = await get({ action: 'check' }, owner);
  const flat = JSON.stringify(r.body);
  ok('the check reports the size of the settings and the photo stored inside them', r.code === 200 && r.body.settings.bytes > 100 && r.body.inlinePhotos.length === 1 && r.body.inlinePhotos[0].where === 'Home hero photo 2');
  ok('the check says what is set up without giving any value', r.body.setup.storage === true && r.body.setup.signin === true && r.body.setup.email === false && r.body.setup.oldPasscode === false && !/test-secret|OwnerPass123/.test(flat));
  process.env.ADMIN_PASSCODE = 'left-over'; r = await get({ action: 'check' }, owner); delete process.env.ADMIN_PASSCODE;
  ok('the check warns when an old passcode is still set, and does not show it', r.body.setup.oldPasscode === true && !/left-over/.test(JSON.stringify(r.body)));

  // --- a backup kept on the website storage
  r = await post({ action: 'save' }, owner);
  ok('the owner saves a backup', r.code === 200 && r.body.backup.kind === 'manual' && r.body.backups.length === 1);
  const first = r.body.backup.name;
  ok('it is stored privately', store.get('ss-admin/backups/' + first).access === 'private');
  r = await get({ action: 'download', name: first }, owner);
  ok('it can be downloaded, and holds the content but no accounts', r.code === 200 && r.body.backup.format === 'sightseers-backup' && r.body.backup.settings.ss_catalog_v1.yachts.edits['Sunset Private Charter'].price === 'Starting from $400 USD' && !/passwordHash|users|OwnerPass|test-secret/.test(JSON.stringify(r.body)));
  ok('a made-up backup name is not accepted', (await get({ action: 'download', name: '../../ss-data/users.json' }, owner)).code === 404);

  // --- restore
  await wait(3);
  await edit([{ id: '@c', list: 'yachts', key: 'Sunset Private Charter', value: { edits: { price: 'Starting from $999 USD' } }, label: 'Yacht: Sunset' }], owner);
  ok('the live price is now the newer one', (await live()).ss_catalog_v1.yachts.edits['Sunset Private Charter'].price === 'Starting from $999 USD');
  r = await post({ action: 'restore', name: first }, owner);
  ok('restoring a saved backup puts the older content back', r.code === 200 && r.body.restored.includes('ss_catalog_v1') && (await live()).ss_catalog_v1.yachts.edits['Sunset Private Charter'].price === 'Starting from $400 USD');
  ok('and saves what was live as a backup of its own first', r.body.safety.kind === 'before-restore' && r.body.backups.some(b => b.name === r.body.safety.name));
  await wait(3);
  r = await post({ action: 'restore', name: r.body.safety.name }, owner);
  ok('a restore can be undone by restoring that backup', r.code === 200 && (await live()).ss_catalog_v1.yachts.edits['Sunset Private Charter'].price === 'Starting from $999 USD');
  ok('the content that was not in the way is untouched', (await live()).ss_site_settings.brandName === 'Sight Seers');

  // --- restoring a file
  const good = { format: 'sightseers-backup', version: 1, settings: { ss_site_settings: { brandName: 'From a file' } } };
  ok('a file that is not a backup is refused', (await post({ action: 'restore', backup: { hello: 'world' } }, owner)).code === 400);
  ok('a file for another version is refused', (await post({ action: 'restore', backup: Object.assign({}, good, { version: 7 }) }, owner)).code === 400);
  ok('a file with a script address is refused', (await post({ action: 'restore', backup: { format: 'sightseers-backup', version: 1, settings: { ss_site_settings: { heroImg1: 'javascript:alert(1)' } } } }, owner)).code === 400);
  ok('a file with an invalid catalog change is refused', (await post({ action: 'restore', backup: { format: 'sightseers-backup', version: 1, settings: { ss_catalog_v1: { yachts: { edits: { 'Sunset Private Charter': { name: '' } } } } } } }, owner)).code === 400);
  ok('a file with a wording change that is not text is refused', (await post({ action: 'restore', backup: { format: 'sightseers-backup', version: 1, settings: { ss_text_edits_v1: { home: { 'Hello': { x: 1 } } } } } }, owner)).code === 400);
  ok('a file with nothing to restore is refused', (await post({ action: 'restore', backup: { format: 'sightseers-backup', version: 1, settings: { users: [] } } }, owner)).code === 400);
  const before = await live();
  r = await post({ action: 'restore', backup: good }, owner);
  const after = await live();
  ok('a good file puts back only what it holds', r.code === 200 && r.body.restored.length === 1 && after.ss_site_settings.brandName === 'From a file' && JSON.stringify(after.ss_catalog_v1) === JSON.stringify(before.ss_catalog_v1));
  ok('accounts can never be restored from a file', !('users' in after) && (await call('auth', 'POST', '/api/auth', { action: 'signin', email: 'owner@example.com', password: 'OwnerPass123!' })).code === 200);

  // --- making the site lighter
  await call('settings', 'POST', '/api/settings', { batch: { ss_site_settings: { brandName: 'Sight Seers', heroImg2: 'data:image/png;base64,' + PNG, aboutImage: '/assets/about.jpg' } } }, owner);
  await wait(3);
  r = await post({ action: 'lighten' }, owner);
  const lit = await live();
  ok('the photo stored inside the settings moves to a file of its own', r.code === 200 && r.body.moved === 1 && /^https:\/\/blob\.test\/site-images\/.+\.png$/.test(lit.ss_site_settings.heroImg2) && lit.ss_site_settings.aboutImage === '/assets/about.jpg' && lit.ss_site_settings.brandName === 'Sight Seers');
  const moved = store.get(lit.ss_site_settings.heroImg2.replace(URLBASE, ''));
  ok('the file is the same picture and is public', !!moved && moved.body.toString('base64') === PNG && moved.access === 'public');
  ok('a backup was kept first, and the check finds nothing left to move', r.body.safety.kind === 'before-lighten' && (await get({ action: 'check' }, owner)).body.inlinePhotos.length === 0);
  r = await post({ action: 'lighten' }, owner);
  ok('doing it again changes nothing', r.code === 200 && r.body.moved === 0);

  // --- exports
  r = await get({ action: 'export-content' }, owner);
  ok('the content export holds the settings and the content collections, and no accounts', r.code === 200 && r.body.backup.settings.ss_catalog_v1 && r.body.backup.collections['blog-posts'].length === 1 && !('users' in r.body.backup.collections) && !/passwordHash|test-secret/.test(JSON.stringify(r.body)));
  r = await get({ action: 'export-enquiries' }, owner);
  const lines = r.body.csv.replace(/^﻿/, '').split('\r\n');
  ok('the enquiries export is a spreadsheet with a header row and one row per enquiry', r.code === 200 && r.body.count === 1 && /^"Received","Type","Title","Name","Email"/.test(lines[0]) && lines.length === 3);
  ok('a name that looks like a formula is made harmless, and quotes and line breaks survive', /"'=HYPERLINK\(""http:\/\/evil\.example"",""x""\)"/.test(lines[1]) && /Line one Line, two ""quoted""/.test(lines[1]));
  ok('only the owner can export', (await get({ action: 'export-enquiries' }, writer)).code === 403 && (await get({ action: 'export-content' })).code === 401);

  // --- only the newest twelve are kept
  for (let i = 0; i < 14; i++) { await wait(3); await post({ action: 'save' }, owner); }
  r = await get({ action: 'list' }, owner);
  ok('only the newest twelve backups are kept', r.body.backups.length === 12 && [...store.keys()].filter(k => k.startsWith('ss-admin/backups/')).length === 12);
  ok('the newest comes first', r.body.backups.every((b, i, a) => !i || String(a[i - 1].at) >= String(b.at)));

  console.log(fails ? '\n' + fails + ' FAILED' : '\nALL PASSED');
  process.exit(fails ? 1 : 0);
})();
