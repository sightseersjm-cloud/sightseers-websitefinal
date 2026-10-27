/**
 * api/_lib/club-entry.js
 * The owner-approved "know before you go" cards behind each Travel Club trip's checklist:
 *
 *   destination (the country a trip goes to)  x  passport (the country on the traveler's passport)
 *
 * The starting text lives in api/_data/club-entry-drafts.json. It was drafted from official government and tourism pages.
 * A traveler sees an entry only once it is approved: the owner approved the entries that have a summary and an official link,
 * and can unapprove or edit any of them in the website manager (Destinations tab).
 * The owner's edits and approvals are stored in 'club-destinations' and override the drafts field by field.
 * Nothing is invented: an entry cannot be approved without a summary and at least one official link, and a passport nobody
 * has prepared gets no card, never a guess. The only thing collected from travelers is the passport's country, never a passport number.
 */

const db = require('./db');
let DRAFTS = { destinations: [] };
try { DRAFTS = require('../_data/club-entry-drafts.json'); } catch (e) { /* the drafts are optional */ }

const COL = 'club-destinations';
const PREPARED = ['United States', 'Canada', 'United Kingdom', 'Jamaica'];
const CONFIDENCE = ['high', 'medium', 'low'];
const GENERAL_FIELDS = ['currency', 'language', 'plug', 'voltage', 'driving'];

function str(v, max) { return String(v == null ? '' : v).trim().slice(0, max || 300); }
function norm(s) { return String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/^the\s+/, '').trim(); }
function slug(s) { return norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60); }
function httpsLinks(v) {
  const arr = Array.isArray(v) ? v : String(v == null ? '' : v).split(/\r?\n/);
  const out = [];
  arr.forEach(x => {
    const u = str(x, 400);
    if (!u) return;
    try { const p = new URL(u); if (p.protocol === 'https:' && p.hostname.indexOf('.') > 0 && out.indexOf(p.toString()) < 0) out.push(p.toString()); } catch (e) { /* skip */ }
  });
  return out.slice(0, 6);
}

/* a shipped approval only counts when the same rule the admin screen enforces holds: a summary and an official link (general: a source and one detail) */
function okEntry(e) { return !!(e && str(e.summary, 900) && httpsLinks(e.officialLinks).length); }
function okGeneral(g) { return !!(g && httpsLinks(g.sources).length && GENERAL_FIELDS.some(k => str(g[k], 200))); }
function fromDraft(d) {
  const g = Object.assign({}, d.general || {});
  g.status = g.status === 'approved' && okGeneral(g) ? 'approved' : 'draft';
  const entry = {};
  Object.keys(d.entry || {}).forEach(p => {
    const e = Object.assign({}, d.entry[p]);
    e.status = e.status === 'approved' && okEntry(e) ? 'approved' : 'draft';
    entry[p] = e;
  });
  return { id: d.id || slug(d.country), country: d.country, source: 'research', reviewNote: d.reviewNote || '', general: g, entry };
}

/* every destination, the research drafts with the owner's saved edits and approvals laid over them */
async function all() {
  const out = {};
  (DRAFTS.destinations || []).forEach(d => { const x = fromDraft(d); out[x.id] = x; });
  (await db.getCollection(COL)).forEach(doc => {
    const base = out[doc.id] || { id: doc.id, country: doc.country, source: 'owner', reviewNote: '', general: { status: 'draft' }, entry: {} };
    if (doc.general) base.general = Object.assign({}, base.general, doc.general);
    Object.keys(doc.entry || {}).forEach(p => { base.entry[p] = Object.assign({}, base.entry[p] || {}, doc.entry[p]); });
    if (doc.country) base.country = doc.country;
    out[doc.id] = base;
  });
  return Object.keys(out).map(k => out[k]).sort((a, b) => a.country.localeCompare(b.country));
}

function cleanGeneral(f) {
  const o = {};
  GENERAL_FIELDS.forEach(k => { o[k] = str(f && f[k], 200); });
  o.sources = httpsLinks(f && f.sources);
  return o;
}
function cleanEntry(f) {
  f = f || {};
  return {
    summary: str(f.summary, 900), passportValidity: str(f.passportValidity, 600), extra: str(f.extra, 1400),
    officialLinks: httpsLinks(f.officialLinks), checkedOn: /^\d{4}-\d{2}-\d{2}$/.test(str(f.checkedOn, 10)) ? str(f.checkedOn, 10) : '',
    confidence: CONFIDENCE.indexOf(f.confidence) > -1 ? f.confidence : 'medium'
  };
}

