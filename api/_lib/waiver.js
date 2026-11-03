/* The waiver wording (api/_data/waiver.json) plus one entry for each 5-Day Signature package, built from api/_data/packages.json,
   so a package's waiver names that package's real activities. The page embeds this merged object (run `npm run sync:waiver`). */
const BASE = require('../_data/waiver.json');
const PACKAGES = require('../_data/packages.json');

const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const SKIP = /^(airport drop-off|morning at leisure|evening at leisure)/i;

function packageEvent(key) {
  const p = PACKAGES[key];
  const items = [];
  (p.days || []).forEach(d => ['am', 'pm'].forEach(sl => { const it = d[sl]; if (it && it.title && !SKIP.test(it.title) && !items.includes(it.title)) items.push(it.title); }));
  const list = items.length > 1 ? items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1] : items.join('');
  return {
    id: 'pkg-' + slug(key), label: p.title + ' package', apparel: false, package: key,
    activities: 'the ' + p.title + ', a five-day group itinerary organised by Sight Seers Caribbean Adventures ("Sight Seers"). It includes ' + list +
      ', with private transport where it is part of the package or booked as an add-on, such as the airport pickup and drop-off or a private driver day. Some activities are provided by third-party operators and guides'
  };
}

const generic = BASE.events.filter(e => e.id === 'general');
const summit = BASE.events.filter(e => e.id !== 'general');
const EVENTS = [].concat(
  generic,
  [
    { id: 'tour', label: 'A Sight Seers tour or excursion', apparel: false, activities: 'a tour or excursion booked with Sight Seers Caribbean Adventures ("Sight Seers"), including travel between the meeting point and the activity' },
    { id: 'group-trip', label: 'A Travel Club group trip', apparel: false, activities: 'a Sight Seers Travel Club group trip organised by Sight Seers Caribbean Adventures ("Sight Seers"), including the activities, excursions and travel in its itinerary' }
  ],
  Object.keys(PACKAGES).map(packageEvent),
  summit
);
const WAIVER = Object.assign({}, BASE, { events: EVENTS });

module.exports = { WAIVER, packageEventId: key => 'pkg-' + slug(key), slug };
