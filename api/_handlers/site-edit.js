const db = require('../_lib/db');
const { getUser, requirePerm, requireOwner, canPublishNow, signPreview, verifyPreview, escapeHtml, can } = require('../_lib/auth');
const { sendEmail } = require('../_lib/email');
const edit = require('../_lib/siteEdit');
const catalog = require('../_lib/catalog');
const { readSettings } = require('../_lib/siteStore');

const MAX_CHANGES = 60;

/* checks a list of changes from the browser; gives back tidy ones that really differ from what is live */
async function prepare(list) {
  if (!Array.isArray(list) || !list.length) return { error: 'There is nothing to save.' };
  if (list.length > MAX_CHANGES) return { error: 'That is too many changes at once.' };
  const clean = [];
  for (const raw of list) {
    const c = edit.cleanChange(raw);
    if (c.error) return { error: c.error };
    const now = await edit.currentValue(c);
    if (JSON.stringify(now) !== JSON.stringify(c.value)) clean.push(c);
    if (c.id === edit.TEXT_ID && c.value !== '' && now === '') {
      const live = await readSettings();
      if (edit.countTextEdits(live[edit.TEXT]) + clean.filter(x => x.id === edit.TEXT_ID && x.value !== '').length > edit.MAX_TEXT_EDITS) return { error: 'The site already holds as many in-page changes as it can (' + edit.MAX_TEXT_EDITS + '). Put some back to the original first.' };
    }
  }
  /* an added experience, package or stay must fit in what the site can hold */
  const cats = clean.filter(x => x.id === edit.CAT_ID);
  if (cats.length) {
    const live = await readSettings();
    const stored = live[edit.CAT] && typeof live[edit.CAT] === 'object' && !Array.isArray(live[edit.CAT]) ? live[edit.CAT] : {};
    const docs = {};
    for (const c of cats) {
      const put = catalog.putState(docs[c.list] || stored[c.list], c.key, c.value, c.list);
      if (put.error) return { error: put.error };
      docs[c.list] = put.doc;
    }
  }
  return { changes: clean };
}

/* puts changes live when the person may publish, otherwise leaves them for the owner to approve */
async function submit(req, res, user, list, note, meta) {
  const p = await prepare(list);
  if (p.error) return res.status(400).json({ error: p.error });
  if (!p.changes.length) return res.status(200).json({ ok: true, unchanged: true });
  if (await canPublishNow(user)) {
    const made = await edit.publish(p.changes, user, Object.assign({ note, via: 'direct' }, meta || {}));
    return res.status(200).json({ ok: true, live: true, count: made.length });
  }
  const draft = await edit.makeDraft(p.changes, user, note);
  notifyOwner(req, draft);
  return res.status(200).json({ ok: true, live: false, draftId: draft.id, count: draft.changes.length });
}

function siteHost(req) { return String(req.headers['x-forwarded-host'] || req.headers.host || 'www.sightseerscaribbean.com').split(',')[0].trim(); }

function notifyOwner(req, draft) {
  const to = process.env.OWNER_EMAIL || process.env.BUSINESS_EMAIL;
  if (!to) return;
  const n = draft.changes.length;
  sendEmail({
    to,
    subject: draft.by.name + ' sent ' + n + ' change' + (n === 1 ? '' : 's') + ' for your approval',
    html: '<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#1a2b3f"><h2 style="color:#0a3557">Changes waiting for you</h2><p><b>' + escapeHtml(draft.by.name) + '</b> edited the website (' + n + ' change' + (n === 1 ? '' : 's') + '). Nothing is live until you approve it.</p>' +
      (draft.note ? '<p style="border-left:3px solid #ef8731;padding-left:12px">' + escapeHtml(draft.note) + '</p>' : '') +
      '<p><a href="https://' + siteHost(req) + '/manage" style="display:inline-block;background:#0a3557;color:#fff;padding:14px 26px;text-decoration:none;font-weight:bold">Review the changes</a></p></div>'
  }).catch(() => {});
}

