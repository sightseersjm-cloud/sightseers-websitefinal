/* Page editing: publish, approval, history and restore, previews. Runs the real handlers against an in-memory store.
   Run with:  npm run test:site   (needs no network and no environment variables) */
const Module = require('module');
const store = new Map();
const blob = { put: async (p, b) => { store.set(p, Buffer.from(b)); return {}; }, get: async p => store.has(p) ? { statusCode: 200, stream: new Response(store.get(p)).body } : { statusCode: 404 }, del: async p => { store.delete(p); }, list: async () => ({ blobs: [] }) };
const o = Module._load; Module._load = function (r, ...a) { return r === '@vercel/blob' ? blob : o.call(this, r, ...a); };
process.env.BLOB_READ_WRITE_TOKEN = 'x'; process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-12345'; process.env.ADMIN_PASSCODE = 'TestCode123!';
process.env.OWNER_EMAIL = 'owner@example.com'; process.env.OWNER_PASSWORD = 'OwnerPass123!';
const root = require('path').resolve(__dirname, '..') + '/';
const H = { auth: require(root + 'api/_handlers/auth'), edit: require(root + 'api/_handlers/site-edit'), settings: require(root + 'api/_handlers/settings') };
function call(h, method, url, body, token, query) {
  return new Promise(r => {
    const res = { headers: {}, status(c) { this.code = c; return this; }, json(x) { r({ code: this.code, body: x }); }, end(x) { r({ code: this.code, body: x }); }, setHeader() {} };
    H[h]({ method, url, headers: { host: 'www.sightseerscaribbean.com', 'x-forwarded-for': '9.9.9.9', ...(token ? { authorization: 'Bearer ' + token } : {}) }, body: body || {}, query: query || {} }, res);
  });
}
const post = (b, t) => call('edit', 'POST', '/api/site-edit', b, t);
const get = (q, t) => call('edit', 'GET', '/api/site-edit', {}, t, q);
const live = async () => (await call('settings', 'GET', '/api/settings')).body;
let fails = 0; const ok = (name, cond, extra) => { console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); if (!cond) fails++; };

