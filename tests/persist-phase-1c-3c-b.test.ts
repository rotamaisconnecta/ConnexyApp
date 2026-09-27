import { beforeEach, describe, expect, test } from "bun:test";
import {
  getReelsMigrationStages,
  migrateLegacyReelLikes,
  parseReelsMigrationMarker,
  resolveReelsMigrationUserId,
  type LocalReelsMigrationIO,
  type ReelsMigrationMarker,
} from "../src/lib/reels/local-reel-persistence";
import {
  REEL_LIKE_STORE,
  REEL_STORE,
  reelsPersistenceSchema,
} from "../src/lib/persistence/domain/reels-schema";
import { reelLikeId, type StoredReel } from "../src/lib/persistence/domain/reels-entities";
import { ReelRepository } from "../src/repositories/reel.repository";
import { ReelLikeRepository } from "../src/repositories/reel-like.repository";
import { currentUser } from "../src/lib/mock-data";

type Disk = Map<string, Map<string, unknown>>;

function completedReelsMarker(
  patch: Partial<NonNullable<ReelsMigrationMarker["stages"]>> = {},
): ReelsMigrationMarker {
  return {
    version: 1,
    ranAt: "2026-09-12T00:00:00.000Z",
    counts: { reels: 2, likes: 0, comments: 0 },
    stages: {
      reels: "completed",
      likes: "pending",
      comments: "pending",
      ...patch,
    },
  };
}

