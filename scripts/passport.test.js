/* The passport renewal request: two emergency contacts are required, they reach the team email and the inbox record,
   and a failed email is reported instead of looking like success. Run with:  npm run test:passport */
process.env.RESEND_API_KEY = 'test';
const path = require('path');
const root = path.resolve(__dirname, '..');
const calls = [];
let failMail = false;
global.fetch = async (u, o) => { calls.push(JSON.parse(o.body)); return failMail ? { ok: false, status: 422, json: async () => ({ message: 'rejected' }) } : { ok: true, status: 200, json: async () => ({ id: 'x' }) }; };
const handler = require(path.join(root, 'api/_handlers/passport'));
let fails = 0;
const ok = (name, cond, extra) => { console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); if (!cond) fails++; };
const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/pLvAAAAAElFTkSuQmCC';
const C1 = { name: 'Ann Brown', relationship: 'Mother', phone: '+1 876 555 0001', email: 'ann@example.com', address: '1 Hope Road, Kingston, Jamaica' };
const C2 = { name: 'Bob Green', relationship: 'Friend', phone: '+1 305 555 0002', email: 'bob@example.com', address: '2 Ocean Drive, Miami, USA' };
const send = body => new Promise(r => { const res = { status(c) { this.c = c; return this; }, json(x) { r({ code: this.c, body: x }); }, end() { r({ code: this.c }); } };
  handler({ method: 'POST', headers: {}, body: Object.assign({ name: 'Test Person', email: 't@example.com', phone: '+1 876 555 0000', ia: 'IA123', address: '5 Palm Street, Ocho Rios, St Ann, Jamaica', bio: { name: 'bio.png', type: 'image/png', b64: PNG }, photo: { name: 'p.png', type: 'image/png', b64: PNG } }, body) }, res); });

(async () => {
  let r = await send({ address: '', contacts: [C1, C2] });
  ok('the applicant address is required', r.code === 400);
  r = await send({});
  ok('a request with no emergency contacts is refused', r.code === 400 && /emergency/i.test(r.body.error));
  r = await send({ contacts: [C1] });
  ok('one emergency contact is not enough', r.code === 400);
  r = await send({ contacts: [C1, Object.assign({}, C2, { address: '' })] });
  ok('every detail of both contacts is required', r.code === 400);
  r = await send({ contacts: [C1, Object.assign({}, C2, { email: 'not-an-email' })] });
  ok('a contact email must look like an email', r.code === 400 && /email/i.test(r.body.error));
  ok('nothing was emailed for refused requests', calls.length === 0);
  r = await send({ contacts: [C1, C2], photoCheck: 'Shape is right: 35 × 45 mm portrait.' });
  const html = calls[0] && calls[0].html || '';
  ok('a complete request is accepted and emailed with both files', r.code === 201 && calls[0].attachments.length === 2);
  ok('the applicant address is in the email', /5 Palm Street/.test(html));
  ok('both emergency contacts are in the email, with their details', /Emergency contact 1/.test(html) && /Emergency contact 2/.test(html) && /ann@example\.com/.test(html) && /2 Ocean Drive/.test(html) && /\+1 305 555 0002/.test(html));
  ok('the photo size check is passed on to the team', /Photo size check/.test(html) && /35 × 45 mm portrait/.test(html));
  failMail = true;
  r = await send({ contacts: [C1, C2] });
  ok('when the email cannot be sent the person is told, not thanked', r.code === 502 && /could not send/i.test(r.body.error));
  console.log(fails ? '\n' + fails + ' FAILED' : '\nALL PASSED');
  process.exit(fails ? 1 : 0);
})();
