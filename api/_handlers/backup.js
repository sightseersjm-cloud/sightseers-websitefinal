/* Backups, restore, the enquiries export and the site check. Owner only.
   - A backup holds the website's content (wording, photos, added sections, the catalog changes). It never holds accounts, passwords,
     sign-in codes or any secret. Backups kept on the website's own storage are under ss-admin/backups/; the newest KEEP are kept.
   - Restoring puts back the six content settings that the admin writes. It first saves what is live now as a backup of its own,
     so a restore can always be undone.
   - The site check reports what it can see on the server (the size of what visitors download, photos stored inside the settings,
     changes waiting, what is set up). It never returns a secret, only whether one is set. The browser adds the checks that need
     the lists written in the page (photos that do not load, items with no price or photo). */
const { put, get, list, del } = require('@vercel/blob');
const db = require('../_lib/db');
const { requireOwner, uid } = require('../_lib/auth');
const { readSettings, writeSettings } = require('../_lib/siteStore');
const inbox = require('../_lib/inbox');
const catalog = require('../_lib/catalog');
const edit = require('../_lib/siteEdit');
const siteImages = require('../_lib/siteImages');

const PREFIX = 'ss-admin/backups/';
const KEEP = 12;
/* what a restore may put back, and what a backup keeps (the older keys are kept for safekeeping only) */
const ACTIVE = ['ss_site_settings', 'ss_page_editor_settings', 'ss_stay_page_settings', 'ss_dynamic_sections_v1', 'ss_text_edits_v1', 'ss_catalog_v1'];
const KEPT = ACTIVE.concat(['ss_customer_gallery', 'ss_master_tours_manager_v1', 'ss_ga4_id']);
const COLLECTIONS = ['blog-posts', 'sections', 'tours', 'stays', 'gallery', 'image-meta', 'site-history'];
const MAX_RESPONSE = 4 * 1024 * 1024;       // a serverless response can be 4.5 MB
const MAX_PHOTO = 4 * 1024 * 1024;
const KINDS = ['manual', 'before-restore', 'before-lighten', 'weekly'];
const KEEP_WEEKLY = 8;
const PHOTO_NAMES = { heroImg1: 'Home hero photo 1', heroImg2: 'Home hero photo 2', heroImg3: 'Home hero photo 3', aboutImage: 'About photo', jamaicaImage: 'Jamaica photo' };
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/svg+xml': 'svg' };

const size = v => Buffer.byteLength(JSON.stringify(v === undefined ? null : v));
const pick = (all, keys) => { const o = {}; keys.forEach(k => { if (all && all[k] !== undefined) o[k] = all[k]; }); return o; };
const who = u => ({ name: u.name || u.email || 'The owner', email: u.email || '' });
const stamp = at => at.replace(/[:.]/g, '-');
const SNAP_NAME = /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z-(manual|before-restore|before-lighten|weekly)\.json$/;
const DANGEROUS = /^\s*(javascript|vbscript):|^\s*data:(?!image\/)/i;

function backupOf(settings, user, kind) {
  return { format: 'sightseers-backup', version: 1, kind, createdAt: new Date().toISOString(), createdBy: who(user), settings: pick(settings, KEPT) };
}

