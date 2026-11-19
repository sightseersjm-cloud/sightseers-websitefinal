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
const ymd = (now, delta) => new Date(now.getTime() + delta * 86400000).toISOString().slice(0, 10);

/* the account's trip history ("Trips and history" tab): the finished trips above, plus some coming up and one just sent */
function bookings(now) {
  now = now || new Date();
  const out = stamps(now).map((st, i) => ({
    id: 'demo-b' + (100 + i), type: i === 0 ? 'stay' : 'tour', tourName: i === 0 ? '' : st.title, stayName: i === 0 ? st.title : '',
    date: st.on, checkIn: i === 0 ? st.on : '', checkOut: i === 0 ? ymd(new Date(st.on + 'T12:00:00Z'), 3) : '',
    guests: [2, 4, 6, 2, 8, 3, 2, 5, 2, 4, 6, 2, 3, 2, 4, 2][i] || 2, status: 'completed', notes: '', createdAt: new Date(new Date(st.on + 'T12:00:00Z').getTime() - 30 * 86400000).toISOString()
  }));
  out.unshift(
    { id: 'demo-b001', type: 'tour', tourName: 'Pitons Boat Day', stayName: '', date: ymd(now, 38), guests: 4, status: 'confirmed', notes: 'Pickup from the hotel confirmed.', createdAt: new Date(now.getTime() - 9 * 86400000).toISOString() },
    { id: 'demo-b002', type: 'stay', tourName: '', stayName: 'Negril Cliffside Villa', checkIn: ymd(now, 96), checkOut: ymd(now, 101), guests: 8, status: 'confirmed', notes: '', createdAt: new Date(now.getTime() - 15 * 86400000).toISOString() },
    { id: 'demo-b003', type: 'tour', tourName: 'Great Blue Hole Flyover', stayName: '', date: ymd(now, 140), guests: 2, status: 'pending', notes: '', createdAt: new Date(now.getTime() - 1 * 86400000).toISOString() }
  );
  return out;
}

/* the "Group trips" tab: a community application that was approved, two trips this member leads with travellers who joined, and trips they joined */
function groupTrips(now) {
  now = now || new Date();
  const iso = d => new Date(now.getTime() + d * 86400000).toISOString();
  const trav = (n, f, status, party, src, ago) => ({ photo: '', verified: true, firstName: f, partySize: party, guests: [], status, source: src, createdAt: iso(-ago), shared: false });
  const t1 = {
    role: 'main', mainLeaderName: 'You', coLeader: null, sponsors: [], gallery: [], image: '', leaderCard: null, launchKit: null,
    id: 'demo-t1', slug: 'demo-montego-bay-getaway', title: 'Montego Bay Girls Getaway', status: 'open', dateText: 'Five days, two months from now', destination: 'Montego Bay, Jamaica', country: 'Jamaica', startDate: ymd(now, 62),
    url: '/trip/demo-montego-bay-getaway', counts: { total: 7, new: 1, contacted: 1, confirmed: 3, booked: 2, cancelled: 0, waitlist: 0, travelers: 14 }, seatsTotal: 20, inviteGoal: 20,
    reward: { status: 'earned', text: 'A free spot for you once 10 friends book.' }, groupLink: 'https://chat.whatsapp.com/', joined: 14, updates: [], summary: 'Sun, boat days and one big group chat.', descriptionText: 'Five easy days in Montego Bay with the crew. Mornings at the beach, an afternoon boat day, a group dinner and plenty of free time.\n\nPerfect for friends who want one trip that is planned for them.', included: ['Airport pickups', 'Villa stay', 'Boat day', 'Group dinner'], notIncluded: ['Flights', 'Travel insurance'], itinerary: [], arrival: null, theme: '', themes: [], payouts: [],
    travelers: [trav(0, 'Aaliyah', 'booked', 2, 'instagram', 3), trav(0, 'Marcus', 'booked', 4, 'whatsapp', 5), trav(0, 'Tanya', 'confirmed', 3, 'instagram', 7), trav(0, 'Devon', 'confirmed', 2, '', 9), trav(0, 'Simone', 'confirmed', 3, 'whatsapp', 10), trav(0, 'Kareem', 'contacted', 2, '', 12), trav(0, 'Joelle', 'new', 1, 'instagram', 1)]
  };
  const t2 = Object.assign({}, t1, {
    id: 'demo-t2', slug: 'demo-ocho-rios-reunion', title: 'Ocho Rios Class Reunion', status: 'closed', dateText: 'Last spring', destination: 'Ocho Rios, Jamaica', startDate: ymd(now, -190), url: '/trip/demo-ocho-rios-reunion',
    counts: { total: 6, new: 0, contacted: 0, confirmed: 0, booked: 6, cancelled: 0, waitlist: 0, travelers: 18 }, seatsTotal: 18, inviteGoal: 18, joined: 18, reward: { status: 'paid', text: 'Reward paid.' },
    travelers: [trav(0, 'Andre', 'booked', 4, 'whatsapp', 230), trav(0, 'Keisha', 'booked', 3, 'whatsapp', 228), trav(0, 'Omar', 'booked', 3, '', 226), trav(0, 'Nia', 'booked', 4, 'instagram', 222), trav(0, 'Jamal', 'booked', 2, '', 220), trav(0, 'Rhea', 'booked', 2, 'instagram', 219)]
  });
  const applications = [{ ref: 'DEMO-APP1', status: 'approved', communityName: 'Island Crew Travel Club', reply: 'Welcome aboard. Your trips are live.', createdAt: iso(-260), seenApproved: true, communityType: 'Friends and family', city: 'Kingston', link: '', audienceSize: '500 to 1,000', channels: ['Instagram', 'WhatsApp'], experience: 'Organised group trips for five years', inviteCount: 20, destination: 'Jamaica', styles: ['Beach', 'Adventure'], timing: 'Spring and summer', message: '', notes: '' }];
  const interests = [
    { guests: [], ref: 'DEMO-J1', tripSlug: 'demo-negril-group-week', tripTitle: 'Negril Group Week', status: 'booked', partySize: 2, createdAt: iso(-150), leaderName: 'Sight Seers', dateText: 'Last summer', groupLink: '', shareContact: true, tripCountry: 'Jamaica', tripStart: ymd(now, -131), tripEnd: ymd(now, -126), tripImage: '', tripDestination: 'Negril, Jamaica', tripTheme: '', updates: [] },
    { guests: [], ref: 'DEMO-J2', tripSlug: 'demo-saint-lucia-escape', tripTitle: 'Saint Lucia Escape', status: 'confirmed', partySize: 3, createdAt: iso(-20), leaderName: 'Marcus', dateText: 'In three months', groupLink: 'https://chat.whatsapp.com/', shareContact: true, tripCountry: 'Saint Lucia', tripStart: ymd(now, 98), tripEnd: ymd(now, 104), tripImage: '', tripDestination: 'Soufriere, Saint Lucia', tripTheme: '', updates: [] }
  ];
  return { applications, trips: [t1, t2], interests };
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

module.exports = { isDemo, stamps, reviewsFor, bookings, groupTrips, POINTS, referral };
