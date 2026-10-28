/* The catalogs as the owner edits them: changes laid over the lists that are written in the site's code (experiences, destination packages, stays).
   One file, used in three places: the admin saves and checks changes with it, the experience pages and the trip builder's
   prices are worked out with it on the server, and the browser applies it to the list the site shows.
   (build.js copies this file to public/ss-catalog.js for the browser.)

   What is stored, per list ("experiences", "packages", "stays"):
     edits:  { <the original key>: { field: value, ... } }   changes to an item that comes with the site
     hidden: { <the original key>: true }                     items taken off the website
     added:  [ { id, title, ... } ]                           items the owner added
   The original key is the title for an experience, "Island|title" for a package and the id for a stay.
   A "state" is everything stored for one item: { edits, hidden, added }. Saving a state replaces what was stored. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SSCatalog = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var COUNTRIES = ['Jamaica', 'Barbados', 'Saint Lucia', 'The Bahamas', 'Belize', 'Curacao', 'Dominican Republic'];
  /* what each list is called, which page of the site it lives on, and how many added items it can hold */
  var LISTS = {
    experiences: { noun: 'experience', page: 'tours', max: 120 },
    packages: { noun: 'package', page: 'destinations', max: 60 },
    stays: { noun: 'stay', page: 'stays', max: 80 },
    yachts: { noun: 'yacht charter', page: 'yacht-charters', max: 20 },
    transfers: { noun: 'transfer service', page: 'transfers', max: 12 },
    gallery: { noun: 'gallery photo', page: 'gallery', max: 150 }
  };
  var MAX_ADDED = 120;
  var CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g;

  /* what may be changed, and how long each may be. kind: t text, n number, u photo address, s choice, l list of lines, ul list of photo addresses, m extra sections, f fact rows.
     req: true on a text field means it can never be saved empty. */
  var FIELDS = {
    experiences: {
      title: { kind: 't', max: 120, label: 'Name' },
      area: { kind: 't', max: 80, label: 'Area' },
      duration: { kind: 't', max: 60, label: 'How long' },
      label: { kind: 't', max: 40, label: 'Kind of experience' },
      hero: { kind: 't', max: 200, label: 'One-line summary' },
      desc: { kind: 't', max: 1500, label: 'Description' },
      best: { kind: 't', max: 160, label: 'Best for' },
      image: { kind: 'u', label: 'Photo' },
      priceValue: { kind: 'n', min: 0, max: 100000, label: 'Price' },
      per: { kind: 's', of: ['person', 'group'], label: 'Priced per' },
      cap: { kind: 'n', min: 1, max: 200, int: true, label: 'Up to how many guests' },
      highlights: { kind: 'l', max: 12, each: 240, label: 'Highlights' },
      includes: { kind: 'l', max: 14, each: 240, label: 'What is included' },
      extras: { kind: 'l', max: 14, each: 240, label: 'Optional extras' },
      extrasNote: { kind: 't', max: 300, label: 'Note above the extras' },
      extrasFoot: { kind: 't', max: 300, label: 'Note below the extras' },
      route: { kind: 't', max: 400, label: 'Suggested route' },
      routeNote: { kind: 't', max: 400, label: 'Note under the route' },
      more: { kind: 'm', max: 8, label: 'More sections' },
      facts: { kind: 'f', max: 8, label: 'Extra facts' }
    },
    packages: {
      destination: { kind: 's', of: COUNTRIES, label: 'Island' },
      title: { kind: 't', max: 120, label: 'Name' },
      tag: { kind: 't', max: 40, label: 'Label on the card' },
      type: { kind: 't', max: 40, label: 'Kind of package' },
      duration: { kind: 't', max: 60, label: 'How long' },
      price: { kind: 't', max: 40, label: 'Price' },
      img: { kind: 'u', label: 'Photo' },
      blurb: { kind: 't', max: 400, label: 'Summary' },
      highlights: { kind: 'l', max: 8, each: 80, label: 'Highlights' },
      inclusions: { kind: 'l', max: 10, each: 140, label: 'What is included' },
      idealFor: { kind: 't', max: 240, label: 'Ideal for' },
      note: { kind: 't', max: 300, label: 'Planning note' }
    },
    stays: {
      country: { kind: 's', of: COUNTRIES, label: 'Island' },
      type: { kind: 's', of: ['villa', 'airbnb'], label: 'Kind of stay' },
      title: { kind: 't', max: 120, label: 'Name' },
      price: { kind: 't', max: 60, label: 'Price' },
      img: { kind: 'u', label: 'Photo' },
      copy: { kind: 't', max: 500, label: 'Description' },
      highlights: { kind: 'l', max: 4, each: 60, label: 'Highlights' },
      gallery: { kind: 'ul', max: 8, label: 'More photos' }
    },
    yachts: {
      name: { kind: 't', max: 80, req: true, label: 'Name' },
      category: { kind: 's', of: ['private', 'group', 'luxury'], label: 'Kind of charter' },
      sub: { kind: 't', max: 80, label: 'Line under the name' },
      pills: { kind: 'l', max: 4, each: 40, label: 'Small tags' },
      blurb: { kind: 't', max: 400, label: 'Description' },
      bullets: { kind: 'l', max: 6, each: 140, label: 'What it offers' },
      price: { kind: 't', max: 60, label: 'Price' },
      img: { kind: 'u', label: 'Main photo' },
      gallery: { kind: 'ul', max: 8, label: 'More photos' }
    },
    transfers: {
      name: { kind: 't', max: 80, req: true, label: 'Name' },
      category: { kind: 's', of: ['airport', 'executive', 'group'], label: 'Kind of transfer' },
      badge: { kind: 't', max: 40, label: 'Label on the photo' },
      sub: { kind: 't', max: 80, label: 'Line under the name' },
      blurb: { kind: 't', max: 400, label: 'Description' },
      bullets: { kind: 'l', max: 6, each: 140, label: 'What it offers' },
      img: { kind: 'u', label: 'Photo' }
    },
    gallery: {
      country: { kind: 's', of: COUNTRIES, label: 'Island' },
      src: { kind: 'u', label: 'Photo' },
      label: { kind: 't', max: 100, req: true, label: 'Caption' }
    }
  };
  /* what an added item must have, in the order the person is told about it */
  var REQUIRED = {
    experiences: [['title', 'Give it a name.'], ['country', 'Choose the island.'], ['image', 'Choose a photo.'], ['desc', 'Write a short description.']],
    packages: [['title', 'Give it a name.'], ['destination', 'Choose the island.'], ['img', 'Choose a photo.'], ['blurb', 'Write a short summary.']],
    stays: [['title', 'Give it a name.'], ['country', 'Choose the island.'], ['type', 'Choose villa or vacation rental.'], ['img', 'Choose a photo.'], ['copy', 'Write a short description.']],
    yachts: [['name', 'Give it a name.'], ['category', 'Choose the kind of charter.'], ['img', 'Choose a photo.'], ['blurb', 'Write a short description.']],
    transfers: [['name', 'Give it a name.'], ['category', 'Choose the kind of transfer.'], ['img', 'Choose a photo.'], ['blurb', 'Write a short description.']],
    gallery: [['country', 'Choose the island.'], ['src', 'Choose a photo.'], ['label', 'Write a short caption.']]
  };
  /* only for experiences the owner adds */
  var ADDED_ONLY = { experiences: { country: { kind: 's', of: COUNTRIES, label: 'Island' }, type: { kind: 's', of: ['water', 'land'], label: 'On water or on land' } } };

  function okUrl(v) { return /^(https:\/\/[^\s'"()<>\\]{1,1800}|\/[^\s'"()<>\\]{0,1800})$/.test(v); }
  function text(v, max) { return String(v == null ? '' : v).replace(CONTROL, '').replace(/\s+/g, ' ').trim().slice(0, max); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  /* checks one set of field values; gives back { value } with only valid fields, or { error } */
  function cleanFields(list, raw, forAdded) {
    var spec = Object.assign({}, FIELDS[list] || {}, forAdded ? (ADDED_ONLY[list] || {}) : {});
    var out = {};
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { value: out };
    /* always in the order of the field list, so the same values are stored the same way however they were sent */
    var names = Object.keys(spec);
    for (var ni = 0; ni < names.length; ni++) {
      var k = names[ni];
      if (!Object.prototype.hasOwnProperty.call(raw, k)) continue;
      var f = spec[k], v = raw[k];
      if (v === null || v === undefined) continue;
      if (f.kind === 't') {
        v = text(v, f.max);
        if ((k === 'title' || f.req) && !v) return { error: (k === 'title' ? 'The name' : 'The ' + f.label.toLowerCase()) + ' cannot be empty.' };
        out[k] = v;
      } else if (f.kind === 'n') {
        if (v === '' ) { out[k] = k === 'cap' ? null : 0; continue; }
        var n = Number(v);
        if (!isFinite(n) || n < f.min || n > f.max) return { error: f.label + ' must be a number from ' + f.min + ' to ' + f.max + '.' };
        out[k] = f.int ? Math.round(n) : Math.round(n * 100) / 100;
      } else if (f.kind === 'u') {
        v = String(v).trim();
        if (v && !okUrl(v)) return { error: 'The photo must be a web address starting with https:// or a path on this site.' };
        if (v) out[k] = v;
      } else if (f.kind === 's') {
        if (f.of.indexOf(v) < 0) return { error: f.label + ' is not one of the choices.' };
        out[k] = v;
      } else if (f.kind === 'l') {
        if (!Array.isArray(v)) return { error: f.label + ' must be a list.' };
        out[k] = v.map(function (x) { return text(x, f.each); }).filter(Boolean).slice(0, f.max);
      } else if (f.kind === 'ul') {
        if (!Array.isArray(v)) return { error: f.label + ' must be a list.' };
        var urls = [];
        for (var ui = 0; ui < v.length && urls.length < f.max; ui++) {
          var u = String(v[ui] == null ? '' : v[ui]).trim();
          if (!u) continue;
          if (!okUrl(u)) return { error: 'Each photo in ' + f.label + ' must be a web address starting with https:// or a path on this site.' };
          urls.push(u);
        }
        out[k] = urls;
      } else if (f.kind === 'm') {
        if (!Array.isArray(v)) return { error: f.label + ' must be a list.' };
        out[k] = v.map(function (x) { return x && typeof x === 'object' ? { h: text(x.h, 80), p: text(x.p, 900) } : null; }).filter(function (x) { return x && x.h && x.p; }).slice(0, f.max);
      } else if (f.kind === 'f') {
        if (!Array.isArray(v)) return { error: f.label + ' must be a list.' };
        out[k] = v.map(function (x) { return Array.isArray(x) ? [text(x[0], 40), text(x[1], 200)] : null; }).filter(function (x) { return x && x[0] && x[1]; }).slice(0, f.max);
      }
    }
    return { value: out };
  }

  /* checks a state for one experience. `key` is the original title (or the id of an added one). */
  function cleanState(list, key, state) {
    if (!FIELDS[list]) return { error: 'That list cannot be changed here.' };
    key = String(key == null ? '' : key);
    if (!key || key.length > 200) return { error: 'That item could not be identified.' };
    state = state && typeof state === 'object' ? state : {};
    var out = {};
    if (state.added) {
      if (!/^n[a-z0-9]{4,24}$/.test(key)) return { error: 'An added item needs a short code of its own.' };
      var a = state.added;
      var r = cleanFields(list, a, true);
      if (r.error) return r;
      var need = REQUIRED[list] || [];
      for (var ri = 0; ri < need.length; ri++) if (!r.value[need[ri][0]]) return { error: need[ri][1] };
      if (list === 'experiences' && !r.value.type) r.value.type = 'land';
      out.added = Object.assign({ id: key }, r.value);
      if (state.hidden === true) out.hidden = true;
      return { value: out };
    }
    if (state.edits && typeof state.edits === 'object' && Object.keys(state.edits).length) {
      var e = cleanFields(list, state.edits, false);
      if (e.error) return e;
      if (Object.keys(e.value).length) out.edits = e.value;
    }
    if (state.hidden === true) out.hidden = true;
    return { value: out };
  }

  function emptyDoc() { return { edits: {}, hidden: {}, added: [] }; }
  function docOf(settingsValue) {
    var d = settingsValue && typeof settingsValue === 'object' ? settingsValue : {};
    return { edits: d.edits && typeof d.edits === 'object' ? d.edits : {}, hidden: d.hidden && typeof d.hidden === 'object' ? d.hidden : {}, added: Array.isArray(d.added) ? d.added : [] };
  }

  /* everything stored for one key, as a state */
  function stateOf(doc, key) {
    doc = docOf(doc);
    var s = {};
    var a = doc.added.filter(function (x) { return x && x.id === key; })[0];
    if (a) s.added = clone(a);
    else if (doc.edits[key]) s.edits = clone(doc.edits[key]);
    if (doc.hidden[key]) s.hidden = true;
    return s;
  }

  /* replace what is stored for one key. Gives back the new doc; the counts are checked here. */
  function putState(doc, key, state, list) {
    var d = docOf(clone(docOf(doc)));
    delete d.edits[key]; delete d.hidden[key];
    d.added = d.added.filter(function (x) { return x && x.id !== key; });
    if (state && state.added) d.added.push(state.added);
    else if (state && state.edits && Object.keys(state.edits).length) d.edits[key] = state.edits;
    if (state && state.hidden) d.hidden[key] = true;
    var spec = LISTS[list || 'experiences'] || LISTS.experiences;
    if (d.added.length > spec.max) return { error: 'That is more added ' + spec.noun + 's than the site can hold (' + spec.max + ').' };
    return { doc: d };
  }

  function priceLabel(v, per) {
    if (!(Number(v) > 0)) return 'Price on request';
    return 'from $' + Number(v).toLocaleString('en-US', { minimumFractionDigits: Number(v) % 1 ? 2 : 0, maximumFractionDigits: 2 }) + (per === 'group' ? ' per group' : '');
  }
  function slugOf(t) {
    var skip = { with: 1, and: 1, the: 1, of: 1, a: 1, an: 1, in: 1, at: 1, to: 1, for: 1, on: 1, by: 1, from: 1 };
    if (t && t.slug) return String(t.slug);
    return String((t && t.title) || '').toLowerCase().replace(/['’]/g, '').split(/[^a-z0-9]+/).filter(function (w) { return w && !skip[w]; }).join('-');
  }

  /* what the site shows: the list from the code with the edits laid over it, hidden ones left out and added ones at the end.
     `base` is never changed; a new list of new objects comes back. Each item remembers its original title in `origKey`. */
  function effective(list, base, rawDoc) {
    if (list !== 'experiences') return effectiveSimple(list, base, rawDoc);
    var doc = docOf(rawDoc), out = [];
    (base || []).forEach(function (b) {
      var key = b.origKey || b.title;
      if (doc.hidden[key]) return;
      var item = clone(b);
      item.origKey = key;
      var e = doc.edits[key];
      if (e) {
        if (e.title && e.title !== item.title && !item.slug) item.slug = slugOf(b);   // a renamed experience keeps its web address
        var c = cleanFields(list, e, false).value;
        for (var k in c) item[k] = c[k];
        if (c.per === 'person') delete item.cap;
        if (c.cap === null) delete item.cap;
        if (c.priceValue !== undefined || c.per !== undefined) item.priceLabel = priceLabel(item.priceValue, item.per);
      }
      out.push(item);
    });
    doc.added.forEach(function (a) {
      if (!a || !a.id || doc.hidden[a.id]) return;
      var c = cleanFields(list, a, true).value;
      var item = Object.assign({ origKey: a.id, added: true, label: c.type === 'water' ? 'Water Experience' : 'Land Experience', area: '', duration: '', hero: '', best: '', highlights: [], priceValue: 0 }, c);
      item.slug = a.slug || slugOf(item);
      item.priceLabel = priceLabel(item.priceValue, item.per);
      if (!item.hero) item.hero = item.desc.length > 140 ? item.desc.slice(0, 137) + '...' : item.desc;
      out.push(item);
    });
    return out;
  }

  /* the same for packages and stays: edits laid over the item, hidden ones left out, added ones at the end */
  function keyOf(list, b) {
    if (list === 'packages') return String(b.destination || '') + '|' + String(b.title || '');
    if (list === 'gallery') return String(b.country || '') + '|' + String(b.src || '');
    if (list === 'yachts' || list === 'transfers') return String(b.name || '');
    return String(b.id != null ? b.id : b.title);
  }
  var DEFAULTS = {
    packages: { tag: 'Curated Package', type: 'Curated Package', duration: '', price: 'Price on request', blurb: '', highlights: [] },
    stays: { price: 'Rate on request', copy: '', highlights: [] },
    yachts: { sub: '', pills: [], bullets: [], price: 'Price on request', gallery: [] },
    transfers: { badge: '', sub: '', bullets: [] },
    gallery: {}
  };
  function finish(list, item) {
    if (list === 'stays') { item.tag = item.type === 'villa' ? 'Villa' : 'Vacation Rentals'; if (item.id == null) item.id = item.origKey; }
  }
  function effectiveSimple(list, base, rawDoc) {
    var doc = docOf(rawDoc), out = [];
    (base || []).forEach(function (b) {
      var key = b.origKey || keyOf(list, b);
      if (doc.hidden[key]) return;
      var item = clone(b);
      item.origKey = key;
      var e = doc.edits[key];
      if (e) {
        var c = cleanFields(list, e, false).value;
        for (var k in c) item[k] = c[k];
        /* the photo description, the transfer's kind and the planning note were written for the old name or kind, so they follow the new one */
        if (c.name !== undefined && c.name !== b.name) { delete item.alt; delete item.note; }
        if (c.category !== undefined && c.category !== b.category) delete item.type;
      }
      finish(list, item);
      out.push(item);
    });
    doc.added.forEach(function (a) {
      if (!a || !a.id || doc.hidden[a.id]) return;
      var c = cleanFields(list, a, true).value;
      var item = Object.assign(clone(DEFAULTS[list] || {}), c);
      item.origKey = a.id; item.added = true;
      finish(list, item);
      out.push(item);
    });
    return out;
  }

  /* prices for the trip builder: the code's list with the edits laid over it, in the shape the builder reads */
  function builderItems(baseItems, base, rawDoc) {
    var items = {};
    Object.keys(baseItems || {}).forEach(function (k) { items[k] = baseItems[k]; });
    effective('experiences', base, rawDoc).forEach(function (t) {
      if (t.type !== 'water' && t.type !== 'land') return;
      var orig = baseItems && baseItems[t.origKey];
      if (!orig && !t.added) return;
      if (orig && t.title !== t.origKey) delete items[t.origKey];
      items[t.title] = { country: t.country, area: t.area || '', type: t.type, price: Number(t.priceValue) > 0 ? Number(t.priceValue) : 0, per: t.per === 'group' ? 'group' : 'person', cap: t.cap || null };
    });
    var doc = docOf(rawDoc);
    Object.keys(doc.hidden).forEach(function (k) { delete items[k]; });
    return items;
  }

  return { COUNTRIES: COUNTRIES, LISTS: LISTS, REQUIRED: REQUIRED, keyOf: keyOf, FIELDS: FIELDS, ADDED_ONLY: ADDED_ONLY, MAX_ADDED: MAX_ADDED, cleanFields: cleanFields, cleanState: cleanState, docOf: docOf, emptyDoc: emptyDoc, stateOf: stateOf, putState: putState, effective: effective, builderItems: builderItems, priceLabel: priceLabel, slugOf: slugOf, okUrl: okUrl };
});