/* photos stored inside the settings as text (data:image/...): they make the document every visitor downloads much bigger */
function inlinePhotos(settings) {
  const out = [];
  (function walk(v, path, parent, key) {
    if (typeof v === 'string') { if (/^data:image\//i.test(v)) out.push({ path, parent, key, bytes: v.length }); return; }
    if (Array.isArray(v)) { v.forEach((x, i) => walk(x, path + '[' + i + ']', v, i)); return; }
    if (v && typeof v === 'object') Object.keys(v).forEach(k => walk(v[k], path ? path + '.' + k : k, v, k));
  })(settings, '', null, null);
  return out;
}
const nameOfPath = p => { const last = p.split('.').pop(); return PHOTO_NAMES[last] || p; };

async function snapshots() {
  try {
    const { blobs } = await list({ prefix: PREFIX });
    return (blobs || []).filter(b => SNAP_NAME.test(String(b.pathname).slice(PREFIX.length))).map(b => {
      const name = String(b.pathname).slice(PREFIX.length);
      return { name, url: b.url, at: b.uploadedAt || '', bytes: b.size || 0, kind: (/-(manual|before-restore|before-lighten|weekly)\.json$/.exec(name) || [])[1] };
    }).sort((a, b) => String(b.at).localeCompare(String(a.at)) || (a.name < b.name ? 1 : -1));
  } catch (e) { return []; }
}

async function saveSnapshot(settings, user, kind) {
  const bk = backupOf(settings, user, kind);
  const name = stamp(bk.createdAt) + '-' + kind + '.json';
  const body = JSON.stringify(bk);
  await put(PREFIX + name, body, { access: 'private', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: false });
  const all = await snapshots();
  /* the weekly ones are pruned on their own, so they never push out the ones the owner saved */
  const old2 = all.filter(b => b.kind === 'weekly').slice(KEEP_WEEKLY).concat(all.filter(b => b.kind !== 'weekly').slice(KEEP));
  for (const old of old2) { try { await del(old.url); } catch (e) { /* the next backup tries again */ } }
  return { name, kind, at: bk.createdAt, bytes: Buffer.byteLength(body) };
}

async function readSnapshot(name) {
  if (!SNAP_NAME.test(String(name || ''))) return null;
  try {
    const r = await get(PREFIX + name, { access: 'private', useCache: false });
    if (!r || !r.stream) return null;
    return await new Response(r.stream).json();
  } catch (e) { return null; }
}

/* ---------- checking a backup before it is put back ---------- */
function deepSafe(v, depth) {
  if (depth > 12) return false;
  if (typeof v === 'string') return !DANGEROUS.test(v);
  if (Array.isArray(v)) return v.every(x => deepSafe(x, depth + 1));
  if (v && typeof v === 'object') return Object.keys(v).every(k => deepSafe(v[k], depth + 1));
  return v === null || typeof v === 'number' || typeof v === 'boolean';
}
const isObj = v => v && typeof v === 'object' && !Array.isArray(v);

function cleanCatalog(doc) {
  if (!isObj(doc)) return { error: 'The catalog changes in this backup are not in a form this website understands.' };
  const out = {};
  for (const list of Object.keys(catalog.LISTS)) {
    const d = doc[list];
    if (d === undefined) continue;
    if (!isObj(d)) return { error: 'The ' + catalog.LISTS[list].noun + ' changes in this backup are not in a form this website understands.' };
    const next = catalog.emptyDoc();
    for (const key of Object.keys(isObj(d.edits) ? d.edits : {})) {
      const r = catalog.cleanState(list, key, { edits: d.edits[key] });
      if (r.error) return { error: 'A change to a ' + catalog.LISTS[list].noun + ' in this backup is not valid: ' + r.error };
      if (r.value.edits) next.edits[key] = r.value.edits;
    }
    for (const key of Object.keys(isObj(d.hidden) ? d.hidden : {})) if (d.hidden[key] === true) next.hidden[key] = true;
    for (const a of (Array.isArray(d.added) ? d.added : [])) {
      if (!a || typeof a.id !== 'string') return { error: 'A ' + catalog.LISTS[list].noun + ' added in this backup has no code of its own.' };
      const r = catalog.cleanState(list, a.id, { added: a });
      if (r.error) return { error: 'A ' + catalog.LISTS[list].noun + ' added in this backup is not valid: ' + r.error };
      next.added.push(r.value.added);
    }
    if (next.added.length > catalog.LISTS[list].max) return { error: 'This backup holds more ' + catalog.LISTS[list].noun + 's than the website can.' };
    out[list] = next;
  }
  return { value: out };
}

function cleanTextEdits(doc) {
  if (!isObj(doc)) return { error: 'The wording changes in this backup are not in a form this website understands.' };
  const out = {};
  let n = 0;
  for (const scope of Object.keys(doc)) {
    if (scope !== '*' && !/^[a-z0-9-]{1,40}$/i.test(scope)) return { error: 'The wording changes in this backup name a page this website does not have.' };
    const sc = doc[scope];
    if (!isObj(sc)) return { error: 'The wording changes in this backup are not in a form this website understands.' };
    const keep = {};
    for (const orig of Object.keys(sc)) {
      const v = sc[orig];
      if (typeof v !== 'string' || orig.length > 2000) return { error: 'A wording change in this backup is not valid.' };
      if (/^img:/.test(orig)) { if (v && !edit.okUrl(v)) return { error: 'A photo change in this backup is not a web address starting with https:// or a path on this site.' }; }
      else if (v.length > 1200) return { error: 'A wording change in this backup is too long.' };
      keep[orig] = v; n++;
    }
    if (Object.keys(keep).length) out[scope] = keep;
  }
  if (n > edit.MAX_TEXT_EDITS) return { error: 'This backup holds more wording changes than the website can.' };
  return { value: out };
}

function cleanForRestore(settings) {
  if (!isObj(settings)) return { error: 'This file is not a backup this website can read.' };
  const out = {};
  for (const k of ACTIVE) {
    if (settings[k] === undefined) continue;
    const v = settings[k];
    if (k === 'ss_catalog_v1') { const r = cleanCatalog(v); if (r.error) return r; out[k] = r.value; }
    else if (k === 'ss_text_edits_v1') { const r = cleanTextEdits(v); if (r.error) return r; out[k] = r.value; }
    else if (k === 'ss_dynamic_sections_v1') { const r = edit.cleanSections(v); if (r.error) return r; out[k] = r.value; }
    else {
      if (!isObj(v)) return { error: 'One of the settings in this backup is not in a form this website understands.' };
      if (!deepSafe(v, 0)) return { error: 'This backup holds a web address that is not allowed.' };
      out[k] = v;
    }
  }
  if (!Object.keys(out).length) return { error: 'This file holds none of the website content that can be restored.' };
  return { value: out };
}

/* ---------- the enquiries export ---------- */
function csvCell(v) {
  let t = String(v == null ? '' : v).replace(/\r?\n/g, ' ');
  if (/^[=+\-@\t]/.test(t)) t = "'" + t;       // a spreadsheet must never run a cell as a formula
  return '"' + t.replace(/"/g, '""') + '"';
}
function enquiriesCsv(items) {
  const head = ['Received', 'Type', 'Title', 'Name', 'Email', 'Phone', 'Status', 'Assigned to', 'Summary', 'Details', 'Private note', 'Last handled'];
  const rows = items.map(i => [i.createdAt, i.type, i.title, i.name, i.email, i.phone, i.status === 'in_progress' ? 'In progress' : i.status === 'done' ? 'Done' : 'New', i.assignee ? i.assignee.name : '', i.summary, i.details, i.note, i.handledAt]);
  return '﻿' + [head].concat(rows).map(r => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

/* ---------- the site check ---------- */
async function check() {
  const settings = await readSettings();
  const keys = Object.keys(settings).map(k => ({ key: k, bytes: size(settings[k]) })).sort((a, b) => b.bytes - a.bytes);
  const inline = inlinePhotos(settings);
  const drafts = await db.getCollection('site-drafts').catch(() => []);
  const waiting = drafts.filter(d => d && d.status === 'pending').sort((a, b) => String(a.at).localeCompare(String(b.at)));
  const env = k => !!String(process.env[k] || '').trim();
  return {
    settings: { bytes: size(settings), keys: keys.slice(0, 8) },
    inlinePhotos: inline.map(p => ({ where: nameOfPath(p.path), path: p.path, bytes: p.bytes })),
    waiting: { count: waiting.length, oldest: waiting.length ? waiting[0].at : '' },
    setup: {
      storage: env('BLOB_READ_WRITE_TOKEN'), signin: env('JWT_SECRET'), email: env('RESEND_API_KEY'), emailFrom: env('RESEND_FROM'),
      payments: env('STRIPE_SECRET_KEY'), paymentsWebhook: env('STRIPE_WEBHOOK_SECRET'), cron: env('CRON_SECRET'),
      visitCounting: String(process.env.VISIT_COUNTING || '').toLowerCase() === 'on', oldPasscode: env('ADMIN_PASSCODE')
    },
    backups: await snapshots()
  };
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  const user = await requireOwner(req, res);
  if (!user) return;
  res.setHeader('Cache-Control', 'no-store');
  const q = req.method === 'GET' ? (req.query || {}) : (req.body || {});
  const action = String(q.action || '');

  if (req.method === 'GET') {
    if (action === 'check') return res.status(200).json(Object.assign({ ok: true }, await check()));
    if (action === 'list') return res.status(200).json({ ok: true, backups: await snapshots() });
    if (action === 'download') {
      const bk = await readSnapshot(q.name);
      if (!bk) return res.status(404).json({ error: 'That backup could not be found.' });
      return res.status(200).json({ ok: true, name: q.name, backup: bk });
    }
    if (action === 'export-content') {
      const bk = backupOf(await readSettings(), user, 'manual');
      bk.collections = {};
      for (const c of COLLECTIONS) bk.collections[c] = await db.getCollection(c).catch(() => []);
      bk.note = 'Website content only. It holds no accounts, passwords or sign-in codes.';
      if (size(bk) > MAX_RESPONSE) { bk.collections['site-history'] = []; bk.truncated = ['site-history']; }
      if (size(bk) > MAX_RESPONSE) return res.status(413).json({ error: 'The backup is too large to download in one go. Save a backup on the website storage instead, which keeps the content settings.' });
      return res.status(200).json({ ok: true, backup: bk });
    }
    if (action === 'export-enquiries') {
      const items = await inbox.collect(db);
      return res.status(200).json({ ok: true, count: items.length, csv: enquiriesCsv(items) });
    }
    return res.status(400).json({ error: 'Unknown request.' });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.BLOB_READ_WRITE_TOKEN) return res.status(503).json({ error: 'Website storage is not set up, so this cannot be done.' });

  if (action === 'save') {
    const snap = await saveSnapshot(await readSettings(), user, 'manual');
    return res.status(200).json({ ok: true, backup: snap, backups: await snapshots() });
  }

  if (action === 'restore') {
    let bk = null;
    if (q.name) { bk = await readSnapshot(q.name); if (!bk) return res.status(404).json({ error: 'That backup could not be found.' }); }
    else bk = q.backup;
    if (!isObj(bk) || bk.format !== 'sightseers-backup' || bk.version !== 1) return res.status(400).json({ error: 'This file is not a Sight Seers backup.' });
    const r = cleanForRestore(bk.settings);
    if (r.error) return res.status(400).json({ error: r.error });
    const current = await readSettings();
    const snap = await saveSnapshot(current, user, 'before-restore');
    Object.keys(r.value).forEach(k => { current[k] = r.value[k]; });
    await writeSettings(current);
    return res.status(200).json({ ok: true, restored: Object.keys(r.value), safety: snap, backups: await snapshots() });
  }

  if (action === 'lighten') {
    const settings = await readSettings();
    const found = inlinePhotos(settings);
    if (!found.length) return res.status(200).json({ ok: true, moved: 0, skipped: [], savedBytes: 0 });
    const snap = await saveSnapshot(settings, user, 'before-lighten');
    let moved = 0, saved = 0;
    const skipped = [];
    for (const p of found) {
      const m = /^data:(image\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/i.exec(p.parent[p.key]);
      const ext = m && EXT[m[1].toLowerCase()];
      const buf = m && ext ? Buffer.from(m[2].replace(/\s+/g, ''), 'base64') : null;
      if (!buf || !buf.length || buf.length > MAX_PHOTO) { skipped.push(nameOfPath(p.path)); continue; }
      const blob = await siteImages.save('site-images', ext, buf, m[1].toLowerCase());
      const url = blob.url;
      if (!url) { skipped.push(nameOfPath(p.path)); continue; }
      saved += p.bytes - url.length; moved++;
      p.parent[p.key] = url;
    }
    if (moved) await writeSettings(settings);
    return res.status(200).json({ ok: true, moved, skipped, savedBytes: saved, safety: snap });
  }

  return res.status(400).json({ error: 'Unknown request.' });
};

module.exports.KINDS = KINDS;
/* the weekly job (api/backup-cron.js) saves through this, with no signed-in person */
module.exports.saveWeekly = async function () {
  return saveSnapshot(await readSettings(), { name: 'Automatic weekly backup' }, 'weekly');
};
