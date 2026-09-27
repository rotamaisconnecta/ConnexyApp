import { beforeEach, describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  acceptRequest,
  createDemoGroup,
  respondToDemoGroupInvite,
  sendRequest,
} from "../src/lib/demo/demo-db";
import { listLocalInboxItems } from "../src/lib/notifications/local-invite-inbox";
import {
  OUTING_INVITES_STORAGE_KEY,
  OutingInviteStatus,
  getOutingInvite,
  getOutingRideSearch,
  isOutingRideAvailable,
  listOutingInvites,
  respondToOutingInvite,
  sendOutingInvite,
} from "../src/lib/marketplace/outing-invites";
import { buildCompanionStops, parseCompanions } from "../src/lib/mobility/ride-search";
import { createTrip, getTrip, resetTrip } from "../src/lib/mobility/trip/trip-store";

const A = "lucas";
const B = "beatriz";
const C = "rafael";
const TARGET = {
  id: "cafe-central",
  title: "Café Central",
  address: "Rua Augusta, 1200 — São Paulo, SP",
  latitude: -23.561,
  longitude: -46.656,
};
const ORIGIN = { lat: -23.55, lng: -46.64, label: "Sua localização" };
const projectRoot = join(import.meta.dir, "..");

type MemoryStorage = Storage & { keys(): string[] };

