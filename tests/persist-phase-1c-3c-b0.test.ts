import { describe, expect, test } from "bun:test";
import {
  completeReelsMigrationStage,
  getReelsMigrationStages,
  isReelsMigrationCompleted,
  isReelsMigrationStageCompleted,
  migrateLegacyPublishedReels,
  parseReelsMigrationMarker,
  type LocalReelsMigrationIO,
  type ReelsMigrationMarker,
} from "../src/lib/reels/local-reel-persistence";
import { REEL_STORE, reelsPersistenceSchema } from "../src/lib/persistence/domain/reels-schema";
import { ReelRepository } from "../src/repositories/reel.repository";

function marker(
  stages: ReelsMigrationMarker["stages"],
  counts = { reels: 0, likes: 0, comments: 0 },
): ReelsMigrationMarker {
  return {
    version: 1,
    ranAt: "2026-09-12T00:00:00.000Z",
    counts,
    stages,
  };
}

function markerIO(initial: unknown = null) {
  let raw = initial === null ? null : JSON.stringify(initial);
  const published = '{"version":1,"items":[]}';
  const likes = '{"reel-001":true}';
  const comments = '{"reel-001":[]}';
  let markerWrites = 0;

  return {
    io: {
      readLegacy: () => published,
      readMarker: () => raw,
      writeMarker: (value: string) => {
        raw = value;
        markerWrites += 1;
        return true;
      },
    } satisfies LocalReelsMigrationIO,
    raw: () => raw,
    writes: () => markerWrites,
    legacy: () => ({ published, likes, comments }),
    corrupt: (value: string) => {
      raw = value;
    },
  };
}

function memoryReelRepository() {
  const rows = new Map<string, unknown>();
  const adapter = {
    schema: reelsPersistenceSchema,
    async get(_store: string, id: string) {
      return rows.get(id) ?? null;
    },
    async getAll() {
      return [...rows.values()];
    },
    async getAllKeys() {
      return [...rows.keys()];
    },
    async getAllByIndex() {
      return [];
    },
    async put(store: string, value: { id: string }) {
      expect(store).toBe(REEL_STORE);
      rows.set(value.id, value);
    },
    async delete(_store: string, id: string) {
      rows.delete(id);
    },
    async clear() {
      rows.clear();
    },
    async close() {},
  };
  return new ReelRepository(adapter);
}

