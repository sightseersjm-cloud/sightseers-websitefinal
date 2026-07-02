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
 * Tour data lives in tours-data.json (shared with /api/vtours).
 * Regenerate after editing:  node build-tours.js
 */

const fs = require('fs');
const path = require('path');

const SITE = 'https://www.sightseerscaribbean.com';
const OUT = path.join(__dirname, 'public', 'virtual-tours');

const TOURS = require('./tours-data.json').map(t => ({
  ...t,
  pano: t.media.pano,
  ogImage: t.media.og,
  heroImage: t.media.hero,
  panoView: t.spatial ? t.spatial.view : null
}));

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

function chrome(inner, {title, desc, canonical, ogImage, jsonld, extraHead='', trackKey='page'}) {
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
<script>
(function(){var q=[{e:'tour_page',k:'${trackKey}'}];
function fl(){if(!q.length)return;var p=JSON.stringify({events:q.splice(0,25)});try{if(navigator.sendBeacon){navigator.sendBeacon('/api/track',p)}else{fetch('/api/track',{method:'POST',body:p,keepalive:true}).catch(function(){})}}catch(e){}}
document.addEventListener('click',function(ev){
  var b=ev.target.closest&&ev.target.closest('a[href*="#booking"]');if(b)q.push({e:'book_cta',k:'${trackKey}'});
  var c=ev.target.closest&&ev.target.closest('a[href*="#contact"]');if(c)q.push({e:'quote_cta',k:'${trackKey}'});
  if(b||c)fl();
});
addEventListener('pagehide',fl);setTimeout(fl,1500);})();
</script>
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
    extraHead: panoScript,
    trackKey: t.slug
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
        <span class="chip"><b>${TOURS.filter(t => t.pano).length}</b> interactive 360&deg; scenes</span>
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
    jsonld,
    trackKey: 'hub'
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

module.exports = { TOURS };
