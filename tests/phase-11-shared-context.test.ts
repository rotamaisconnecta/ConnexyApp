import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PresenceVisibility, type PresenceRecord } from "../src/lib/event-checkin/checkin-types";
import { DEMO_USER_ANA } from "../src/lib/demo/demo-cast";
import { setDemoEnabledForTests } from "../src/lib/demo/demo-config";
import { setDemoIdentity } from "../src/lib/demo/demo-identity";
import { connectUser, getConnectionIds } from "../src/lib/demo/demo-db";
import {
  commonGround,
  compatibilityScore,
  currentUser,
  findPerson,
  sharedInterestPercent,
} from "../src/lib/mock-data";
import { listSharedActivities } from "../src/lib/presence/presence-privacy";

const VIEWER = "lucas";
const BEATRIZ = "beatriz";
const projectRoot = join(import.meta.dir, "..");

type MemoryStorage = Storage & { keys(): string[] };

function createMemoryStorage(): MemoryStorage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key: string) => data.get(key) ?? null,
    key: (index: number) => [...data.keys()][index] ?? null,
    removeItem: (key: string) => data.delete(key),
    setItem: (key: string, value: string) => data.set(String(key), String(value)),
    keys: () => [...data.keys()],
  } as MemoryStorage;
}

function installBrowser(storage: MemoryStorage = createMemoryStorage()): MemoryStorage {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    writable: true,
    value: {
      localStorage: storage,
      dispatchEvent: () => true,
      addEventListener() {},
      removeEventListener() {},
    },
  });
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    writable: true,
    value: storage,
  });
  return storage;
}

async function source(relativePath: string): Promise<string> {
  return readFile(join(projectRoot, relativePath), "utf8");
}

function presenceRecord(
  overrides: Partial<PresenceRecord> & Pick<PresenceRecord, "userId" | "targetId">,
): PresenceRecord {
  return {
    id: `prs-${overrides.userId}-${overrides.targetId}`,
    userName: "Teste",
    userPhoto: "/avatar.png",
    visibility: PresenceVisibility.PUBLIC,
    targetName: "Alvo",
    targetType: "place",
    checkedInAt: "2026-10-08T12:00:00.000Z",
    ...overrides,
  };
}

function sharedFixture(): PresenceRecord[] {
  return [
    presenceRecord({
      userId: VIEWER,
      targetId: "evt-1",
      targetName: "Noite de Jazz",
      targetType: "event",
      checkedInAt: "2026-10-07T20:00:00.000Z",
    }),
    presenceRecord({
      userId: BEATRIZ,
      targetId: "evt-1",
      targetName: "Noite de Jazz",
      targetType: "event",
      checkedInAt: "2026-10-07T21:00:00.000Z",
    }),
    presenceRecord({
      userId: VIEWER,
      targetId: "cafe-central",
      targetName: "Café Central",
      targetType: "place",
      checkedInAt: "2026-10-06T15:00:00.000Z",
    }),
    presenceRecord({
      userId: BEATRIZ,
      targetId: "vinil-store",
      targetName: "Vinil Store",
      targetType: "place",
      checkedInAt: "2026-10-06T18:00:00.000Z",
    }),
  ];
}

beforeEach(() => {
  installBrowser();
  setDemoEnabledForTests(true);
  setDemoIdentity(VIEWER);
});

afterEach(() => {
  setDemoIdentity(VIEWER);
  setDemoEnabledForTests(null);
});

