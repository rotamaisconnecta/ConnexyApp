import { beforeEach, describe, expect, test } from "bun:test";
import { PersistenceError, PersistenceErrorCode } from "../src/lib/persistence/errors";
import {
  REEL_COMMENT_INDEX_REEL,
  REEL_COMMENT_STORE,
  REEL_LIKE_STORE,
  REEL_STORE,
  reelsPersistenceSchema,
} from "../src/lib/persistence/domain/reels-schema";
import type { StoredReelComment } from "../src/lib/persistence/domain/reels-entities";
import { ReelCommentRepository } from "../src/repositories/reel-comment.repository";

type Disk = Map<string, Map<string, unknown>>;

function memoryDisk(): Disk {
  return new Map([
    [REEL_STORE, new Map()],
    [REEL_LIKE_STORE, new Map()],
    [REEL_COMMENT_STORE, new Map()],
  ]);
}

function memoryAdapter(disk: Disk) {
  return {
    schema: reelsPersistenceSchema,
    async get(store: string, id: string) {
      return disk.get(store)?.get(id) ?? null;
    },
    async getAll(store: string) {
      return [...(disk.get(store)?.values() ?? [])];
    },
    async getAllKeys(store: string) {
      return [...(disk.get(store)?.keys() ?? [])];
    },
    async getAllByIndex(store: string, indexName: string, value: string | number) {
      const storeDefinition = reelsPersistenceSchema.stores.find(
        (candidate) => candidate.name === store,
      );
      const index = storeDefinition?.indexes?.find((candidate) => candidate.name === indexName);
      const keyPath = typeof index?.keyPath === "string" ? index.keyPath : null;
      const rows = [...(disk.get(store)?.values() ?? [])];
      return keyPath
        ? rows.filter((row) => (row as Record<string, unknown>)[keyPath] === value)
        : rows;
    },
    async put(store: string, value: { id: string }) {
      disk.get(store)?.set(value.id, value);
    },
    async delete(store: string, id: string) {
      disk.get(store)?.delete(id);
    },
    async clear(store: string) {
      disk.set(store, new Map());
    },
    async close() {},
  };
}

function comment(
  id: string,
  options: {
    reelId?: string;
    parentId?: string | null;
    siblingOrder?: number | null;
    createdAt?: string;
  } = {},
): StoredReelComment {
  return {
    id,
    reelId: options.reelId ?? "reel-1",
    ...(Object.hasOwn(options, "parentId") ? { parentId: options.parentId } : {}),
    ...(Object.hasOwn(options, "siblingOrder") ? { siblingOrder: options.siblingOrder } : {}),
    text: `comentário ${id}`,
    authorId: `author-${id}`,
    authorName: `Autor ${id}`,
    authorPhoto: `${id}.jpg`,
    createdAt: options.createdAt ?? "2026-09-12T01:00:00.000Z",
    likes: 0,
    likedByMe: false,
  };
}

let disk: Disk;
let repository: ReelCommentRepository;

beforeEach(() => {
  disk = memoryDisk();
  repository = new ReelCommentRepository(memoryAdapter(disk));
});

