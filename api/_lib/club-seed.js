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
    organizerName: 'K. Stout',
    organizerCommunity: 'With Sight Seers Caribbean Adventures',
    organizerBio: '',
    organizerEmail: '',
    showOrganizer: true,
    coLeader: { status: 'approved', name: 'R. Ashley', email: '', userId: '' },
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
      await db.addToCollection(TRIPS, Object.assign({ id: uid(), createdAt: new Date().toISOString(), applicationId: null }, s.trip));
    }
    done.push(s.key); changed = true;
  }
  if (changed) await db.setDoc(MARKER, { done });
  checked = true;
}
function resetForTests() { checked = false; }

module.exports = { ensureSeeds, resetForTests, SEEDS };