describe("Fase 1C-3C-B0 — estado independente da migração", () => {
  test("marcador ausente inicia todas as etapas como pending", () => {
    const parsed = parseReelsMigrationMarker(null);
    expect(parsed).toBeNull();
    expect(getReelsMigrationStages(parsed)).toEqual({
      reels: "pending",
      likes: "pending",
      comments: "pending",
    });
    expect(isReelsMigrationCompleted(parsed)).toBe(false);
  });

  test("concluir reels não conclui likes nem comments", () => {
    const fake = markerIO();
    expect(completeReelsMigrationStage(fake.io, "reels", 10)).toBe(true);
    const parsed = parseReelsMigrationMarker(fake.raw());

    expect(getReelsMigrationStages(parsed)).toEqual({
      reels: "completed",
      likes: "pending",
      comments: "pending",
    });
    expect(parsed?.counts).toEqual({ reels: 10, likes: 0, comments: 0 });
    expect(isReelsMigrationCompleted(parsed)).toBe(false);
  });

  test("likes pending nunca é interpretado como migração completa", () => {
    const value = marker({
      reels: "completed",
      likes: "pending",
      comments: "completed",
    });
    expect(isReelsMigrationStageCompleted(value, "likes")).toBe(false);
    expect(isReelsMigrationCompleted(value)).toBe(false);
  });

  test("comments pending nunca é interpretado como migração completa", () => {
    const value = marker({
      reels: "completed",
      likes: "completed",
      comments: "pending",
    });
    expect(isReelsMigrationStageCompleted(value, "comments")).toBe(false);
    expect(isReelsMigrationCompleted(value)).toBe(false);
  });

  test("reels e likes completed com comments pending é um estado válido", () => {
    const value = marker({
      reels: "completed",
      likes: "completed",
      comments: "pending",
    });
    const parsed = parseReelsMigrationMarker(JSON.stringify(value));
    expect(parsed).not.toBeNull();
    expect(getReelsMigrationStages(parsed)).toEqual(value.stages!);
  });

  test("somente as três etapas completed concluem a migração v1", () => {
    const value = marker({
      reels: "completed",
      likes: "completed",
      comments: "completed",
    });
    expect(isReelsMigrationCompleted(value)).toBe(true);
  });

  test("concluir uma etapa preserva etapas já concluídas", () => {
    const fake = markerIO(
      marker(
        { reels: "completed", likes: "pending", comments: "pending" },
        { reels: 7, likes: 0, comments: 0 },
      ),
    );

    expect(completeReelsMigrationStage(fake.io, "likes", 3)).toBe(true);
    const afterLikes = parseReelsMigrationMarker(fake.raw());
    expect(getReelsMigrationStages(afterLikes)).toEqual({
      reels: "completed",
      likes: "completed",
      comments: "pending",
    });
    expect(afterLikes?.counts).toEqual({ reels: 7, likes: 3, comments: 0 });

    expect(completeReelsMigrationStage(fake.io, "reels", 7)).toBe(true);
    expect(getReelsMigrationStages(parseReelsMigrationMarker(fake.raw())).likes).toBe("completed");
  });

  test("marcador legado da Fase A significa apenas reels completed", () => {
    const legacy = {
      version: 1,
      ranAt: "2026-09-12T00:00:00.000Z",
      counts: { reels: 12, likes: 0, comments: 0 },
    };
    const parsed = parseReelsMigrationMarker(JSON.stringify(legacy));

    expect(getReelsMigrationStages(parsed)).toEqual({
      reels: "completed",
      likes: "pending",
      comments: "pending",
    });
    expect(isReelsMigrationCompleted(parsed)).toBe(false);
  });

  test("marcador corrompido volta ao estado inicial seguro", () => {
    expect(parseReelsMigrationMarker("{invalido")).toBeNull();
    expect(getReelsMigrationStages(parseReelsMigrationMarker("{invalido"))).toEqual({
      reels: "pending",
      likes: "pending",
      comments: "pending",
    });
  });

  test("versão desconhecida não é aceita nem interpretada como concluída", () => {
    const unknown = JSON.stringify({
      version: 2,
      ranAt: "2026-09-12T00:00:00.000Z",
      counts: { reels: 9, likes: 9, comments: 9 },
      stages: { reels: "completed", likes: "completed", comments: "completed" },
    });
    const parsed = parseReelsMigrationMarker(unknown);
    expect(parsed).toBeNull();
    expect(isReelsMigrationCompleted(parsed)).toBe(false);
  });

  test("retomada atualiza somente a etapa pendente", () => {
    const fake = markerIO(
      marker(
        { reels: "completed", likes: "pending", comments: "pending" },
        { reels: 4, likes: 0, comments: 0 },
      ),
    );

    completeReelsMigrationStage(fake.io, "likes", 2);
    const resumed = parseReelsMigrationMarker(fake.raw());
    expect(resumed?.counts).toEqual({ reels: 4, likes: 2, comments: 0 });
    expect(getReelsMigrationStages(resumed).comments).toBe("pending");
    expect(fake.writes()).toBe(1);
  });

  test("contagem inválida não corrompe nem rebaixa o marcador", () => {
    const initial = marker(
      { reels: "completed", likes: "pending", comments: "pending" },
      { reels: 4, likes: 0, comments: 0 },
    );
    const fake = markerIO(initial);

    expect(completeReelsMigrationStage(fake.io, "likes", Number.NaN)).toBe(false);
    expect(completeReelsMigrationStage(fake.io, "likes", -1)).toBe(false);
    expect(fake.writes()).toBe(0);
    expect(parseReelsMigrationMarker(fake.raw())).toEqual(initial);
  });

  test("atualizar o marcador não escreve nas três fontes legadas", () => {
    const fake = markerIO();
    const before = fake.legacy();
    completeReelsMigrationStage(fake.io, "reels", 0);
    completeReelsMigrationStage(fake.io, "likes", 0);
    completeReelsMigrationStage(fake.io, "comments", 0);
    expect(fake.legacy()).toEqual(before);
  });

  test("marcador legado concluído evita reexecutar e duplicar Reels", async () => {
    const repo = memoryReelRepository();
    const fake = markerIO({
      version: 1,
      ranAt: "2026-09-12T00:00:00.000Z",
      counts: { reels: 1, likes: 0, comments: 0 },
    });

    const first = await migrateLegacyPublishedReels(repo, fake.io);
    const second = await migrateLegacyPublishedReels(repo, fake.io);

    expect(first.migrated).toBe(0);
    expect(second.migrated).toBe(0);
    expect(await repo.list()).toHaveLength(0);
    expect(fake.writes()).toBe(0);
  });
});