async function load(country) {
  const id = slug(country);
  const doc = (await db.getCollection(COL)).find(x => x.id === id);
  return { id, doc };
}
async function write(id, doc, patch) {
  if (doc) return db.updateInCollection(COL, id, patch);
  return db.addToCollection(COL, Object.assign({ id, createdAt: new Date().toISOString() }, patch));
}

/**
 * Saves the general card or one passport's entry for a destination, as a draft or approved.
 * Approving needs a summary and an official link (general: at least one source), so nothing unsourced reaches a traveler.
 */
async function save(input, by) {
  const country = str(input.country, 80);
  if (!country) return { error: 'Choose a destination.' };
  const status = input.status === 'approved' ? 'approved' : 'draft';
  const { id, doc } = await load(country);
  const now = new Date().toISOString();
  const stamp = status === 'approved' ? { status, approvedAt: now, approvedBy: by || '' } : { status: 'draft', approvedAt: '', approvedBy: '' };
  if (input.scope === 'general') {
    const g = cleanGeneral(input.fields);
    if (status === 'approved' && (!g.currency && !g.language && !g.plug && !g.voltage && !g.driving)) return { error: 'Fill in at least one detail before approving.' };
    if (status === 'approved' && !g.sources.length) return { error: 'Add at least one official source link before approving.' };
    await write(id, doc, { country: (doc && doc.country) || country, general: Object.assign(g, stamp, { updatedAt: now }) });
    return { ok: true };
  }
  const passport = str(input.passport, 60);
  if (!passport) return { error: 'Choose a passport country.' };
  const e = cleanEntry(input.fields);
  if (status === 'approved' && !e.summary) return { error: 'Add the entry summary before approving.' };
  if (status === 'approved' && !e.officialLinks.length) return { error: 'Add at least one official link before approving, so travelers can check it themselves.' };
  const entry = Object.assign({}, (doc && doc.entry) || {}, { [passport]: Object.assign(e, stamp, { updatedAt: now }) });
  await write(id, doc, { country: (doc && doc.country) || country, entry });
  return { ok: true };
}
/* back to the research draft, dropping the owner's edits */
async function reset(country) {
  const { id, doc } = await load(country);
  if (doc) await db.removeFromCollection(COL, id);
  return { ok: true };
}

/* what a traveler may see: only approved material, and only for the passport on their profile */
function pick(list, destination, passport) {
  if (!destination) return null;
  const key = norm(destination);
  const d = list.find(x => norm(x.country) === key);
  if (!d) return null;
  const g = d.general && d.general.status === 'approved' ? d.general : null;
  const pk = norm(passport);
  const pname = Object.keys(d.entry).find(p => norm(p) === pk);
  const e = pname && d.entry[pname].status === 'approved' ? d.entry[pname] : null;
  if (!g && !e) return null;
  const pickG = g ? { currency: g.currency, language: g.language, plug: g.plug, voltage: g.voltage, driving: g.driving, sources: g.sources || [] } : null;
  const pickE = e ? { passport: pname, summary: e.summary, passportValidity: e.passportValidity, extra: e.extra, officialLinks: e.officialLinks || [], checkedOn: e.checkedOn || '' } : null;
  return { country: d.country, general: pickG, entry: pickE };
}
async function forTraveler(destination, passport) { return pick(await all(), destination, passport); }

/* which passports travelers have told us about, and whether we have prepared (and approved) anything for them */
function demand(users, interests, destinations) {
  const counts = {};
  const add = c => { const n = str(c, 60); if (n) counts[n] = (counts[n] || 0) + 1; };
  const seen = {};
  users.forEach(u => { if (u.passportCountry) { add(u.passportCountry); seen[(u.email || '').toLowerCase()] = 1; } });
  interests.forEach(i => { const e = (i.email || '').toLowerCase(); if (i.passportCountry && !seen[e]) { add(i.passportCountry); seen[e] = 1; } });
  const approved = {};
  destinations.forEach(d => Object.keys(d.entry).forEach(p => { if (d.entry[p].status === 'approved') approved[norm(p)] = 1; }));
  return Object.keys(counts).map(c => ({ country: c, count: counts[c], covered: !!approved[norm(c)] })).sort((a, b) => b.count - a.count);
}

function cleanPassport(v) { return str(v, 60); }
function cleanExpiry(v) { const s = str(v, 7); return /^\d{4}-(0[1-9]|1[0-2])$/.test(s) ? s : ''; }

module.exports = { PREPARED, all, save, reset, pick, forTraveler, demand, cleanPassport, cleanExpiry, norm, slug };