function createMemoryStorage(seed?: Map<string, string>): MemoryStorage {
  const data = seed ? new Map(seed) : new Map<string, string>();
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

function reloadContext(): MemoryStorage {
  const current = (globalThis as { window?: { localStorage: MemoryStorage } }).window?.localStorage;
  const snapshot = new Map<string, string>();
  if (current) {
    for (const key of current.keys()) {
      const value = current.getItem(key);
      if (value != null) snapshot.set(key, value);
    }
  }
  return installBrowser(createMemoryStorage(snapshot));
}

async function source(relativePath: string): Promise<string> {
  return readFile(join(projectRoot, relativePath), "utf8");
}

function inviteFromA() {
  return sendOutingInvite({
    fromUserId: A,
    toUserId: B,
    target: TARGET,
    message: "Vamos juntos para Café Central?",
    stop: { address: "Rua Augusta, 1544 — Consolação", lat: -23.5501, lng: -46.6398 },
  });
}

function startOutingRide(fromUserId: string, targetId: string) {
  const search = getOutingRideSearch(fromUserId, targetId);
  if (!search) return null;
  const companions = parseCompanions(search.companions);
  return createTrip({
    origin: ORIGIN,
    destination: {
      lat: search.destinationLat ?? -23.58,
      lng: search.destinationLng ?? -46.65,
      label: search.destinationAddress || search.destinationName || "",
    },
    stops: buildCompanionStops(ORIGIN, companions),
    source: search.source,
    companionLabel: search.source === "invite" ? "Ir juntos" : undefined,
    userId: fromUserId,
  });
}

beforeEach(() => {
  installBrowser();
  resetTrip();
});

describe("Fase 1F-6 — persistência de Ir juntos", () => {
  test("A envia convite para B e o registro fica em connexy:demo:outing-invites", () => {
    const invite = inviteFromA();
    const again = inviteFromA();
    expect(again.id).toBe(invite.id);
    expect(listOutingInvites()).toHaveLength(1);
    expect(invite.status).toBe(OutingInviteStatus.PENDING);
    expect(invite.fromUserId).toBe(A);
    expect(invite.personId).toBe(B);
    expect(invite.targetId).toBe(TARGET.id);
    expect(listOutingInvites()).toHaveLength(1);
    expect(window.localStorage.getItem(OUTING_INVITES_STORAGE_KEY)).toContain(invite.id);
    expect(window.localStorage.getItem("connexy:demo:outing-invites-v2")).toBeNull();
    expect(isOutingRideAvailable(A, TARGET.id)).toBe(false);
    expect(getOutingRideSearch(A, TARGET.id)).toBeNull();
  });

  test("B recebe o convite real na inbox funcional", () => {
    const invite = inviteFromA();
    const inbox = listLocalInboxItems(B);
    expect(inbox).toHaveLength(1);
    expect(inbox[0]).toMatchObject({
      kind: "outing_invite",
      inviteId: invite.id,
      fromUserId: A,
      toUserId: B,
      status: OutingInviteStatus.PENDING,
    });
    expect(listLocalInboxItems(A)).toEqual([]);
    expect(listLocalInboxItems(C)).toEqual([]);
  });

  test("B aceita, o status persiste e A vê aceito depois do reload", () => {
    const invite = inviteFromA();
    const first = respondToOutingInvite(invite.id, B, true);
    const second = respondToOutingInvite(invite.id, B, true);
    expect(first?.status).toBe(OutingInviteStatus.ACCEPTED);
    expect(second?.id).toBe(first?.id);
    expect(second?.status).toBe(OutingInviteStatus.ACCEPTED);
    expect(listOutingInvites()).toHaveLength(1);
    expect(getOutingInvite(invite.id)?.status).toBe(OutingInviteStatus.ACCEPTED);
    expect(isOutingRideAvailable(A, TARGET.id)).toBe(true);

    reloadContext();
    expect(getOutingInvite(invite.id)?.status).toBe(OutingInviteStatus.ACCEPTED);
    expect(isOutingRideAvailable(A, TARGET.id)).toBe(true);
    expect(listLocalInboxItems(B)[0]).toMatchObject({
      kind: "outing_invite",
      status: OutingInviteStatus.ACCEPTED,
    });
  });

  test("B recusa, o status persiste e a corrida não fica disponível", () => {
    const invite = inviteFromA();
    const first = respondToOutingInvite(invite.id, B, false);
    const second = respondToOutingInvite(invite.id, B, false);
    expect(first?.status).toBe(OutingInviteStatus.DECLINED);
    expect(second?.status).toBe(OutingInviteStatus.DECLINED);
    expect(isOutingRideAvailable(A, TARGET.id)).toBe(false);
    expect(getOutingRideSearch(A, TARGET.id)).toBeNull();
    expect(startOutingRide(A, TARGET.id)).toBeNull();
    expect(getTrip()).toBeNull();

    reloadContext();
    expect(getOutingInvite(invite.id)?.status).toBe(OutingInviteStatus.DECLINED);
    expect(isOutingRideAvailable(A, TARGET.id)).toBe(false);
  });

  test("somente o destinatário pode aceitar ou recusar", () => {
    const invite = inviteFromA();
    expect(respondToOutingInvite(invite.id, A, true)?.status).toBe(OutingInviteStatus.PENDING);
    expect(respondToOutingInvite(invite.id, C, true)?.status).toBe(OutingInviteStatus.PENDING);
    expect(respondToOutingInvite("missing-invite", B, true)).toBeNull();
    expect(getOutingInvite(invite.id)?.status).toBe(OutingInviteStatus.PENDING);
    expect(isOutingRideAvailable(A, TARGET.id)).toBe(false);
  });

  test("convites antigos sem status ou remetente continuam pendentes e atribuídos a Lucas", () => {
    window.localStorage.setItem(
      OUTING_INVITES_STORAGE_KEY,
      JSON.stringify([
        {
          id: "outing-legacy-beatriz",
          targetId: TARGET.id,
          personId: B,
          message: "Vamos?",
          createdAt: 1,
        },
      ]),
    );
    const legacy = getOutingInvite("outing-legacy-beatriz");
    expect(legacy).toMatchObject({
      fromUserId: A,
      status: OutingInviteStatus.PENDING,
      personId: B,
    });
    expect(respondToOutingInvite(legacy!.id, B, true)?.status).toBe(OutingInviteStatus.ACCEPTED);
  });
});

describe("Fase 1F-6 — corrida só após aceite com Trip existente", () => {
  test("CTA/corrida só existe depois do aceite e reutiliza createTrip", () => {
    const invite = inviteFromA();
    expect(isOutingRideAvailable(A, TARGET.id)).toBe(false);
    expect(startOutingRide(A, TARGET.id)).toBeNull();
    expect(getTrip()).toBeNull();

    respondToOutingInvite(invite.id, B, true);
    const search = getOutingRideSearch(A, TARGET.id);
    expect(search).toMatchObject({
      destinationId: TARGET.id,
      source: "invite",
    });
    expect(parseCompanions(search?.companions).map((companion) => companion.id)).toEqual([B]);

    const first = startOutingRide(A, TARGET.id);
    const second = startOutingRide(A, TARGET.id);
    expect(first?.id).toBeTruthy();
    expect(second?.id).toBe(first?.id);
    expect(first?.source).toBe("invite");
    expect(first?.companionLabel).toBe("Ir juntos");
    expect(getTrip()?.id).toBe(first?.id);
  });
});

describe("Fase 1F-6 — regressão da inbox 1F-5", () => {
  test("friend requests, group invites e n1-n4 continuam no contrato anterior", async () => {
    expect(listLocalInboxItems(A)).toEqual([]);
    const request = sendRequest(B, A, "Solicitação visível na inbox");
    expect(listLocalInboxItems(A)[0]).toMatchObject({
      kind: "conversation_invite",
      requestId: request.id,
      fromUserId: B,
    });
    expect(listLocalInboxItems(A).some((item) => item.id === "n1")).toBe(false);
    expect(listLocalInboxItems(A).some((item) => item.id === "n2")).toBe(false);
    expect(listLocalInboxItems(A).some((item) => item.id === "n3")).toBe(false);
    expect(listLocalInboxItems(A).some((item) => item.id === "n4")).toBe(false);

    await acceptRequest(B, A);
    expect(listLocalInboxItems(A).filter((item) => item.kind === "conversation_invite")).toEqual(
      [],
    );

    sendRequest(A, C, "Base para grupo");
    const connection = await acceptRequest(A, C);
    const group = createDemoGroup(connection.conversationId, A, [C], "Grupo 1F-6");
    expect(listLocalInboxItems(C).filter((item) => item.kind === "group_invite")).toHaveLength(1);
    respondToDemoGroupInvite(group.id, C, false);
    expect(listLocalInboxItems(C).filter((item) => item.kind === "group_invite")).toEqual([]);
  });
});

describe("Fase 1F-6 — superfícies existentes", () => {
  test("não cria chave, inbox ou Trip paralelos e reutiliza /ride/request", async () => {
    const store = await source("src/lib/marketplace/outing-invites.ts");
    expect(store).toContain("connexy:demo:outing-invites");
    expect(store).not.toContain("outing-invites-v2");
    expect(store).not.toContain("supabase.from(");
    expect(store).not.toContain("supabase.auth");

    const sheet = await source("src/components/marketplace/local-engagement.tsx");
    expect(sheet).toContain("sendOutingInvite");
    expect(sheet).toContain("Corrida disponível");
    expect(sheet).toContain('to: "/ride/request"');
    expect(sheet).not.toContain("setAccepted");
    expect(sheet).not.toContain("supabase.from(");

    const inbox = await source("src/lib/notifications/local-invite-inbox.ts");
    expect(inbox).toContain("outing_invite");
    expect(inbox).toContain("listIncomingOutingInvites");
    expect(inbox).toContain("conversation_invite");
    expect(inbox).toContain("group_invite");

    const page = await source("src/routes/_app.notificacoes.tsx");
    expect(page).toContain("respondToOutingInvite");
    expect(page).toContain("listLocalInboxItems");
    expect(page).not.toContain("import { notifications");
    expect(page).not.toContain("Sunset no Parque");
    expect(page).not.toContain("markAsRead");
    expect(page).not.toContain("supabase.from(");

    const ride = await source("src/routes/_app/ride/request.tsx");
    expect(ride).toContain("RideFlow");
    expect(ride).toContain("seedInitial");
    expect(ride).toContain('search.source === "invite" ? "Ir juntos"');
  });
});
