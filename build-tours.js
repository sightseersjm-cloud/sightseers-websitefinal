#!/usr/bin/env node
/**
 * build-tours.js — generates the static, indexable /virtual-tours/ pages.
 *
 * Output (committed to the repo, served as-is by Vercel):
 *   public/virtual-tours/index.html            — hub landing page
 *   public/virtual-tours/<slug>/index.html     — one page per experience
 *
 * Each tour page is self-canonical with its own meta tags, Open Graph,
 * TouristTrip + BreadcrumbList + FAQPage JSON-LD, descriptive copy,
 * an interactive 360° preview where a real panorama exists
 * (self-hosted Pannellum at /vendor/pannellum/), FAQ, related tours,
 * and booking CTAs that deep-link into the main app (/#booking, /#vtours).
 *
 * Regenerate after editing TOURS:  node build-tours.js
 */

const fs = require('fs');
const path = require('path');

const SITE = 'https://www.sightseerscaribbean.com';
const OUT = path.join(__dirname, 'public', 'virtual-tours');

const TOURS = [
  {
    slug: 'blue-lagoon-morning-walk',
    title: 'Blue Lagoon Morning Walk',
    location: 'Port Antonio, Portland',
    category: 'Beaches & Lagoons',
    intents: ['Relaxation', 'Romance', 'Photography'],
    duration: '3 hours',
    group: '2–20 guests',
    priceFrom: 65,
    pano: '/panos/blue-lagoon.jpg',
    ogImage: '/panos/og-blue-lagoon.jpg',
    heroImage: '/panos/og-blue-lagoon.jpg',
    panoView: { yaw: 15, pitch: -4, hfov: 100 },
    short: 'Walk the wooden docks of Portland’s famous turquoise lagoon at sunrise, guided live by a local host.',
    overview: [
      'The Blue Lagoon Morning Walk is Sight Seers Caribbean’s signature slow-travel experience. You arrive as the light comes up over Portland parish, when the water is glass-calm and the docks are quiet. A local guide walks your group along the waterfront, telling the stories behind the lagoon, the fishing boats, and the hills that keep this corner of Jamaica so green.',
      'Before you book, step inside the tour with our interactive 360° preview below. Drag to look around the dock, find the marked points of interest, and get a feel for the real place — this is the actual scene your walk begins from.',
      'The experience suits couples, small friend groups, and photographers. Morning departures keep the temperature comfortable and the light soft, and transport can be arranged from Port Antonio and nearby villas.'
    ],
    included: ['Professional local guide', 'Waterfront dock walk & lookout stops', 'Fresh coconut water on arrival', 'Photo assistance at the best angles', 'Optional hotel pickup (Port Antonio area)'],
    itinerary: ['Lagoon dock meeting point', 'Waterfront boardwalk & boat launch', 'Hillside lookout over the lagoon', 'Local craft & refreshment stop'],
    faq: [
      ['Is this tour good for groups?', 'Yes. The morning walk comfortably hosts groups of up to 20. For birthdays, greek-life trips, and larger private groups we can arrange a dedicated departure — request an itinerary and a planner will confirm timing.'],
      ['Do I need to be able to swim?', 'No. This is a guided waterfront walk. Swimming and bamboo-raft add-ons are optional and always guide-supervised.'],
      ['What should I bring?', 'Light clothing, comfortable sandals or trainers, sunscreen, and your camera or phone. Mornings are mild — a light cover-up is enough.']
    ],
    related: ['sunset-yacht-charter', 'falmouth-market-stall-walk']
  },
  {
    slug: 'falmouth-market-stall-walk',
    title: 'Falmouth Market Stall Walk',
    location: 'Falmouth, Trelawny',
    category: 'Culture & Markets',
    intents: ['Culture', 'Food', 'Shopping'],
    duration: '2 hours',
    group: '2–15 guests',
    priceFrom: 35,
    pano: '/panos/market-stall.jpg',
    ogImage: '/panos/og-market-stall.jpg',
    heroImage: '/panos/og-market-stall.jpg',
    panoView: { yaw: 118, pitch: -16, hfov: 105 },
    short: 'Browse a working Jamaican market stall with a local host — sweets, spices, craft, and the vendors behind them.',
    overview: [
      'Markets are where Jamaica talks. On the Falmouth Market Stall Walk your host brings you stall to stall — tamarind balls and coconut drops, jerk seasoning and pimento, handwoven baskets and larimar jewellery — and introduces you to the people who make and sell them.',
      'Use the interactive 360° preview below to stand at a stall counter before you book: drag around the goods, meet the vendor’s smile, and tap the marked items to see what guests most often take home.',
      'This walk pairs perfectly with a morning at the lagoon or an afternoon beach session, and every purchase goes directly to the vendor — Sight Seers takes nothing from stall sales.'
    ],
    included: ['Local market host', 'Tastings at three stalls', 'Craft & spice introductions', 'Bargaining help and fair-price guidance', 'Market map & vendor list to keep'],
    itinerary: ['Market entrance & sweets counter', 'Spice and seasoning stalls', 'Craft row — baskets, canvas art, jewellery', 'Fresh fruit finish'],
    faq: [
      ['Can I pay by card at the stalls?', 'Most stalls are cash-first. Your host will point out the few that take cards and help you change small bills safely.'],
      ['Is the market walk suitable for kids?', 'Very — children love the sweets counters. Strollers manage fine in the main aisles.'],
      ['What if I don’t want to buy anything?', 'No pressure, ever. The tastings are included and browsing with your host is the point — buying is optional.']
    ],
    related: ['kingston-culture-food-tour', 'blue-lagoon-morning-walk']
  },
  {
    slug: 'sunset-yacht-charter',
    title: 'Sunset Yacht Charter',
    location: 'Montego Bay, St. James',
    category: 'Yacht & Catamaran',
    intents: ['Luxury', 'Groups', 'Celebrations'],
    duration: '4 hours',
    group: '4–30 guests',
    priceFrom: 180,
    pano: null,
    ogImage: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&h=630&fit=crop',
    heroImage: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1600&h=900&fit=crop',
    short: 'Private catamaran charter out of Montego Bay with open bar, sound system, and the best sunset in Jamaica.',
    overview: [
      'The Sunset Yacht Charter is our most requested group experience: a private catamaran out of Montego Bay with an open bar, a captain and crew who know exactly where the light lands, and room for the whole crew — birthdays, bachelorettes, fraternity and sorority trips, corporate escapes.',
      'A live guided 360° preview of this charter runs inside our V-Tours portal — join a session to walk the deck, check the dining area, and size the boat for your group before you commit.',
      'Charters include swim stops on calm days, DJ add-ons, and catering upgrades. Sunset departures sell out first — request your date early.'
    ],
    included: ['Private catamaran & crew', 'Open bar (rum punch, beer, soft drinks)', 'Bluetooth / DJ-ready sound system', 'Swim stop (weather permitting)', 'Hotel transfer add-on available'],
    itinerary: ['Marina welcome & safety brief', 'Coastline cruise with open bar', 'Swim & snorkel stop', 'Sunset viewing point & return'],
    faq: [
      ['How many people fit on the charter?', 'Standard charters host up to 30 guests. Larger groups can split across two vessels that cruise together — ask a planner.'],
      ['Can we bring our own music?', 'Yes — the sound system takes any phone, and a live DJ is available as an add-on.'],
      ['What happens if the weather turns?', 'Your captain makes the final call. If a charter is cancelled for weather you rebook or receive a full refund per our refund policy.']
    ],
    related: ['negril-seven-mile-sunset', 'blue-lagoon-morning-walk']
  },
  {
    slug: 'dunns-river-falls-climb',
    title: "Dunn's River Falls Climb",
    location: 'Ocho Rios, St. Ann',
    category: 'Adventure & Waterfalls',
    intents: ['Adventure', 'Family', 'Groups'],
    duration: '3 hours',
    group: '2–40 guests',
    priceFrom: 55,
    pano: null,
    ogImage: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1200&h=630&fit=crop',
    heroImage: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1600&h=900&fit=crop',
    short: 'Climb Jamaica’s iconic 600-ft terraced waterfall hand-in-hand with your group, led by licensed falls guides.',
    overview: [
      'Dunn’s River Falls is the climb every visitor to Jamaica promises themselves — 600 feet of cool terraced limestone rising from the Caribbean Sea straight into the rainforest. Licensed falls guides lead your chain up the terraces, calling the footholds and catching the moments.',
      'Preview the falls inside our live V-Tours portal before you book, then arrive already knowing the route, what to wear, and where the photo stops are.',
      'We time entries to avoid the biggest cruise-ship waves, and combine the climb with river tubing or an Ocho Rios lunch stop for a full day out.'
    ],
    included: ['Falls entry ticket', 'Licensed falls guide', 'Water-shoe rental', 'Locker & changing facilities', 'Round-trip transport add-on available'],
    itinerary: ['Beach base & safety brief', 'Guided terrace climb (about 90 minutes)', 'Lagoon pools & photo stops', 'Gardens exit & craft market'],
    faq: [
      ['Do I need to be fit to climb?', 'A moderate level — children from 6 and active seniors climb daily. There are exit points partway if anyone wants to stop early.'],
      ['Are water shoes really necessary?', 'Yes, and they’re included. The limestone is smooth in places and water shoes make the climb easy and safe.'],
      ['Can we film the climb?', 'Yes — waterproof phone pouches are sold at the base, and our guides know every angle worth stopping for.']
    ],
    related: ['blue-lagoon-morning-walk', 'kingston-culture-food-tour']
  },
  {
    slug: 'kingston-culture-food-tour',
    title: 'Kingston Culture & Food Tour',
    location: 'Kingston & St. Andrew',
    category: 'Food & Culture',
    intents: ['Culture', 'Food', 'Music'],
    duration: '4 hours',
    group: '2–15 guests',
    priceFrom: 75,
    pano: null,
    ogImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&h=630&fit=crop',
    heroImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&h=900&fit=crop',
    short: 'Jerk pits, patty shops, Bob Marley’s Kingston, and the food the city actually eats — guided by a born-and-raised host.',
    overview: [
      'Kingston is Jamaica’s kitchen and its stage. This tour eats through both: pimento-smoke jerk pits, the patty counters locals argue over, fresh juice stands, and the streets that raised reggae — with stops tied to the music at every turn.',
      'Join a live guided session in our V-Tours portal to taste the route virtually first — your host cooks through the menu on camera and answers questions in the live chat.',
      'Tours run day and evening. Evening departures add the city’s skyline from Skyline Drive and a stop for the best soft-serve in the Caribbean.'
    ],
    included: ['Local host & storyteller', 'Five food stops with tastings', 'Bottled water throughout', 'Music-history stops', 'Air-conditioned transport between stops'],
    itinerary: ['Downtown patty counter', 'Jerk pit & pimento smoke', 'Market fruit walk', 'Music landmark stop & juice finish'],
    faq: [
      ['I’m vegetarian — will I eat well?', 'Extremely. Ital cooking is a Kingston strength: festival, roast breadfruit, ackee, callaloo, and fresh juice at every stop.'],
      ['Is Kingston safe for this tour?', 'Your host is born and raised in the city and the route sticks to busy, welcoming neighbourhoods. Thousands of guests have walked it with us.'],
      ['How spicy is the food?', 'You control it — scotch bonnet is always served on the side until you ask otherwise.']
    ],
    related: ['falmouth-market-stall-walk', 'dunns-river-falls-climb']
  },
  {
    slug: 'negril-seven-mile-sunset',
    title: 'Negril Seven Mile Beach & Sunset',
    location: 'Negril, Westmoreland',
    category: 'Beaches & Lagoons',
    intents: ['Relaxation', 'Romance', 'Groups'],
    duration: '5 hours',
    group: '2–25 guests',
    priceFrom: 60,
    pano: null,
    ogImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=630&fit=crop',
    heroImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&h=900&fit=crop',
    short: 'An unhurried afternoon on Jamaica’s most famous beach, ending at Rick’s Café for the island’s definitive sunset.',
    overview: [
      'Seven Mile Beach earns its reputation quietly: powder sand, warm shallow water, and beach bars that have been perfecting rum punch for fifty years. This trip gives you a full unhurried afternoon of it, with a reserved shaded base and your host handling chairs, drinks, and timing.',
      'As the light turns gold you move to the cliffs — Rick’s Café — for cliff divers, live music, and the sunset every postcard of Jamaica is chasing.',
      'Preview the beach in a live 360° session inside our V-Tours portal, then let a planner time your visit to the best light of your travel week.'
    ],
    included: ['Reserved beach base with shade & chairs', 'Welcome drink', 'Host on the beach all afternoon', 'Cliff sunset session at Rick’s Café', 'Round-trip transport add-on available'],
    itinerary: ['Beach arrival & reserved base', 'Swim, paddle & beach-bar time', 'Golden-hour move to the cliffs', 'Sunset & cliff divers at Rick’s'],
    faq: [
      ['Is the sea calm enough for weak swimmers?', 'Seven Mile is famously shallow and calm — you can wade out a long way. Lifeguarded sections are part of our base setup.'],
      ['Do we have to cliff-dive at Rick’s?', 'Not at all — most guests watch with a drink in hand. Diving is open to anyone who wants it, at posted heights.'],
      ['Can this be a private romantic setup?', 'Yes — couples can add a private cabana, photographer hour, and beachside dinner. Request an itinerary and mention the occasion.']
    ],
    related: ['sunset-yacht-charter', 'blue-lagoon-morning-walk']
  }
];

