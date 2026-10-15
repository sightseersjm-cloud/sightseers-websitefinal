/**
 * api/_lib/geo.js
 * Where a request came from, as far as the host can tell (the visitor's IP address, looked up by Vercel).
 * Only the country (and the city when given) is kept, never the IP address itself.
 */
function geo(req) {
  const h = (req && req.headers) || {};
  const country = String(h['x-vercel-ip-country'] || '').trim().toUpperCase();
  let city = String(h['x-vercel-ip-city'] || '').trim();
  try { city = decodeURIComponent(city); } catch (e) { /* keep as is */ }
  return { country: /^[A-Z]{2}$/.test(country) ? country : '', city: city.slice(0, 80) };
}
module.exports = { geo };
