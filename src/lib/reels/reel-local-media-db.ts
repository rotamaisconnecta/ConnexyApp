/* =========================================================
   reel-local-media-db.ts — Persistência local de mídia dos
   Reels. Arquivos reais no OPFS via local-media-storage;
   este banco guarda metadados e, só se OPFS faltar, o Blob.
========================================================= */

import {
  getLocalMediaBlob,
  getLocalMediaObjectUrl,
  removeLocalMedia,
  saveLocalMedia,
} from "@/lib/media/local-media-storage";

const DB_NAME = "connexy-reels-local-db";
const DB_VERSION = 2;
const STORE_NAME = "media";

export interface ReelMediaRecord {
  id: string;
  videoBlob: Blob;
  videoType: string;
  posterBlob: Blob | null;
  posterType: string | null;
  storedAt: string;
  durationMs?: number;
}

type StoredReelMedia = {
  id: string;
  videoType: string;
  posterType: string | null;
  storedAt: string;
  videoMediaId: string;
  posterMediaId: string | null;
  videoBlob?: Blob;
  posterBlob?: Blob | null;
};

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

const objectUrlCache = new Map<string, string>();
const recordCache = new Map<string, ReelMediaRecord>();

function posterCacheKey(reelId: string): string {
  return `poster:${reelId}`;
}

function posterMediaId(reelId: string): string {
  return `${reelId}-poster`;
}

async function hydrate(row: StoredReelMedia): Promise<ReelMediaRecord> {
  let videoBlob = row.videoBlob;
  if (!videoBlob) {
    videoBlob = await getLocalMediaBlob(row.videoMediaId || row.id);
  }
  let posterBlob = row.posterBlob ?? null;
  if (!posterBlob && row.posterMediaId) {
    posterBlob = await getLocalMediaBlob(row.posterMediaId).catch(() => null);
  }
  return {
    id: row.id,
    videoBlob,
    videoType: row.videoType,
    posterBlob,
    posterType: row.posterType,
    storedAt: row.storedAt,
  };
}

export async function saveReelMedia(record: ReelMediaRecord): Promise<void> {
  const video = await saveLocalMedia({
    id: record.id,
    kind: "reel",
    scope: "reel",
    blob: record.videoBlob,
    mimeType: record.videoType,
    fileName: `${record.id}.${record.videoType.includes("mp4") ? "mp4" : "webm"}`,
    durationMs: record.durationMs,
  });
  let posterId: string | null = null;
  if (record.posterBlob) {
    const poster = await saveLocalMedia({
      id: posterMediaId(record.id),
      kind: "photo",
      scope: "reel",
      blob: record.posterBlob,
      mimeType: record.posterType || "image/jpeg",
      fileName: `${record.id}-poster.jpg`,
    });
    posterId = poster.id;
  }
  const stored: StoredReelMedia = {
    id: record.id,
    videoType: record.videoType,
    posterType: record.posterType,
    storedAt: record.storedAt,
    videoMediaId: video.id,
    posterMediaId: posterId,
    ...(video.backend === "fallback"
      ? { videoBlob: record.videoBlob, posterBlob: record.posterBlob }
      : {}),
  };
  await withStore("readwrite", (store) => store.put(stored));
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
  const record = await withStore<StoredReelMedia | undefined>("readonly", (store) =>
    store.get(reelId),
  );
  if (!record) return null;
  try {
    const hydrated = await hydrate(record);
    recordCache.set(reelId, hydrated);
    return hydrated;
  } catch {
    return null;
  }
}

export async function getReelVideoUrl(reelId: string): Promise<string | null> {
  const cached = objectUrlCache.get(reelId);
  if (cached) return cached;
  try {
    const url = await getLocalMediaObjectUrl(reelId);
    objectUrlCache.set(reelId, url);
    return url;
  } catch {
    const record = await getReelMedia(reelId);
    if (!record) return null;
    const url = URL.createObjectURL(record.videoBlob);
    objectUrlCache.set(reelId, url);
    return url;
  }
}

export async function getReelPosterUrl(reelId: string): Promise<string | null> {
  const key = posterCacheKey(reelId);
  const cached = objectUrlCache.get(key);
  if (cached) return cached;
  try {
    const url = await getLocalMediaObjectUrl(posterMediaId(reelId));
    objectUrlCache.set(key, url);
    return url;
  } catch {
    const record = await getReelMedia(reelId);
    if (!record?.posterBlob) return null;
    const url = URL.createObjectURL(record.posterBlob);
    objectUrlCache.set(key, url);
    return url;
  }
}

export async function listStoredReelIds(): Promise<string[]> {
  return withStore<IDBValidKey[]>("readonly", (store) => store.getAllKeys()).then((keys) =>
    keys.filter((k): k is string => typeof k === "string"),
  );
}

export async function deleteReelMedia(reelId: string): Promise<void> {
  await withStore("readwrite", (store) => store.delete(reelId));
  await removeLocalMedia(reelId).catch(() => undefined);
  await removeLocalMedia(posterMediaId(reelId)).catch(() => undefined);
  for (const key of [reelId, posterCacheKey(reelId)]) {
    const url = objectUrlCache.get(key);
    if (url) {
      URL.revokeObjectURL(url);
      objectUrlCache.delete(key);
    }
  }
  recordCache.delete(reelId);
}