/* ── shared page chrome ─────────────────────────────────────────── */

const CSS = `
:root{--navy:#063a63;--navy2:#0d5371;--orange:#ef8731;--ink:#15293d;--mut:#5c6f82;--bg:#f7fafc;--line:rgba(6,58,99,.1)}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Raleway',-apple-system,sans-serif;color:var(--ink);background:var(--bg);line-height:1.7;font-size:16px}
h1,h2,h3{font-family:'Playfair Display',serif;color:var(--navy);line-height:1.2}
a{color:var(--navy2);text-decoration:none}
img{max-width:100%;display:block}
.wrap{max-width:1040px;margin:0 auto;padding:0 22px}
.topbar{position:sticky;top:0;z-index:50;background:rgba(255,255,255,.92);backdrop-filter:blur(14px);border-bottom:1px solid var(--line)}
.topbar-in{display:flex;align-items:center;gap:18px;height:62px}
.brand{font-family:'Playfair Display',serif;font-weight:700;font-size:19px;color:var(--navy);letter-spacing:.4px}
.brand span{color:var(--orange)}
.topnav{margin-left:auto;display:flex;gap:20px;align-items:center;font-size:13.5px;font-weight:600}
.btn{display:inline-block;padding:12px 26px;border-radius:999px;font-weight:700;font-size:14px;transition:all .25s;border:2px solid transparent}
.btn-primary{background:var(--orange);color:#fff}
.btn-primary:hover{background:#d4741e;transform:translateY(-1px)}
.btn-ghost{border-color:var(--navy);color:var(--navy)}
.btn-ghost:hover{background:var(--navy);color:#fff}
.btn-sm{padding:9px 20px;font-size:13px}
.hero{position:relative;min-height:390px;display:flex;align-items:flex-end;background:var(--navy) center/cover no-repeat}
.hero::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(6,30,52,.15) 30%,rgba(6,30,52,.82))}
.hero-in{position:relative;z-index:2;padding:70px 0 34px;color:#fff;width:100%}
.crumbs{font-size:12.5px;letter-spacing:.4px;opacity:.85;margin-bottom:14px}
.crumbs a{color:#fff}
.hero h1{color:#fff;font-size:clamp(30px,5vw,48px);margin-bottom:10px}
.chips{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}
.chip{background:rgba(255,255,255,.14);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.25);padding:6px 15px;border-radius:999px;font-size:12.5px;font-weight:600}
.chip b{color:#ffd9b0;font-weight:800}
.sec{padding:44px 0}
.sec h2{font-size:26px;margin-bottom:16px}
.grid2{display:grid;grid-template-columns:1.6fr 1fr;gap:36px;align-items:start}
.card{background:#fff;border:1px solid var(--line);border-radius:18px;padding:26px;box-shadow:0 6px 24px rgba(6,58,99,.05)}
.list{list-style:none}
.list li{padding:8px 0 8px 28px;position:relative;border-bottom:1px dashed var(--line);font-size:14.5px}
.list li:last-child{border-bottom:0}
.list li::before{content:'✓';position:absolute;left:2px;color:var(--orange);font-weight:800}
.steps{list-style:none;counter-reset:s}
.steps li{counter-increment:s;padding:10px 0 10px 40px;position:relative;font-size:14.5px;border-bottom:1px dashed var(--line)}
.steps li:last-child{border-bottom:0}
.steps li::before{content:counter(s);position:absolute;left:0;top:9px;width:26px;height:26px;border-radius:50%;background:var(--navy);color:#fff;font-size:12.5px;font-weight:700;display:flex;align-items:center;justify-content:center;font-family:'Raleway',sans-serif}
.pano-wrap{position:relative;border-radius:18px;overflow:hidden;box-shadow:0 18px 48px rgba(6,30,52,.25);background:#0d3a5c}
#pano{width:100%;height:480px}
.pano-hint{position:absolute;left:50%;bottom:16px;transform:translateX(-50%);z-index:5;background:rgba(0,0,0,.55);backdrop-filter:blur(8px);color:#fff;font-size:12.5px;font-weight:600;padding:8px 18px;border-radius:999px;pointer-events:none}
.pano-badge{position:absolute;top:14px;left:14px;z-index:5;background:var(--orange);color:#fff;font-size:11px;font-weight:800;letter-spacing:1.2px;padding:6px 14px;border-radius:999px}
.portal-note{display:flex;gap:16px;align-items:center;background:linear-gradient(120deg,#063a63,#0d5371);border-radius:18px;padding:22px 26px;color:#fff;flex-wrap:wrap}
.portal-note p{flex:1;min-width:220px;font-size:14.5px;color:rgba(255,255,255,.88)}
.portal-note strong{color:#fff}
details{background:#fff;border:1px solid var(--line);border-radius:14px;padding:16px 20px;margin-bottom:10px}
details summary{cursor:pointer;font-weight:700;font-size:15px;color:var(--navy);list-style:none;position:relative;padding-right:26px}
details summary::after{content:'+';position:absolute;right:0;top:-2px;font-size:20px;color:var(--orange);font-weight:400}
details[open] summary::after{content:'–'}
details p{margin-top:10px;font-size:14.5px;color:var(--mut)}
.rel-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:18px}
.rel-card{background:#fff;border:1px solid var(--line);border-radius:16px;overflow:hidden;transition:transform .25s,box-shadow .25s}
.rel-card:hover{transform:translateY(-4px);box-shadow:0 14px 34px rgba(6,58,99,.12)}
.rel-card img{height:150px;width:100%;object-fit:cover}
.rel-card .rc-body{padding:16px 18px}
.rel-card h3{font-size:17px;margin-bottom:4px}
.rel-card p{font-size:12.5px;color:var(--mut)}
.cta-band{background:linear-gradient(120deg,#063a63,#0d5371);border-radius:22px;padding:44px 30px;text-align:center;color:#fff}
.cta-band h2{color:#fff;font-size:clamp(22px,3.4vw,32px);margin-bottom:10px}
.cta-band p{color:rgba(255,255,255,.8);max-width:560px;margin:0 auto 24px;font-size:15px}
.cta-row{display:flex;gap:14px;justify-content:center;flex-wrap:wrap}
.tour-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:22px}
.tour-card{background:#fff;border:1px solid var(--line);border-radius:18px;overflow:hidden;display:flex;flex-direction:column;transition:transform .25s,box-shadow .25s}
.tour-card:hover{transform:translateY(-5px);box-shadow:0 18px 40px rgba(6,58,99,.13)}
.tour-card .tc-img{position:relative;height:190px}
.tour-card .tc-img img{width:100%;height:100%;object-fit:cover}
.tc-360{position:absolute;top:12px;left:12px;background:var(--orange);color:#fff;font-size:10.5px;font-weight:800;letter-spacing:1px;padding:5px 12px;border-radius:999px}
.tc-body{padding:20px 22px 22px;display:flex;flex-direction:column;flex:1}
.tc-body h3{font-size:19px;margin-bottom:4px}
.tc-loc{font-size:12.5px;color:var(--mut);margin-bottom:10px}
.tc-desc{font-size:13.5px;color:var(--mut);flex:1;margin-bottom:14px}
.tc-foot{display:flex;align-items:center;justify-content:space-between}
.tc-price{font-size:13px;color:var(--mut)}
.tc-price b{color:var(--navy);font-size:17px;font-family:'Playfair Display',serif}
.intents{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin:26px 0 8px}
.intent{background:#fff;border:1px solid var(--line);border-radius:999px;padding:8px 18px;font-size:13px;font-weight:600;color:var(--navy)}
footer{border-top:1px solid var(--line);margin-top:50px;padding:30px 0 40px;font-size:13px;color:var(--mut)}
.foot-in{display:flex;gap:18px;flex-wrap:wrap;align-items:center;justify-content:space-between}
.foot-links{display:flex;gap:18px;flex-wrap:wrap}
@media(max-width:840px){.grid2{grid-template-columns:1fr}#pano{height:340px}.topnav .hide-m{display:none}}
`;

