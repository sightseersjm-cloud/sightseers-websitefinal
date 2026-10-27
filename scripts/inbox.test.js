/* Enquiries and bookings inbox: assign, notes, replies, who may do what. Runs the real handlers against an in-memory store.
   Run with:  npm run test:inbox   (needs no network and no environment variables) */
const Module = require('module');
const store = new Map();
const blob = { put: async (p, b) => { store.set(p, Buffer.from(b)); return {}; }, get: async p => store.has(p) ? { statusCode: 200, stream: new Response(store.get(p)).body } : { statusCode: 404 }, del: async p => { store.delete(p); }, list: async () => ({ blobs: [] }) };
const o = Module._load; Module._load = function (r, ...a) { return r === '@vercel/blob' ? blob : o.call(this, r, ...a); };
process.env.BLOB_READ_WRITE_TOKEN = 'x'; process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-12345'; process.env.OWNER_EMAIL = 'owner@example.com'; process.env.OWNER_PASSWORD = 'OwnerPass123!'; process.env.RESEND_API_KEY = 'rk_test'; process.env.BUSINESS_EMAIL = 'office@example.com';
const sent = []; let mailOk = true;
global.fetch = async (url, opts) => { if (String(url).includes('resend.com')) { const b = JSON.parse(opts.body); sent.push(b); return { ok: mailOk, status: mailOk ? 200 : 422, json: async () => (mailOk ? { id: 'e' + sent.length } : { message: 'bad' }) }; } throw new Error('unexpected fetch ' + url); };
const root = require('path').resolve(__dirname, '..') + '/';
const H = { auth: require(root + 'api/_handlers/auth'), inbox: require(root + 'api/_handlers/inbox'), contact: require(root + 'api/_handlers/contact') };
function call(h, method, url, body, token, query) {
  return new Promise(r => {
    const res = { headers: {}, status(c) { this.code = c; return this; }, json(x) { r({ code: this.code, body: x }); }, end(x) { r({ code: this.code, body: x }); }, setHeader() {} };
    H[h]({ method, url, headers: { host: 'www.sightseerscaribbean.com', 'x-forwarded-for': '9.9.9.9', ...(token ? { authorization: 'Bearer ' + token } : {}) }, body: body || {}, query: query || {} }, res);
  });
}
const post = (b, t) => call('inbox', 'POST', '/api/inbox', b, t);
let fails = 0; const ok = (name, cond, extra) => { console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); if (!cond) fails++; };

