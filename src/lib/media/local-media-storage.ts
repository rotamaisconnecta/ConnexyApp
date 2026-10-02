/* =========================================================
   local-media-storage.ts — Persistência local de mídia.
   OPFS é o armazenamento primário dos arquivos.
   IndexedDB guarda metadados e, só se OPFS faltar, o Blob.
   Object URLs são temporários de reprodução — nunca armazenamento.
========================================================= */

export type LocalMediaKind = "photo" | "audio" | "reel";
export type LocalMediaScope = "conversation" | "post" | "reel";
export type LocalMediaBackend = "opfs" | "fallback";

export type LocalMediaRecord = {
  id: string;
  kind: LocalMediaKind;
  scope: LocalMediaScope;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: number;
  durationMs?: number;
  path: string;
  backend: LocalMediaBackend;
};

export class LocalMediaError extends Error {
  constructor(
    message: string,
    readonly code:
      | "unsupported"
      | "permission"
      | "quota"
      | "missing"
      | "corrupt"
      | "unavailable"
      | "aborted",
  ) {
    super(message);
    this.name = "LocalMediaError";
  }
}

const DB_NAME = "connexy-media-local-db";
const DB_VERSION = 1;
const STORE_NAME = "records";
const ROOT_DIR = "connexy-media";

const DIR_BY_SCOPE: Record<LocalMediaScope, readonly string[]> = {
  conversation: ["photos", "conversations"],
  post: ["photos", "posts"],
  reel: ["reels"],
};

const AUDIO_DIR = ["audio", "conversations"] as const;

export function supportsOpfs(): boolean {
  return (
    typeof navigator !== "undefined" &&
    "storage" in navigator &&
    typeof navigator.storage?.getDirectory === "function"
  );
}

type StoredRow = LocalMediaRecord & { blob?: Blob };

type DirectoryLike = {
  getDirectoryHandle: (
    name: string,
    options?: { create?: boolean },
  ) => Promise<DirectoryLike>;
  getFileHandle: (
    name: string,
    options?: { create?: boolean },
  ) => Promise<{
    createWritable: () => Promise<{ write: (data: Blob) => Promise<void>; close: () => Promise<void> }>;
    getFile: () => Promise<File>;
  }>;
  removeEntry?: (name: string) => Promise<void>;
};

let initPromise: Promise<void> | null = null;
let opfsRoot: DirectoryLike | null = null;
let memoryRecords = new Map<string, StoredRow>();
const objectUrlCache = new Map<string, string>();
let dbPromise: Promise<IDBDatabase> | null = null;
let testDirectory: DirectoryLike | null = null;

export function getLocalMediaBackend(): LocalMediaBackend {
  if (testDirectory) return "opfs";
  return supportsOpfs() ? "opfs" : "fallback";
}

export function __setOpfsDirectoryForTests(root: DirectoryLike | null): void {
  testDirectory = root;
  initPromise = null;
  opfsRoot = null;
}

export function __resetLocalMediaForTests(): void {
  for (const url of objectUrlCache.values()) URL.revokeObjectURL(url);
  objectUrlCache.clear();
  memoryRecords = new Map();
  initPromise = null;
  opfsRoot = null;
  testDirectory = null;
  if (dbPromise) {
    void dbPromise.then((db) => db.close()).catch(() => undefined);
    dbPromise = null;
  }
}

/** Simula reload da sessão React: Object URLs somem; OPFS e metadados permanecem. */
export function __forgetSessionForTests(): void {
  for (const url of objectUrlCache.values()) URL.revokeObjectURL(url);
  objectUrlCache.clear();
  initPromise = null;
  opfsRoot = null;
  if (dbPromise) {
    void dbPromise.then((db) => db.close()).catch(() => undefined);
    dbPromise = null;
  }
}

function openMetaDb(): Promise<IDBDatabase> | null {
  if (typeof indexedDB === "undefined") return null;
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB indisponível"));
  });
  return dbPromise;
}

async function withMetaStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T | undefined> {
  try {
    const open = openMetaDb();
    if (!open) return undefined;
    const db = await open;
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, mode);
      const req = fn(tx.objectStore(STORE_NAME));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error ?? new Error("Falha nos metadados de mídia"));
    });
  } catch {
    return undefined;
  }
}

async function putRow(row: StoredRow): Promise<void> {
  const written = await withMetaStore("readwrite", (store) => store.put(row));
  if (written === undefined) memoryRecords.set(row.id, row);
}

async function getRow(id: string): Promise<StoredRow | null> {
  const fromDb = await withMetaStore<StoredRow | undefined>("readonly", (store) => store.get(id));
  if (fromDb) return fromDb;
  return memoryRecords.get(id) ?? null;
}

