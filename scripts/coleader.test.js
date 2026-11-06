/* Travel Club co-leaders: the main leader invites one, the invitee accepts, the owner approves; only then can the
   co-leader help run the trip. Only the main leader deletes the trip or changes the co-leader, and the reward stays
   with the main leader. Runs the real handlers against an in-memory store.  Run with:  npm run test:coleader */
const Module = require('module');
const store = new Map();
const blob = { put: async (p, b) => { store.set(p, Buffer.from(b)); return {}; }, get: async p => store.has(p) ? { statusCode: 200, stream: new Response(store.get(p)).body } : { statusCode: 404 }, del: async p => { store.delete(p); }, list: async () => ({ blobs: [] }) };
const o = Module._load; Module._load = function (r, ...a) { return r === '@vercel/blob' ? blob : o.call(this, r, ...a); };
Object.assign(process.env, { BLOB_READ_WRITE_TOKEN: 'x', JWT_SECRET: 'test-secret-test-secret-test-secret-12345', OWNER_EMAIL: 'owner@example.com', OWNER_PASSWORD: 'OwnerPass123!', RESEND_API_KEY: 'rk_test', BUSINESS_EMAIL: 'office@example.com' });
const sent = [];
global.fetch = async (url, opts) => { if (String(url).includes('resend.com')) { sent.push(JSON.parse(opts.body)); return { ok: true, status: 200, json: async () => ({ id: 'e' + sent.length }) }; } throw new Error('no network in tests: ' + url); };
const root = require('path').resolve(__dirname, '..') + '/';
const H = { auth: require(root + 'api/_handlers/auth'), trips: require(root + 'api/_handlers/trips') };
let n = 0;
function call(h, method, url, body, token) {
  return new Promise(r => {
    const res = { headers: {}, status(c) { this.code = c; return this; }, json(x) { r({ code: this.code, body: x }); }, end(x) { r({ code: this.code, body: x }); }, setHeader() {} };
    const q = Object.fromEntries(new URL('http://x' + url).searchParams);
    H[h]({ method, url, query: q, headers: { host: 'www.sightseerscaribbean.com', 'x-forwarded-for': '10.0.0.' + (++n % 250), ...(token ? { authorization: 'Bearer ' + token } : {}) }, body: body || {} }, res);
  });
}
let fails = 0; const ok = (name, cond, extra) => { console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); if (!cond) fails++; };
const mailsTo = addr => sent.filter(m => (m.to || []).includes(addr));
const post = (b, t) => call('trips', 'POST', '/api/trips', b, t);