(async () => {
  let r = await call('auth', 'POST', '/api/auth', { action: 'signin', email: 'owner@example.com', password: 'OwnerPass123!' }); const owner = r.body.token;
  async function member(name, email, preset) {
    let x = await call('auth', 'POST', '/api/auth', { action: 'team-invite', name, email, preset }, owner);
    const code = new URL(x.body.link).searchParams.get('code');
    x = await call('auth', 'POST', '/api/auth', { action: 'reset-password', email, code, newPassword: 'Member12345!' });
    return { token: x.body.token, id: x.body.user.id };
  }
  const helper = await member('Ines Inbox', 'ines@example.com', 'inbox');
  const writer = await member('Wanda Writer', 'wanda@example.com', 'content');
  const blogger = await member('Bo Blog', 'bo@example.com', 'blog');

  // a customer writes through the website form
  await call('contact', 'POST', '/api/contact', { action: 'send', name: 'Tasha Brown', email: 'tasha@example.com', phone: '+1 555 0100', subject: 'Group trip to Negril', message: 'We are 12 friends and want a boat day.' });
  r = await call('inbox', 'GET', '/api/inbox', {}, owner);
  ok('the request is in the inbox with a team list to hand it to', r.body.items.length === 1 && r.body.items[0].status === 'new' && r.body.team.length === 2, JSON.stringify(r.body.team.map(t => t.name)));
  const item = r.body.items[0], src = item.source, id = item.id;
  ok('only people who may work the inbox can be given requests', !r.body.team.some(t => t.name === 'Wanda Writer') && r.body.team.some(t => t.name === 'Ines Inbox'));
  ok('staff without inbox access cannot read it', (await call('inbox', 'GET', '/api/inbox', {}, writer.token)).code === 403);

  // status
  r = await post({ action: 'set-status', source: src, id, status: 'in_progress' }, helper.token);
  ok('an inbox helper can change the status', r.code === 200 && r.body.item.status === 'in_progress' && r.body.item.thread[0].text === 'Marked In progress');
  ok('a status that does not exist is refused', (await post({ action: 'set-status', source: src, id, status: 'bogus' }, helper.token)).code === 400);

  // assign
  sent.length = 0;
  r = await post({ action: 'assign', source: src, id, assigneeId: helper.id }, owner);
  ok('the owner hands it to the helper', r.code === 200 && r.body.item.assignee.name === 'Ines Inbox');
  ok('the helper is told by email', sent.some(m => m.to[0] === 'ines@example.com' && /gave you a request/.test(m.subject)));
  ok('a person without inbox access cannot be given a request', (await post({ action: 'assign', source: src, id, assigneeId: writer.id }, owner)).code === 400);
  r = await post({ action: 'assign', source: src, id, assigneeId: '' }, helper.token);
  ok('it can be put back to no one', r.body.item.assignee === null);
  sent.length = 0; await post({ action: 'assign', source: src, id, assigneeId: helper.id }, helper.token);
  ok('taking one yourself sends no email', sent.length === 0);

  // notes
  r = await post({ action: 'note', source: src, id, text: 'Called, no answer. Try again at 5pm.' }, helper.token);
  ok('a private note is kept with who wrote it', r.body.item.thread.some(t => t.type === 'note' && t.by.name === 'Ines Inbox' && /5pm/.test(t.text)));
  ok('an empty note is refused', (await post({ action: 'note', source: src, id, text: '   ' }, helper.token)).code === 400);

  // replies
  sent.length = 0;
  r = await post({ action: 'reply', source: src, id, subject: 'Your Negril boat day', message: 'Hi Tasha,\n\nThanks for writing. A boat day for 12 is easy to arrange.\n\nSpeak soon' }, helper.token);
  ok('a reply is emailed to the customer', r.code === 200 && sent.length === 1 && sent[0].to[0] === 'tasha@example.com' && sent[0].subject === 'Your Negril boat day', JSON.stringify(r.body).slice(0, 200));
  ok('their reply goes to the company inbox', sent[0].reply_to === 'office@example.com');
  ok('the message is escaped in the email', !/<script/i.test(sent[0].html));
  ok('the reply is recorded in the history', r.body.item.thread.some(t => t.type === 'reply' && t.to === 'tasha@example.com'));
  sent.length = 0;
  await post({ action: 'reply', source: src, id, subject: 'x', message: '<script>alert(1)</script> hello' }, helper.token);
  ok('markup in a reply is neutralised', sent.length === 1 && !/<script>/i.test(sent[0].html) && /&lt;script&gt;/.test(sent[0].html));
  mailOk = false;
  r = await post({ action: 'reply', source: src, id, subject: 'Retry', message: 'Will fail' }, helper.token);
  ok('if the email service refuses, nothing is recorded as sent', r.code === 502);
  r = await call('inbox', 'GET', '/api/inbox', {}, owner);
  ok('…and the history has no phantom reply', !r.body.items[0].thread.some(t => t.subject === 'Retry'));
  mailOk = true;
  ok('a reply needs a message', (await post({ action: 'reply', source: src, id, subject: 'Hi', message: '' }, helper.token)).code === 400);

  // a new request that is replied to moves out of "new"
  await call('contact', 'POST', '/api/contact', { action: 'send', name: 'Dee', email: 'dee@example.com', subject: 'Tent rental', message: 'How much for 3 nights?' });
  r = await call('inbox', 'GET', '/api/inbox', {}, owner);
  const second = r.body.items.find(i => i.name === 'Dee');
  ok('the second request starts as new', second.status === 'new');
  r = await post({ action: 'reply', source: second.source, id: second.id, subject: 'Tent rental', message: 'Hello Dee' }, owner);
  ok('replying to a new request marks it in progress', r.body.item.status === 'in_progress');

  // deleting is for the owner only
  ok('an inbox helper cannot delete a request', (await post({ action: 'delete', source: src, id }, helper.token)).code === 403);
  ok('the owner can', (await post({ action: 'delete', source: second.source, id: second.id }, owner)).code === 200);
  ok('a blog writer cannot touch the inbox', (await post({ action: 'note', source: src, id, text: 'x' }, blogger.token)).code === 403);

  console.log(fails ? '\n' + fails + ' FAILED' : '\nALL PASSED');
  process.exit(fails ? 1 : 0);
})();