function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function money(n){return 'USD $' + n;}

function chrome(inner, {title, desc, canonical, ogImage, jsonld, extraHead=''}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Sight Seers Caribbean">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${ogImage.startsWith('http') ? ogImage : SITE + ogImage}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Raleway:wght@400;600;700;800&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
${extraHead}
${jsonld.map(o => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n')}
<style>${CSS}</style>
</head>
<body>
<header class="topbar"><div class="wrap topbar-in">
  <a class="brand" href="/">SIGHT SEERS <span>CARIBBEAN</span></a>
  <nav class="topnav">
    <a href="/virtual-tours/" class="hide-m">Virtual Tours</a>
    <a href="/#vtours" class="hide-m">Live 360&deg; Portal</a>
    <a href="/#booking" class="btn btn-primary btn-sm">Book Now</a>
  </nav>
</div></header>
${inner}
<footer><div class="wrap foot-in">
  <div>&copy; ${new Date().getFullYear()} Sight Seers Caribbean &mdash; Jamaica &amp; Caribbean group travel, tours &amp; virtual experiences.</div>
  <div class="foot-links">
    <a href="/">Main Site</a>
    <a href="/virtual-tours/">All Virtual Tours</a>
    <a href="/#vtours">Live 360&deg; Portal</a>
    <a href="/#contact">Contact a Planner</a>
  </div>
</div></footer>
</body>
</html>`;
}

/* ── per-tour page ──────────────────────────────────────────────── */

function tourPage(t) {
  const url = `${SITE}/virtual-tours/${t.slug}/`;
  const byslug = Object.fromEntries(TOURS.map(x => [x.slug, x]));

  const jsonld = [
    {
      '@context': 'https://schema.org',
      '@type': 'TouristTrip',
      name: t.title,
      description: t.short,
      url,
      image: (t.ogImage.startsWith('http') ? t.ogImage : SITE + t.ogImage),
      touristType: t.intents.join(', '),
      provider: { '@type': 'TravelAgency', name: 'Sight Seers Caribbean', url: SITE },
      offers: { '@type': 'Offer', price: String(t.priceFrom), priceCurrency: 'USD', availability: 'https://schema.org/InStock', url: `${SITE}/#booking` },
      itinerary: { '@type': 'ItemList', itemListElement: t.itinerary.map((n, i) => ({ '@type': 'ListItem', position: i + 1, name: n })) }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
        { '@type': 'ListItem', position: 2, name: 'Virtual Tours', item: SITE + '/virtual-tours/' },
        { '@type': 'ListItem', position: 3, name: t.title, item: url }
      ]
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: t.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } }))
    }
  ];

  const panoBlock = t.pano ? `
  <section class="sec" id="preview"><div class="wrap">
    <h2>Step Inside &mdash; Interactive 360&deg; Preview</h2>
    <p style="color:var(--mut);margin-bottom:18px;font-size:14.5px">This is a real 360&deg; scene from the tour. Click and drag (or swipe) to look around; scroll or pinch to zoom.</p>
    <div class="pano-wrap">
      <span class="pano-badge">LIVE 360&deg;</span>
      <div id="pano"></div>
      <div class="pano-hint">Drag to look around</div>
      <noscript><img src="${t.heroImage}" alt="360 degree panorama preview of ${esc(t.title)}"></noscript>
    </div>
  </div></section>` : `
  <section class="sec"><div class="wrap">
    <div class="portal-note">
      <p><strong>Live 360&deg; preview available.</strong> This experience is toured live inside the Sight Seers V-Tours portal &mdash; join a guided session with live chat, shoppable moments, and a local host on camera.</p>
      <a class="btn btn-primary" href="/#vtours">Enter the 360&deg; Portal</a>
    </div>
  </div></section>`;

  const panoScript = t.pano ? `
<link rel="stylesheet" href="/vendor/pannellum/pannellum.css">
<script src="/vendor/pannellum/pannellum.js" defer></script>
<script>
window.addEventListener('DOMContentLoaded',function(){
  if(typeof pannellum==='undefined')return;
  pannellum.viewer('pano',{type:'equirectangular',panorama:'${t.pano}',
    autoLoad:true,autoRotate:-1.5,autoRotateInactivityDelay:7000,
    yaw:${t.panoView.yaw},pitch:${t.panoView.pitch},hfov:${t.panoView.hfov},
    minHfov:55,maxHfov:110,showControls:false,keyboardZoom:true,mouseZoom:true});
});
</script>` : '';

  const related = t.related.map(slug => {
    const r = byslug[slug];
    const img = r.pano ? r.heroImage : r.heroImage.replace('w=1600&h=900', 'w=640&h=400');
    return `<a class="rel-card" href="/virtual-tours/${r.slug}/">
      <img src="${img}" alt="${esc(r.title)}" loading="lazy">
      <div class="rc-body"><h3>${esc(r.title)}</h3><p>${esc(r.location)} &middot; from ${money(r.priceFrom)}</p></div>
    </a>`;
  }).join('\n');

  const inner = `
<main>
  <div class="hero" style="background-image:url('${t.heroImage}')">
    <div class="wrap hero-in">
      <div class="crumbs"><a href="/">Home</a> / <a href="/virtual-tours/">Virtual Tours</a> / ${esc(t.title)}</div>
      <h1>${esc(t.title)}</h1>
      <div class="chips">
        <span class="chip">${esc(t.location)}</span>
        <span class="chip">${esc(t.category)}</span>
        <span class="chip">${esc(t.duration)}</span>
        <span class="chip">${esc(t.group)}</span>
        <span class="chip">From <b>${money(t.priceFrom)}</b> / person</span>
      </div>
    </div>
  </div>

  ${panoBlock}

  <section class="sec" style="padding-top:${t.pano ? '10px' : '0'}"><div class="wrap grid2">
    <div>
      <h2>About This Experience</h2>
      ${t.overview.map(p => `<p style="margin-bottom:14px;color:#33475b;font-size:15px">${p}</p>`).join('\n')}
      <h2 style="margin-top:30px">Tour Stops</h2>
      <ol class="steps">${t.itinerary.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
    </div>
    <div>
      <div class="card">
        <h3 style="font-size:19px;margin-bottom:12px">What&rsquo;s Included</h3>
        <ul class="list">${t.included.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
        <div style="margin-top:20px;display:flex;flex-direction:column;gap:10px">
          <a class="btn btn-primary" style="text-align:center" href="/#booking">Book This Experience</a>
          <a class="btn btn-ghost" style="text-align:center" href="/#contact">Request an Itinerary</a>
          <a style="text-align:center;font-size:13px;font-weight:600" href="/#vtours">Preview live in the 360&deg; portal &rarr;</a>
        </div>
      </div>
    </div>
  </div></section>

  <section class="sec" style="padding-top:0"><div class="wrap">
    <h2>Good to Know</h2>
    ${t.faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('\n')}
  </div></section>

  <section class="sec" style="padding-top:0"><div class="wrap">
    <h2>You Might Also Like</h2>
    <div class="rel-grid">${related}</div>
  </div></section>

  <section class="sec" style="padding-top:0"><div class="wrap">
    <div class="cta-band">
      <h2>Ready to make it real?</h2>
      <p>Tell a Sight Seers planner your dates, group size, and vibe &mdash; we&rsquo;ll build the itinerary around ${esc(t.title)} and handle every transfer.</p>
      <div class="cta-row">
        <a class="btn btn-primary" href="/#booking">Start Planning</a>
        <a class="btn" style="border-color:rgba(255,255,255,.5);color:#fff" href="/#vtours">Watch a Live 360&deg; Session</a>
      </div>
    </div>
  </div></section>
</main>`;

  return chrome(inner, {
    title: `${t.title} — 360° Virtual Tour & Booking | Sight Seers Caribbean`,
    desc: t.short + ` From ${money(t.priceFrom)} per person · ${t.duration} · ${t.location}.`,
    canonical: url,
    ogImage: t.ogImage,
    jsonld,
    extraHead: panoScript
  });
}

