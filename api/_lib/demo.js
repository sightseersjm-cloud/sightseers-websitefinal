/**
 * api/_lib/demo.js
 * Showcase accounts: an account listed here (the owner's demo login) shows every Travel Club feature with sample data,
 * so the product can be shown to people. The sample data is only ever returned to that account itself. It is never written
 * to the stores, never counted in the admin, and never shown on a public page (no sample reviews appear on trip pages).
 */
const lower = v => String(v || '').trim().toLowerCase();
const DEFAULT = ['daine.allenn@gmail.com'];

function demoEmails() {
  const extra = String(process.env.DEMO_ACCOUNTS || '').split(',').map(lower).filter(Boolean);
  return new Set(DEFAULT.concat(extra));
}
const isDemo = user => !!(user && user.email && demoEmails().has(lower(user.email)));

const dayStr = (now, back) => new Date(now.getTime() - back * 86400000).toISOString().slice(0, 10);

/* sample finished trips, newest first, dated relative to today so they always look recent: a well-travelled passport across the islands Sight Seers serves */
function stamps(now) {
  now = now || new Date();
  const T = [
    [14, 'Ocho Rios Villa Weekend', 'Jamaica', 'booking'],
    [41, 'Pitons Boat Day', 'Saint Lucia', 'booking'],
    [68, 'Catamaran Sunset Cruise', 'Jamaica', 'booking'],
    [97, 'Swimming Pigs Day Trip', 'The Bahamas', 'booking'],
    [126, 'Negril Group Week', 'Jamaica', 'club'],
    [158, 'Great Blue Hole Flyover', 'Belize', 'booking'],
    [189, 'Harrison Cave Tour', 'Barbados', 'booking'],
    [221, 'Bamboo Rafting on the Martha Brae', 'Jamaica', 'booking'],
    [252, 'Saona Island Beach Day', 'Dominican Republic', 'booking'],
    [284, 'Willemstad City Tour', 'Curacao', 'booking'],
    [316, 'ATV Mountain Adventure', 'Jamaica', 'booking'],
    [349, 'Catamaran Snorkel Cruise', 'Barbados', 'booking'],
    [383, 'Cave Tubing Adventure', 'Belize', 'booking'],
    [421, 'Blue Hole Escape', 'Jamaica', 'booking'],
    [462, 'Nassau Island Hopping', 'The Bahamas', 'booking'],
    [507, 'Dunn River Falls', 'Jamaica', 'booking']
  ];
  return T.map(t => ({ title: t[1], country: t[2], on: dayStr(now, t[0]), kind: t[3] }));
}
const POINTS = 800;                                   /* Pioneer tier */
const referral = { joined: 3, rewarded: 2 };
function reviewsFor(now) {
  const s = stamps(now);
  return {
    eligible: [{ refKey: 'demo:' + s[0].title, title: s[0].title, country: s[0].country, on: s[0].on }],
    mine: [
      { id: 'demo-r1', name: 'You', title: s[4].title, rating: 5, text: 'An unforgettable week. The group was great and every detail was taken care of.', country: 'Jamaica', on: s[4].on, status: 'approved', verified: true },
      { id: 'demo-r2', name: 'You', title: s[2].title, rating: 5, text: 'Perfect sunset, friendly crew, and the music was just right.', country: 'Jamaica', on: s[2].on, status: 'approved', verified: true }
    ]
  };
}

module.exports = { isDemo, stamps, reviewsFor, POINTS, referral };
