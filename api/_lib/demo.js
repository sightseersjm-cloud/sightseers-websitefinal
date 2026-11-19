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

/* sample finished trips, newest first, dated relative to today so they always look recent */
function stamps(now) {
  now = now || new Date();
  return [
    { title: 'Ocho Rios Villa Weekend', country: 'Jamaica', on: dayStr(now, 21), kind: 'booking' },
    { title: 'Catamaran Sunset Cruise', country: '', on: dayStr(now, 74), kind: 'booking' },
    { title: 'Negril Group Week', country: 'Jamaica', on: dayStr(now, 131), kind: 'club' },
    { title: 'Bamboo Rafting on the Martha Brae', country: '', on: dayStr(now, 190), kind: 'booking' },
    { title: 'Blue Hole Escape', country: 'Jamaica', on: dayStr(now, 262), kind: 'booking' },
    { title: 'Dunn River Falls', country: 'Jamaica', on: dayStr(now, 335), kind: 'booking' }
  ];
}
const POINTS = 800;                                   /* Pioneer tier */
const referral = { joined: 3, rewarded: 2 };
function reviewsFor(now) {
  const s = stamps(now);
  return {
    eligible: [{ refKey: 'demo:' + s[0].title, title: s[0].title, country: s[0].country, on: s[0].on }],
    mine: [
      { id: 'demo-r1', name: 'You', title: s[2].title, rating: 5, text: 'An unforgettable week. The group was great and every detail was taken care of.', country: 'Jamaica', on: s[2].on, status: 'approved', verified: true },
      { id: 'demo-r2', name: 'You', title: s[1].title, rating: 5, text: 'Perfect sunset, friendly crew, and the music was just right.', country: '', on: s[1].on, status: 'approved', verified: true }
    ]
  };
}

module.exports = { isDemo, stamps, reviewsFor, POINTS, referral };