async function deleteRow(id: string): Promise<void> {
  const deleted = await withMetaStore("readwrite", (store) => store.delete(id));
  if (deleted === undefined) memoryRecords.delete(id);
}

async function getAllRows(): Promise<StoredRow[]> {
  const fromDb = await withMetaStore<StoredRow[]>("readonly", (store) => store.getAll());
  if (fromDb) return fromDb;
  return [...memoryRecords.values()];
}

function mapError(error: unknown, fallback: LocalMediaError["code"]): LocalMediaError {
  if (error instanceof LocalMediaError) return error;
  const name = error instanceof DOMException ? error.name : "";
  const message = error instanceof Error ? error.message : "Falha no armazenamento local de mídia";
  if (name === "NotAllowedError" || name === "SecurityError") {
    return new LocalMediaError("Permissão negada para o armazenamento local.", "permission");
  }
  if (name === "QuotaExceededError" || message.toLowerCase().includes("quota")) {
    return new LocalMediaError("Espaço insuficiente para salvar a mídia.", "quota");
  }
  if (name === "AbortError") {
    return new LocalMediaError("A gravação da mídia foi interrompida.", "aborted");
  }
  if (name === "NotFoundError") {
    return new LocalMediaError("Arquivo de mídia não encontrado.", "missing");
  }
  return new LocalMediaError(message, fallback);
}

async function getOpfsRoot(): Promise<DirectoryLike | null> {
  if (testDirectory) return testDirectory;
  if (!supportsOpfs()) return null;
  if (opfsRoot) return opfsRoot;
  opfsRoot = (await navigator.storage.getDirectory()) as unknown as DirectoryLike;
  return opfsRoot;
}

async function ensureDir(segments: readonly string[]): Promise<DirectoryLike | null> {
  const root = await getOpfsRoot();
  if (!root) return null;
  let current = await root.getDirectoryHandle(ROOT_DIR, { create: true });
  for (const segment of segments) {
    current = await current.getDirectoryHandle(segment, { create: true });
  }
  return current;
}

export async function ensureLocalMediaReady(): Promise<LocalMediaBackend> {
  if (!initPromise) {
    initPromise = (async () => {
      if (!supportsOpfs() && !testDirectory) return;
      await ensureDir(["photos", "conversations"]);
      await ensureDir(["photos", "posts"]);
      await ensureDir(["audio", "conversations"]);
      await ensureDir(["reels"]);
    })().catch((error) => {
      initPromise = null;
      throw mapError(error, "unavailable");
    });
  }
  await initPromise;
  return getLocalMediaBackend();
}

function extensionFor(mimeType: string, kind: LocalMediaKind): string {
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("webp")) return "webp";
  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) return "jpg";
  if (mimeType.includes("mp4")) return "mp4";
  if (mimeType.includes("webm")) return "webm";
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("mpeg") || mimeType.includes("mp3")) return "mp3";
  if (kind === "photo") return mimeType.startsWith("video/") ? "webm" : "jpg";
  if (kind === "audio") return "webm";
  return "webm";
}

function pathFor(kind: LocalMediaKind, scope: LocalMediaScope, id: string, mimeType: string): string {
  const ext = extensionFor(mimeType, kind);
  const fileName = `${id}.${ext}`;
  const dir = kind === "audio" ? AUDIO_DIR : DIR_BY_SCOPE[scope];
  return [ROOT_DIR, ...dir, fileName].join("/");
}

function fileNameFromPath(path: string): string {
  return path.split("/").pop() ?? path;
}

async function writeOpfsFile(path: string, blob: Blob): Promise<void> {
  const segments = path.split("/");
  const fileName = segments.pop();
  if (!fileName) throw new LocalMediaError("Caminho de mídia inválido.", "corrupt");
  const dirSegments = segments[0] === ROOT_DIR ? segments.slice(1) : segments;
  const dir = await ensureDir(dirSegments);
  if (!dir) throw new LocalMediaError("OPFS indisponível.", "unavailable");
  const handle = await dir.getFileHandle(fileName, { create: true });
  const writable = await handle.createWritable();
  await writable.write(blob);
  await writable.close();
}

async function readOpfsFile(path: string): Promise<File> {
  const segments = path.split("/");
  const fileName = segments.pop();
  if (!fileName) throw new LocalMediaError("Caminho de mídia inválido.", "corrupt");
  const dirSegments = segments[0] === ROOT_DIR ? segments.slice(1) : segments;
  const dir = await ensureDir(dirSegments);
  if (!dir) throw new LocalMediaError("OPFS indisponível.", "unavailable");
  const handle = await dir.getFileHandle(fileName, { create: false });
  return handle.getFile();
}

