/* =========================================================
   indexed-db.ts — Adapter IndexedDB (API nativa, sem lib)
   para a camada de persistência local (Fase 1C-1).

   Isola IndexedDB (IDBDatabase, IDBTransaction, IDBRequest,
   nomes de object stores) do restante do app: o contrato
   StorageAdapter expõe apenas operações assíncronas por store.

   Coexistência: a store "connexy-reels-local-db/media" usada
   pelo fluxo de Reels NÃO é tocada. Esta camada usa um banco
   e stores próprios e não migra nenhum dado existente.

   Versionamento (prompt §10): a versão da abertura vem de
   PersistenceSchema.version. Em upgrades, quaisquer stores
   definidas e ausentes são criadas em applyUpgrade(); migrações
   futuras (renomear/transformar stores) devem ser adicionadas
   nesse hook, nunca dropando dados sem migração.
   ========================================================= */

import { PersistenceError, PersistenceErrorCode, toPersistenceError } from "../errors";
import type {
  EntityId,
  PersistenceSchema,
  PersistedEntity,
  StorageAdapter,
  StoreName,
} from "../types";

export class IndexedDbAdapter implements StorageAdapter {
  readonly schema: PersistenceSchema;
  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor(schema: PersistenceSchema) {
    this.schema = schema;
  }

  private open(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;
    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      if (typeof indexedDB === "undefined") {
        reject(
          new PersistenceError(
            "IndexedDB indisponível neste ambiente",
            PersistenceErrorCode.ADAPTER_UNAVAILABLE,
          ),
        );
        return;
      }
      const request = indexedDB.open(this.schema.name, this.schema.version);
      request.onupgradeneeded = () => this.applyUpgrade(request.result);
      request.onblocked = () => {
        reject(
          new PersistenceError(
            `Upgrade do banco "${this.schema.name}" bloqueado (schema incompatível)`,
            PersistenceErrorCode.SCHEMA_MISMATCH,
          ),
        );
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(
          toPersistenceError(
            request.error,
            PersistenceErrorCode.DATABASE_OPEN_FAILED,
            `Falha ao abrir o banco "${this.schema.name}"`,
          ),
        );
    });
    return this.dbPromise;
  }

  /** Cria stores ausentes e índices ausentes (sem nunca dropar dados). */
  private applyUpgrade(db: IDBDatabase): void {
    for (const store of this.schema.stores) {
      const objectStore = db.objectStoreNames.contains(store.name)
        ? db.transaction(store.name, "versionchange").objectStore(store.name)
        : db.createObjectStore(store.name, { keyPath: store.keyPath ?? "id" });
      for (const index of store.indexes ?? []) {
        if (objectStore.indexNames.contains(index.name)) continue;
        objectStore.createIndex(index.name, index.keyPath, { unique: false });
      }
    }
  }

  private request<T>(
    store: StoreName,
    mode: IDBTransactionMode,
    fn: (store: IDBObjectStore) => IDBRequest<T>,
    operation: string,
  ): Promise<T> {
    return this.open().then(
      (db) =>
        new Promise<T>((resolve, reject) => {
          let tx: IDBTransaction;
          try {
            tx = db.transaction(store, mode);
          } catch (error) {
            reject(
              toPersistenceError(
                error,
                PersistenceErrorCode.STORE_MISSING,
                `Store "${store}" indisponível`,
              ),
            );
            return;
          }
          const req = fn(tx.objectStore(store));
          req.onsuccess = () => resolve(req.result);
          req.onerror = () =>
            reject(
              toPersistenceError(
                req.error,
                PersistenceErrorCode.UNKNOWN,
                `Falha na operação "${operation}" em "${store}"`,
              ),
            );
        }),
    );
  }

  get<T extends PersistedEntity>(store: StoreName, id: EntityId): Promise<T | null> {
    return this.request<T | undefined>(store, "readonly", (s) => s.get(id), "get").then(
      (record) => record ?? null,
    );
  }

  getAll<T extends PersistedEntity>(store: StoreName): Promise<T[]> {
    return this.request<T[]>(store, "readonly", (s) => s.getAll(), "getAll");
  }

  async getAllKeys(store: StoreName): Promise<EntityId[]> {
    const keys = await this.request<IDBValidKey[]>(
      store,
      "readonly",
      (s) => s.getAllKeys(),
      "getAllKeys",
    );
    return keys.filter((key): key is EntityId => typeof key === "string");
  }

  getAllByIndex<T extends PersistedEntity>(
    store: StoreName,
    indexName: string,
    value: string | number,
  ): Promise<T[]> {
    return this.request<T[]>(
      store,
      "readonly",
      (s) => s.index(indexName).getAll(value),
      `getAllByIndex("${indexName}")`,
    );
  }

  put<T extends PersistedEntity>(store: StoreName, value: T): Promise<void> {
    return this.request<IDBValidKey>(store, "readwrite", (s) => s.put(value), "put").then(() => {});
  }

  delete(store: StoreName, id: EntityId): Promise<void> {
    return this.request<undefined>(store, "readwrite", (s) => s.delete(id), "delete").then(
      () => {},
    );
  }

  clear(store: StoreName): Promise<void> {
    return this.request<undefined>(store, "readwrite", (s) => s.clear(), "clear").then(() => {});
  }

  async close(): Promise<void> {
    if (!this.dbPromise) return;
    const db = await this.dbPromise.catch(() => null);
    this.dbPromise = null;
    if (db) db.close();
  }
}
