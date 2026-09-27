import { beforeEach, describe, expect, test } from "bun:test";
import { PersistenceError, PersistenceErrorCode } from "../src/lib/persistence/errors";
import { IndexedDbAdapter } from "../src/lib/persistence/local/indexed-db";
import {
  createLocalRepository,
  LocalRepository,
} from "../src/lib/persistence/local/local-repository";
import { jsonSerializer } from "../src/lib/persistence/serializer";
import type {
  EntityId,
  PersistedEntity,
  PersistenceSchema,
  StorageAdapter,
  StoreName,
} from "../src/lib/persistence/types";

const schema: PersistenceSchema = {
  name: "connexy-persist-test",
  version: 1,
  stores: [{ name: "items" }],
};

interface Item extends PersistedEntity {
  title: string;
  score: number;
}

/* "Disco" compartilhado que simula a persistência entre instâncias
   do adapter (à semelhança de um IndexedDB que sobrevive a reloads). */
const disk = new Map<StoreName, Map<EntityId, PersistedEntity>>();

function memoryAdapter(failOn?: (operation: string) => boolean): StorageAdapter {
  return {
    schema,
    async get(store, id) {
      return disk.get(store)?.get(id) ?? null;
    },
    async getAll(store) {
      return [...(disk.get(store)?.values() ?? [])];
    },
    async getAllKeys(store) {
      return [...(disk.get(store)?.keys() ?? [])];
    },
    async getAllByIndex(store, indexName, value) {
      const entries = disk.get(store);
      if (!entries) return [];
      const storeDef = schema.stores.find((item) => item.name === store);
      const indexDef = storeDef?.indexes?.find((item) => item.name === indexName);
      const keyPath = typeof indexDef?.keyPath === "string" ? indexDef.keyPath : null;
      const rows = [...entries.values()];
      if (!keyPath) return rows;
      return rows.filter((row) => (row as Record<string, unknown>)[keyPath] === value);
    },
    async put(store, value) {
      if (failOn?.("put")) {
        throw new PersistenceError("put falhou (injetado)", PersistenceErrorCode.UNKNOWN);
      }
      let map = disk.get(store);
      if (!map) {
        map = new Map();
        disk.set(store, map);
      }
      map.set(value.id, value);
    },
    async delete(store, id) {
      if (failOn?.("delete")) {
        throw new PersistenceError("delete falhou (injetado)", PersistenceErrorCode.UNKNOWN);
      }
      disk.get(store)?.delete(id);
    },
    async clear(store) {
      if (failOn?.("clear")) {
        throw new PersistenceError("clear falhou (injetado)", PersistenceErrorCode.UNKNOWN);
      }
      disk.set(store, new Map());
    },
    async close() {},
  };
}

beforeEach(() => {
  disk.clear();
});

function makeItem(id: string, title: string, score: number): Item {
  return { id, title, score };
}

describe("Fase 1C-1 — contrato de persistência local", () => {
  test("put + get preserva o registro", async () => {
    const repo = new LocalRepository<Item>(memoryAdapter(), "items");
    const record = makeItem("a", "primeiro", 1);
    await repo.put(record);

    expect(await repo.get("a")).toEqual(record);
  });

  test("get de id inexistente retorna null e exists=false", async () => {
    const repo = new LocalRepository<Item>(memoryAdapter(), "items");

    expect(await repo.get("nao-existe")).toBeNull();
    expect(await repo.exists("nao-existe")).toBe(false);
  });

  test("list devolve todos os registros", async () => {
    const repo = new LocalRepository<Item>(memoryAdapter(), "items");
    await repo.put(makeItem("a", "primeiro", 1));
    await repo.put(makeItem("b", "segundo", 2));

    expect(await repo.list()).toEqual([makeItem("a", "primeiro", 1), makeItem("b", "segundo", 2)]);
  });

  test("update mescla mudanças preservando o id", async () => {
    const repo = new LocalRepository<Item>(memoryAdapter(), "items");
    await repo.put(makeItem("a", "primeiro", 1));

    const updated = await repo.update("a", { score: 9 });

    expect(updated.id).toBe("a");
    expect(updated).toEqual(makeItem("a", "primeiro", 9));
    expect(await repo.get("a")).toEqual(makeItem("a", "primeiro", 9));
  });

  test("update de registro inexistente lança PersistenceError NOT_FOUND", async () => {
    const repo = new LocalRepository<Item>(memoryAdapter(), "items");

    try {
      await repo.update("ausente", { score: 1 });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(PersistenceError);
      expect((error as PersistenceError).code).toBe(PersistenceErrorCode.NOT_FOUND);
    }
  });

  test("delete remove o registro; clear apaga a coleção", async () => {
    const repo = new LocalRepository<Item>(memoryAdapter(), "items");
    await repo.put(makeItem("a", "primeiro", 1));
    await repo.put(makeItem("b", "segundo", 2));

    await repo.delete("a");
    expect(await repo.get("a")).toBeNull();
    expect(await repo.list()).toEqual([makeItem("b", "segundo", 2)]);

    await repo.clear();
    expect(await repo.list()).toEqual([]);
  });

  test("dados persistem após nova instância do adapter", async () => {
    const first = new LocalRepository<Item>(memoryAdapter(), "items");
    await first.put(makeItem("a", "persistente", 1));

    const second = createLocalRepository<Item>(memoryAdapter(), "items");

    expect(await second.get("a")).toEqual(makeItem("a", "persistente", 1));
    expect(await second.exists("a")).toBe(true);
    expect(await second.list()).toEqual([makeItem("a", "persistente", 1)]);
  });

  test("erro do adapter é propagado como PersistenceError identificável", async () => {
    const repo = new LocalRepository<Item>(
      memoryAdapter((op) => op === "put"),
      "items",
    );

    try {
      await repo.put(makeItem("x", "falha", 0));
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(PersistenceError);
      expect((error as PersistenceError).code).toBe(PersistenceErrorCode.UNKNOWN);
    }
  });

  test("serializador padrão rejeita valores não serializáveis", () => {
    const serializer = jsonSerializer<{ id: string; loop?: unknown }>();
    const circular: { id: string; loop?: unknown } = { id: "a" };
    circular.loop = circular;

    try {
      serializer.encode(circular);
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(PersistenceError);
      expect((error as PersistenceError).code).toBe(PersistenceErrorCode.SERIALIZATION);
    }
  });

  test("IndexedDbAdapter rejeita com ADAPTER_UNAVAILABLE quando não há IndexedDB", async () => {
    const adapter = new IndexedDbAdapter(schema);

    try {
      await adapter.getAll("items");
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(PersistenceError);
      expect((error as PersistenceError).code).toBe(PersistenceErrorCode.ADAPTER_UNAVAILABLE);
    }

    await adapter.close();
  });
});