async function tellAuthor(req, draft, approved, reason) {
  try {
    const users = await db.getCollection('users');
    const u = users.find(x => x.id === draft.by.id);
    if (!u || !u.email) return;
    sendEmail({
      to: u.email,
      subject: approved ? 'Your website changes are now live' : 'Your website changes were not approved',
      html: '<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#1a2b3f"><h2 style="color:#0a3557">' + (approved ? 'Your changes are live' : 'Your changes were not approved') + '</h2><p>' +
        (approved ? 'The owner approved your ' + draft.changes.length + ' change' + (draft.changes.length === 1 ? '' : 's') + ' and they are now on the website.' : 'The owner did not approve this set of changes. Nothing was published.') + '</p>' +
        (reason ? '<p style="border-left:3px solid #ef8731;padding-left:12px">' + escapeHtml(reason) + '</p>' : '') +
        '<p><a href="https://' + siteHost(req) + '/manage" style="color:#0a3557">Open the admin</a></p></div>'
    }).catch(() => {});
  } catch (e) { /* the email is a courtesy; the decision is already saved */ }
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const view = (req.query && req.query.view) || '';

    /* a preview link works without signing in, but only shows the one waiting change it was made for */
    if (view === 'preview') {
      const id = verifyPreview(req.query.token);
      const draft = id ? (await db.getCollection('site-drafts')).find(d => d.id === id) : null;
      if (!draft || draft.status !== 'pending') return res.status(404).json({ error: 'This preview link has expired or the changes have already been decided.' });
      return res.status(200).json({ ok: true, by: draft.by.name, note: draft.note, changes: draft.changes.map(c => {
        if (c.id === edit.CAT_ID) return { id: c.id, kind: c.kind, after: c.after, page: c.page, store: edit.CAT, list: c.list, key: c.key };
        if (c.id === edit.TEXT_ID) return { id: c.id, kind: c.kind, after: c.after, page: c.page, store: edit.TEXT, scope: c.scope, orig: c.orig };
        const loc = c.id === edit.SECTIONS_ID ? { store: edit.DYN, key: '' } : edit.where(c.id);
        return { id: c.id, kind: c.kind, after: c.after, page: c.page, store: loc && loc.store, key: loc && loc.key };
      }) });
    }

    const user = await requirePerm(req, res, 'pages', 'catalog', 'blog');
    if (!user) return;
    const owner = user.role === 'admin';

    if (view === 'map') return res.status(200).json({ ok: true, map: edit.SITE_FIELDS });

    if (view === 'history') {
      const field = String((req.query && req.query.field) || '');
      const limit = Math.min(300, Math.max(1, parseInt(req.query && req.query.limit, 10) || 80));
      let hist = await db.getCollection('site-history');
      if (field) hist = hist.filter(h => h.fieldId === field);
      hist = hist.slice(-limit).reverse();
      /* a long list of added sections is only sent when asked for one change, to keep the list light */
      hist = hist.map(h => h.kind === 'sections' ? Object.assign({}, h, { before: Array.isArray(h.before) ? h.before.length : 0, after: Array.isArray(h.after) ? h.after.length : 0, count: true }) : h);
      return res.status(200).json({ ok: true, history: hist });
    }

    if (view === 'drafts') {
      let drafts = await db.getCollection('site-drafts');
      if (!owner) drafts = drafts.filter(d => d.by.id === user.id);
      const live = await readSettings();
      const pending = drafts.filter(d => d.status === 'pending').reverse().map(d => Object.assign({}, d, { changes: d.changes.map(c => Object.assign({}, c, { now: edit.liveValue(live, c) })) }));
      const decided = drafts.filter(d => d.status !== 'pending').slice(-15).reverse();
      return res.status(200).json({ ok: true, pending, decided, canApprove: owner });
    }

    return res.status(400).json({ error: 'Unknown view.' });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const body = req.body || {};
  const action = body.action;

  /* changes to the experience catalog need the tours permission; everything else needs the pages permission */
  async function mayChange(req, res, user, list) {
    const arr = Array.isArray(list) ? list : [];
    if (arr.some(c => c && c.id === edit.CAT_ID) && !(await can(user, 'catalog'))) { res.status(403).json({ error: 'You do not have access to change tours and stays.' }); return false; }
    if (arr.some(c => !c || c.id !== edit.CAT_ID) && !(await can(user, 'pages'))) { res.status(403).json({ error: 'You do not have access to change pages and photos.' }); return false; }
    return true;
  }

  if (action === 'save') {
    const user = await requirePerm(req, res, 'pages', 'catalog');
    if (!user) return;
    if (!(await mayChange(req, res, user, body.changes))) return;
    return submit(req, res, user, body.changes, body.note);
  }

  /* put an earlier version back: one field, or everything one save changed */
  if (action === 'restore') {
    const user = await requirePerm(req, res, 'pages', 'catalog');
    if (!user) return;
    const hist = await db.getCollection('site-history');
    const entries = body.group ? hist.filter(h => h.group === body.group) : hist.filter(h => h.id === body.id);
    if (!entries.length) return res.status(404).json({ error: 'We could not find that change.' });
    const list = [];
    for (const h of entries) {
      if (h.count) continue;
      if (h.kind === 'c') { list.push({ id: edit.CAT_ID, kind: 'c', list: h.list, key: h.key, value: h.before && typeof h.before === 'object' ? h.before : {}, label: 'Put back: ' + (h.label || 'item'), page: (catalog.LISTS[h.list] || {}).page || 'tours', before: h.after, keepEmpty: true }); continue; }
      if (h.kind === 't' || h.kind === 'ti') { list.push({ id: edit.TEXT_ID, kind: h.kind, scope: h.scope, orig: h.kind === 'ti' ? String(h.orig || '').replace(/^img:/, '') : h.orig, value: typeof h.before === 'string' ? h.before : '', label: 'Put back: ' + (h.label || 'wording'), page: h.page, before: typeof h.after === 'string' ? h.after : '', keepEmpty: true }); continue; }
      list.push({ id: h.fieldId, kind: h.kind === 'sections' ? 'sections' : (h.kind === 'image' ? 'image' : 'text'), value: h.before, label: 'Put back: ' + (h.label || h.fieldId), page: h.page, before: typeof h.after === 'string' ? h.after : '' });
    }
    /* text that had no earlier saved version cannot be put back from here: "Put back the original" handles that */
    const usable = list.filter(c => c.keepEmpty || (c.value !== '' && c.value !== undefined && c.value !== null));
    if (!usable.length) return res.status(400).json({ error: 'There is no earlier version to put back. Use "Put back the original" on that item instead.' });
    if (!(await mayChange(req, res, user, usable))) return;
    return submit(req, res, user, usable, 'Put an earlier version back', { via: 'restore', restoredFrom: body.group || body.id });
  }

  if (action === 'draft-approve' || action === 'draft-reject') {
    const owner = await requireOwner(req, res);
    if (!owner) return;
    const drafts = await db.getCollection('site-drafts');
    const idx = drafts.findIndex(d => d.id === body.id);
    if (idx === -1) return res.status(404).json({ error: 'We could not find those changes.' });
    const d = drafts[idx];
    if (d.status !== 'pending') return res.status(409).json({ error: 'Those changes have already been decided.' });
    if (action === 'draft-reject') {
      d.status = 'rejected'; d.decidedBy = edit.who(owner); d.decidedAt = new Date().toISOString(); d.reason = String(body.reason || '').slice(0, 400);
      await db.setCollection('site-drafts', drafts);
      tellAuthor(req, d, false, d.reason);
      return res.status(200).json({ ok: true });
    }
    const list = d.changes.map(c => Object.assign({ id: c.id, kind: c.kind, value: c.after, label: c.label, page: c.page, before: typeof c.before === 'string' ? c.before : '' }, c.id === edit.TEXT_ID ? { scope: c.scope, orig: c.kind === 'ti' ? String(c.orig || '').replace(/^img:/, '') : c.orig } : c.id === edit.CAT_ID ? { list: c.list, key: c.key } : {}));
    const p = await prepare(list);
    if (p.error) return res.status(400).json({ error: p.error });
    if (p.changes.length) await edit.publish(p.changes, d.by, { via: 'approved', approvedBy: edit.who(owner), note: d.note });
    d.status = 'approved'; d.decidedBy = edit.who(owner); d.decidedAt = new Date().toISOString();
    await db.setCollection('site-drafts', drafts);
    tellAuthor(req, d, true, '');
    return res.status(200).json({ ok: true, live: true });
  }

  if (action === 'draft-withdraw') {
    const user = await requirePerm(req, res, 'pages', 'catalog', 'blog');
    if (!user) return;
    const drafts = await db.getCollection('site-drafts');
    const d = drafts.find(x => x.id === body.id);
    if (!d || d.by.id !== user.id) return res.status(404).json({ error: 'We could not find those changes.' });
    if (d.status !== 'pending') return res.status(409).json({ error: 'Those changes have already been decided.' });
    d.status = 'withdrawn'; d.decidedAt = new Date().toISOString();
    await db.setCollection('site-drafts', drafts);
    return res.status(200).json({ ok: true });
  }

  if (action === 'preview-link') {
    const user = await requirePerm(req, res, 'pages', 'catalog');
    if (!user) return;
    const drafts = await db.getCollection('site-drafts');
    const d = drafts.find(x => x.id === body.id);
    const owner = user.role === 'admin';
    if (!d || (!owner && d.by.id !== user.id)) return res.status(404).json({ error: 'We could not find those changes.' });
    if (d.status !== 'pending') return res.status(409).json({ error: 'Those changes have already been decided.' });
    return res.status(200).json({ ok: true, token: signPreview(d.id, 7), page: (d.changes.find(c => c.page) || {}).page || 'home' });
  }

  return res.status(400).json({ error: 'Invalid action' });
};
