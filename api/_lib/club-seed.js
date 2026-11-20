/**
 * api/_lib/club-seed.js
 * Departures that Sight Seers itself runs and that ship with the site. Each one is added to the trips list once, the first time
 * the site asks for the list, and is then an ordinary trip: the owner edits, closes or deletes it in the admin. A deleted one is
 * not added again (the marker below remembers it was already added).
 */
const db = require('./db');
const { uid } = require('./auth');

const TRIPS = 'club-trips';
const MARKER = 'club-seeds';

const SEEDS = [{
  key: 'summit-challenge',
  /* led by the same account that leads this trip (found by its web address, or by its title) */
  sameLeaderAs: { slug: 'legend-escape-weekend-jamaica', title: /legend escape weekend/i },
  trip: {
    title: 'The Summit Challenge',
    slug: 'the-summit-challenge',
    status: 'open',
    destination: '',
    country: 'Jamaica',
    dateText: 'TBA, date to be announced',
    startDate: '', endDate: '',
    summary: 'A private team challenge led by Sight Seers: six challenges, two teams and one Summit Champion. Ten places.',
    description: 'A team challenge where nobody wins alone. Every challenge needs the whole team to plan, communicate and back each other up, while the Sight Seers Team Lead keeps the score. About four hours on site.\n\nTwo teams compete across six challenges. The team with the most points is crowned Summit Champions, with awards for Most Valuable Player, Best Team Spirit and Safe Rider.',
    included: [
      'Six team challenges: climbing wall relay, laser tag missions, a guided ATV convoy (not a race), a farm train tour with a team quiz, and team games',
      'A Sight Seers Team Lead to guide the day and keep the score',
      'Round trip coach transport',
      'A branded team shirt'
    ],
    notIncluded: ['Meals and refreshments'],
    itinerary: [],
    theme: 'Adventure',
    image: '', imageAlt: '',
    priceText: '',
    paymentNote: '',
    seatsTotal: 10,
    organizerName: 'Sight Seers Caribbean Adventures',
    organizerCommunity: '',
    organizerBio: '',
    organizerEmail: '',
    showOrganizer: true,
    reward: '', rewardStatus: 'not_set',
    internalNote: 'Private event: the location is hidden on the public site. Add the date and the price in the admin when they are set.',
    privateEvent: true,
    arrival: {
      getting: 'The meeting point is shared once your place is confirmed. Please arrive 15 minutes before departure.',
      bring: 'Comfortable activewear\nClosed toe athletic shoes\nA refillable water bottle\nSunscreen and insect repellent\nSnacks',
      before: 'Complete a short waiver and medical form before the day.\nShare your shirt size when your place is confirmed.'
    },
    groupLink: '', sponsors: [], gallery: []
  }
}];

let checked = false;
async function ensureSeeds() {
  if (checked) return;
  const doc = (await db.getDoc(MARKER)) || {};
  const done = Array.isArray(doc.done) ? doc.done.slice() : [];
  const trips = await db.getCollection(TRIPS);
  let changed = false;
  for (const s of SEEDS) {
    if (done.indexOf(s.key) > -1) continue;
    if (!trips.some(t => t.slug === s.trip.slug)) {
      const rec = Object.assign({ id: uid(), createdAt: new Date().toISOString(), applicationId: null }, s.trip);
      /* take the leader details from the trip it should share a leader with, so that account runs this one too */
      const src = s.sameLeaderAs && (trips.find(t => t.slug === s.sameLeaderAs.slug) || trips.find(t => s.sameLeaderAs.title.test(String(t.title || ''))));
      if (src && (src.organizerUserId || src.organizerEmail || src.organizerName)) {
        ['organizerUserId', 'organizerEmail', 'organizerName', 'organizerCommunity', 'organizerBio'].forEach(k => { if (src[k] !== undefined) rec[k] = src[k]; });
        rec.showOrganizer = true;
      }
      await db.addToCollection(TRIPS, rec);
    }
    done.push(s.key); changed = true;
  }
  if (changed) await db.setDoc(MARKER, { done });
  checked = true;
}
function resetForTests() { checked = false; }

module.exports = { ensureSeeds, resetForTests, SEEDS };
