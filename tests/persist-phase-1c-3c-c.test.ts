import { beforeEach, describe, expect, test } from "bun:test";
import {
  getReelsMigrationStages,
  migrateLegacyReelComments,
  parseReelsMigrationMarker,
  type LocalReelsMigrationIO,
  type ReelsMigrationMarker,
} from "../src/lib/reels/local-reel-persistence";
import {
  REEL_COMMENT_STORE,
  REEL_LIKE_STORE,
  REEL_STORE,
  reelsPersistenceSchema,
} from "../src/lib/persistence/domain/reels-schema";
import type { StoredReel, StoredReelComment } from "../src/lib/persistence/domain/reels-entities";
import { ReelRepository } from "../src/repositories/reel.repository";
import { ReelCommentRepository } from "../src/repositories/reel-comment.repository";

type Disk = Map<string, Map<string, unknown>>;

function migrationMarker(
  stages: ReelsMigrationMarker["stages"] = {
    reels: "completed",
    likes: "completed",
    comments: "pending",
  },
): ReelsMigrationMarker {
  return {
    version: 1,
    ranAt: "2026-09-12T00:00:00.000Z",
    counts: { reels: 2, likes: 3, comments: 0 },
    stages,
  };
}

function makeIO(raw: string | null, initialMarker: unknown = migrationMarker()) {
  const source = raw;
  let markerRaw = initialMarker === null ? null : JSON.stringify(initialMarker);
  let sourceReads = 0;
  return {
    io: {
      readLegacy: () => null,
      readLikes: () => null,
      readComments: () => {
        sourceReads += 1;
        return source;
      },
      readMarker: () => markerRaw,
      writeMarker: (value: string) => {
        markerRaw = value;
        return true;
      },
    } satisfies LocalReelsMigrationIO,
    marker: () => parseReelsMigrationMarker(markerRaw),
    source: () => source,
    sourceReads: () => sourceReads,
  };
}

