/**
 * Team draw for group challenges: two equal teams, balanced by gender, plus a Wild Card when the group is odd.
 * The draw runs here on the server, so whoever presses Draw cannot shape the result, and every draw is kept with its time.
 */
const crypto = require('crypto');

const MAX_PEOPLE = 60;
const clean = (s, max) => String(s == null ? '' : s).replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);

function rand(n) { return crypto.randomInt(n); }
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }

/* checks what the page sends; returns { error } or the cleaned request */
function parse(body) {
  body = body || {};
  const title = clean(body.title, 80) || 'Team Draw';
  const teams = { g: clean(body.team1, 40) || 'Team 1', o: clean(body.team2, 40) || 'Team 2' };
  if (teams.g.toLowerCase() === teams.o.toLowerCase()) return { error: 'Give the two teams different names.' };
  const raw = Array.isArray(body.people) ? body.people : [];
  if (raw.length > MAX_PEOPLE) return { error: 'A draw can have up to ' + MAX_PEOPLE + ' people.' };
  const people = [], seen = new Set();
  for (const p of raw) {
    const name = clean(p && p.name, 40);
    if (!name) continue;
    const gender = p.gender === 'M' || p.gender === 'F' ? p.gender : '';
    if (!gender) return { error: 'Choose male or female for ' + name + '.' };
    const key = name.toLowerCase();
    if (seen.has(key)) return { error: name + ' is listed twice. Add a surname or initial to tell them apart.' };
    seen.add(key);
    people.push({ name, gender });
  }
  if (people.length < 3) return { error: 'Add at least 3 people.' };
  return { title, teams, people };
}

/* the draw: the Wild Card comes from whichever gender has an odd number, then each gender is dealt evenly across the teams */
function draw(people) {
  const groups = { F: shuffle(people.filter(p => p.gender === 'F')), M: shuffle(people.filter(p => p.gender === 'M')) };
  let wildCard = null;
  if (people.length % 2 === 1) {
    const odd = groups.F.length % 2 === 1 ? 'F' : 'M';
    wildCard = groups[odd].shift();
  }
  const g = [], o = [];
  const first = rand(2) ? 'g' : 'o';
  const order = rand(2) ? ['F', 'M'] : ['M', 'F'];
  let start = first;
  for (const gen of order) {
    const list = groups[gen];
    list.forEach((p, i) => ((i % 2 === 0) === (start === 'g') ? g : o).push(p));
    /* if this gender had an odd number, the next gender starts on the other team so the sizes stay level */
    if (list.length % 2 === 1) start = start === 'g' ? 'o' : 'g';
  }
  const gs = shuffle(g), os = shuffle(o), reveal = [];
  for (let i = 0; i < Math.max(gs.length, os.length); i++) {
    if (gs[i]) reveal.push({ name: gs[i].name, team: 'g' });
    if (os[i]) reveal.push({ name: os[i].name, team: 'o' });
  }
  return { wildCard, g: gs, o: os, reveal };
}

function makeId() { return crypto.randomBytes(8).toString('base64url').replace(/[^A-Za-z0-9]/g, '').slice(0, 10).padEnd(10, 'x'); }

function record(req) {
  const result = draw(req.people);
  return { id: makeId(), title: req.title, teams: req.teams, createdAt: new Date().toISOString(), count: req.people.length, result };
}

module.exports = { parse, draw, record, makeId, MAX_PEOPLE };

/* ---- sign-up spins: each person joins on their own and the server places them ---- */

/* The roster is kept here in the code and never shown on the site: each person's email (or full name) and M or F,
   so the spin can balance the teams without asking anyone. People not listed are placed by team size only. */
const SUMMIT_ROSTER = {
  // 'name@example.com': 'F',
  // 'First Last': 'M',
};
const SUMMIT = { id: 'summit-challenge', title: 'The Summit Challenge', teams: { g: 'Green Giants', o: 'Orange Blaze' }, size: 9, roster: SUMMIT_ROSTER };

function rosterGender(ev, user, name) {
  const r = (ev && ev.roster) || {};
  const keys = Object.keys(r).reduce((m, k) => { m[k.trim().toLowerCase()] = r[k]; return m; }, {});
  const g = keys[String((user && user.email) || '').trim().toLowerCase()] || keys[String(name || '').trim().toLowerCase()] || '';
  return g === 'M' || g === 'F' ? g : '';
}

function newEvent(body) {
  body = body || {};
  const size = Math.round(Number(body.size));
  if (!(size >= 3 && size <= MAX_PEOPLE)) return { error: 'Group size must be between 3 and ' + MAX_PEOPLE + '.' };
  const teams = { g: clean(body.team1, 40) || 'Team 1', o: clean(body.team2, 40) || 'Team 2' };
  if (teams.g.toLowerCase() === teams.o.toLowerCase()) return { error: 'Give the two teams different names.' };
  return { id: makeId(), title: clean(body.title, 80) || 'Team Draw', teams, size, createdAt: new Date().toISOString(), members: [] };
}

function caps(ev) { const per = Math.floor(ev.size / 2); return { g: per, o: per, wc: ev.size % 2 }; }

/* places one person: keeps the teams level and each gender split as evenly as it can,
   and gives every sign-up the same chance of being the Wild Card */
function place(ev, person) {
  const c = caps(ev), m = ev.members || [];
  const n = t => m.filter(x => x.team === t).length;
  const ng = (t, gen) => m.filter(x => x.team === t && x.gender === gen).length;
  const left = ev.size - m.length;
  if (left <= 0) return { error: 'All the places are taken.' };
  if (c.wc && n('wc') === 0 && rand(left) === 0) return 'wc';
  let teams = ['g', 'o'].filter(t => n(t) < c[t]);
  if (!teams.length) return 'wc';
  /* the gender rule first, then the smaller team, then chance */
  if (person.gender) {
    const minG = Math.min(...teams.map(t => ng(t, person.gender)));
    teams = teams.filter(t => ng(t, person.gender) === minG);
  }
  const minN = Math.min(...teams.map(n));
  teams = teams.filter(t => n(t) === minN);
  return teams[rand(teams.length)];
}

