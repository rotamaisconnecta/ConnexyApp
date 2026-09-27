/* =========================================================
   types.ts — Contratos da camada de persistência local (Fase 1C-1).

   A UI nunca deve conhecer IndexedDB, IDBDatabase, transações,
   IDBRequest ou nomes de object stores. A hierarquia pretendida:

     UI → Hook/Service → Repository → PersistenceAdapter → IndexedDB

   No futuro, um SupabaseRepository poderá substituir o adapter
   local sem exigir reescrever as telas (a UI depende apenas das
   interfaces deste arquivo).

   Nenhuma entidade real do Connexy é migrada por esta camada.
   ========================================================= */

/** Identificador estável de uma entidade persistente. */
export type EntityId = string;

/** Forma mínima de qualquer entidade persistida nesta camada. */
export interface PersistedEntity {
  id: EntityId;
}

/** Nome de uma coleção (store) persistida. Convenção: snake_case, singular. */
export type StoreName = string;

/** Nome de um índice dentro de uma store. Convenção: "by_<campo>". */
export type IndexName = string;

export interface StoreIndexDefinition {
  readonly name: IndexName;
  /** Campo (ou campos) indexado(s) no registro armazenado. */
  readonly keyPath: string | readonly string[];
}

export interface StoreDefinition {
  readonly name: StoreName;
  /** Chave primária usada pela store. Padrão: "id". */
  readonly keyPath?: string;
  /** Índices adicionais (não-únicos) criados na store. Opcional. */
  readonly indexes?: readonly StoreIndexDefinition[];
}

export interface PersistenceSchema {
  /** Nome do banco de dados. */
  readonly name: string;
  /** Versão do banco (mecanismo de versionamento/migração). */
  readonly version: number;
  readonly stores: readonly StoreDefinition[];
}

/**
 * Responsável por definir como objetos são armazenados.
 * Nunca devem ser persistidas funções, referências React ou
 * objetos de UI — apenas valores serializáveis (dados).
 */
export interface Serializer<T> {
  /** Converte o objeto de domínio em um valor armazenável. */
  encode(value: T): T;
  /** Converte o valor armazenado de volta em objeto de domínio. */
  decode(value: T): T;
}

/**
 * Adapter de persistência bruta por coleção. Esconde toda a
 * implementação (IndexedDB hoje; Supabase/outros depois).
 */
export interface StorageAdapter {
  readonly schema: PersistenceSchema;

  get<T extends PersistedEntity>(store: StoreName, id: EntityId): Promise<T | null>;
  getAll<T extends PersistedEntity>(store: StoreName): Promise<T[]>;
  getAllKeys(store: StoreName): Promise<EntityId[]>;
  /**
   * Consulta por índice (única chave de igualdade). Usado para
   * consultas eficientes por campo indexado (ex.: mensagens por
   * conversationId). A ordenação dos resultados segue a ordem do
   * índice; a camada de domínio pode reordenar quando necessário.
   */
  getAllByIndex<T extends PersistedEntity>(
    store: StoreName,
    indexName: IndexName,
    value: string | number,
  ): Promise<T[]>;
  put<T extends PersistedEntity>(store: StoreName, value: T): Promise<void>;
  delete(store: StoreName, id: EntityId): Promise<void>;
  clear(store: StoreName): Promise<void>;
  close(): Promise<void>;
}

/**
 * Contrato de repository de entidades persistentes. Pequeno por
 * deliberação: get, list, put, update, delete, clear, exists.
 */
export interface PersistenceRepository<T extends PersistedEntity> {
  /** Coleção onde a entidade vive (ex.: "feed_posts"). */
  readonly store: StoreName;

  get(id: EntityId): Promise<T | null>;
  list(): Promise<T[]>;
  /** Cria ou substitui (upsert) um registro por id. */
  put(record: T): Promise<T>;
  /** Mescla mudanças em um registro existente (id preservado). */
  update(id: EntityId, changes: Partial<Omit<T, "id">>): Promise<T>;
  delete(id: EntityId): Promise<void>;
  clear(): Promise<void>;
  exists(id: EntityId): Promise<boolean>;
}

/**
 * Convenção de namespace de coleções (prompt §11).
 *
 * As coleções `conversations` e `messages` já são criadas na Fase 1C-2
 * (primeira migração-piloto) no banco local `connexy-app-local-db`.
 * As demais permanecem um CONTRATO RESERVADO para fases futuras:
 * nenhuma outra entidade real do Connexy foi migrada para cá.
 */
export const RESERVED_COLLECTIONS = [
  "user_profiles",
  "connections",
  "connection_requests",
  "conversations",
  "messages",
  "conversation_groups",
  "trip_history",
  "ride_blocks",
  "reel_likes",
  "reel_comments",
  "feed_posts",
  "notifications",
  "presence_checkins",
  "marketplace_favorites",
  "marketplace_reviews",
  "promotion_redemptions",
  "ai_history",
  "live_events",
] as const;

export type ReservedCollection = (typeof RESERVED_COLLECTIONS)[number];
