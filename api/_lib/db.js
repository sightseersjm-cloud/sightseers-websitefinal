const { put, list, del } = require('@vercel/blob');

const BASE = 'ss-data/';

async function getDoc(name) {
  try {
    const path = BASE + name + '.json';
    const { blobs } = await list({ prefix: path });
    const blob = blobs.find(b => b.pathname === path);
    if (!blob) return null;
    const url = (blob.downloadUrl || blob.url) + '?t=' + Date.now();
    const res = await fetch(url);
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

async function setDoc(name, data) {
  await put(BASE + name + '.json', JSON.stringify(data), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false
  });
}

async function getCollection(name) {
  const doc = await getDoc(name);
  return Array.isArray(doc) ? doc : [];
}

async function setCollection(name, items) {
  await setDoc(name, items);
}

async function findInCollection(name, predicate) {
  const items = await getCollection(name);
  return items.find(predicate) || null;
}

async function addToCollection(name, item) {
  const items = await getCollection(name);
  items.push(item);
  await setCollection(name, items);
  return item;
}

async function updateInCollection(name, id, updates) {
  const items = await getCollection(name);
  const idx = items.findIndex(i => i.id === id);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...updates, updatedAt: new Date().toISOString() };
  await setCollection(name, items);
  return items[idx];
}

async function removeFromCollection(name, id) {
  const items = await getCollection(name);
  const filtered = items.filter(i => i.id !== id);
  if (filtered.length === items.length) return false;
  await setCollection(name, filtered);
  return true;
}

async function listImages(prefix) {
  try {
    const { blobs } = await list({ prefix: prefix || 'site-images/' });
    return blobs.map(b => ({ url: b.url, pathname: b.pathname, size: b.size, uploadedAt: b.uploadedAt }));
  } catch { return []; }
}

async function deleteBlob(url) {
  try { await del(url); return true; } catch { return false; }
}

module.exports = {
  getDoc, setDoc, getCollection, setCollection,
  findInCollection, addToCollection, updateInCollection, removeFromCollection,
  listImages, deleteBlob
};