(async () => {
  const owner = (await call('auth', 'POST', '/api/auth', { action: 'signin', email: 'owner@example.com', password: 'OwnerPass123!' })).body.token;
  const signup = async (name, email) => (await call('auth', 'POST', '/api/auth', { action: 'signup', name, email, password: 'Leader12345!' })).body.token;
  const main = await signup('Ann Main', 'ann@example.com'), co = await signup('Cole Co', 'cole@example.com'), other = await signup('Olive Other', 'olive@example.com');
  let r = await post({ action: 'trip-save', title: 'Negril Weekend', slug: 'negril-weekend', status: 'open', summary: 'A weekend in Negril with friends.', dateText: '1 to 3 May 2027', organizerName: 'Ann Main', organizerEmail: 'ann@example.com', showOrganizer: true, reward: 'US$20 per booked traveler', rewardStatus: 'agreed' }, owner);
  ok('the owner sets up a trip led by Ann', r.code === 200, r.body.error);
  const id = r.body.trip.id;

  sent.length = 0;
  r = await post({ action: 'co-invite', id, email: 'cole@example.com', name: 'Cole Co' }, other);
  ok('someone who does not lead the trip cannot invite a co-leader', r.code === 404);
  r = await post({ action: 'co-invite', id, email: 'ann@example.com' }, main);
  ok('the main leader cannot invite themselves', r.code === 400);
  r = await post({ action: 'co-invite', id, email: 'cole@example.com', name: 'Cole Co' }, main);
  ok('the main leader invites a co-leader', r.code === 200 && r.body.coLeader.status === 'invited');
  ok('the invitee is emailed', mailsTo('cole@example.com').length === 1 && /co-lead/i.test(mailsTo('cole@example.com')[0].subject));
  r = await post({ action: 'co-invite', id, email: 'olive@example.com' }, main);
  ok('only one co-leader per trip', r.code === 409);

  r = await call('trips', 'GET', '/api/trips?mine=1', null, co);
  ok('the invitation shows on the invitee\'s dashboard', r.body.coInvites.length === 1 && r.body.coInvites[0].mainLeaderName === 'Ann Main' && !r.body.trips.length);
  r = await post({ action: 'trip-info-save', id, summary: 'Changed by Cole before approval.' }, co);
  ok('an invited person cannot edit the trip', r.code === 404);
  r = await post({ action: 'co-respond', id, accept: true }, other);
  ok('nobody else can accept the invitation', r.code === 404);

  sent.length = 0;
  r = await post({ action: 'co-respond', id, accept: true }, co);
  ok('the invitee accepts', r.code === 200 && r.body.status === 'accepted');
  ok('the owner is asked to approve, and the main leader is told', sent.some(m => !(m.to || []).includes('ann@example.com') && /Co-leader to approve/.test(m.subject)) && mailsTo('ann@example.com').some(m => /accepted/.test(m.subject)));
  r = await post({ action: 'trip-info-save', id, summary: 'Changed by Cole before approval.' }, co);
  ok('an accepted co-leader still cannot edit until the owner approves', r.code === 404);
  r = await call('trips', 'GET', '/api/trips?admin=1', null, owner);
  ok('the owner sees the co-leader waiting', r.body.trips.find(t => t.id === id).coLeader.status === 'accepted');
  r = await post({ action: 'co-review', id, approve: true }, main);
  ok('a leader cannot approve a co-leader', r.code === 401 || r.code === 403);

  sent.length = 0;
  r = await post({ action: 'co-review', id, approve: true }, owner);
  ok('the owner approves the co-leader', r.code === 200 && r.body.coLeader.status === 'approved');
  ok('both leaders are emailed', mailsTo('cole@example.com').some(m => /now co-leading/.test(m.subject)) && mailsTo('ann@example.com').some(m => /co-leader/.test(m.subject)));

  r = await call('trips', 'GET', '/api/trips?mine=1', null, co);
  const ct = r.body.trips.find(t => t.id === id);
  ok('the trip is on the co-leader\'s dashboard as co-leader', ct && ct.role === 'co' && ct.mainLeaderName === 'Ann Main');
  ok('the co-leader does not see the main leader\'s reward or payouts', ct && ct.reward === null && ct.payouts.length === 0 && ct.coLeader === null);
  r = await call('trips', 'GET', '/api/trips?mine=1', null, main);
  const mt = r.body.trips.find(t => t.id === id);
  ok('the main leader still sees the reward and the approved co-leader', mt.role === 'main' && /US\$20/.test(mt.reward.text) && mt.coLeader.status === 'approved' && mt.coLeader.name === 'Cole Co');

  r = await post({ action: 'trip-info-save', id, summary: 'A long weekend in Negril, planned together.' }, co);
  ok('the approved co-leader can edit the trip details', r.code === 200);
  r = await post({ action: 'trip-group-link', id, groupLink: 'https://chat.whatsapp.com/abc123' }, co);
  ok('and add the group link', r.code === 200);
  r = await post({ action: 'trip-delete-mine', id }, co);
  ok('but cannot delete the trip', r.code === 404);
  r = await post({ action: 'co-remove', id }, co);
  ok('and cannot remove themselves as co-leader', r.code === 404);

  r = await call('trips', 'GET', '/api/trips?slug=negril-weekend');
  ok('the public trip page shows both leaders', r.body.trip.organizer.name === 'Ann Main & Cole Co' && r.body.trip.organizer.coName === 'Cole Co');

  sent.length = 0;
  r = await post({ action: 'interest', tripSlug: 'negril-weekend', name: 'Tasha Traveler', email: 'tasha@example.com', consent: true });
  ok('a traveler joins', r.code === 200 || r.code === 201, r.body.error);
  ok('both leaders are told someone joined', mailsTo('ann@example.com').some(m => /New traveler/.test(m.subject)) && mailsTo('cole@example.com').some(m => /New traveler/.test(m.subject)));

  sent.length = 0;
  r = await post({ action: 'co-remove', id }, main);
  ok('the main leader removes the co-leader', r.code === 200 && mailsTo('cole@example.com').length === 1);
  r = await call('trips', 'GET', '/api/trips?mine=1', null, co);
  ok('the trip leaves the former co-leader\'s dashboard', !r.body.trips.some(t => t.id === id));
  r = await post({ action: 'trip-info-save', id, summary: 'Cole tries again after removal.' }, co);
  ok('and they can no longer edit it', r.code === 404);

  r = await post({ action: 'co-invite', id, email: 'olive@example.com', name: 'Olive Other' }, main);
  sent.length = 0;
  r = await post({ action: 'co-respond', id, accept: false }, other);
  ok('an invitee can decline, and the main leader is told', r.code === 200 && r.body.status === 'declined' && mailsTo('ann@example.com').some(m => /declined/.test(m.subject)));
  r = await post({ action: 'co-invite', id, email: 'cole@example.com', name: 'Cole Co' }, main);
  ok('after a decline the main leader can invite someone else', r.code === 200);
  await post({ action: 'co-respond', id, accept: true }, co);
  r = await post({ action: 'co-review', id, approve: false, reply: 'We need to speak with you first.' }, owner);
  ok('the owner can decline a co-leader, who then has no access', r.code === 200 && r.body.coLeader.status === 'rejected' && (await post({ action: 'trip-info-save', id, summary: 'Cole after decline.' }, co)).code === 404);

  // sponsors: a list on the trip, added like days
  const base = { action: 'trip-save', id, title: 'Negril Weekend', slug: 'negril-weekend', status: 'open', summary: 'A long weekend in Negril, planned together.', dateText: '1 to 3 May 2027', organizerName: 'Ann Main', organizerEmail: 'ann@example.com', showOrganizer: true };
  r = await post(Object.assign({}, base, { sponsors: [{ name: 'Legend Lager', url: 'http://not-secure.example' }] }), owner);
  ok('a sponsor link must be https', r.code === 400);
  r = await post(Object.assign({}, base, { sponsors: [{ url: 'https://wisynco.com/' }] }), owner);
  ok('a sponsor needs a name', r.code === 400);
  r = await post(Object.assign({}, base, { sponsors: [{ name: 'Legend Lager (Wisynco Group)', url: 'https://wisynco.com/', logo: '/logos/legend.png', note: 'Drinks on the yacht day' }, { name: '', url: '', logo: '', note: '' }, { name: 'Second Sponsor', url: 'https://example.com/' }] }), owner);
  ok('the owner adds two sponsors (an empty row is ignored)', r.code === 200 && r.body.trip.sponsors.length === 2, r.body.error);
  r = await call('trips', 'GET', '/api/trips?slug=negril-weekend');
  ok('the public trip shows both sponsors with logo, link and line', r.body.trip.sponsors.length === 2 && r.body.trip.sponsors[0].logo === '/logos/legend.png' && r.body.trip.sponsors[0].note === 'Drinks on the yacht day');
  r = await call('trips', 'GET', '/api/trips?mine=1', null, main);
  ok('the leader sees the sponsors on their dashboard', r.body.trips.find(t => t.id === id).sponsors.length === 2);
  r = await post(Object.assign({}, base), owner);
  r = await call('trips', 'GET', '/api/trips?slug=negril-weekend');
  ok('saving the trip without the sponsor list keeps the sponsors', r.body.trip.sponsors.length === 2);
  r = await post(Object.assign({}, base, { sponsors: Array.from({ length: 9 }, (x, i) => ({ name: 'S' + i })) }), owner);
  ok('at most six sponsors are kept', r.code === 200 && r.body.trip.sponsors.length === 6);

  // photos: an uploaded photo (served from the private store) is kept, and a trip can hold a photo section
  const up = '/api/images?file=tours/0f8d5c2a-1b2c-4d3e-8f9a-0123456789ab.jpg';
  r = await post(Object.assign({}, base, { image: up }), owner);
  ok('a trip photo uploaded through the admin portal is kept when the trip is saved', r.code === 200 && r.body.trip.image === up, r.body.trip && r.body.trip.image);
  r = await post(Object.assign({}, base, { gallery: [{ url: up, alt: 'Pool party' }, { url: '', alt: '' }, { url: '/assets/tours/dunns-river-falls-and-blue-hole-tour.jpg', alt: 'Falls' }] }), owner);
  ok('the owner adds photos to the trip page (an empty row is ignored)', r.code === 200 && r.body.trip.gallery.length === 2, r.body.error);
  r = await post(Object.assign({}, base, { gallery: [{ url: 'javascript:alert(1)' }] }), owner);
  ok('a photo that is not from the library or an https link is refused', r.code === 400);
  r = await call('trips', 'GET', '/api/trips?slug=negril-weekend');
  ok('the public trip shows the photos with their descriptions', r.body.trip.gallery.length === 2 && r.body.trip.gallery[0].alt === 'Pool party');
  r = await post(Object.assign({}, base, { gallery: Array.from({ length: 15 }, () => ({ url: up })) }), owner);
  ok('at most twelve photos are kept', r.code === 200 && r.body.trip.gallery.length === 12);

  // leaders upload and change trip photos themselves
  const jpeg = 'data:image/jpeg;base64,' + Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(200, 1)]).toString('base64');
  r = await post({ action: 'trip-photo-upload', id, data: jpeg }, other);
  ok('someone who does not lead the trip cannot upload photos to it', r.code === 404);
  r = await post({ action: 'trip-photo-upload', id, data: 'data:image/jpeg;base64,' + Buffer.from('<script>not a photo</script>').toString('base64') }, main);
  ok('a file that is not really a photo is refused', r.code === 400);
  r = await post({ action: 'trip-photo-upload', id, data: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=' }, main);
  ok('only JPG, PNG and WebP are accepted', r.code === 400);
  r = await post({ action: 'trip-photo-upload', id, data: jpeg }, main);
  ok('the leader uploads a photo', r.code === 200 && /^\/api\/images\?file=tours\//.test(r.body.url), JSON.stringify(r.body));
  const mine = r.body.url;
  sent.length = 0;
  r = await post({ action: 'trip-photos-save', id, image: mine, gallery: [{ url: mine, alt: 'Our villa' }] }, main);
  ok('the leader sets the banner photo and the photo section', r.code === 200 && r.body.image === mine && r.body.gallery.length === 1);
  ok('the owner is told the leader changed the photos', sent.some(m => /updated trip photos/.test(m.subject)));
  r = await call('trips', 'GET', '/api/trips?slug=negril-weekend');
  ok('the trip page shows the leader\'s photos at once', r.body.trip.image === mine && r.body.trip.gallery[0].alt === 'Our villa');
  r = await post({ action: 'trip-photos-save', id, image: '', gallery: [] }, other);
  ok('someone who does not lead the trip cannot change its photos', r.code === 404);

  console.log(fails ? '\n' + fails + ' FAILED' : '\nALL PASSED');
  process.exit(fails ? 1 : 0);
})();