function makeRepositories(failOnceFor?: string) {
  const disk: Disk = new Map([
    [REEL_STORE, new Map()],
    [REEL_LIKE_STORE, new Map()],
    [REEL_COMMENT_STORE, new Map()],
  ]);
  let failed = false;
  const adapter = {
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
      if (!failed && store === REEL_COMMENT_STORE && failOnceFor === value.id) {
        failed = true;
        throw new Error("falha de Comment simulada");
      }
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
  return {
    reels: new ReelRepository(adapter),
    comments: new ReelCommentRepository(adapter),
    adapter,
    disk,
  };
}

function storedReel(id: string): StoredReel {
  return {
    id,
    caption: id,
    category: "MOMENT",
    author: {
      id: "author",
      name: "Autor",
      handle: "autor",
      photoUrl: "",
      verified: false,
      profession: null,
      isFollowing: false,
    },
    context: null,
    durationS: 10,
    createdAt: "2026-09-12T00:00:00.000Z",
    persistence: "local",
  };
}

function legacyComment(
  id: string,
  options: {
    createdAt?: unknown;
    authorId?: unknown;
    parentId?: string | null;
    siblingOrder?: number | null;
    replies?: unknown[];
    likes?: unknown;
    likedByMe?: unknown;
  } = {},
) {
  return {
    id,
    text: `texto ${id}`,
    authorId: options.authorId ?? `author-${id}`,
    authorName: `Autor ${id}`,
    authorPhoto: `${id}.jpg`,
    createdAt: options.createdAt === undefined ? "2026-09-12T01:00:00.000Z" : options.createdAt,
    likes: options.likes ?? 2,
    likedByMe: options.likedByMe ?? false,
    replies: options.replies ?? [],
    ...(Object.hasOwn(options, "parentId") ? { parentId: options.parentId } : {}),
    ...(Object.hasOwn(options, "siblingOrder") ? { siblingOrder: options.siblingOrder } : {}),
  };
}

const MIGRATION_AT = "2026-09-12T04:45:00.000Z";
let repos: ReturnType<typeof makeRepositories>;

beforeEach(() => {
  repos = makeRepositories();
});

async function addReels(...ids: string[]) {
  for (const id of ids) await repos.reels.put(storedReel(id));
}

async function migrate(raw: unknown, marker: unknown = migrationMarker()) {
  const fake = makeIO(raw === null ? null : JSON.stringify(raw), marker);
  const result = await migrateLegacyReelComments(
    repos.reels,
    repos.comments,
    fake.io,
    MIGRATION_AT,
  );
  return { result, fake };
}

describe("Fase 1C-3C-C — fonte e mapeamento", () => {
  test("chave ausente conclui com zero Comments", async () => {
    const { result, fake } = await migrate(null);
    expect(result).toMatchObject({ completed: true, found: 0, migrated: 0 });
    expect(fake.marker()?.counts.comments).toBe(0);
  });

  test("objeto vazio conclui sem registros", async () => {
    const { result } = await migrate({});
    expect(result.completed).toBe(true);
    expect(await repos.comments.list()).toHaveLength(0);
  });

  test("Reel com array vazio é válido", async () => {
    await addReels("reel-1");
    const { result } = await migrate({ "reel-1": [] });
    expect(result).toMatchObject({ completed: true, found: 0 });
  });

  test("migra raiz preservando ID, autor, createdAt e snapshots de Like", async () => {
    await addReels("reel-1");
    const source = legacyComment("A", {
      likes: 7,
      likedByMe: true,
      createdAt: "2025-01-02T03:04:05.000Z",
    });
    const { result } = await migrate({ "reel-1": [source] });
    expect(result).toMatchObject({ completed: true, found: 1, migrated: 1 });
    expect(await repos.comments.get("A")).toMatchObject({
      id: "A",
      reelId: "reel-1",
      parentId: null,
      authorId: "author-A",
      authorName: "Autor A",
      authorPhoto: "A.jpg",
      createdAt: "2025-01-02T03:04:05.000Z",
      likes: 7,
      likedByMe: true,
    });
  });

  test("migra múltiplos comentários e múltiplos Reels", async () => {
    await addReels("reel-1", "reel-2");
    const { result } = await migrate({
      "reel-1": [legacyComment("A"), legacyComment("B")],
      "reel-2": [legacyComment("C"), legacyComment("D")],
    });
    expect(result).toMatchObject({ found: 4, migrated: 4 });
    expect(await repos.comments.countByReel("reel-1")).toBe(2);
    expect(await repos.comments.countByReel("reel-2")).toBe(2);
  });

  test("createdAt ausente ou inválido usa timestamp único da execução", async () => {
    await addReels("reel-1");
    const withoutCreatedAt = legacyComment("A");
    delete (withoutCreatedAt as Partial<typeof withoutCreatedAt>).createdAt;
    const { result } = await migrate({
      "reel-1": [withoutCreatedAt, legacyComment("B", { createdAt: "inválido" })],
    });
    expect(result.synthesizedCreatedAt).toBe(2);
    expect((await repos.comments.get("A"))?.createdAt).toBe(MIGRATION_AT);
    expect((await repos.comments.get("B"))?.createdAt).toBe(MIGRATION_AT);
  });

  test("autor ausente é inválido e não recebe currentUser", async () => {
    await addReels("reel-1");
    const source = legacyComment("A");
    delete (source as Partial<typeof source>).authorId;
    const { result } = await migrate({ "reel-1": [source] });
    expect(result).toMatchObject({ completed: false, invalid: 1, migrated: 0 });
    expect(await repos.comments.get("A")).toBeNull();
  });

  test("ID ausente é inválido e nenhum ID é inventado", async () => {
    await addReels("reel-1");
    const source = legacyComment("A");
    delete (source as Partial<typeof source>).id;
    const { result } = await migrate({ "reel-1": [source] });
    expect(result).toMatchObject({ completed: false, invalid: 1, migrated: 0 });
    expect(await repos.comments.list()).toHaveLength(0);
  });

  test("estrutura de Reel inválida não é silenciosamente aceita", async () => {
    const { result } = await migrate({ "reel-1": "não-é-array" });
    expect(result).toMatchObject({ completed: false, invalid: 1 });
  });
});

describe("Fase 1C-3C-C — replies, relações e ordem", () => {
  test("preserva reply de primeiro e segundo níveis", async () => {
    await addReels("reel-1");
    const source = legacyComment("A", {
      replies: [
        legacyComment("B", {
          replies: [legacyComment("C")],
        }),
      ],
    });
    const { result } = await migrate({ "reel-1": [source] });
    expect(result).toMatchObject({ completed: true, found: 3, maxDepth: 3 });
    expect((await repos.comments.get("A"))?.parentId).toBeNull();
    expect((await repos.comments.get("B"))?.parentId).toBe("A");
    expect((await repos.comments.get("C"))?.parentId).toBe("B");
  });

  test("preserva árvore A → B → C → D", async () => {
    await addReels("reel-1");
    const tree = legacyComment("A", {
      replies: [
        legacyComment("B", {
          replies: [
            legacyComment("C", {
              replies: [legacyComment("D")],
            }),
          ],
        }),
      ],
    });
    const { result } = await migrate({ "reel-1": [tree] });
    expect(result.maxDepth).toBe(4);
    expect((await repos.comments.get("D"))?.parentId).toBe("C");
  });

  test("não limita profundidade arbitrária", async () => {
    await addReels("reel-1");
    let tree = legacyComment("node-12");
    for (let index = 11; index >= 0; index -= 1) {
      tree = legacyComment(`node-${index}`, { replies: [tree] });
    }
    const { result } = await migrate({ "reel-1": [tree] });
    expect(result).toMatchObject({ completed: true, found: 13, maxDepth: 13 });
    expect((await repos.comments.get("node-12"))?.parentId).toBe("node-11");
  });

  test("preserva múltiplos siblings e siblingOrder existente", async () => {
    await addReels("reel-1");
    const tree = legacyComment("A", {
      replies: [
        legacyComment("third", { siblingOrder: 2 }),
        legacyComment("first", { siblingOrder: 0 }),
        legacyComment("second", { siblingOrder: 1 }),
      ],
    });
    await migrate({ "reel-1": [tree] });
    expect((await repos.comments.listByParent("reel-1", "A")).map((item) => item.id)).toEqual([
      "first",
      "second",
      "third",
    ]);
    expect((await repos.comments.get("second"))?.siblingOrder).toBe(1);
  });

  test("sem siblingOrder usa fallback determinístico createdAt + id após reload", async () => {
    await addReels("reel-1");
    const tree = legacyComment("root", {
      replies: [
        legacyComment("later", { createdAt: "2026-09-12T03:00:00.000Z" }),
        legacyComment("same-b", { createdAt: "2026-09-12T02:00:00.000Z" }),
        legacyComment("same-a", { createdAt: "2026-09-12T02:00:00.000Z" }),
      ],
    });
    await migrate({ "reel-1": [tree] });
    const reloaded = new ReelCommentRepository(repos.adapter);
    expect((await reloaded.listByParent("reel-1", "root")).map((item) => item.id)).toEqual([
      "same-a",
      "same-b",
      "later",
    ]);
  });

  test("preserva múltiplas árvores sem cruzar relações", async () => {
    await addReels("reel-1");
    const { result } = await migrate({
      "reel-1": [
        legacyComment("A", { replies: [legacyComment("B")] }),
        legacyComment("X", { replies: [legacyComment("Y")] }),
      ],
    });
    expect(result).toMatchObject({ found: 4, migrated: 4 });
    expect((await repos.comments.get("B"))?.parentId).toBe("A");
    expect((await repos.comments.get("Y"))?.parentId).toBe("X");
  });

  test("parentId explícito incompatível com nesting é inválido", async () => {
    await addReels("reel-1");
    const { result } = await migrate({
      "reel-1": [
        legacyComment("A", {
          replies: [legacyComment("B", { parentId: "outro" })],
        }),
      ],
    });
    expect(result).toMatchObject({ completed: false, migrated: 1, invalid: 1 });
    expect(await repos.comments.get("B")).toBeNull();
  });

  test("pai inexistente e autorreferência permanecem inválidos", async () => {
    await addReels("reel-1");
    const { result } = await migrate({
      "reel-1": [
        legacyComment("missing-child", { parentId: "missing" }),
        legacyComment("self", { parentId: "self" }),
      ],
    });
    expect(result).toMatchObject({ completed: false, invalid: 2, migrated: 0 });
  });

  test("ciclo lógico é classificado como inválido", async () => {
    await addReels("reel-1");
    const { result } = await migrate({
      "reel-1": [legacyComment("A", { parentId: "B" }), legacyComment("B", { parentId: "A" })],
    });
    expect(result).toMatchObject({ completed: false, invalid: 2, migrated: 0 });
  });

  test("pai de outro Reel é inválido", async () => {
    await addReels("reel-1", "reel-2");
    await repos.comments.put({
      id: "parent-other-reel",
      reelId: "reel-2",
      parentId: null,
      text: "pai",
      authorId: "author",
      authorName: "Autor",
      authorPhoto: "",
      createdAt: MIGRATION_AT,
      likes: 0,
      likedByMe: false,
    });
    const { result } = await migrate({
      "reel-1": [legacyComment("child", { parentId: "parent-other-reel" })],
    });
    expect(result).toMatchObject({ completed: false, invalid: 1, migrated: 0 });
  });
});

describe("Fase 1C-3C-C — idempotência, falhas e órfãos", () => {
  test("Reel inexistente classifica raiz e replies como órfãos sem criar Reel", async () => {
    const source = legacyComment("A", { replies: [legacyComment("B")] });
    const { result } = await migrate({ "reel-missing": [source] });
    expect(result).toMatchObject({ completed: false, found: 2, orphaned: 2 });
    expect(await repos.reels.get("reel-missing")).toBeNull();
    expect(await repos.comments.list()).toHaveLength(0);
  });

  test("comentário semanticamente igual já existente é processado sem sobrescrita", async () => {
    await addReels("reel-1");
    const source = legacyComment("A");
    await repos.comments.put({
      ...source,
      reelId: "reel-1",
      parentId: null,
    });
    const { result } = await migrate({ "reel-1": [source] });
    expect(result).toMatchObject({
      completed: true,
      migrated: 0,
      skippedAlreadyPresent: 1,
    });
  });

  test("colisão de ID semanticamente diferente é inválida e preserva existente", async () => {
    await addReels("reel-1");
    const existing: StoredReelComment = {
      ...legacyComment("A"),
      reelId: "reel-1",
      parentId: null,
      text: "texto já persistido",
    };
    await repos.comments.put(existing);
    const { result } = await migrate({ "reel-1": [legacyComment("A")] });
    expect(result).toMatchObject({ completed: false, invalid: 1 });
    expect((await repos.comments.get("A"))?.text).toBe("texto já persistido");
  });

  test("descendente de pai com conflito também não é migrado", async () => {
    await addReels("reel-1");
    await repos.comments.put({
      ...legacyComment("A"),
      reelId: "reel-1",
      parentId: null,
      text: "pai incompatível",
    });
    const { result } = await migrate({
      "reel-1": [
        legacyComment("A", {
          replies: [legacyComment("B")],
        }),
      ],
    });
    expect(result).toMatchObject({ completed: false, invalid: 2, migrated: 0 });
    expect(await repos.comments.get("B")).toBeNull();
  });

  test("IDs duplicados na fonte são inválidos e não sobrescrevem", async () => {
    await addReels("reel-1");
    const { result } = await migrate({
      "reel-1": [legacyComment("A"), legacyComment("A")],
    });
    expect(result).toMatchObject({ completed: false, found: 2, invalid: 2, migrated: 0 });
    expect(await repos.comments.get("A")).toBeNull();
  });

  test("execução repetida não duplica", async () => {
    await addReels("reel-1");
    const source = { "reel-1": [legacyComment("A")] };
    const fake = makeIO(JSON.stringify(source));
    const first = await migrateLegacyReelComments(
      repos.reels,
      repos.comments,
      fake.io,
      MIGRATION_AT,
    );
    const second = await migrateLegacyReelComments(
      repos.reels,
      repos.comments,
      fake.io,
      MIGRATION_AT,
    );
    expect(first.migrated).toBe(1);
    expect(second.migrated).toBe(0);
    expect(await repos.comments.countByReel("reel-1")).toBe(1);
  });

  test("falha parcial preserva sucesso e mantém Comments pendente", async () => {
    repos = makeRepositories("B");
    await addReels("reel-1");
    const { result, fake } = await migrate({
      "reel-1": [
        legacyComment("A", {
          replies: [legacyComment("B", { replies: [legacyComment("C")] })],
        }),
      ],
    });
    expect(result).toMatchObject({
      completed: false,
      found: 3,
      migrated: 1,
      failed: 2,
    });
    expect(getReelsMigrationStages(fake.marker()).comments).toBe("pending");
    expect(await repos.comments.get("A")).not.toBeNull();
  });

  test("retomada migra restantes sem duplicar", async () => {
    repos = makeRepositories("B");
    await addReels("reel-1");
    const raw = JSON.stringify({
      "reel-1": [
        legacyComment("A", {
          replies: [legacyComment("B", { replies: [legacyComment("C")] })],
        }),
      ],
    });
    const fake = makeIO(raw);
    await migrateLegacyReelComments(repos.reels, repos.comments, fake.io, MIGRATION_AT);
    const resumed = await migrateLegacyReelComments(
      repos.reels,
      repos.comments,
      fake.io,
      MIGRATION_AT,
    );
    expect(resumed).toMatchObject({
      completed: true,
      migrated: 2,
      skippedAlreadyPresent: 1,
    });
    expect(await repos.comments.countByReel("reel-1")).toBe(3);
    expect(fake.marker()?.counts.comments).toBe(3);
  });

  test("fonte legada permanece byte a byte intacta", async () => {
    await addReels("reel-1");
    const raw = '{ "reel-1": [' + JSON.stringify(legacyComment("A")) + "] }";
    const fake = makeIO(raw);
    await migrateLegacyReelComments(repos.reels, repos.comments, fake.io, MIGRATION_AT);
    expect(fake.source()).toBe(raw);
  });

  test("nenhum registro válido é silenciosamente perdido", async () => {
    await addReels("reel-1");
    const { result } = await migrate({
      "reel-1": [
        legacyComment("A", { replies: [legacyComment("B")] }),
        { ...legacyComment("invalid"), authorId: null },
      ],
      "reel-missing": [legacyComment("orphan")],
    });
    expect(
      result.migrated +
        result.skippedAlreadyPresent +
        result.orphaned +
        result.invalid +
        result.failed,
    ).toBe(result.found);
  });
});

describe("Fase 1C-3C-C — marcador por etapa", () => {
  test("marcador ausente bloqueia antes de ler a fonte", async () => {
    const { result, fake } = await migrate({}, null);
    expect(result.error).toBe("reels-migration-pending");
    expect(fake.sourceReads()).toBe(0);
  });

  test("marcador legado da Fase A bloqueia até Likes concluir", async () => {
    const phaseAMarker = {
      version: 1,
      ranAt: MIGRATION_AT,
      counts: { reels: 2, likes: 0, comments: 0 },
    };
    const { result } = await migrate({}, phaseAMarker);
    expect(result.error).toBe("likes-migration-pending");
  });

  test("marcador após Likes permite concluir somente Comments", async () => {
    const initial = migrationMarker();
    initial.counts = { reels: 8, likes: 5, comments: 0 };
    const { result, fake } = await migrate({}, initial);
    expect(result.completed).toBe(true);
    expect(fake.marker()?.counts).toEqual({ reels: 8, likes: 5, comments: 0 });
    expect(getReelsMigrationStages(fake.marker())).toEqual({
      reels: "completed",
      likes: "completed",
      comments: "completed",
    });
  });

  test("Comments já completed não relê nem duplica", async () => {
    const completed = migrationMarker({
      reels: "completed",
      likes: "completed",
      comments: "completed",
    });
    const { result, fake } = await migrate({ "reel-1": [legacyComment("A")] }, completed);
    expect(result.completed).toBe(true);
    expect(fake.sourceReads()).toBe(0);
    expect(await repos.comments.list()).toHaveLength(0);
  });

  test("marcador inválido e versão incompatível bloqueiam", async () => {
    const invalid = await migrate({}, { version: 1, counts: null });
    const incompatible = await migrate(
      {},
      { version: 2, ranAt: MIGRATION_AT, counts: { reels: 1, likes: 1, comments: 0 } },
    );
    expect(invalid.result.error).toBe("reels-migration-pending");
    expect(incompatible.result.error).toBe("reels-migration-pending");
  });
});
