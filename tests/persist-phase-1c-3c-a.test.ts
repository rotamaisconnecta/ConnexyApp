import { beforeEach, describe, expect, test } from "bun:test";
import { REEL_STORE, reelsPersistenceSchema } from "../src/lib/persistence/domain/reels-schema";
import type { StoredReel } from "../src/lib/persistence/domain/reels-entities";
import { ReelRepository } from "../src/repositories/reel.repository";
import {
  migrateLegacyPublishedReels,
  REELS_MIGRATION_MARKER_KEY,
  toStoredReel,
  type LocalReelsMigrationIO,
  type ReelsMigrationMarker,
} from "../src/lib/reels/local-reel-persistence";
import type { EntityId } from "../src/lib/persistence/types";

type Disk = Map<string, Map<EntityId, unknown>>;

function memoryDisk(): Disk {
  return new Map([[REEL_STORE, new Map()]]);
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
    async getAllByIndex(_store: string, _indexName: string, _value: string | number) {
      return [];
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

function makeLegacyReel(id: string): Record<string, unknown> {
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
    durationS: 15,
    createdAt: "2026-07-21T10:00:00.000Z",
    persistence: "local",
  };
}

function isReelsMarker(value: string | null): boolean {
  if (!value) return false;
  try {
    const parsed = JSON.parse(value) as ReelsMigrationMarker;
    return parsed.version === 1 && typeof parsed.counts?.reels === "number";
  } catch {
    return false;
  }
}

function makeIO(legacyRaw: string | null) {
  let legacy = legacyRaw;
  let marker: string | null = null;
  let writes = 0;
  let legacyReads = 0;
  return {
    io: {
      readLegacy: () => {
        legacyReads += 1;
        return legacy;
      },
      readMarker: () => marker,
      writeMarker: (value: string) => {
        marker = value;
        writes += 1;
        return true;
      },
    } satisfies LocalReelsMigrationIO,
    setLegacy: (value: string | null) => {
      legacy = value;
    },
    marker: () => marker,
    markerWrites: () => writes,
    legacyReadCount: () => legacyReads,
  };
}

let disk: Disk;

beforeEach(() => {
  disk = memoryDisk();
});

describe("Fase 1C-3C-A — toStoredReel (transformação)", () => {
  test("transforma campo a campo sem inventar dados", () => {
    const stored = toStoredReel(makeLegacyReel("reel-1"));
    expect(stored).not.toBeNull();

    expect(stored).toEqual({
      id: "reel-1",
      caption: "legenda reel-1",
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
      durationS: 15,
      createdAt: "2026-07-21T10:00:00.000Z",
      persistence: "local",
    });
  });

  test("contexto de referência é preservado 1:1", () => {
    const reel = makeLegacyReel("reel-x");
    reel.context = { tipo: "negocio", id: "biz-1", titulo: "Café Central" };
    const stored = toStoredReel(reel);
    expect(stored?.context).toEqual({ tipo: "negocio", id: "biz-1", titulo: "Café Central" });
  });

  test("rejeita registro com contexto malformado sem descartar silenciosamente", () => {
    const reel = makeLegacyReel("reel-x");
    reel.context = { tipo: "desconhecido", id: "x", titulo: "y" };
    expect(toStoredReel(reel)).toBeNull();
  });

  test("rejeita registro incompleto (sem caption/autor/categoria)", () => {
    expect(toStoredReel(null)).toBeNull();
    expect(toStoredReel(42)).toBeNull();
    expect(toStoredReel({ id: "x" })).toBeNull();
    expect(toStoredReel({ ...makeLegacyReel("x"), caption: undefined })).toBeNull();
    const semAutor = makeLegacyReel("x");
    delete semAutor.author;
    expect(toStoredReel(semAutor)).toBeNull();
    expect(toStoredReel({ ...makeLegacyReel("x"), persistence: "nuvem" })).toBeNull();
  });
});

describe("Fase 1C-3C-A — migração de published:v1", () => {
  test("Teste 1: chave inexistente → nenhuma falha, nenhum Reel, marcador gravado, idempotente", async () => {
    const repo = new ReelRepository(memoryAdapter(disk));
    const fake = makeIO(null);

    const first = await migrateLegacyPublishedReels(repo, fake.io);
    expect(first.completed).toBe(true);
    expect(first.migrated).toBe(0);
    expect(await repo.list()).toHaveLength(0);
    expect(isReelsMarker(fake.marker())).toBe(true);

    const second = await migrateLegacyPublishedReels(repo, fake.io);
    expect(second.completed).toBe(true);
    expect(await repo.list()).toHaveLength(0);
    // marcador já existia → segunda execução não regrava
    expect(fake.markerWrites()).toBe(1);
  });

  test("Teste 2: conteúdo vazio → migração concluída, nenhum Reel", async () => {
    const repo = new ReelRepository(memoryAdapter(disk));
    const fake = makeIO(JSON.stringify({ version: 1, items: [] }));

    const result = await migrateLegacyPublishedReels(repo, fake.io);
    expect(result.completed).toBe(true);
    expect(result.migrated).toBe(0);
    expect(await repo.list()).toHaveLength(0);
    expect(isReelsMarker(fake.marker())).toBe(true);
  });

  test("Teste 2b: array vazio bruto também finaliza", async () => {
    const repo = new ReelRepository(memoryAdapter(disk));
    const fake = makeIO("[]");

    const result = await migrateLegacyPublishedReels(repo, fake.io);
    expect(result.completed).toBe(true);
    expect(await repo.list()).toHaveLength(0);
  });

  test("Teste 3: um Reel publicado → um StoredReel correspondente", async () => {
    const repo = new ReelRepository(memoryAdapter(disk));
    const fake = makeIO(JSON.stringify({ version: 1, items: [makeLegacyReel("reel-1")] }));

    const result = await migrateLegacyPublishedReels(repo, fake.io);
    expect(result.completed).toBe(true);
    expect(result.migrated).toBe(1);

    const stored = await repo.get("reel-1");
    expect(stored).toEqual(toStoredReel(makeLegacyReel("reel-1")));
    expect(isReelsMarker(fake.marker())).toBe(true);
  });

  test("Teste 4: vários Reels → todos migrados com ids preservados", async () => {
    const repo = new ReelRepository(memoryAdapter(disk));
    const items = [makeLegacyReel("reel-a"), makeLegacyReel("reel-b"), makeLegacyReel("reel-c")];
    const fake = makeIO(JSON.stringify({ version: 1, items }));

    const result = await migrateLegacyPublishedReels(repo, fake.io);
    expect(result.completed).toBe(true);
    expect(result.migrated).toBe(3);

    const ids = (await repo.list()).map((r) => r.id).sort();
    expect(ids).toEqual(["reel-a", "reel-b", "reel-c"]);
  });

  test("Teste 5: segunda execução não duplica", async () => {
    const repo = new ReelRepository(memoryAdapter(disk));
    const fake = makeIO(JSON.stringify({ version: 1, items: [makeLegacyReel("reel-1")] }));

    const first = await migrateLegacyPublishedReels(repo, fake.io);
    expect(first.completed).toBe(true);
    expect(first.migrated).toBe(1);

    const second = await migrateLegacyPublishedReels(repo, fake.io);
    expect(second.completed).toBe(true);
    expect(second.migrated).toBe(0);
    expect(await repo.list()).toHaveLength(1);
  });

  test("Teste 6: IndexedDB já contém um Reel → não duplica", async () => {
    const repo = new ReelRepository(memoryAdapter(disk));
    await repo.put(toStoredReel(makeLegacyReel("reel-existente")) as StoredReel);

    const fake = makeIO(
      JSON.stringify({
        version: 1,
        items: [makeLegacyReel("reel-existente"), makeLegacyReel("reel-novo")],
      }),
    );

    const result = await migrateLegacyPublishedReels(repo, fake.io);
    expect(result.completed).toBe(true);
    expect(result.skippedAlreadyPresent).toBe(1);
    expect(await repo.list()).toHaveLength(2);
  });

  test("Teste 7: falha intermediária não aborta os demais; execução seguinte continua", async () => {
    const base = memoryAdapter(disk);
    let failedOnce = false;
    const failingOnB = {
      ...base,
      put: async (store: string, value: { id: string }) => {
        if (!failedOnce && store === REEL_STORE && value.id === "reel-b") {
          failedOnce = true;
          throw new Error("falha de escrita simulada");
        }
        return base.put(store, value);
      },
    };

    const repo = new ReelRepository(failingOnB);
    const items = [makeLegacyReel("reel-a"), makeLegacyReel("reel-b"), makeLegacyReel("reel-c")];
    const fake = makeIO(JSON.stringify({ version: 1, items }));

    const first = await migrateLegacyPublishedReels(repo, fake.io);
    expect(first.completed).toBe(false);
    expect(first.failed).toBe(1);
    expect(first.migrated).toBe(2);
    expect(isReelsMarker(fake.marker())).toBe(false);

    // Nova execução (adapter funcional): retoma sem duplicar A/C
    const repo2 = new ReelRepository(memoryAdapter(disk));
    const resume = await migrateLegacyPublishedReels(repo2, fake.io);
    expect(resume.completed).toBe(true);
    expect(resume.skippedAlreadyPresent).toBe(2);
    expect(resume.migrated).toBe(1);
    expect((await repo2.list()).map((r) => r.id).sort()).toEqual(["reel-a", "reel-b", "reel-c"]);
    expect(isReelsMarker(fake.marker())).toBe(true);
  });

  test("Teste 7b: registro inválido não bloqueia os válidos; marcador fica pendente até saneamento", async () => {
    const repo = new ReelRepository(memoryAdapter(disk));
    const items = [makeLegacyReel("reel-a"), { id: "quebrado" }, makeLegacyReel("reel-c")];
    const fake = makeIO(JSON.stringify({ version: 1, items }));

    const first = await migrateLegacyPublishedReels(repo, fake.io);
    expect(first.completed).toBe(false);
    expect(first.invalid).toBe(1);
    expect(first.migrated).toBe(2);
    expect(isReelsMarker(fake.marker())).toBe(false);
    expect(await repo.list()).toHaveLength(2);

    // Fonte saneada → migração conclui sem duplicar
    fake.setLegacy(
      JSON.stringify({ version: 1, items: [makeLegacyReel("reel-a"), makeLegacyReel("reel-c")] }),
    );
    const resume = await migrateLegacyPublishedReels(repo, fake.io);
    expect(resume.completed).toBe(true);
    expect(resume.skippedAlreadyPresent).toBe(2);
    expect(isReelsMarker(fake.marker())).toBe(true);
  });

  test("Teste 8: migração já marcada concluída → não reexecuta nem relê a fonte", async () => {
    const repo = new ReelRepository(memoryAdapter(disk));
    const fake = makeIO("[]");
    fake.io.writeMarker(
      JSON.stringify({
        version: 1,
        ranAt: "2026-09-12T00:00:00.000Z",
        counts: { reels: 3, likes: 0, comments: 0 },
      } satisfies ReelsMigrationMarker),
    );

    const result = await migrateLegacyPublishedReels(repo, fake.io);
    expect(result.completed).toBe(true);
    expect(result.migrated).toBe(0);
    expect(fake.legacyReadCount()).toBe(0);
    expect(await repo.list()).toHaveLength(0);
  });

  test("Teste 9: JSON inválido → erro controlado, fonte preservada, sem marcador", async () => {
    const repo = new ReelRepository(memoryAdapter(disk));
    const fake = makeIO("{{isto não é json");

    const result = await migrateLegacyPublishedReels(repo, fake.io);
    expect(result.completed).toBe(false);
    expect(result.error).toBe("invalid-json");
    expect(result.invalid).toBe(1);
    expect(fake.marker()).toBeNull();
    expect(await repo.list()).toHaveLength(0);
    // A fonte antiga não é lida/alterada pela migração (é preservada pelo caller).
    expect(fake.io.readLegacy()).toBe("{{isto não é json");
  });

  test("Teste 9b: JSON válido com forma inesperada → erro controlado, sem marcador", async () => {
    const repo = new ReelRepository(memoryAdapter(disk));
    const fake = makeIO(JSON.stringify({ version: 1, items: "nao-e-array" }));

    const result = await migrateLegacyPublishedReels(repo, fake.io);
    expect(result.completed).toBe(false);
    expect(result.error).toBe("invalid-structure");
    expect(fake.marker()).toBeNull();
    expect(await repo.list()).toHaveLength(0);
  });

  test("fonte antiga nunca é apagada nem sobrescrita", async () => {
    const repo = new ReelRepository(memoryAdapter(disk));
    const raw = JSON.stringify({ version: 1, items: [makeLegacyReel("reel-1")] });
    const fake = makeIO(raw);

    await migrateLegacyPublishedReels(repo, fake.io);
    expect(fake.io.readLegacy()).toBe(raw);
    expect(fake.io.readLegacy()).not.toBeNull();
  });

  test("marcador de versão inválida é tratado como não concluído e regravado", async () => {
    const repo = new ReelRepository(memoryAdapter(disk));
    const fake = makeIO(JSON.stringify({ version: 1, items: [makeLegacyReel("reel-1")] }));
    fake.io.writeMarker(
      JSON.stringify({ version: 99, ranAt: "x", counts: { reels: 1, likes: 0, comments: 0 } }),
    );

    const result = await migrateLegacyPublishedReels(repo, fake.io);
    expect(result.completed).toBe(true);
    expect(result.migrated).toBe(1);
    expect(isReelsMarker(fake.marker())).toBe(true);
    expect(REELS_MIGRATION_MARKER_KEY).toBe("connexy:reels:migration-status:v1");
  });
});
