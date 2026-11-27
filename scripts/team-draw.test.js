// Team draw: equal teams, gender balanced, Wild Card only for odd groups, input checks.
const T = require('../api/_lib/team-draw.js');
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('FAIL ' + m); } };
const ppl = (f, m) => [...Array(f)].map((_, i) => ({ name: 'F' + i, gender: 'F' })).concat([...Array(m)].map((_, i) => ({ name: 'M' + i, gender: 'M' })));
const cnt = (t, g) => t.filter(p => p.gender === g).length;
for (const [f, m] of [[5, 4], [4, 5], [3, 6], [9, 0], [2, 7], [4, 4], [3, 5], [5, 5], [1, 2], [6, 7], [0, 3]]) {
  for (let k = 0; k < 300; k++) {
    const r = T.draw(ppl(f, m)), n = f + m;
    ok(!!r.wildCard === (n % 2 === 1), `wild card only when odd (${f}F ${m}M)`);
    ok(r.g.length === r.o.length, `teams level (${f}F ${m}M): ${r.g.length} v ${r.o.length}`);
    ok(Math.abs(cnt(r.g, 'F') - cnt(r.o, 'F')) <= 1 && Math.abs(cnt(r.g, 'M') - cnt(r.o, 'M')) <= 1, `gender balanced (${f}F ${m}M)`);
    const all = r.g.concat(r.o, r.wildCard ? [r.wildCard] : []).map(p => p.name).sort();
    ok(all.join() === ppl(f, m).map(p => p.name).sort().join(), 'everyone placed exactly once');
    ok(r.reveal.length === r.g.length + r.o.length, 'reveal lists every team member');
    if (n % 2 === 1 && (f % 2 === 1)) ok(r.wildCard.gender === 'F', 'wild card comes from the odd gender');
  }
}
// 5 women and 4 men: always 2 and 2 per team, Wild Card a woman
for (let k = 0; k < 200; k++) { const r = T.draw(ppl(5, 4)); ok(cnt(r.g, 'F') === 2 && cnt(r.g, 'M') === 2 && r.wildCard.gender === 'F', '5F 4M gives 2+2 each and a female Wild Card'); }
// the Wild Card is spread across the odd group
const seen = new Set(); for (let k = 0; k < 400; k++) seen.add(T.draw(ppl(5, 4)).wildCard.name); ok(seen.size === 5, 'any of the five can be the Wild Card');
// input checks
ok(T.parse({ people: ppl(1, 1) }).error, 'needs 3 people');
ok(T.parse({ people: [{ name: 'A', gender: 'F' }, { name: 'a', gender: 'M' }, { name: 'B', gender: 'M' }] }).error, 'duplicate names refused');
ok(T.parse({ people: [{ name: 'A' }, { name: 'B', gender: 'M' }, { name: 'C', gender: 'M' }] }).error, 'gender required');
ok(T.parse({ team1: 'X', team2: 'x', people: ppl(2, 2) }).error, 'team names must differ');
const p = T.parse({ title: '<b>Summit</b>', team1: 'Green Giants', team2: 'Orange Blaze', people: ppl(2, 2).concat([{ name: '  Kim  ', gender: 'F' }]) });
ok(!p.error && p.title === 'bSummit/b' && p.people[4].name === 'Kim', 'cleans names and titles');
ok(/^[A-Za-z0-9]{10}$/.test(T.makeId()), 'draw ids are 10 letters and digits');

// sign-up spins: 9 places, 4 + 4 + Wild Card, gender split as evenly as possible, everyone equally likely to be the Wild Card
const wcAt = Array(9).fill(0);
for (let k = 0; k < 3000; k++) {
  const ev = Object.assign({ members: [] }, T.SUMMIT);
  const genders = ['F','F','M','F','M','M','F','M','F'];
  genders.forEach((gd, i) => { const r = T.join(ev, { name: 'P' + i, gender: gd }); if (r.error) ok(false, 'join error ' + r.error); });
  const t = x => ev.members.filter(m => m.team === x);
  ok(t('g').length === 4 && t('o').length === 4 && t('wc').length === 1, 'sign-ups fill 4 + 4 + 1');
  const fg = t('g').filter(m => m.gender === 'F').length, fo = t('o').filter(m => m.gender === 'F').length;
  ok(Math.abs(fg - fo) <= 1, 'women split evenly between the teams (' + fg + ' v ' + fo + ')');
  wcAt[ev.members.findIndex(m => m.team === 'wc')]++;
  ok(T.join(ev, { name: 'Late', gender: 'F' }).error, 'a tenth person is told the places are taken');
  ok(T.join(ev, { name: 'p3', gender: 'F' }).already, 'signing up again shows the same team');
}
ok(wcAt[8] === 3000 && wcAt.slice(0, 8).every(c => c === 0), 'the last person to spin is always the Wild Card: ' + wcAt.join(','));
ok(T.newEvent({ size: 2 }).error && !T.newEvent({ size: 9, team1: 'A', team2: 'B' }).error, 'new sign-up checks the size');
ok(T.caps({ size: 8 }).wc === 0 && T.caps({ size: 9 }).wc === 1, 'Wild Card only for odd groups');

