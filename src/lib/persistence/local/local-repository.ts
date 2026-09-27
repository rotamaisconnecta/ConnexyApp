/* =========================================================
   local-repository.ts — LocalRepository (Fase 1C-1).

   Implementação do contrato PersistenceRepository<T> sobre um
   StorageAdapter local. O repositório desconhece IndexedDB —
   depende apenas da interface StorageAdapter — o que permite,
   no futuro, um SupabaseRepository com o mesmo contrato sem
   reescrever a UI.

   update() é um read-modify-write: busca, mescla mudanças e
   grava. Não lança se o registro não existir; usa NOT_FOUND.
   Nenhuma entidade real do Connexy é migrada por esta camada.
   ========================================================= */

import { PersistenceError, PersistenceErrorCode } from "../errors";
import { jsonSerializer } from "../serializer";
import type {
  EntityId,
  PersistedEntity,
  PersistenceRepository,
  Serializer,
  StorageAdapter,
  StoreName,
} from "../types";

export class LocalRepository<T extends PersistedEntity> implements PersistenceRepository<T> {
  readonly store: StoreName;
  protected readonly adapter: StorageAdapter;
  protected readonly serializer: Serializer<T>;

  constructor(
    adapter: StorageAdapter,
    store: StoreName,
    serializer: Serializer<T> = jsonSerializer<T>(),
  ) {
    this.adapter = adapter;
    this.store = store;
    this.serializer = serializer;
  }

  async get(id: EntityId): Promise<T | null> {
    const record = await this.adapter.get<T>(this.store, id);
    return record ? this.serializer.decode(record) : null;
  }

  async list(): Promise<T[]> {
    const records = await this.adapter.getAll<T>(this.store);
    return records.map((record) => this.serializer.decode(record));
  }

  async put(record: T): Promise<T> {
    const encoded = this.serializer.encode(record);
    await this.adapter.put<T>(this.store, encoded);
    return record;
  }

  async update(id: EntityId, changes: Partial<Omit<T, "id">>): Promise<T> {
    const current = await this.get(id);
    if (!current) {
      throw new PersistenceError(
        `Registro "${id}" inexistente na coleção "${this.store}"`,
        PersistenceErrorCode.NOT_FOUND,
      );
    }
    const merged = { ...current, ...changes } as T;
    return this.put(merged);
  }

  async delete(id: EntityId): Promise<void> {
    await this.adapter.delete(this.store, id);
  }

  async clear(): Promise<void> {
    await this.adapter.clear(this.store);
  }

  async exists(id: EntityId): Promise<boolean> {
    return (await this.adapter.get<T>(this.store, id)) != null;
  }
}

/** Fábrica orientada a injeção: facilita trocar o adapter no futuro. */
export function createLocalRepository<T extends PersistedEntity>(
  adapter: StorageAdapter,
  store: StoreName,
  serializer: Serializer<T> = jsonSerializer<T>(),
): PersistenceRepository<T> {
  return new LocalRepository<T>(adapter, store, serializer);
}