describe("Fase 11 — Atividade compartilhada", () => {
  test("TESTE 1: check-in no mesmo evento conta como atividade compartilhada", () => {
    const shared = listSharedActivities(sharedFixture(), VIEWER, BEATRIZ);

    expect(shared).toHaveLength(1);
    expect(shared[0]).toEqual({
      targetId: "evt-1",
      targetName: "Noite de Jazz",
      targetType: "event",
      checkedInAt: "2026-10-07T21:00:00.000Z",
    });
  });

  test("TESTE 2: check-in de uma única pessoa não aparece como compartilhado", () => {
    const shared = listSharedActivities(sharedFixture(), VIEWER, BEATRIZ);
    const sharedIds = shared.map((activity) => activity.targetId);

    expect(sharedIds).not.toContain("cafe-central");
    expect(sharedIds).not.toContain("vinil-store");
  });

  test("TESTE 2: check-in anônimo nunca vira atividade compartilhada", () => {
    const records = [
      presenceRecord({ userId: VIEWER, targetId: "evt-2", targetName: "Feira de Jazz" }),
      presenceRecord({
        userId: BEATRIZ,
        targetId: "evt-2",
        targetName: "Feira de Jazz",
        visibility: PresenceVisibility.ANONYMOUS,
      }),
    ];

    expect(listSharedActivities(records, VIEWER, BEATRIZ)).toEqual([]);
  });

  test("TESTE 3: navegação preserva o id do alvo e aponta para rotas existentes", async () => {
    const shared = listSharedActivities(sharedFixture(), VIEWER, BEATRIZ);

    expect(shared[0].targetId).toBe("evt-1");
    expect(shared[0].targetType).toBe("event");

    const perfil = await source("src/routes/_app.perfil.$id.tsx");
    expect(perfil).toContain('to="/event/$eventId"');
    expect(perfil).toContain("params={{ eventId: activity.targetId }}");
    expect(perfil).toContain('to="/local/$id"');
    expect(perfil).toContain("params={{ id: activity.targetId }}");
    expect(perfil).not.toMatch(/replace\(\s*\/\^evt-/);

    const mockBusinesses = await source("src/lib/marketplace/mock-businesses.ts");
    expect(mockBusinesses).toContain('id: "evt-1"');
  });

  test("TESTE 6: sem dados, a seção fica oculta e nada é fabricado", async () => {
    expect(listSharedActivities([], VIEWER, BEATRIZ)).toEqual([]);
    expect(listSharedActivities(sharedFixture(), VIEWER, VIEWER)).toEqual([]);

    const perfil = await source("src/routes/_app.perfil.$id.tsx");
    expect(perfil).toContain("sharedActivities.length > 0");
    expect(perfil).toContain("listSharedActivities(checkins, viewerId, person.id, friendIds)");
    expect(perfil).not.toContain("Confirmou presença em um evento próximo");
    expect(perfil).not.toContain("um lugar da região");
    expect(perfil).not.toMatch(/Curtiu \$\{displayPlaces/);
    expect(perfil).not.toMatch(/Fez check-in no /);
    expect(perfil).not.toContain("12 amigos em comum");
  });
});

describe("Fase 11 — Interesses e identidade ativa", () => {
  test("TESTE 4: interesses em comum são a interseção exata", () => {
    const juliana = findPerson("juliana");
    expect(juliana).not.toBeNull();

    const expected = juliana!.interests.filter((interest) =>
      currentUser.interests.includes(interest),
    );
    expect(expected).toEqual(["Eventos", "Música"]);

    const ground = commonGround(juliana!);
    expect(ground.sharedInterests).toEqual(expected);
    expect(ground.sharedInterests).not.toContain("Café");
    expect(ground.sharedInterests).not.toContain("Arte");
    expect(sharedInterestPercent(juliana!)).toBe(
      Math.round((expected.length / currentUser.interests.length) * 100),
    );
  });

  test("TESTE 5: A vendo B não é igual a B vendo A", () => {
    const beatriz = findPerson(BEATRIZ)!;
    const marina = findPerson("marina")!;

    setDemoIdentity(BEATRIZ);
    const beatrizSeesMarina = sharedInterestPercent(marina);
    expect(beatrizSeesMarina).toBe(25);
    expect(commonGround(marina).sharedInterests).toEqual(["Arte"]);
    expect(sharedInterestPercent(marina)).toBe(25);

    setDemoIdentity("marina");
    const marinaSeesBeatriz = sharedInterestPercent(beatriz);
    expect(marinaSeesBeatriz).toBe(50);
    expect(marinaSeesBeatriz).not.toBe(beatrizSeesMarina);

    setDemoIdentity(BEATRIZ);
    expect(sharedInterestPercent(marina, currentUser)).toBe(0);
    expect(commonGround(marina, currentUser).sharedInterests).toEqual([]);

    setDemoIdentity(VIEWER);
    const lucasSeesMarina = compatibilityScore(marina);
    setDemoIdentity(BEATRIZ);
    const beatrizSeesMarinaScore = compatibilityScore(marina);
    expect(beatrizSeesMarinaScore - lucasSeesMarina).toBe(20);
  });

  test("identidade ativa alimenta presença, interesses e contexto social", async () => {
    const provider = await source("src/providers/presence/presence-provider.tsx");
    expect(provider).toContain("getActiveViewer");
    expect(provider).not.toContain("CURRENT_USER_ID");
    expect(provider).not.toMatch(/userId: "lucas"/);

    const commonalities = await source("src/lib/feed/commonalities.ts");
    expect(commonalities).toContain("getActiveViewer");
    expect(commonalities).not.toMatch(/\bcurrentUser\./);

    const perfil = await source("src/routes/_app.perfil.$id.tsx");
    expect(perfil).toContain("getConnectionIds(viewerId)");
    expect(perfil).toContain("getConnectionIds(person.id)");
    expect(perfil).not.toMatch(/findPlace\("sunset-parque"\)/);
    expect(perfil).not.toMatch(/\bpeople\b/);
    expect(perfil).not.toContain("currentUser");
  });

  test("amigos em comum vêm do grafo real de conexões", async () => {
    await connectUser(DEMO_USER_ANA, VIEWER);
    await connectUser(DEMO_USER_ANA, BEATRIZ);

    const viewerFriends = getConnectionIds(VIEWER);
    const personFriends = getConnectionIds(BEATRIZ);
    const sharedFriendIds = viewerFriends.filter((friendId) => personFriends.includes(friendId));

    expect(viewerFriends).toContain(DEMO_USER_ANA);
    expect(personFriends).toContain(DEMO_USER_ANA);
    expect(sharedFriendIds).toContain(DEMO_USER_ANA);
    expect(sharedFriendIds).not.toContain(BEATRIZ);
    expect(sharedFriendIds).not.toContain(VIEWER);
  });
});
