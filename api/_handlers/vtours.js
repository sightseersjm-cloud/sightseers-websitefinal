/**
 * api/_handlers/vtours.js
 * Public, read-only tour-data API — the content contract shared by the
 * website's /virtual-tours/ pages, the live 360° portal, and the future
 * Sight Seers Spatial Tour Portals app for Apple Vision Pro (visionOS 26).
 *
 *   GET /api/vtours              → { ok, version, count, tours: [...] }
 *   GET /api/vtours?slug=<slug>  → { ok, version, tour: {...} }
 *
 * Data source: tours-data.json at the repo root (also consumed by
 * build-tours.js, which generates the static landing pages).
 * All media URLs are returned absolute so native clients can load them
 * directly. Spatial tours carry scene view params and hotspots with
 * pitch/yaw positions ready for RealityKit anchoring.
 */

const TOURS = require('../../tours-data.json');

const SITE = 'https://www.sightseerscaribbean.com';
const API_VERSION = '2026-07-02';

function absolute(url) {
  if (!url) return null;
  return url.startsWith('http') ? url : SITE + url;
}

function publicTour(t) {
  return {
    id: t.slug,
    slug: t.slug,
    title: t.title,
    location: t.location,
    category: t.category,
    intents: t.intents,
    duration: t.duration,
    groupSize: t.group,
    pricing: { from: t.priceFrom, currency: t.currency || 'USD' },
    shortDescription: t.short,
    overview: t.overview,
    included: t.included,
    itinerary: t.itinerary,
    faq: t.faq.map(([question, answer]) => ({ question, answer })),
    related: t.related,
    media: {
      hero: absolute(t.media.hero),
      og: absolute(t.media.og),
      panorama: absolute(t.media.pano)
    },
    spatial: t.spatial
      ? {
          type: 'equirectangular',
          panorama: absolute(t.media.pano),
          initialView: t.spatial.view,
          ambientAudioLabel: t.spatial.ambient,
          hotspots: t.spatial.hotspots
        }
      : null,
    links: {
      page: `${SITE}/virtual-tours/${t.slug}/`,
      book: `${SITE}/#booking`,
      livePortal: `${SITE}/#vtours`
    }
  };
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');

  const { slug } = req.query || {};
  if (slug) {
    const tour = TOURS.find(t => t.slug === slug);
    if (!tour) return res.status(404).json({ error: 'Tour not found', slug });
    return res.status(200).json({ ok: true, version: API_VERSION, tour: publicTour(tour) });
  }

  return res.status(200).json({
    ok: true,
    version: API_VERSION,
    count: TOURS.length,
    tours: TOURS.map(publicTour)
  });
};
