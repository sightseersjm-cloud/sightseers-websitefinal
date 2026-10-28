/* Changing the live site's wording, photos and added sections, with a record of every change.
   A change either goes live straight away (owners, and team members the owner trusts to publish) or waits as a
   draft until the owner approves it. Every live change is written to the history so it can be put back. */
const db = require('./db');
const { readSettings, writeSettings } = require('./siteStore');
const { uid } = require('./auth');
const catalog = require('./catalog');

const PE = 'ss_page_editor_settings';   // wording and photos tied to a place on a page
const SITE = 'ss_site_settings';        // brand, phones, home hero and a few home-page blocks
const DYN = 'ss_dynamic_sections_v1';   // sections added to a page
const CAT = 'ss_catalog_v1';            // experiences hidden, edited or added: { experiences: { edits, hidden, added } }
const TEXT = 'ss_text_edits_v1';        // any word or photo changed in place: { page or '*': { original text or 'img:' + original photo: new value } }

/* admin field id -> the key the site reads it from in the SITE store. Anything not listed lives in PE under its own id. */
const SITE_FIELDS = {
  adminBrandName: 'brandName', adminTagline: 'tagline', adminPhone1: 'phone1', adminPhone2: 'phone2', adminEmail: 'email',
  adminHeroEyebrow: 'heroEyebrow', adminHeroTitle: 'heroTitle', adminHeroEm: 'heroEm', adminHeroSub: 'heroSub',
  adminAboutTitle: 'aboutTitle', adminAboutBody: 'aboutBody', adminCustomerTitle: 'customerTitle', adminCustomerSub: 'customerSub',
  adminHeroImg1: 'heroImg1', adminHeroImg2: 'heroImg2', adminHeroImg3: 'heroImg3', adminAboutImage: 'aboutImage', adminJamaicaImage: 'jamaicaImage',
  adminSpecialKicker: 'specialKicker', adminSpecialTitle: 'specialTitle', adminSpecialBody: 'specialBody',
  adminHeroSlide1Eyebrow: 'heroSlide1Eyebrow', adminHeroSlide1Title: 'heroSlide1Title', adminHeroSlide1Em: 'heroSlide1Em', adminHeroSlide1Sub: 'heroSlide1Sub',
  adminHeroSlide3Eyebrow: 'heroSlide3Eyebrow', adminHeroSlide3Title: 'heroSlide3Title', adminHeroSlide3Em: 'heroSlide3Em', adminHeroSlide3Sub: 'heroSlide3Sub'
};
const PAGES = ['home', 'about', 'gallery', 'tours', 'transfers', 'destinations', 'stays', 'contact', 'blog', 'booking', 'partners'];
const SECTION_TYPES = ['packages', 'cards', 'banner', 'text'];
const MAX_TEXT = 6000;
const MAX_SECTIONS = 60;
const KEEP_HISTORY = 1500;
const KEEP_SECTION_SNAPSHOTS = 30;

const SECTIONS_ID = '@sections';
const TEXT_ID = '@t';
const CAT_ID = '@c';
const catFieldId = (list, key) => CAT_ID + ':' + list + ':' + shortHash(key);
const MAX_TEXT_EDITS = 3000;
const normText = v => String(v == null ? '' : v).replace(/\s+/g, ' ').trim();
const shortHash = v => require('crypto').createHash('sha1').update(String(v)).digest('hex').slice(0, 8);
const textFieldId = (scope, orig) => TEXT_ID + ':' + scope + ':' + shortHash(orig);
const countTextEdits = doc => Object.keys(doc || {}).reduce((n, k) => n + Object.keys(doc[k] || {}).length, 0);

function where(id) {
  const m = /^(admin[A-Za-z0-9]{2,80})(__alt|__focus)?$/.exec(String(id || ''));
  if (!m) return null;
  const base = m[1], suffix = m[2] || '';
  return SITE_FIELDS[base] ? { store: SITE, key: SITE_FIELDS[base] + suffix, suffix } : { store: PE, key: base + suffix, suffix };
}