(async () => {
  let r = await call('auth', 'POST', '/api/auth', { action: 'signin', email: 'owner@example.com', password: 'OwnerPass123!' }); const owner = r.body.token;
  async function member(name, email, preset, needsApproval) {
    let x = await call('auth', 'POST', '/api/auth', { action: 'team-invite', name, email, preset, needsApproval }, owner);
    const code = new URL(x.body.link).searchParams.get('code');
    x = await call('auth', 'POST', '/api/auth', { action: 'reset-password', email, code, newPassword: 'Member12345!' });
    return x.body.token;
  }
  const writer = await member('Wanda Writer', 'wanda@example.com', 'content');          // default: changes need approval
  const trusted = await member('Tom Trusted', 'tom@example.com', 'content', false);      // may publish straight away
  const nobody = await member('Ines Inbox', 'ines@example.com', 'inbox');                // no page access at all
  const team = (await call('auth', 'POST', '/api/auth', { action: 'team-list' }, owner)).body.team;
  ok('a new team member needs approval by default', team.find(t => t.email === 'wanda@example.com').needsApproval === true);
  ok('the owner can trust someone to publish', team.find(t => t.email === 'tom@example.com').needsApproval === false);

  // --- the owner publishes straight away
  r = await post({ action: 'save', changes: [{ id: 'adminHeroTitle', kind: 'text', value: 'Travel Beautifully', label: 'Hero title', page: 'home', before: 'Old title' }] }, owner);
  ok('owner change goes live', r.code === 200 && r.body.live === true, JSON.stringify(r.body));
  let s = await live();
  ok('it lands in the home settings the site reads (heroTitle)', s.ss_site_settings && s.ss_site_settings.heroTitle === 'Travel Beautifully');
  r = await post({ action: 'save', changes: [{ id: 'adminToursTitle', kind: 'text', value: 'Our tours', label: 'Tours title', page: 'tours', before: 'Tours' }] }, owner);
  s = await live();
  ok('page wording lands in the page-editor settings', s.ss_page_editor_settings.adminToursTitle === 'Our tours');
  r = await post({ action: 'save', changes: [{ id: 'adminToursTitle', kind: 'text', value: 'Our tours', label: 'Tours title', page: 'tours' }] }, owner);
  ok('saving the same thing again changes nothing', r.body.unchanged === true);

  // --- checks on what may be saved
  ok('empty wording is refused', (await post({ action: 'save', changes: [{ id: 'adminToursTitle', value: '   ' }] }, owner)).code === 400);
  ok('an unknown field is refused', (await post({ action: 'save', changes: [{ id: 'evil', value: 'x' }] }, owner)).code === 400);
  ok('a script address is refused for a photo', (await post({ action: 'save', changes: [{ id: 'adminAboutImage', kind: 'image', value: 'javascript:alert(1)' }] }, owner)).code === 400);
  ok('a quote cannot be smuggled into a photo address', (await post({ action: 'save', changes: [{ id: 'adminAboutImage', kind: 'image', value: "https://x.com/a.jpg');alert(1);('" }] }, owner)).code === 400);
  ok('a normal https photo is accepted', (await post({ action: 'save', changes: [{ id: 'adminAboutImage', kind: 'image', value: 'https://example.com/a.jpg', label: 'About photo', page: 'home', before: '/old.jpg' }] }, owner)).body.live === true);
  s = await live(); ok('home photo is stored under aboutImage', s.ss_site_settings.aboutImage === 'https://example.com/a.jpg');
  ok('a bad focus point is refused', (await post({ action: 'save', changes: [{ id: 'adminAboutImage__focus', value: 'left top' }] }, owner)).code === 400);
  ok('a focus point and photo description are stored', (await post({ action: 'save', changes: [{ id: 'adminAboutImage__focus', value: '30% 20%' }, { id: 'adminAboutImage__alt', value: 'Guests laughing on the beach' }] }, owner)).body.live === true);
  s = await live(); ok('they sit next to the photo', s.ss_site_settings.aboutImage__focus === '30% 20%' && s.ss_site_settings.aboutImage__alt === 'Guests laughing on the beach');

  // --- people without page access
  ok('inbox-only person cannot save', (await post({ action: 'save', changes: [{ id: 'adminToursTitle', value: 'x' }] }, nobody)).code === 403);
  ok('inbox-only person cannot read history', (await get({ view: 'history' }, nobody)).code === 403);
  ok('signed-out visitor cannot save', (await post({ action: 'save', changes: [{ id: 'adminToursTitle', value: 'x' }] })).code === 401);

  // --- approval: a writer's change waits
  r = await post({ action: 'save', note: 'Fresh wording for the tours page', changes: [{ id: 'adminToursTitle', kind: 'text', value: 'Island tours for everyone', label: 'Tours title', page: 'tours', before: 'Our tours' }] }, writer);
  ok('a writer’s change is held for approval', r.code === 200 && r.body.live === false && !!r.body.draftId, JSON.stringify(r.body));
  const draftId = r.body.draftId;
  s = await live(); ok('…and is NOT on the live site', s.ss_page_editor_settings.adminToursTitle === 'Our tours');
  r = await get({ view: 'drafts' }, owner); ok('each waiting change shows what is live right now', r.body.pending[0].changes[0].now === 'Our tours', JSON.stringify(r.body.pending[0].changes[0].now));
  r = await get({ view: 'drafts' }, owner); ok('owner sees it waiting', r.body.pending.length === 1 && r.body.canApprove === true && r.body.pending[0].by.name === 'Wanda Writer');
  r = await get({ view: 'drafts' }, writer); ok('the writer sees only their own', r.body.pending.length === 1 && r.body.canApprove === false);
  r = await get({ view: 'drafts' }, trusted); ok('another editor sees none of it', r.body.pending.length === 0);
  ok('a writer cannot approve their own change', (await post({ action: 'draft-approve', id: draftId }, writer)).code === 403);
  ok('a trusted publisher cannot approve either (owner only)', (await post({ action: 'draft-approve', id: draftId }, trusted)).code === 403);

  // --- preview link
  r = await post({ action: 'preview-link', id: draftId }, writer); ok('the writer can get a preview link', r.code === 200 && !!r.body.token && r.body.page === 'tours');
  const token = r.body.token;
  r = await get({ view: 'preview', token }); ok('the link works without signing in and shows the waiting wording', r.code === 200 && r.body.changes[0].after === 'Island tours for everyone');
  ok('a tampered link is refused', (await get({ view: 'preview', token: token.slice(0, -3) + 'abc' })).code === 404);
  ok('a trusted editor cannot make a link for someone else’s draft', (await post({ action: 'preview-link', id: draftId }, trusted)).code === 404);

  // --- approve
  r = await post({ action: 'draft-approve', id: draftId }, owner); ok('owner approves', r.code === 200 && r.body.live === true, JSON.stringify(r.body));
  s = await live(); ok('now it is live', s.ss_page_editor_settings.adminToursTitle === 'Island tours for everyone');
  ok('deciding twice is refused', (await post({ action: 'draft-approve', id: draftId }, owner)).code === 409);
  ok('the preview link stops working once decided', (await get({ view: 'preview', token })).code === 404);

  // --- reject
  r = await post({ action: 'save', changes: [{ id: 'adminToursSub', kind: 'text', value: 'Rejected wording', label: 'Tours intro', page: 'tours', before: 'Intro' }] }, writer);
  r = await post({ action: 'draft-reject', id: r.body.draftId, reason: 'Please keep it shorter' }, owner); ok('owner rejects with a reason', r.code === 200);
  s = await live(); ok('a rejected change never goes live', !(s.ss_page_editor_settings || {}).adminToursSub);
  r = await get({ view: 'drafts' }, writer); ok('the writer can see it was rejected, and why', r.body.decided[0].status === 'rejected' && r.body.decided[0].reason === 'Please keep it shorter');

  // --- withdraw
  r = await post({ action: 'save', changes: [{ id: 'adminToursSub', kind: 'text', value: 'Changed my mind', label: 'Tours intro', page: 'tours' }] }, writer);
  ok('another person cannot withdraw it', (await post({ action: 'draft-withdraw', id: r.body.draftId }, trusted)).code === 404);
  ok('the author can withdraw it', (await post({ action: 'draft-withdraw', id: r.body.draftId }, writer)).code === 200);

  // --- a trusted editor publishes straight away
  r = await post({ action: 'save', changes: [{ id: 'adminToursSub', kind: 'text', value: 'Trusted wording', label: 'Tours intro', page: 'tours', before: 'Intro' }] }, trusted);
  ok('a trusted editor’s change goes live at once', r.body.live === true);

  // --- history and restore
  r = await get({ view: 'history', field: 'adminToursTitle' }, owner);
  ok('history lists changes newest first with who made them', r.body.history.length === 2 && r.body.history[0].after === 'Island tours for everyone' && r.body.history[0].by.name === 'Wanda Writer' && r.body.history[0].approvedBy.name, JSON.stringify(r.body.history.map(h => h.after)));
  const last = r.body.history[0];
  r = await post({ action: 'restore', id: last.id }, owner); ok('owner puts the earlier wording back', r.body.live === true);
  s = await live(); ok('the earlier wording is live again', s.ss_page_editor_settings.adminToursTitle === 'Our tours');
  r = await get({ view: 'history', field: 'adminToursTitle' }, owner); ok('the restore is itself in the history', r.body.history[0].via === 'restore');
  await post({ action: 'save', changes: [{ id: 'adminToursTitle', kind: 'text', value: 'Another wording', label: 'Tours title', page: 'tours' }] }, owner);
  r = await post({ action: 'restore', id: last.id }, writer); ok('a writer’s restore waits for approval like any change', r.body.live === false, JSON.stringify(r.body));
  // the first ever change had no saved earlier version but the browser told us the default, so it can be put back
  const firstHist = (await get({ view: 'history', field: 'adminHeroTitle' }, owner)).body.history[0];
  r = await post({ action: 'restore', id: firstHist.id }, owner); s = await live();
  ok('the first-ever change can be put back using the original the browser knew', r.body.live === true && s.ss_site_settings.heroTitle === 'Old title');

  // --- a whole save restored together
  r = await post({ action: 'save', changes: [{ id: 'adminHeroSub', kind: 'text', value: 'New hero line', label: 'Hero subtitle', page: 'home', before: 'Orig sub' }, { id: 'adminHeroEm', kind: 'text', value: 'New em', label: 'Hero line 2', page: 'home', before: 'Orig em' }] }, owner);
  const grp = (await get({ view: 'history', field: 'adminHeroSub' }, owner)).body.history[0].group;
  r = await post({ action: 'restore', group: grp }, owner); s = await live();
  ok('everything one save changed can be put back together', s.ss_site_settings.heroSub === 'Orig sub' && s.ss_site_settings.heroEm === 'Orig em');

  // --- added sections
  r = await post({ action: 'save', changes: [{ id: '@sections', value: [{ page: 'about', type: 'text', title: 'Why us', entries: 'Safe | Always\nLocal | Always', eyebrow: 'Hello' }] }] }, owner);
  s = await live(); ok('an added section is stored for its page', r.body.live === true && s.ss_dynamic_sections_v1.length === 1 && s.ss_dynamic_sections_v1[0].page === 'about');
  ok('a section photo must be a safe address', (await post({ action: 'save', changes: [{ id: '@sections', value: [{ page: 'home', type: 'banner', title: 'x', image: 'javascript:1' }] }] }, owner)).code === 400);
  r = await post({ action: 'save', changes: [{ id: '@sections', value: [{ page: 'nowhere', type: 'weird', title: 'Odd', entries: 'a|b', script: '<script>' }] }] }, owner);
  s = await live(); ok('unknown page and style are tidied, extra fields dropped', s.ss_dynamic_sections_v1[0].page === 'home' && s.ss_dynamic_sections_v1[0].type === 'text' && !('script' in s.ss_dynamic_sections_v1[0]));
  r = await get({ view: 'history', field: '@sections' }, owner); ok('the history of sections shows counts, not the whole list', r.body.history[0].count === true && typeof r.body.history[0].after === 'number');
  r = await post({ action: 'restore', id: r.body.history[0].id }, owner); s = await live(); ok('earlier sections can be put back', s.ss_dynamic_sections_v1.length === 1 && s.ss_dynamic_sections_v1[0].title === 'Why us');

  r = await post({ action: 'save', changes: [{ id: '@sections', value: [{ page: 'home', type: 'cards', title: 'Links', entries: 'https://x.com/a.jpg | Ok | text | Go | javascript:alert(1)\n/b.jpg | Two | text | Go | https://example.com' }] }] }, owner);
  s = await live(); ok('a script link inside a section is neutralised', !/javascript:/i.test(s.ss_dynamic_sections_v1[0].entries) && s.ss_dynamic_sections_v1[0].entries.includes('https://example.com'));

  // --- the old passcode can no longer publish through the new system
  r = await call('auth', 'POST', '/api/auth', { action: 'passcode', passcode: 'TestCode123!' }); const pass = r.body.token;
  r = await post({ action: 'save', changes: [{ id: 'adminToursSub', value: 'Passcode wording', label: 'x', page: 'tours' }] }, pass);
  ok('the old shared passcode can only send changes for approval', r.code === 200 && r.body.live === false);

  console.log(fails ? '\n' + fails + ' FAILED' : '\nALL PASSED');
  process.exit(fails ? 1 : 0);
})();
