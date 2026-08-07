/* =========================================================
   reel-local-media-db.ts — Persistência local de mídia dos
   Reels (Fase 3B). Vídeo/pôster em IndexedDB (API nativa,
   sem lib externa). Chave do banco: connexy-reels-local-db
   (v1), store "media" (keyPath: id).

   Nunca armazena base64/blob em localStorage. Blobs são
   expostos via URL.createObjectURL() apenas para exibição,
   com cache por sessão; deleteReelMedia() revoga as URLs
   correspondentes.
========================================================= */

const DB_NAME = "connexy-reels-local-db";
const DB_VERSION = 1;
const STORE_NAME = "media";

export interface ReelMediaRecord {
  id: string;
  videoBlob: Blob;
  videoType: string;
  posterBlob: Blob | null;
  posterType: string | null;
  storedAt: string;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB indisponível"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Falha ao abrir IndexedDB"));
  });
  return dbPromise;
}

function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode);
        const req = fn(tx.objectStore(STORE_NAME));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error ?? new Error("Falha na operação IndexedDB"));
      }),
  );
}

/* ─── Cache de object URLs por sessão ───────────────────── */

const objectUrlCache = new Map<string, string>();
const recordCache = new Map<string, ReelMediaRecord>();

function posterCacheKey(reelId: string): string {
  return `poster:${reelId}`;
}

export async function saveReelMedia(record: ReelMediaRecord): Promise<void> {
  await withStore("readwrite", (store) => store.put(record));
  recordCache.set(record.id, record);
  for (const key of [record.id, posterCacheKey(record.id)]) {
    const url = objectUrlCache.get(key);
    if (url) {
      URL.revokeObjectURL(url);
      objectUrlCache.delete(key);
    }
  }
}

export async function getReelMedia(reelId: string): Promise<ReelMediaRecord | null> {
  const cached = recordCache.get(reelId);
  if (cached) return cached;
  const record = await withStore<ReelMediaRecord | undefined>("readonly", (store) =>
    store.get(reelId),
  );
  if (!record) return null;
  recordCache.set(reelId, record);
  return record;
}

export async function getReelVideoUrl(reelId: string): Promise<string | null> {
  const cached = objectUrlCache.get(reelId);
  if (cached) return cached;
  const record = await getReelMedia(reelId);
  if (!record) return null;
  const url = URL.createObjectURL(record.videoBlob);
  objectUrlCache.set(reelId, url);
  return url;
}

export async function getReelPosterUrl(reelId: string): Promise<string | null> {
  const record = await getReelMedia(reelId);
  if (!record?.posterBlob) return null;
  const key = posterCacheKey(reelId);
  const cached = objectUrlCache.get(key);
  if (cached) return cached;
  const url = URL.createObjectURL(record.posterBlob);
  objectUrlCache.set(key, url);
  return url;
}

export async function listStoredReelIds(): Promise<string[]> {
  return withStore<IDBValidKey[]>("readonly", (store) => store.getAllKeys()).then((keys) =>
    keys.filter((k): k is string => typeof k === "string"),
  );
}

export async function deleteReelMedia(reelId: string): Promise<void> {
  await withStore("readwrite", (store) => store.delete(reelId));
  for (const key of [reelId, posterCacheKey(reelId)]) {
    const url = objectUrlCache.get(key);
    if (url) {
      URL.revokeObjectURL(url);
      objectUrlCache.delete(key);
    }
  }
  recordCache.delete(reelId);
}