/* photos must be web addresses or paths on this site: nothing that could run as a script */
const okUrl = v => /^(https:\/\/[^\s'"()<>\\]{1,1800}|\/[^\s'"()<>\\]{0,1800})$/.test(v);

/* the item lines of a section hold links and photo addresses between "|" marks: nothing that runs as a script may get through */
const safeCells = text => text.split('\n').map(line => line.split('|').map(c => /^\s*(javascript|vbscript):|^\s*data:(?!image\/)/i.test(c) ? '#' : c).join('|')).join('\n');

function cleanSections(list) {
  if (!Array.isArray(list)) return { error: 'Sections must be a list.' };
  if (list.length > MAX_SECTIONS) return { error: 'That is more sections than the site can hold (' + MAX_SECTIONS + ').' };
  const out = [];
  for (const s of list) {
    if (!s || typeof s !== 'object') continue;
    const page = PAGES.includes(s.page) ? s.page : 'home';
    const type = SECTION_TYPES.includes(s.type) ? s.type : 'text';
    const t = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').slice(0, n);
    const image = t(s.image, 1800).trim();
    if (image && !okUrl(image)) return { error: 'A section photo must be a web address starting with https:// or a path on this site.' };
    const item = { page, type, eyebrow: t(s.eyebrow, 200), title: t(s.title, 300), subtitle: t(s.subtitle, 800), image, entries: safeCells(t(s.entries, 6000)), extra: safeCells(t(s.extra, 3000)) };
    if (s.hidden === true) item.hidden = true;
    out.push(item);
  }
  return { value: out };
}

/* checks one change from the browser and gives back a tidy copy, or says what is wrong with it */
function cleanChange(c) {
  if (!c || typeof c !== 'object') return { error: 'A change was not understood.' };
  const label = String(c.label || '').slice(0, 160);
  const page = String(c.page || '').replace(/[^a-z0-9-]/gi, '').slice(0, 40);
  if (c.id === SECTIONS_ID) {
    const r = cleanSections(c.value);
    return r.error ? r : { id: SECTIONS_ID, kind: 'sections', value: r.value, label: label || 'Added sections', page };
  }
  if (c.id === CAT_ID) {
    const list = String(c.list || '');
    const r = catalog.cleanState(list, c.key, c.value);
    if (r.error) return r;
    const spec = catalog.LISTS[list];
    return { id: CAT_ID, kind: 'c', list, key: String(c.key), value: r.value, label: label || spec.noun.charAt(0).toUpperCase() + spec.noun.slice(1), page: spec.page, before: c.before && typeof c.before === 'object' ? c.before : {} };
  }
  if (c.id === TEXT_ID) {
    const scope = c.scope === '*' ? '*' : String(c.scope || '').replace(/[^a-z0-9-]/gi, '').slice(0, 40);
    if (!scope) return { error: 'That change did not say which page it belongs to.' };
    const isImg = c.kind === 'ti';
    let orig = isImg ? String(c.orig || '').trim() : normText(c.orig);
    if (isImg) {
      if (!okUrl(orig)) return { error: 'That photo could not be identified.' };
      orig = 'img:' + orig;
    } else if (!orig || orig.length > 600 || /^img:/.test(orig)) return { error: 'That wording could not be identified.' };
    let value = typeof c.value === 'string' ? c.value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '') : null;
    if (value === null) return { error: 'The new value must be text.' };
    if (isImg) { value = value.trim(); if (value && !okUrl(value)) return { error: 'A photo must be a web address starting with https:// or a path on this site.' }; }
    else { value = value.replace(/\s+/g, ' ').trim(); if (value.length > 1200) return { error: 'That text is too long.' }; }
    return { id: TEXT_ID, kind: isImg ? 'ti' : 't', scope, orig, value, label: label || (isImg ? 'Photo' : 'Wording'), page: scope === '*' ? '' : scope, before: normText(c.before).slice(0, MAX_TEXT) };
  }
  const loc = where(c.id);
  if (!loc) return { error: 'That field is not one that can be changed here.' };
  let value = c.value;
  if (typeof value !== 'string') return { error: 'The new value must be text.' };
  value = value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
  let kind = c.kind === 'image' ? 'image' : 'text';
  if (loc.suffix === '__alt') {
    kind = 'alt';
    value = value.trim().slice(0, 200) || ' ';       // a single space stands for "no description", so older browsers still take the change
  } else if (loc.suffix === '__focus') {
    kind = 'focus';
    if (!/^\d{1,3}% \d{1,3}%$/.test(value.trim())) return { error: 'The photo focus point was not understood.' };
    value = value.trim();
  } else if (kind === 'image') {
    value = value.trim();
    if (!okUrl(value)) return { error: 'A photo must be a web address starting with https:// or a path on this site.' };
  } else {
    if (!value.trim()) return { error: 'The wording cannot be empty. Use "Put back the original" to go back to the first version.' };
    if (value.length > MAX_TEXT) return { error: 'That text is too long.' };
  }
  const before = typeof c.before === 'string' ? c.before.slice(0, MAX_TEXT) : '';
  return { id: c.id, kind, value, label, page, before, store: loc.store, key: loc.key };
}

const who = u => ({ id: u.id, name: u.name || u.email || 'Someone', role: u.role });

/* put cleaned changes on the live site and record them. Returns the history entries it made. */
async function publish(changes, user, meta) {
  meta = meta || {};
  const settings = await readSettings();
  const group = uid();
  const at = new Date().toISOString();
  const made = [];
  for (const c of changes) {
    let store, key, now, was;
    if (c.id === CAT_ID) {
      store = CAT;
      const doc = settings[CAT] && typeof settings[CAT] === 'object' && !Array.isArray(settings[CAT]) ? settings[CAT] : {};
      was = catalog.stateOf(doc[c.list], c.key);
      const put = catalog.putState(doc[c.list], c.key, c.value, c.list);
      if (put.error) throw new Error(put.error);
      doc[c.list] = put.doc; settings[CAT] = doc; now = c.value;
      made.push({ id: uid(), group, at, by: who(user), fieldId: catFieldId(c.list, c.key), store, kind: 'c', label: c.label, page: (catalog.LISTS[c.list] || {}).page || 'tours', list: c.list, key: c.key, before: was, after: now,
        via: meta.via || 'direct', note: meta.note || '', approvedBy: meta.approvedBy || null, restoredFrom: meta.restoredFrom || null });
      continue;
    }
    if (c.id === TEXT_ID) {
      store = TEXT;
      const doc = settings[TEXT] && typeof settings[TEXT] === 'object' && !Array.isArray(settings[TEXT]) ? settings[TEXT] : {};
      const sc = doc[c.scope] && typeof doc[c.scope] === 'object' ? doc[c.scope] : {};
      was = sc[c.orig] !== undefined ? sc[c.orig] : '';
      if (c.value === '') delete sc[c.orig]; else sc[c.orig] = c.value;
      if (Object.keys(sc).length) doc[c.scope] = sc; else delete doc[c.scope];
      settings[TEXT] = doc; now = c.value;
      made.push({ id: uid(), group, at, by: who(user), fieldId: textFieldId(c.scope, c.orig), store, kind: c.kind, label: c.label, page: c.page || '', scope: c.scope, orig: c.orig, before: was, after: now,
        via: meta.via || 'direct', note: meta.note || '', approvedBy: meta.approvedBy || null, restoredFrom: meta.restoredFrom || null });
      continue;
    }
    if (c.id === SECTIONS_ID) { store = DYN; was = Array.isArray(settings[DYN]) ? settings[DYN] : []; settings[DYN] = c.value; now = c.value; }
    else {
      store = c.store; key = c.key;
      const doc = settings[store] && typeof settings[store] === 'object' && !Array.isArray(settings[store]) ? settings[store] : {};
      was = doc[key] !== undefined ? doc[key] : (c.before || '');
      doc[key] = c.value; settings[store] = doc; now = c.value;
    }
    made.push({ id: uid(), group, at, by: who(user), fieldId: c.id, store, kind: c.kind, label: c.label, page: c.page || '', before: was, after: now,
      via: meta.via || 'direct', note: meta.note || '', approvedBy: meta.approvedBy || null, restoredFrom: meta.restoredFrom || null });
  }
  await writeSettings(settings);
  let hist = await db.getCollection('site-history');
  hist = hist.concat(made);
  /* added-section snapshots are big, so only the latest few are kept */
  let snaps = 0;
  for (let i = hist.length - 1; i >= 0; i--) if (hist[i].kind === 'sections' && ++snaps > KEEP_SECTION_SNAPSHOTS) hist[i] = null;
  hist = hist.filter(Boolean);
  if (hist.length > KEEP_HISTORY) hist = hist.slice(-KEEP_HISTORY);
  await db.setCollection('site-history', hist);
  return made;
}

/* what a change would replace right now, so the person approving sees the real before and after */
function liveValue(settings, c) {
  if (c.id === CAT_ID) { const d = settings[CAT]; return catalog.stateOf(d && d[c.list], c.key); }
  if (c.id === TEXT_ID) { const d = settings[TEXT]; const sc = d && d[c.scope]; return sc && sc[c.orig] !== undefined ? sc[c.orig] : ''; }
  if (c.id === SECTIONS_ID) return Array.isArray(settings[DYN]) ? settings[DYN] : [];
  const loc = where(c.id);
  const doc = (loc && settings[loc.store]) || {};
  return loc && doc[loc.key] !== undefined ? doc[loc.key] : (c.before || '');
}
async function currentValue(c) { return liveValue(await readSettings(), c); }

async function makeDraft(changes, user, note) {
  const draft = { id: uid(), at: new Date().toISOString(), by: who(user), note: String(note || '').slice(0, 400), status: 'pending',
    changes: changes.map(c => Object.assign({ id: c.id, kind: c.kind, label: c.label, page: c.page, before: c.before || '', after: c.value }, c.id === TEXT_ID ? { scope: c.scope, orig: c.orig } : c.id === CAT_ID ? { list: c.list, key: c.key } : {})) };
  const drafts = await db.getCollection('site-drafts');
  drafts.push(draft);
  await db.setCollection('site-drafts', drafts.slice(-300));
  return draft;
}

module.exports = { PE, SITE, DYN, TEXT, TEXT_ID, CAT, CAT_ID, MAX_TEXT_EDITS, countTextEdits, textFieldId, SITE_FIELDS, PAGES, SECTIONS_ID, where, okUrl, cleanChange, cleanSections, publish, currentValue, liveValue, makeDraft, who };