function makeIO(likesRaw: string | null, initialMarker: unknown = completedReelsMarker()) {
  let markerRaw = initialMarker === null ? null : JSON.stringify(initialMarker);
  const source = likesRaw;
  let likesReads = 0;
  let markerWrites = 0;
  return {
    io: {
      readLegacy: () => '{"version":1,"items":[]}',
      readLikes: () => {
        likesReads += 1;
        return source;
      },
      readMarker: () => markerRaw,
      writeMarker: (value: string) => {
        markerRaw = value;
        markerWrites += 1;
        return true;
      },
    } satisfies LocalReelsMigrationIO,
    marker: () => parseReelsMigrationMarker(markerRaw),
    source: () => source,
    likesReads: () => likesReads,
    markerWrites: () => markerWrites,
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

function makeRepositories(failOnceFor?: string) {
  const disk: Disk = new Map([
    [REEL_STORE, new Map()],
    [REEL_LIKE_STORE, new Map()],
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
    async getAllByIndex(store: string, _indexName: string, value: string | number) {
      return [...(disk.get(store)?.values() ?? [])].filter(
        (row) => (row as { reelId?: unknown }).reelId === value,
      );
    },
    async put(store: string, value: { id: string; reelId?: string }) {
      if (!failed && store === REEL_LIKE_STORE && failOnceFor && value.reelId === failOnceFor) {
        failed = true;
        throw new Error("falha simulada");
      }
      let rows = disk.get(store);
      if (!rows) {
        rows = new Map();
        disk.set(store, rows);
      }
      rows.set(value.id, value);
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
    likes: new ReelLikeRepository(adapter),
    disk,
  };
}

const USER_ID = "user-active";
const MIGRATION_AT = "2026-09-12T04:30:00.000Z";
let repos: ReturnType<typeof makeRepositories>;

beforeEach(() => {
  repos = makeRepositories();
});

async function addReels(...ids: string[]) {
  for (const id of ids) await repos.reels.put(storedReel(id));
}

describe("Fase 1C-3C-B — identidade", () => {
  test("prioriza auth.user.id", () => {
    expect(resolveReelsMigrationUserId("auth-user", currentUser.id)).toBe("auth-user");
  });

  test("usa currentUser.id quando auth.user não existe", () => {
    expect(resolveReelsMigrationUserId(null, currentUser.id)).toBe(currentUser.id);
  });

  test("ausência de ambas as identidades bloqueia com segurança", () => {
    expect(resolveReelsMigrationUserId(undefined, "")).toBeNull();
  });
});

describe("Fase 1C-3C-B — fonte, destino e idempotência", () => {
  test("ausência da chave conclui com zero Likes", async () => {
    const fake = makeIO(null);
    const result = await migrateLegacyReelLikes(
      repos.reels,
      repos.likes,
      fake.io,
      USER_ID,
      MIGRATION_AT,
    );
    expect(result).toMatchObject({ completed: true, found: 0, migrated: 0 });
    expect(getReelsMigrationStages(fake.marker()).likes).toBe("completed");
  });

  test("objeto vazio conclui com contador zero", async () => {
    const fake = makeIO("{}");
    const result = await migrateLegacyReelLikes(
      repos.reels,
      repos.likes,
      fake.io,
      USER_ID,
      MIGRATION_AT,
    );
    expect(result.completed).toBe(true);
    expect(fake.marker()?.counts.likes).toBe(0);
  });

  test("somente false não cria registros nem deletes", async () => {
    const fake = makeIO('{"reel-1":false,"reel-2":false}');
    const result = await migrateLegacyReelLikes(
      repos.reels,
      repos.likes,
      fake.io,
      USER_ID,
      MIGRATION_AT,
    );
    expect(result).toMatchObject({ completed: true, ignoredFalse: 2, migrated: 0 });
    expect(await repos.likes.list()).toHaveLength(0);
  });

  test("somente true migra um Like para Reel existente", async () => {
    await addReels("reel-1");
    const fake = makeIO('{"reel-1":true}');
    const result = await migrateLegacyReelLikes(
      repos.reels,
      repos.likes,
      fake.io,
      USER_ID,
      MIGRATION_AT,
    );
    expect(result).toMatchObject({ completed: true, found: 1, migrated: 1 });
    expect(await repos.likes.isLiked("reel-1", USER_ID)).toBe(true);
  });

  test("mistura true/false migra somente true", async () => {
    await addReels("reel-1", "reel-3");
    const fake = makeIO('{"reel-1":true,"reel-2":false,"reel-3":true}');
    const result = await migrateLegacyReelLikes(
      repos.reels,
      repos.likes,
      fake.io,
      USER_ID,
      MIGRATION_AT,
    );
    expect(result).toMatchObject({ found: 2, migrated: 2, ignoredFalse: 1 });
    expect(await repos.likes.list()).toHaveLength(2);
  });

  test("múltiplos Likes usam IDs determinísticos", async () => {
    await addReels("reel-1", "reel-2");
    const fake = makeIO('{"reel-1":true,"reel-2":true}');
    await migrateLegacyReelLikes(repos.reels, repos.likes, fake.io, USER_ID, MIGRATION_AT);
    const ids = (await repos.likes.list()).map((like) => like.id).sort();
    expect(ids).toEqual([reelLikeId("reel-1", USER_ID), reelLikeId("reel-2", USER_ID)]);
  });

  test("todos os Likes da execução compartilham o migration timestamp", async () => {
    await addReels("reel-1", "reel-2");
    const fake = makeIO('{"reel-1":true,"reel-2":true}');
    const result = await migrateLegacyReelLikes(
      repos.reels,
      repos.likes,
      fake.io,
      USER_ID,
      MIGRATION_AT,
    );
    expect(result.migrationTimestamp).toBe(MIGRATION_AT);
    expect((await repos.likes.list()).map((like) => like.createdAt)).toEqual([
      MIGRATION_AT,
      MIGRATION_AT,
    ]);
  });

  test("execução repetida não duplica", async () => {
    await addReels("reel-1");
    const fake = makeIO('{"reel-1":true}');
    const first = await migrateLegacyReelLikes(
      repos.reels,
      repos.likes,
      fake.io,
      USER_ID,
      MIGRATION_AT,
    );
    const second = await migrateLegacyReelLikes(
      repos.reels,
      repos.likes,
      fake.io,
      USER_ID,
      MIGRATION_AT,
    );
    expect(first.migrated).toBe(1);
    expect(second.migrated).toBe(0);
    expect(await repos.likes.list()).toHaveLength(1);
  });

  test("Like já existente é contabilizado sem sobrescrever createdAt", async () => {
    await addReels("reel-1");
    await repos.likes.put({
      id: reelLikeId("reel-1", USER_ID),
      reelId: "reel-1",
      userId: USER_ID,
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    const fake = makeIO('{"reel-1":true}');
    const result = await migrateLegacyReelLikes(
      repos.reels,
      repos.likes,
      fake.io,
      USER_ID,
      MIGRATION_AT,
    );
    expect(result).toMatchObject({ completed: true, skippedAlreadyPresent: 1, migrated: 0 });
    expect((await repos.likes.getByReelAndUser("reel-1", USER_ID))?.createdAt).toBe(
      "2026-01-01T00:00:00.000Z",
    );
    expect(fake.marker()?.counts.likes).toBe(1);
  });

  test("identidade inválida não lê a fonte nem cria Like", async () => {
    await addReels("reel-1");
    const fake = makeIO('{"reel-1":true}');
    const result = await migrateLegacyReelLikes(
      repos.reels,
      repos.likes,
      fake.io,
      null,
      MIGRATION_AT,
    );
    expect(result).toMatchObject({ completed: false, error: "missing-identity" });
    expect(fake.likesReads()).toBe(0);
    expect(await repos.likes.list()).toHaveLength(0);
  });

  test("Reel inexistente é órfão, não cria Reel nem Like", async () => {
    const fake = makeIO('{"reel-inexistente":true}');
    const result = await migrateLegacyReelLikes(
      repos.reels,
      repos.likes,
      fake.io,
      USER_ID,
      MIGRATION_AT,
    );
    expect(result).toMatchObject({ completed: false, orphaned: 1, migrated: 0 });
    expect(await repos.reels.get("reel-inexistente")).toBeNull();
    expect(await repos.likes.list()).toHaveLength(0);
    expect(getReelsMigrationStages(fake.marker()).likes).toBe("pending");
  });

  test("MOCK não persistido é tratado como órfão", async () => {
    const fake = makeIO('{"reel-001":true}');
    const result = await migrateLegacyReelLikes(
      repos.reels,
      repos.likes,
      fake.io,
      USER_ID,
      MIGRATION_AT,
    );
    expect(result.orphaned).toBe(1);
    expect(await repos.likes.getByReelAndUser("reel-001", USER_ID)).toBeNull();
  });

  test("valor não booleano é inválido e mantém etapa pendente", async () => {
    const fake = makeIO('{"reel-1":"true"}');
    const result = await migrateLegacyReelLikes(
      repos.reels,
      repos.likes,
      fake.io,
      USER_ID,
      MIGRATION_AT,
    );
    expect(result).toMatchObject({ completed: false, invalid: 1 });
    expect(getReelsMigrationStages(fake.marker()).likes).toBe("pending");
  });

  test("JSON inválido é controlado e não altera marcador", async () => {
    const fake = makeIO("{inválido");
    const before = fake.marker();
    const result = await migrateLegacyReelLikes(
      repos.reels,
      repos.likes,
      fake.io,
      USER_ID,
      MIGRATION_AT,
    );
    expect(result.error).toBe("invalid-json");
    expect(fake.marker()).toEqual(before);
  });

  test("array é estrutura inválida", async () => {
    const fake = makeIO("[]");
    const result = await migrateLegacyReelLikes(
      repos.reels,
      repos.likes,
      fake.io,
      USER_ID,
      MIGRATION_AT,
    );
    expect(result.error).toBe("invalid-structure");
  });

  test("fonte legada permanece byte a byte intacta", async () => {
    await addReels("reel-1");
    const raw = '{ "reel-1": true, "reel-2": false }';
    const fake = makeIO(raw);
    await migrateLegacyReelLikes(repos.reels, repos.likes, fake.io, USER_ID, MIGRATION_AT);
    expect(fake.source()).toBe(raw);
  });
});

describe("Fase 1C-3C-B — marcador e retomada", () => {
  test("preserva reels e comments ao concluir likes", async () => {
    await addReels("reel-1");
    const initial = completedReelsMarker({ comments: "completed" });
    initial.counts = { reels: 8, likes: 0, comments: 5 };
    const fake = makeIO('{"reel-1":true}', initial);
    await migrateLegacyReelLikes(repos.reels, repos.likes, fake.io, USER_ID, MIGRATION_AT);
    expect(fake.marker()?.counts).toEqual({ reels: 8, likes: 1, comments: 5 });
    expect(getReelsMigrationStages(fake.marker())).toEqual({
      reels: "completed",
      likes: "completed",
      comments: "completed",
    });
  });

  test("likes só passa para completed após processamento integral", async () => {
    await addReels("reel-1");
    const fake = makeIO('{"reel-1":true}');
    const result = await migrateLegacyReelLikes(
      repos.reels,
      repos.likes,
      fake.io,
      USER_ID,
      MIGRATION_AT,
    );
    expect(result.completed).toBe(true);
    expect(getReelsMigrationStages(fake.marker()).likes).toBe("completed");
  });

  test("marcador ausente bloqueia B até A concluir", async () => {
    const fake = makeIO("{}", null);
    const result = await migrateLegacyReelLikes(
      repos.reels,
      repos.likes,
      fake.io,
      USER_ID,
      MIGRATION_AT,
    );
    expect(result.error).toBe("reels-migration-pending");
    expect(fake.likesReads()).toBe(0);
  });

  test("marcador antigo da Fase A permite executar somente B", async () => {
    await addReels("reel-1");
    const legacyMarker = {
      version: 1,
      ranAt: "2026-09-12T00:00:00.000Z",
      counts: { reels: 6, likes: 0, comments: 0 },
    };
    const fake = makeIO('{"reel-1":true}', legacyMarker);
    const result = await migrateLegacyReelLikes(
      repos.reels,
      repos.likes,
      fake.io,
      USER_ID,
      MIGRATION_AT,
    );
    expect(result.completed).toBe(true);
    expect(fake.marker()?.counts.reels).toBe(6);
    expect(getReelsMigrationStages(fake.marker())).toEqual({
      reels: "completed",
      likes: "completed",
      comments: "pending",
    });
  });

  test("marcador inválido bloqueia B", async () => {
    const fake = makeIO("{}", { version: 1, counts: null });
    const result = await migrateLegacyReelLikes(
      repos.reels,
      repos.likes,
      fake.io,
      USER_ID,
      MIGRATION_AT,
    );
    expect(result.error).toBe("reels-migration-pending");
  });

  test("versão incompatível bloqueia B", async () => {
    const fake = makeIO("{}", {
      version: 2,
      ranAt: "x",
      counts: { reels: 1, likes: 0, comments: 0 },
    });
    const result = await migrateLegacyReelLikes(
      repos.reels,
      repos.likes,
      fake.io,
      USER_ID,
      MIGRATION_AT,
    );
    expect(result.error).toBe("reels-migration-pending");
  });

  test("likes já completed não lê fonte nem duplica", async () => {
    const fake = makeIO('{"reel-1":true}', completedReelsMarker({ likes: "completed" }));
    const result = await migrateLegacyReelLikes(
      repos.reels,
      repos.likes,
      fake.io,
      USER_ID,
      MIGRATION_AT,
    );
    expect(result.completed).toBe(true);
    expect(fake.likesReads()).toBe(0);
    expect(await repos.likes.list()).toHaveLength(0);
  });

  test("falha parcial não marca etapa e preserva registros já migrados", async () => {
    repos = makeRepositories("reel-2");
    await addReels("reel-1", "reel-2", "reel-3");
    const fake = makeIO('{"reel-1":true,"reel-2":true,"reel-3":true}');
    const result = await migrateLegacyReelLikes(
      repos.reels,
      repos.likes,
      fake.io,
      USER_ID,
      MIGRATION_AT,
    );
    expect(result).toMatchObject({ completed: false, migrated: 2, failed: 1 });
    expect(await repos.likes.list()).toHaveLength(2);
    expect(getReelsMigrationStages(fake.marker()).likes).toBe("pending");
  });

  test("retomada após falha migra restante sem duplicar", async () => {
    repos = makeRepositories("reel-2");
    await addReels("reel-1", "reel-2", "reel-3");
    const fake = makeIO('{"reel-1":true,"reel-2":true,"reel-3":true}');
    await migrateLegacyReelLikes(repos.reels, repos.likes, fake.io, USER_ID, MIGRATION_AT);
    const resumed = await migrateLegacyReelLikes(
      repos.reels,
      repos.likes,
      fake.io,
      USER_ID,
      "2026-09-12T05:00:00.000Z",
    );
    expect(resumed).toMatchObject({
      completed: true,
      migrated: 1,
      skippedAlreadyPresent: 2,
    });
    expect(await repos.likes.list()).toHaveLength(3);
    expect(fake.marker()?.counts.likes).toBe(3);
  });

  test("falha ao escrever marcador mantém etapa retomável", async () => {
    await addReels("reel-1");
    const fake = makeIO('{"reel-1":true}');
    const io = { ...fake.io, writeMarker: () => false };
    const result = await migrateLegacyReelLikes(
      repos.reels,
      repos.likes,
      io,
      USER_ID,
      MIGRATION_AT,
    );
    expect(result).toMatchObject({ completed: false, error: "marker-write-failed" });
    expect(await repos.likes.list()).toHaveLength(1);
    expect(getReelsMigrationStages(fake.marker()).likes).toBe("pending");
  });
});
