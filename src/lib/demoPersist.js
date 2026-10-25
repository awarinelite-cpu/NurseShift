// Demo mode keeps its data in memory, so uploaded facility photos used to vanish
// on refresh. This keeps just the photos in the browser (IndexedDB holds the
// image files themselves, which localStorage is too small for).
const DB_NAME = 'nurseshift-demo';
const STORE = 'facility-photos';

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB unavailable'));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function done(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

// Returns { [facilityId]: [{ url, path, blob? }] } with object URLs rebuilt for stored files.
export async function loadDemoPhotos() {
  const db = await openDb();
  const tx = db.transaction(STORE, 'readonly');
  const store = tx.objectStore(STORE);
  const keys = await new Promise((res, rej) => { const r = store.getAllKeys(); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const values = await new Promise((res, rej) => { const r = store.getAll(); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  db.close();
  const out = {};
  keys.forEach((id, i) => {
    out[id] = (values[i] ?? []).map((item) =>
      item.blob ? { url: URL.createObjectURL(item.blob), path: null, blob: item.blob } : { url: item.url, path: null }
    );
  });
  return out;
}

export async function saveDemoPhotos(facilityId, photos) {
  const db = await openDb();
  const tx = db.transaction(STORE, 'readwrite');
  const store = tx.objectStore(STORE);
  if (!photos.length) store.delete(facilityId);
  else store.put(photos.map((p) => (p.blob ? { blob: p.blob } : { url: p.url })), facilityId);
  await done(tx);
  db.close();
}

export async function deleteDemoPhotos(facilityId) {
  const db = await openDb();
  const tx = db.transaction(STORE, 'readwrite');
  tx.objectStore(STORE).delete(facilityId);
  await done(tx);
  db.close();
}