async function removeOpfsFile(path: string): Promise<void> {
  const segments = path.split("/");
  const fileName = segments.pop();
  if (!fileName) return;
  const dirSegments = segments[0] === ROOT_DIR ? segments.slice(1) : segments;
  const dir = await ensureDir(dirSegments);
  await dir?.removeEntry?.(fileName);
}

export async function saveLocalMedia(input: {
  kind: LocalMediaKind;
  scope: LocalMediaScope;
  blob: Blob;
  mimeType: string;
  fileName?: string;
  durationMs?: number;
  id?: string;
}): Promise<LocalMediaRecord> {
  await ensureLocalMediaReady();
  const id = input.id ?? `media-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const mimeType = input.mimeType || input.blob.type || "application/octet-stream";
  const path = pathFor(input.kind, input.scope, id, mimeType);
  const fileName = input.fileName || fileNameFromPath(path);
  let backend: LocalMediaBackend = getLocalMediaBackend();
  let storedBlob: Blob | undefined;

  if (backend === "opfs") {
    try {
      await writeOpfsFile(path, input.blob);
    } catch (error) {
      const mapped = mapError(error, "unavailable");
      if (mapped.code === "quota" || mapped.code === "permission" || mapped.code === "unavailable") {
        backend = "fallback";
        storedBlob = input.blob;
      } else {
        throw mapped;
      }
    }
  } else {
    storedBlob = input.blob;
  }

  const record: LocalMediaRecord = {
    id,
    kind: input.kind,
    scope: input.scope,
    fileName,
    mimeType,
    size: input.blob.size,
    createdAt: Date.now(),
    durationMs: input.durationMs,
    path,
    backend,
  };
  await putRow(storedBlob ? { ...record, blob: storedBlob } : record);
  const cached = objectUrlCache.get(id);
  if (cached) {
    URL.revokeObjectURL(cached);
    objectUrlCache.delete(id);
  }
  return record;
}

export async function getLocalMediaRecord(id: string): Promise<LocalMediaRecord | null> {
  const row = await getRow(id);
  if (!row) return null;
  const { blob: _blob, ...record } = row;
  return record;
}

export async function localMediaExists(id: string): Promise<boolean> {
  return (await getRow(id)) != null;
}

export async function getLocalMediaBlob(id: string): Promise<Blob> {
  const row = await getRow(id);
  if (!row) throw new LocalMediaError("Arquivo de mídia não encontrado.", "missing");
  if (row.backend === "opfs") {
    try {
      return await readOpfsFile(row.path);
    } catch (error) {
      if (row.blob) return row.blob;
      throw mapError(error, "missing");
    }
  }
  if (row.blob) return row.blob;
  throw new LocalMediaError("Referência de mídia corrompida.", "corrupt");
}

export function peekLocalMediaObjectUrl(id: string): string | null {
  return objectUrlCache.get(id) ?? null;
}

export async function getLocalMediaObjectUrl(id: string): Promise<string> {
  const cached = objectUrlCache.get(id);
  if (cached) return cached;
  const blob = await getLocalMediaBlob(id);
  const url = URL.createObjectURL(blob);
  objectUrlCache.set(id, url);
  return url;
}

export function revokeLocalMediaObjectUrl(id: string): void {
  const url = objectUrlCache.get(id);
  if (!url) return;
  URL.revokeObjectURL(url);
  objectUrlCache.delete(id);
}

export async function removeLocalMedia(id: string): Promise<void> {
  const row = await getRow(id);
  revokeLocalMediaObjectUrl(id);
  if (row?.backend === "opfs") {
    try {
      await removeOpfsFile(row.path);
    } catch {
      // Metadados ainda são removidos para não deixar referência órfã visível.
    }
  }
  await deleteRow(id);
}

export async function listLocalMediaRecords(): Promise<LocalMediaRecord[]> {
  const rows = await getAllRows();
  return rows.map(({ blob: _blob, ...record }) => record);
}

/** Só deve ser chamada por reset explícito da demonstração. */
export async function clearAllLocalMedia(): Promise<void> {
  const rows = await getAllRows();
  for (const row of rows) {
    revokeLocalMediaObjectUrl(row.id);
    if (row.backend === "opfs") {
      try {
        await removeOpfsFile(row.path);
      } catch {
        /* ignore */
      }
    }
  }
  memoryRecords = new Map();
  const cleared = await withMetaStore("readwrite", (store) => store.clear());
  if (cleared === undefined) memoryRecords = new Map();
}
