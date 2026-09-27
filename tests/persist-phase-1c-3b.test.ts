import { beforeEach, describe, expect, test } from "bun:test";
import { PersistenceError, PersistenceErrorCode } from "../src/lib/persistence/errors";
import type { EntityId } from "../src/lib/persistence/types";
import {
  reelsPersistenceSchema,
  REEL_COMMENT_INDEX_REEL,
  REEL_COMMENT_STORE,
  REEL_LIKE_INDEX_REEL,
  REEL_LIKE_STORE,
  REEL_STORE,
  REELS_DB_NAME,
} from "../src/lib/persistence/domain/reels-schema";
import {
  reelLikeId,
  type StoredReel,
  type StoredReelComment,
  type StoredReelLike,
} from "../src/lib/persistence/domain/reels-entities";
import { ReelRepository, deleteReelWithCascade } from "../src/repositories/reel.repository";
import { ReelLikeRepository } from "../src/repositories/reel-like.repository";
import { ReelCommentRepository } from "../src/repositories/reel-comment.repository";

type Disk = Map<string, Map<EntityId, unknown>>;

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
      const storeDef = reelsPersistenceSchema.stores.find((item) => item.name === store);
      const indexDef = storeDef?.indexes?.find((item) => item.name === indexName);
      const keyPath = typeof indexDef?.keyPath === "string" ? indexDef.keyPath : null;
      const rows = [...(disk.get(store)?.values() ?? [])];
      if (!keyPath) return rows;
      return rows.filter((row) => (row as Record<string, unknown>)[keyPath] === value);
    },
    async put(store: string, value: { id: string }) {
      let map = disk.get(store);
      if (!map) {
        map = new Map();
        disk.set(store, map);
      }
      map.set(value.id, value);
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

function makeReel(id: string, createdAt: string): StoredReel {
  return {
    id,
    caption: `legenda ${id}`,
    category: "MOMENT",
    author: {
      id: "lucas",
      name: "Lucas Almeida",
      handle: "lucas.a",
      photoUrl: "https://i.pravatar.cc/200?img=12",
      verified: false,
      profession: null,
      isFollowing: false,
    },
    context: null,
    durationS: 30,
    createdAt,
    persistence: "local",
  };
}

function makeComment(id: string, reelId: string, createdAt: string): StoredReelComment {
  return {
    id,
    reelId,
    text: `comentário ${id}`,
    authorId: "u1",
    authorName: "Ana Silva",
    authorPhoto: "https://i.pravatar.cc/150?img=1",
    createdAt,
    likes: 0,
    likedByMe: false,
  };
}

let disk: Disk;

beforeEach(() => {
  disk = memoryDisk();
});

describe("Fase 1C-3B — ReelRepository", () => {
  test("cria (put), obtém e verifica existência", async () => {
    const repo = new ReelRepository(memoryAdapter(disk));
    const reel = makeReel("reel-1", "2026-07-21T10:00:00Z");
    await repo.put(reel);

    expect((await repo.get("reel-1"))?.id).toBe("reel-1");
    expect(await repo.exists("reel-1")).toBe(true);
  });

  test("getById retorna null para Reel inexistente", async () => {
    const repo = new ReelRepository(memoryAdapter(disk));
    expect(await repo.get("nao-existe")).toBeNull();
    expect(await repo.exists("nao-existe")).toBe(false);
  });

  test("lista Reels", async () => {
    const repo = new ReelRepository(memoryAdapter(disk));
    await repo.put(makeReel("reel-1", "2026-07-21T10:00:00Z"));
    await repo.put(makeReel("reel-2", "2026-07-22T10:00:00Z"));

    const list = await repo.list();
    expect(list.map((r) => r.id).sort()).toEqual(["reel-1", "reel-2"]);
  });

  test("listOrderedByRecent ordena por criação (mais recente primeiro)", async () => {
    const repo = new ReelRepository(memoryAdapter(disk));
    await repo.put(makeReel("a", "2026-07-20T10:00:00Z"));
    await repo.put(makeReel("b", "2026-07-22T10:00:00Z"));
    await repo.put(makeReel("c", "2026-07-21T10:00:00Z"));

    expect((await repo.listOrderedByRecent()).map((r) => r.id)).toEqual(["b", "c", "a"]);
  });

  test("update preserva o id (base da camada genérica)", async () => {
    const repo = new ReelRepository(memoryAdapter(disk));
    await repo.put(makeReel("reel-1", "2026-07-21T10:00:00Z"));
    const updated = await repo.update("reel-1", { caption: "nova legenda" });

    expect(updated.id).toBe("reel-1");
    expect(updated.caption).toBe("nova legenda");
  });

  test("update de Reel inexistente lança PersistenceError NOT_FOUND", async () => {
    const repo = new ReelRepository(memoryAdapter(disk));
    try {
      await repo.update("ausente", { caption: "x" });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(PersistenceError);
      expect((error as PersistenceError).code).toBe(PersistenceErrorCode.NOT_FOUND);
    }
  });

  test("exclui Reel", async () => {
    const repo = new ReelRepository(memoryAdapter(disk));
    await repo.put(makeReel("reel-1", "2026-07-21T10:00:00Z"));
    await repo.delete("reel-1");

    expect(await repo.get("reel-1")).toBeNull();
    expect(await repo.list()).toHaveLength(0);
  });
});

describe("Fase 1C-3B — ReelLikeRepository", () => {
  test("adiciona curtida com identidade reelId + userId", async () => {
    const repo = new ReelLikeRepository(memoryAdapter(disk));
    const like = await repo.addLike("reel-1", "user-A");

    expect(like.reelId).toBe("reel-1");
    expect(like.userId).toBe("user-A");
    expect(like.id).toBe(reelLikeId("reel-1", "user-A"));
    expect(typeof like.createdAt).toBe("string");
  });

  test("busca curtida por Reel + usuário", async () => {
    const repo = new ReelLikeRepository(memoryAdapter(disk));
    await repo.addLike("reel-1", "user-A");

    expect((await repo.getByReelAndUser("reel-1", "user-A"))?.userId).toBe("user-A");
    expect(await repo.getByReelAndUser("reel-1", "user-B")).toBeNull();
  });

  test("segunda curtida do mesmo usuário no mesmo Reel é idempotente", async () => {
    const repo = new ReelLikeRepository(memoryAdapter(disk));
    const first = await repo.addLike("reel-1", "user-A");
    const second = await repo.addLike("reel-1", "user-A");

    expect(second.id).toBe(first.id);
    expect(await repo.countByReel("reel-1")).toBe(1);
    expect(await repo.listByReel("reel-1")).toHaveLength(1);
  });

  test("usuários diferentes no mesmo Reel produzem curtidas distintas", async () => {
    const repo = new ReelLikeRepository(memoryAdapter(disk));
    await repo.addLike("reel-1", "user-A");
    await repo.addLike("reel-1", "user-B");

    expect(await repo.countByReel("reel-1")).toBe(2);
    const users = (await repo.listByReel("reel-1")).map((l) => l.userId).sort();
    expect(users).toEqual(["user-A", "user-B"]);
  });

  test("isolamento de usuário: A curtido, B não; depois de B curtir, ficam distintas", async () => {
    const repo = new ReelLikeRepository(memoryAdapter(disk));
    await repo.addLike("reel-1", "user-A");

    expect(await repo.isLiked("reel-1", "user-A")).toBe(true);
    expect(await repo.isLiked("reel-1", "user-B")).toBe(false);

    await repo.addLike("reel-1", "user-B");
    expect(await repo.isLiked("reel-1", "user-B")).toBe(true);
    expect(await repo.countByReel("reel-1")).toBe(2);
  });

  test("listByReel retorna somente as curtidas do Reel", async () => {
    const repo = new ReelLikeRepository(memoryAdapter(disk));
    await repo.addLike("reel-1", "user-A");
    await repo.addLike("reel-2", "user-B");

    const reel1 = await repo.listByReel("reel-1");
    expect(reel1).toHaveLength(1);
    expect(reel1[0].reelId).toBe("reel-1");
    expect(reel1.map((l) => l.reelId)).not.toContain("reel-2");
  });

  test("countByReel deriva a quantidade sem contador persistido", async () => {
    const repo = new ReelLikeRepository(memoryAdapter(disk));
    await repo.addLike("reel-1", "user-A");
    await repo.addLike("reel-1", "user-B");
    await repo.addLike("reel-2", "user-A");

    expect(await repo.countByReel("reel-1")).toBe(2);
    expect(await repo.countByReel("reel-2")).toBe(1);
  });

  test("removeLike remove e é idempotente", async () => {
    const repo = new ReelLikeRepository(memoryAdapter(disk));
    await repo.addLike("reel-1", "user-A");
    await repo.removeLike("reel-1", "user-A");
    await repo.removeLike("reel-1", "user-A");

    expect(await repo.isLiked("reel-1", "user-A")).toBe(false);
    expect(await repo.countByReel("reel-1")).toBe(0);
  });
});

describe("Fase 1C-3B — ReelCommentRepository", () => {
  test("cria e obtém comentário por id", async () => {
    const repo = new ReelCommentRepository(memoryAdapter(disk));
    const comment = makeComment("c1", "reel-1", "2026-07-21T10:00:00Z");
    await repo.put(comment);

    expect(await repo.get("c1")).toEqual(comment);
  });

  test("listByReel ordena por createdAt (cronológica)", async () => {
    const repo = new ReelCommentRepository(memoryAdapter(disk));
    await repo.put(makeComment("c3", "reel-1", "2026-07-21T12:00:00Z"));
    await repo.put(makeComment("c1", "reel-1", "2026-07-21T10:00:00Z"));
    await repo.put(makeComment("c2", "reel-1", "2026-07-21T11:00:00Z"));

    expect((await repo.listByReel("reel-1")).map((c) => c.id)).toEqual(["c1", "c2", "c3"]);
  });

  test("countByReel deriva a quantidade", async () => {
    const repo = new ReelCommentRepository(memoryAdapter(disk));
    await repo.put(makeComment("c1", "reel-1", "2026-07-21T10:00:00Z"));
    await repo.put(makeComment("c2", "reel-1", "2026-07-21T11:00:00Z"));
    await repo.put(makeComment("c3", "reel-2", "2026-07-21T12:00:00Z"));

    expect(await repo.countByReel("reel-1")).toBe(2);
    expect(await repo.countByReel("reel-2")).toBe(1);
  });

  test("exclui comentário preservando os demais", async () => {
    const repo = new ReelCommentRepository(memoryAdapter(disk));
    await repo.put(makeComment("c1", "reel-1", "2026-07-21T10:00:00Z"));
    await repo.put(makeComment("c2", "reel-1", "2026-07-21T11:00:00Z"));

    await repo.delete("c1");
    expect((await repo.listByReel("reel-1")).map((c) => c.id)).toEqual(["c2"]);
  });

  test("isolamento entre Reels: comentários de um não vazam para outro", async () => {
    const repo = new ReelCommentRepository(memoryAdapter(disk));
    await repo.put(makeComment("c1", "reel-1", "2026-07-21T10:00:00Z"));
    await repo.put(makeComment("c2", "reel-2", "2026-07-21T11:00:00Z"));

    const reel1 = await repo.listByReel("reel-1");
    const reel2 = await repo.listByReel("reel-2");
    expect(reel1.map((c) => c.id)).toEqual(["c1"]);
    expect(reel2.map((c) => c.id)).toEqual(["c2"]);
    expect(reel1.map((c) => c.id)).not.toContain("c2");
    expect(reel2.map((c) => c.id)).not.toContain("c1");
  });
});

describe("Fase 1C-3B — Relacionamentos (Reel → Like → Comment)", () => {
  test("reel-1 e reel-2 não cruzam likes nem comentários", async () => {
    const reels = new ReelRepository(memoryAdapter(disk));
    const likes = new ReelLikeRepository(memoryAdapter(disk));
    const comments = new ReelCommentRepository(memoryAdapter(disk));

    await reels.put(makeReel("reel-1", "2026-07-21T10:00:00Z"));
    await reels.put(makeReel("reel-2", "2026-07-22T10:00:00Z"));
    await likes.addLike("reel-1", "user-A");
    await likes.addLike("reel-2", "user-B");
    await comments.put(makeComment("c1", "reel-1", "2026-07-21T10:00:00Z"));
    await comments.put(makeComment("c2", "reel-2", "2026-07-22T10:00:00Z"));

    expect(await likes.countByReel("reel-1")).toBe(1);
    expect(await likes.countByReel("reel-2")).toBe(1);
    expect((await likes.listByReel("reel-1")).every((l) => l.reelId === "reel-1")).toBe(true);
    expect(await comments.countByReel("reel-1")).toBe(1);
    expect((await comments.listByReel("reel-1")).every((c) => c.reelId === "reel-1")).toBe(true);
  });
});

describe("Fase 1C-3B — Cascata de exclusão", () => {
  test("deleteReelWithCascade remove Reel + curtidas/comentários, preservando outro Reel", async () => {
    const reels = new ReelRepository(memoryAdapter(disk));
    const likes = new ReelLikeRepository(memoryAdapter(disk));
    const comments = new ReelCommentRepository(memoryAdapter(disk));

    await reels.put(makeReel("reel-1", "2026-07-21T10:00:00Z"));
    await reels.put(makeReel("reel-2", "2026-07-22T10:00:00Z"));
    await likes.addLike("reel-1", "user-A");
    await likes.addLike("reel-2", "user-B");
    await comments.put(makeComment("c1", "reel-1", "2026-07-21T10:00:00Z"));
    await comments.put(makeComment("c2", "reel-2", "2026-07-22T10:00:00Z"));

    await deleteReelWithCascade(reels, likes, comments, "reel-1");

    expect(await reels.get("reel-1")).toBeNull();
    expect(await likes.countByReel("reel-1")).toBe(0);
    expect(await comments.countByReel("reel-1")).toBe(0);

    expect((await reels.get("reel-2"))?.id).toBe("reel-2");
    expect(await likes.countByReel("reel-2")).toBe(1);
    expect(await comments.countByReel("reel-2")).toBe(1);
  });

  test("deleteReelWithCascade é idempotente para Reel sem filhas", async () => {
    const reels = new ReelRepository(memoryAdapter(disk));
    const likes = new ReelLikeRepository(memoryAdapter(disk));
    const comments = new ReelCommentRepository(memoryAdapter(disk));

    await reels.put(makeReel("reel-solo", "2026-07-21T10:00:00Z"));
    await deleteReelWithCascade(reels, likes, comments, "reel-solo");
    await deleteReelWithCascade(reels, likes, comments, "reel-solo");

    expect(await reels.exists("reel-solo")).toBe(false);
  });
});

describe("Fase 1C-3B — persistência entre instâncias (reload conceitual)", () => {
  test("Reels sobrevivem a nova instância do adapter/repository", async () => {
    const first = new ReelRepository(memoryAdapter(disk));
    const reel = makeReel("reel-1", "2026-07-21T10:00:00Z");
    await first.put(reel);

    const reloaded = new ReelRepository(memoryAdapter(disk));
    expect(await reloaded.get("reel-1")).toEqual(reel);
  });

  test("curtidas sobrevivem a nova instância do adapter/repository", async () => {
    const first = new ReelLikeRepository(memoryAdapter(disk));
    await first.addLike("reel-1", "user-A");

    const reloaded = new ReelLikeRepository(memoryAdapter(disk));
    expect(await reloaded.isLiked("reel-1", "user-A")).toBe(true);
    expect(await reloaded.countByReel("reel-1")).toBe(1);
  });

  test("comentários sobrevivem a nova instância do adapter/repository", async () => {
    const first = new ReelCommentRepository(memoryAdapter(disk));
    await first.put(makeComment("c1", "reel-1", "2026-07-21T10:00:00Z"));

    const reloaded = new ReelCommentRepository(memoryAdapter(disk));
    expect((await reloaded.listByReel("reel-1"))[0].id).toBe("c1");
  });

  test("cenário completo: salvar → destruir → recriar → recuperar", async () => {
    const first = new ReelRepository(memoryAdapter(disk));
    const firstLikes = new ReelLikeRepository(memoryAdapter(disk));
    const firstComments = new ReelCommentRepository(memoryAdapter(disk));

    const reel = makeReel("reel-1", "2026-07-21T10:00:00Z");
    await first.put(reel);
    await firstLikes.addLike("reel-1", "user-A");
    await firstComments.put(makeComment("c1", "reel-1", "2026-07-21T10:00:00Z"));

    const reloaded = new ReelRepository(memoryAdapter(disk));
    const reloadedLikes = new ReelLikeRepository(memoryAdapter(disk));
    const reloadedComments = new ReelCommentRepository(memoryAdapter(disk));

    expect(await reloaded.get("reel-1")).toEqual(reel);
    expect(await reloadedLikes.countByReel("reel-1")).toBe(1);
    expect(await reloadedComments.countByReel("reel-1")).toBe(1);
  });
});

describe("Fase 1C-3B — schema e isolamento", () => {
  test("schema cria apenas reels, reel_likes e reel_comments", () => {
    expect(reelsPersistenceSchema.stores.map((s) => s.name).sort()).toEqual([
      REEL_COMMENT_STORE,
      REEL_LIKE_STORE,
      REEL_STORE,
    ]);
  });

  test("índices by_reel apontam para reelId em likes e comments", () => {
    const likeStore = reelsPersistenceSchema.stores.find((s) => s.name === REEL_LIKE_STORE);
    const commentStore = reelsPersistenceSchema.stores.find((s) => s.name === REEL_COMMENT_STORE);

    expect(likeStore?.indexes?.find((i) => i.name === REEL_LIKE_INDEX_REEL)?.keyPath).toBe(
      "reelId",
    );
    expect(commentStore?.indexes?.find((i) => i.name === REEL_COMMENT_INDEX_REEL)?.keyPath).toBe(
      "reelId",
    );
  });

  test("banco do domínio é independente do banco de mídia de Reels", () => {
    expect(REELS_DB_NAME).not.toBe("connexy-reels-local-db");
    expect(REELS_DB_NAME).toBe("connexy-reels-data-local-db");
  });

  test("curtidas são identificadas por reelId + userId (não apenas reelId)", () => {
    const a = reelLikeId("reel-1", "user-A");
    const b = reelLikeId("reel-1", "user-B");
    expect(a).not.toBe(b);
    expect(a).toBe("reel-1::user-A");
  });
});