// accounts: one spin per account, the name comes from the account
{ const ev = Object.assign({ members: [] }, T.SUMMIT);
  const a = T.join(ev, { gender: 'F', name: 'ignored' }, { id: 'u1', name: 'Kimberly Brown' });
  ok(a.member && a.member.name === 'Kimberly Brown' && a.member.userId === 'u1', 'name comes from the account');
  ok(T.join(ev, { gender: 'M' }, { id: 'u1', name: 'Kimberly Brown' }).already, 'the same account cannot spin twice');
  ok(T.join(ev, { gender: 'F' }, { id: 'u2', name: 'kimberly brown' }).error, 'a second account with the same name is asked to add a surname');
  ok(!T.join(ev, {}, { id: 'u3', name: 'Ann' }).error, 'no gender question: an unlisted person is still placed'); }
// the private roster gives the gender, by email or by name
{ const ev = Object.assign({ members: [] }, T.SUMMIT, { roster: { 'kim@x.com': 'F', 'Andre Hall': 'M' } });
  ok(T.rosterGender(ev, { email: 'KIM@x.com' }, '') === 'F' && T.rosterGender(ev, {}, 'andre hall') === 'M' && T.rosterGender(ev, {}, 'Zed') === '', 'roster lookup by email or name');
  ok(T.join(ev, {}, { id: 'k', name: 'Kim', email: 'kim@x.com' }).member.gender === 'F', 'spin uses the roster gender'); }
// shirt sizes
{ const ev = Object.assign({ members: [] }, T.SUMMIT);
  T.join(ev, {}, { id: 'a', name: 'Amy' });
  ok(T.setSize(ev, { id: 'a' }, 'm').member.shirtSize === 'M', 'shirt size saved, upper case');
  ok(T.setSize(ev, { id: 'a' }, 'XXXL').error, 'unknown size refused');
  ok(T.setSize(ev, { id: 'zz' }, 'M').error, 'size needs a spin first'); }
// the admin places the Wild Card
{ const ev = Object.assign({ members: [] }, T.SUMMIT);
  ok(T.setWildTeam(ev, 'g').error, 'no Wild Card yet');
  ev.members.push({ name: 'W', team: 'wc' });
  ok(T.setWildTeam(ev, 'x').error && !T.setWildTeam(ev, 'o').error && T.publicEvent(ev).wildTeam === 'o', 'Wild Card joins the chosen team'); }
{ const ev = Object.assign({ members: [{ name: 'Kurt Stout', team: 'g', email: 'k@x.com', userId: 'u', gender: 'M', shirtSize: 'L' }] }, T.SUMMIT);
  const pm = T.publicEvent(ev).members[0];
  ok(pm.name === 'Kurt' && !pm.email && !pm.gender && !pm.shirtSize && !pm.userId, 'the page shows first names only, nothing private'); }
// the Wild Card's team comes from the spin
{ let seen = new Set();
  for (let k = 0; k < 200; k++) { const ev = Object.assign({ members: [] }, T.SUMMIT);
    for (let i = 0; i < 9; i++) T.join(ev, {}, { id: 'u' + i, name: 'P' + i });
    ok(ev.wildTeam === 'g' || ev.wildTeam === 'o', 'the Wild Card gets a team from the spin'); seen.add(ev.wildTeam); }
  ok(seen.size === 2, 'either team can get the Wild Card'); }
// confirmation email block
{ const ev = Object.assign({ members: [{ name: 'Kurt Stout', email: 'K@x.com', team: 'o', shirtSize: 'L' }, { name: 'W', email: 'w@x.com', team: 'wc' }], wildTeam: 'g' }, T.SUMMIT);
  const a = T.confirmationBlock(ev, 'k@x.com'), b2 = T.confirmationBlock(ev, 'new@x.com'), w = T.confirmationBlock(ev, 'w@x.com');
  ok(/Orange Blaze/.test(a) && /Shirt size L/.test(a) && !/Spin for your team/.test(a), 'a spun traveller sees their team and size');
  ok(/Spin for your team/.test(b2) && /team-draw/.test(b2), 'a traveller who has not spun gets the spin button');
  ok(/Wild Card, joining the Green Giants/.test(w) && /Choose your shirt size/.test(w), 'the Wild Card sees their team and a size button'); }
// the first eight spins are mixed up: the order of teams varies, but they still finish 4 and 4
{ const orders = new Set();
  for (let k = 0; k < 500; k++) { const ev = Object.assign({ members: [] }, T.SUMMIT);
    for (let i = 0; i < 9; i++) T.join(ev, {}, { id: 'u' + i, name: 'P' + i });
    orders.add(ev.members.slice(0, 8).map(m => m.team).join('')); }
  ok(orders.size > 30, 'many different team orders across the first eight spins (' + orders.size + ')');
  ok([...orders].some(o => o.startsWith('gg')) && [...orders].some(o => o.startsWith('oo')), 'two in a row to the same team can happen'); }
console.log(fails ? fails + ' failed' : 'team draw: all passed');
process.exit(fails ? 1 : 0);