/* ── hub page ───────────────────────────────────────────────────── */

function hubPage() {
  const url = `${SITE}/virtual-tours/`;
  const jsonld = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Caribbean Virtual Tours — Sight Seers Caribbean',
      description: 'Explore Jamaica in 360° before you book: interactive panoramic previews and live guided virtual tours of beaches, yacht charters, waterfalls, markets, and food tours.',
      url,
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: TOURS.map((t, i) => ({
          '@type': 'ListItem', position: i + 1, name: t.title, url: `${SITE}/virtual-tours/${t.slug}/`
        }))
      }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
        { '@type': 'ListItem', position: 2, name: 'Virtual Tours', item: url }
      ]
    }
  ];

  const cards = TOURS.map(t => {
    const img = t.pano ? t.heroImage : t.heroImage.replace('w=1600&h=900', 'w=640&h=400');
    return `<a class="tour-card" href="/virtual-tours/${t.slug}/">
      <div class="tc-img"><img src="${img}" alt="${esc(t.title)} — ${esc(t.location)}" loading="lazy">${t.pano ? '<span class="tc-360">INTERACTIVE 360&deg;</span>' : ''}</div>
      <div class="tc-body">
        <h3>${esc(t.title)}</h3>
        <div class="tc-loc">${esc(t.location)} &middot; ${esc(t.duration)}</div>
        <p class="tc-desc">${esc(t.short)}</p>
        <div class="tc-foot"><span class="tc-price">from <b>${money(t.priceFrom)}</b></span><span class="btn btn-ghost btn-sm">Explore &rarr;</span></div>
      </div>
    </a>`;
  }).join('\n');

  const intents = ['Romance', 'Groups & Greek Life', 'Adventure', 'Culture & Food', 'Luxury & Yacht', 'Family', 'Relaxation'];

  const inner = `
<main>
  <div class="hero" style="background-image:url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&h=900&fit=crop');min-height:430px">
    <div class="wrap hero-in">
      <div class="crumbs"><a href="/">Home</a> / Virtual Tours</div>
      <h1>Step Inside Jamaica Before You Book</h1>
      <p style="max-width:640px;color:rgba(255,255,255,.88);font-size:16.5px">Every Sight Seers experience can be previewed before you commit &mdash; interactive 360&deg; scenes you can look around, and live guided sessions with a local host on camera, live chat, and shoppable moments.</p>
      <div class="chips">
        <span class="chip"><b>${TOURS.length}</b> tour pages</span>
        <span class="chip"><b>2</b> interactive 360&deg; scenes</span>
        <span class="chip">Live guided sessions daily</span>
      </div>
    </div>
  </div>

  <section class="sec"><div class="wrap">
    <div class="intents">${intents.map(i => `<span class="intent">${i}</span>`).join('')}</div>
  </div></section>

  <section class="sec" style="padding-top:0"><div class="wrap">
    <div class="tour-grid">${cards}</div>
  </div></section>

  <section class="sec" style="padding-top:6px"><div class="wrap">
    <div class="portal-note">
      <p><strong>Prefer it live?</strong> The V-Tours portal streams guided 360&deg; sessions with real hosts &mdash; ask questions in chat, vote on where the guide goes next, and add finds to your cart mid-tour.</p>
      <a class="btn btn-primary" href="/#vtours">Enter the Live Portal</a>
    </div>
  </div></section>

  <section class="sec" style="padding-top:0"><div class="wrap">
    <div class="cta-band">
      <h2>Not sure which experience fits your group?</h2>
      <p>Tell us your dates, group size, and occasion. A Sight Seers planner will match the tours, stays, and transport &mdash; usually within a day.</p>
      <div class="cta-row">
        <a class="btn btn-primary" href="/#booking">Start Planning</a>
        <a class="btn" style="border-color:rgba(255,255,255,.5);color:#fff" href="/#contact">Talk to a Planner</a>
      </div>
    </div>
  </div></section>
</main>`;

  return chrome(inner, {
    title: 'Caribbean Virtual Tours — Preview Jamaica in 360° | Sight Seers Caribbean',
    desc: 'Explore Jamaica in 360° before you book. Interactive panoramic previews and live guided virtual tours of Blue Lagoon, yacht charters, Dunn’s River Falls, markets, food tours, and Seven Mile Beach.',
    canonical: url,
    ogImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=630&fit=crop',
    jsonld
  });
}

/* ── write files ────────────────────────────────────────────────── */

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'index.html'), hubPage());
let count = 1;
for (const t of TOURS) {
  const dir = path.join(OUT, t.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), tourPage(t));
  count++;
}
console.log(`✅ Generated ${count} pages under public/virtual-tours/`);
