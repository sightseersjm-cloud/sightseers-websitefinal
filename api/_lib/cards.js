/* The markup of the yacht charter cards and the transfer cards, made from plain data. The page in Design_Reference.html has these cards written
   out in full (so they are there before any script runs, and for search engines); this file makes the same markup from the same data when the
   owner has changed, hidden or added a card in the admin. scripts/cards.test.js checks that the two stay the same.
   One file for the browser and for the tests (build.js copies it to public/ss-cards.js). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SSCards = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var YACHT_BADGES = { private: 'Private Charter', group: 'Group Charter', luxury: 'Luxury Charter' };
  var TRANSFER_TYPES = { airport: 'Airport Transfer', executive: 'Executive Transfer', group: 'Group Transfer' };

  function esc(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  /* a value inside a '...' string inside an onclick="..." attribute */
  function js(v) { return esc(String(v == null ? '' : v).replace(/\\/g, '\\\\').replace(/'/g, "\\'")); }
  function list(a) { return Array.isArray(a) ? a : []; }

  /* the row of small pictures under a card's text; a click opens them all (the page's property gallery handles the click) */
  function gallery(title, images) {
    images = list(images).filter(Boolean);
    if (!images.length) return '';
    var t = title + ' Gallery', joined = images.join('|');
    return '<div class="stay-property-gallery">' + images.slice(0, 4).map(function (src, i) {
      var more = i === 3 && images.length > 4;
      return '<button class="stay-property-thumb' + (more ? ' more' : '') + '" type="button" data-property-title="' + esc(t) + '" data-gallery-images="' + esc(joined) + '"' +
        (more ? ' data-more="+' + (images.length - 3) + ' More"' : '') + '><img src="' + esc(src) + '" alt="' + esc(t) + ' ' + (i + 1) + '" loading="lazy"></button>';
    }).join('') + '</div>';
  }

  function yachtCard(c) {
    var badge = YACHT_BADGES[c.category] || YACHT_BADGES.private;
    return '<article class="yacht-luxe-card" data-yacht-category="' + esc(c.category || 'private') + '">' +
      '<div class="yacht-luxe-media"><img src="' + esc(c.img) + '" alt="' + esc(c.alt || c.name) + '"><span class="yacht-luxe-badge">' + esc(badge) + '</span>' +
      '<div class="yacht-luxe-overlay"><strong>' + esc(c.name) + '</strong>' + (c.sub ? '<span>' + esc(c.sub) + '</span>' : '') + '</div></div>' +
      '<div class="yacht-luxe-body">' + (list(c.pills).length ? '<div class="yacht-luxe-pills">' + list(c.pills).map(function (p) { return '<span>' + esc(p) + '</span>'; }).join('') + '</div>' : '') +
      '<p>' + esc(c.blurb) + '</p>' + gallery(c.name, c.gallery) +
      (list(c.bullets).length ? '<ul class="yacht-luxe-list">' + list(c.bullets).map(function (b) { return '<li><span>' + esc(b) + '</span></li>'; }).join('') + '</ul>' : '') +
      (c.price ? '<div class="yacht-luxe-price">' + esc(c.price) + '</div>' : '') +
      '<div class="yacht-luxe-btns"><button class="btn-primary" type="button" onclick="openYachtBooking(\'' + js(c.name) + '\',\'Yacht Charter\',\'Interested in the ' + js(c.name) + ' package.\')">Book Charter</button>' +
      '<button class="btn-secondary" type="button" onclick="openLinkedStartPlanning();"><i class="fas fa-pen"></i>Custom Inquiry</button></div></div></article>';
  }

  function transferCard(c) {
    var type = c.type || TRANSFER_TYPES[c.category] || 'Transfer';
    var note = c.note || ('Interested in ' + c.name + ' with Sight Seers.');
    return '<article class="transfer-card transfer-card--premium" data-transfer-category="' + esc(c.category || 'airport') + '">' +
      '<div class="transfer-card-media"><img src="' + esc(c.img) + '" alt="' + esc(c.alt || c.name) + '">' + (c.badge ? '<span class="transfer-badge">' + esc(c.badge) + '</span>' : '') +
      '<div class="transfer-meta"><div><strong>' + esc(c.name) + '</strong>' + (c.sub ? '<span>' + esc(c.sub) + '</span>' : '') + '</div></div></div>' +
      '<div class="transfer-card-body"><p class="transfer-copy">' + esc(c.blurb) + '</p>' +
      (list(c.bullets).length ? '<ul class="transfer-highlights">' + list(c.bullets).map(function (b) { return '<li><span>' + esc(b) + '</span></li>'; }).join('') + '</ul>' : '') +
      '<div class="transfer-actions"><button type="button" class="btn-secondary" onclick="openLinkedStartPlanning(\'' + js(c.name) + '\',\'' + js(type) + '\',\'' + js(note) + '\');"><i class="fas fa-pen"></i>Custom Inquiry</button></div></div></article>';
  }

  return { YACHT_BADGES: YACHT_BADGES, TRANSFER_TYPES: TRANSFER_TYPES, esc: esc, gallery: gallery, yachtCard: yachtCard, transferCard: transferCard };
});