describe("Fase 1C-3C-C0 — modelo normalizado de replies", () => {
  test("persiste comentário raiz com parentId null", async () => {
    await repository.put(comment("A", { parentId: null, siblingOrder: 0 }));
    expect(await repository.get("A")).toMatchObject({
      id: "A",
      parentId: null,
      siblingOrder: 0,
    });
  });

  test("comentário 1C-3B sem parentId continua sendo raiz", async () => {
    await repository.put(comment("legacy-root"));
    expect((await repository.listByParent("reel-1", null)).map((item) => item.id)).toEqual([
      "legacy-root",
    ]);
  });

  test("persiste reply de primeiro nível com ID preservado", async () => {
    await repository.put(comment("A", { parentId: null }));
    await repository.put(comment("B", { parentId: "A", siblingOrder: 0 }));
    expect(await repository.get("B")).toMatchObject({ id: "B", parentId: "A" });
  });

  test("preserva A → B → C → D sem limitar profundidade", async () => {
    await repository.put(comment("A", { parentId: null }));
    await repository.put(comment("B", { parentId: "A" }));
    await repository.put(comment("C", { parentId: "B" }));
    await repository.put(comment("D", { parentId: "C" }));

    expect((await repository.get("A"))?.parentId ?? null).toBeNull();
    expect((await repository.get("B"))?.parentId).toBe("A");
    expect((await repository.get("C"))?.parentId).toBe("B");
    expect((await repository.get("D"))?.parentId).toBe("C");
  });

  test("aceita profundidade arbitrária", async () => {
    await repository.put(comment("node-0", { parentId: null }));
    for (let index = 1; index <= 25; index += 1) {
      await repository.put(
        comment(`node-${index}`, {
          parentId: `node-${index - 1}`,
          siblingOrder: 0,
        }),
      );
    }
    expect((await repository.get("node-25"))?.parentId).toBe("node-24");
    expect(await repository.countByReel("reel-1")).toBe(26);
  });

  test("mantém múltiplos filhos do mesmo pai", async () => {
    await repository.put(comment("A", { parentId: null }));
    await repository.put(comment("B", { parentId: "A", siblingOrder: 0 }));
    await repository.put(comment("C", { parentId: "A", siblingOrder: 1 }));
    await repository.put(comment("D", { parentId: "A", siblingOrder: 2 }));
    expect((await repository.listByParent("reel-1", "A")).map((item) => item.id)).toEqual([
      "B",
      "C",
      "D",
    ]);
  });

  test("mantém múltiplas árvores isoladas no mesmo Reel", async () => {
    await repository.put(comment("A", { parentId: null, siblingOrder: 0 }));
    await repository.put(comment("B", { parentId: "A" }));
    await repository.put(comment("X", { parentId: null, siblingOrder: 1 }));
    await repository.put(comment("Y", { parentId: "X" }));

    expect((await repository.listByParent("reel-1", null)).map((item) => item.id)).toEqual([
      "A",
      "X",
    ]);
    expect((await repository.listByParent("reel-1", "A")).map((item) => item.id)).toEqual(["B"]);
    expect((await repository.listByParent("reel-1", "X")).map((item) => item.id)).toEqual(["Y"]);
  });

  test("siblingOrder preserva ordem mesmo com createdAt iguais", async () => {
    await repository.put(comment("A", { parentId: null }));
    await repository.put(comment("third", { parentId: "A", siblingOrder: 2 }));
    await repository.put(comment("first", { parentId: "A", siblingOrder: 0 }));
    await repository.put(comment("second", { parentId: "A", siblingOrder: 1 }));

    expect((await repository.listByParent("reel-1", "A")).map((item) => item.id)).toEqual([
      "first",
      "second",
      "third",
    ]);
  });

  test("createdAt + id fornecem fallback determinístico sem siblingOrder", async () => {
    await repository.put(comment("A", { parentId: null }));
    await repository.put(
      comment("later", {
        parentId: "A",
        createdAt: "2026-09-12T03:00:00.000Z",
      }),
    );
    await repository.put(
      comment("same-b", {
        parentId: "A",
        createdAt: "2026-09-12T02:00:00.000Z",
      }),
    );
    await repository.put(
      comment("same-a", {
        parentId: "A",
        createdAt: "2026-09-12T02:00:00.000Z",
      }),
    );

    expect((await repository.listByParent("reel-1", "A")).map((item) => item.id)).toEqual([
      "same-a",
      "same-b",
      "later",
    ]);
  });

  test("listByReel retorna raízes e replies persistidos", async () => {
    await repository.put(comment("A", { parentId: null }));
    await repository.put(comment("B", { parentId: "A" }));
    await repository.put(comment("C", { parentId: "B" }));
    expect((await repository.listByReel("reel-1")).map((item) => item.id).sort()).toEqual([
      "A",
      "B",
      "C",
    ]);
  });

  test("reload conceitual preserva relações e ordem", async () => {
    await repository.put(comment("A", { parentId: null }));
    await repository.put(comment("B", { parentId: "A", siblingOrder: 1 }));
    await repository.put(comment("C", { parentId: "A", siblingOrder: 0 }));

    const reloaded = new ReelCommentRepository(memoryAdapter(disk));
    expect((await reloaded.listByParent("reel-1", "A")).map((item) => item.id)).toEqual(["C", "B"]);
    expect((await reloaded.get("B"))?.parentId).toBe("A");
  });

  test("upsert repetido é idempotente", async () => {
    const root = comment("A", { parentId: null, siblingOrder: 0 });
    await repository.put(root);
    await repository.put(root);
    expect(await repository.countByReel("reel-1")).toBe(1);
  });
});

describe("Fase 1C-3C-C0 — integridade da hierarquia", () => {
  test("rejeita parentId inexistente sem gravar reply órfã", async () => {
    await expect(repository.put(comment("B", { parentId: "missing" }))).rejects.toMatchObject({
      code: PersistenceErrorCode.SERIALIZATION,
    });
    expect(await repository.get("B")).toBeNull();
  });

  test("rejeita autorreferência", async () => {
    await expect(repository.put(comment("A", { parentId: "A" }))).rejects.toBeInstanceOf(
      PersistenceError,
    );
    expect(await repository.get("A")).toBeNull();
  });

  test("rejeita ciclo A → B → A", async () => {
    await repository.put(comment("A", { parentId: null }));
    await repository.put(comment("B", { parentId: "A" }));
    await expect(repository.update("A", { parentId: "B" })).rejects.toMatchObject({
      code: PersistenceErrorCode.SERIALIZATION,
    });
    expect((await repository.get("A"))?.parentId ?? null).toBeNull();
  });

  test("rejeita pai pertencente a outro Reel", async () => {
    await repository.put(comment("A", { reelId: "reel-1", parentId: null }));
    await expect(
      repository.put(comment("B", { reelId: "reel-2", parentId: "A" })),
    ).rejects.toMatchObject({ code: PersistenceErrorCode.SERIALIZATION });
  });

  test("rejeita siblingOrder inválido", async () => {
    await expect(
      repository.put(comment("A", { parentId: null, siblingOrder: -1 })),
    ).rejects.toMatchObject({ code: PersistenceErrorCode.SERIALIZATION });
  });

  test("delete do pai remove descendentes e não deixa órfãos", async () => {
    await repository.put(comment("A", { parentId: null }));
    await repository.put(comment("B", { parentId: "A" }));
    await repository.put(comment("C", { parentId: "B" }));
    await repository.put(comment("X", { parentId: null }));

    await repository.delete("A");
    expect((await repository.listByReel("reel-1")).map((item) => item.id)).toEqual(["X"]);
  });

  test("schema permanece v1, somente com índice by_reel", () => {
    const store = reelsPersistenceSchema.stores.find(
      (candidate) => candidate.name === REEL_COMMENT_STORE,
    );
    expect(reelsPersistenceSchema.version).toBe(1);
    expect(store?.indexes).toEqual([{ name: REEL_COMMENT_INDEX_REEL, keyPath: "reelId" }]);
  });
});