function join(ev, body, user) {
  const name = clean((user && user.name) || (body && body.name), 40);
  const uid = user && user.id ? String(user.id) : '';
  const found = (ev.members || []).find(x => (uid && x.userId === uid) || (!uid && x.name.toLowerCase() === name.toLowerCase()));
  if (found) return { member: found, already: true };
  if (!name) return { error: 'Add your name to your account first.' };
  if ((ev.members || []).some(x => x.name.toLowerCase() === name.toLowerCase())) return { error: 'Someone named ' + name + ' has already spun. Add your surname to your account name and try again.' };
  /* gender comes from the private roster in the code; a test or older caller may still pass it */
  const gender = rosterGender(ev, user, name) || (body && (body.gender === 'M' || body.gender === 'F') ? body.gender : '');
  const team = place(ev, { name, gender });
  if (team && team.error) return team;
  const member = { name, gender, team, at: new Date().toISOString() };
  /* the Wild Card's team is decided by the same spin: the team with fewer of their gender, otherwise chance */
  if (team === 'wc') {
    let opts = ['g', 'o'];
    if (gender) {
      const cnt = t => (ev.members || []).filter(x => x.team === t && x.gender === gender).length;
      const lo = Math.min(cnt('g'), cnt('o'));
      opts = opts.filter(t => cnt(t) === lo);
    }
    ev.wildTeam = opts[rand(opts.length)]; ev.wildTeamAt = member.at;
  }
  if (uid) member.userId = uid;
  if (user && user.email) member.email = String(user.email).slice(0, 120);
  ev.members = (ev.members || []).concat([member]);
  return { member };
}

const SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];
function setSize(ev, user, size) {
  const sz = String(size || '').trim().toUpperCase();
  if (SIZES.indexOf(sz) === -1) return { error: 'Choose a shirt size.' };
  const uid = user && user.id ? String(user.id) : '';
  const m = (ev.members || []).find(x => uid && x.userId === uid);
  if (!m) return { error: 'Spin for your team first.' };
  m.shirtSize = sz; m.sizeAt = new Date().toISOString();
  return { member: m };
}

/* the admin decides which team the Wild Card joins, after the coin flip or hand wrestle at pickup */
function setWildTeam(ev, team) {
  if (team !== 'g' && team !== 'o' && team !== '') return { error: 'Choose a team.' };
  if (!(ev.members || []).some(x => x.team === 'wc')) return { error: 'Nobody has the Wild Card yet.' };
  ev.wildTeam = team; ev.wildTeamAt = new Date().toISOString();
  return { ok: true, member: ev.members.find(x => x.team === 'wc') };
}

/* the line a Summit Challenge confirmation email carries: their team if they have spun, otherwise a way to spin */
const SPIN_URL = 'https://www.sightseerscaribbean.com/team-draw';
function confirmationBlock(ev, email) {
  const esc = x => String(x == null ? '' : x).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const key = String(email || '').trim().toLowerCase();
  const m = ev && key ? (ev.members || []).find(x => String(x.email || '').toLowerCase() === key) : null;
  const box = inner => '<div style="margin:18px 0;padding:16px 18px;border-radius:12px;background:#f4fbf6;border:1px solid #dde8df;font-family:sans-serif">' + inner + '</div>';
  const btn = (url, label) => '<a href="' + url + '" style="display:inline-block;margin-top:10px;background:#ef8731;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:999px">' + label + '</a>';
  if (m) {
    const team = m.team === 'wc' ? 'Wild Card' + (ev.wildTeam ? ', joining the ' + ev.teams[ev.wildTeam] : '') : ev.teams[m.team];
    return box('<div style="font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#4fae3f">Your team</div>' +
      '<div style="font-size:20px;font-weight:700;color:#063a63;margin-top:4px">' + esc(team) + '</div>' +
      '<div style="font-size:14px;color:#5b6b76;margin-top:2px">' + (m.shirtSize ? 'Shirt size ' + esc(m.shirtSize) : 'Shirt size not chosen yet') + '</div>' +
      (m.shirtSize ? '' : btn(SPIN_URL, 'Choose your shirt size')));
  }
  return box('<div style="font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#4fae3f">Next step</div>' +
    '<div style="font-size:18px;font-weight:700;color:#063a63;margin-top:4px">Spin for your team</div>' +
    '<div style="font-size:14px;color:#5b6b76;margin-top:2px">Sign in to your Sight Seers account, spin once to join the Green Giants or the Orange Blaze, then choose your shirt size.</div>' +
    btn(SPIN_URL, 'Spin for your team'));
}

/* what anyone with the link may see */
function publicEvent(ev) {
  return { id: ev.id, title: ev.title, teams: ev.teams, size: ev.size, createdAt: ev.createdAt, wildTeam: ev.wildTeam || '',
    /* first names only on the page; the full names go to the team by email */
    members: (ev.members || []).map(x => ({ name: String(x.name || '').split(' ')[0], team: x.team, at: x.at })) };
}

module.exports.SUMMIT = SUMMIT;
module.exports.rosterGender = rosterGender;
module.exports.setSize = setSize;
module.exports.setWildTeam = setWildTeam;
module.exports.confirmationBlock = confirmationBlock;
module.exports.SIZES = SIZES;
module.exports.newEvent = newEvent;
module.exports.place = place;
module.exports.join = join;
module.exports.caps = caps;
module.exports.publicEvent = publicEvent;
