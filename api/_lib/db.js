const { put, list, del, get } = require('@vercel/blob');

const BASE = 'ss-data/';

// Read a private JSON doc back via the authenticated get() API (works on private stores).
async function getDoc(name) {
  try {
    const result = await get(BASE + name + '.json', { access: 'private', useCache: false });
    if (!result || !result.stream) return null;
    return await new Response(result.stream).json();
  } catch {
    return null;
  }
}

async function setDoc(name, data) {
  await put(BASE + name + '.json', JSON.stringify(data), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true
  });
}

async function getCollection(name) {
  const doc = await getDoc(name);
  return Array.isArray(doc) ? doc : [];
}

async function setCollection(name, items) {
  await setDoc(name, items);
}

/* A read for a change: a missing collection is empty, but a read that FAILED (storage busy, network, a bad file)
   throws, so a change never writes a one-item list over a whole collection (for example every account). */
async function getCollectionForWrite(name) {
  const result = await get(BASE + name + '.json', { access: 'private', useCache: false });
  if (!result || !result.stream) return [];
  const doc = await new Response(result.stream).json();
  if (!Array.isArray(doc)) throw new Error('Collection ' + name + ' is not a list; not overwriting it');
  return doc;
}

async function findInCollection(name, predicate) {
  const items = await getCollection(name);
  return items.find(predicate) || null;
}

async function addToCollection(name, item) {
  const items = await getCollectionForWrite(name);
  items.push(item);
  await setCollection(name, items);
  return item;
}

async function updateInCollection(name, id, updates) {
  const items = await getCollectionForWrite(name);
  const idx = items.findIndex(i => i.id === id);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...updates, updatedAt: new Date().toISOString() };
  await setCollection(name, items);
  return items[idx];
}

async function removeFromCollection(name, id) {
  const items = await getCollectionForWrite(name);
  const filtered = items.filter(i => i.id !== id);
  if (filtered.length === items.length) return false;
  await setCollection(name, filtered);
  return true;
}

async function listImages(prefix) {
  try {
    const { blobs } = await list({ prefix: prefix || 'site-images/' });
    // downloadUrl is the authenticated URL that works for private blobs
    return blobs.map(b => ({ url: b.downloadUrl || b.url, publicUrl: b.url, pathname: b.pathname, size: b.size, uploadedAt: b.uploadedAt }));
  } catch { return []; }
}

async function deleteBlob(url) {
  try { await del(url); return true; } catch { return false; }
}

module.exports = {
  getDoc, setDoc, getCollection, setCollection, getCollectionForWrite,
  findInCollection, addToCollection, updateInCollection, removeFromCollection,
  listImages, deleteBlob
};
