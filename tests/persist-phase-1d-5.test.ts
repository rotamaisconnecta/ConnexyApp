import { beforeEach, describe, expect, test } from "bun:test";
import {
  acceptRequest,
  createDemoGroup,
  demoSocialStorageKey,
  getConnectionBetween,
  getPendingRequests,
  getRequestBetween,
  respondToDemoGroupInvite,
  sendRequest,
} from "../src/lib/demo/demo-db";
import { listLocalInboxItems } from "../src/lib/notifications/local-invite-inbox";
import {
  PRESENCE_PREFERENCE_STORAGE_KEY,
  readStoredPresencePreference,
  writeStoredPresencePreference,
} from "../src/lib/presence/presence-preference";
import {
  ROLES_STORAGE_KEY,
  getActiveMode,
  getStoredRoles,
  setActiveMode,
} from "../src/lib/roles/roles-storage";
import { UserRole } from "../src/lib/roles/roles-types";
import {
  clearTrip,
  completeTrip,
  confirmDriverPayment,
  createTrip,
  getHistorySnapshot,
  markDriverFound,
  patchTrip,
  recoverPersistedTripState,
  transition,
} from "../src/lib/mobility/trip/trip-store";
import type { Trip, TripDriver } from "../src/lib/mobility/trip/trip-types";

const A = "lucas";
const B = "beatriz";
const DB_KEY = demoSocialStorageKey();
const TRIP_KEY = "connexy_demo_trip";

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

const origin = { lat: -23.55, lng: -46.64, label: "Origem 1D-5" };
const destination = { lat: -23.58, lng: -46.67, label: "Destino 1D-5" };
const stop = {
  id: "stop-1d-5",
  location: { lat: -23.56, lng: -46.65, label: "Parada 1D-5" },
  label: "Parada 1D-5",
  order: 1,
};
const driver: TripDriver = {
  id: "driver-1d-5",
  name: "Motorista 1D-5",
  rating: 4.9,
  totalRides: 12,
  photo: "",
  vehicle: { name: "Onix", color: "Preto", plate: "ABC1D23", seats: 4 },
  boardingCode: "4321",
  verified: true,
};

function persistedTripState(): { trip: Trip | null; history: Trip[] } {
  const raw = window.localStorage.getItem(TRIP_KEY);
  return recoverPersistedTripState(raw ? JSON.parse(raw) : null);
}

function finishTrip(): Trip {
  const trip = createTrip({
    origin,
    destination,
    stops: [stop],
    userId: A,
  });
  expect(transition("embarque")?.id).toBe(trip.id);
  expect(transition("categoria")?.id).toBe(trip.id);
  patchTrip({ paymentMethod: "pix", estimatedFare: 27.5, distanceMeters: 4100 });
  expect(transition("buscando")?.id).toBe(trip.id);
  expect(markDriverFound(driver)?.id).toBe(trip.id);
  expect(transition("chegando")?.id).toBe(trip.id);
  expect(transition("chegou")?.id).toBe(trip.id);
  expect(transition("emviagem")?.id).toBe(trip.id);
  expect(transition("parada")?.id).toBe(trip.id);
  patchTrip({ currentStopIndex: 1 });
  expect(transition("chegada")?.id).toBe(trip.id);
  expect(transition("avaliacao")?.id).toBe(trip.id);
  expect(confirmDriverPayment()?.paymentConfirmed).toBe(true);
  const completed = completeTrip({
    stars: 5,
    tags: ["seguro"],
    comment: "1D-5",
    createdAt: "2026-09-17T04:00:00.000Z",
  });
  expect(completed?.status).toBe("conclusao");
  return completed as Trip;
}

beforeEach(() => {
  installBrowser();
  clearTrip();
});

describe("Fase 1D-5 — Notifications derivadas do convite 1D-2", () => {
  test("criação, persistência e ausência de duplicação usam a mesma solicitação", () => {
    expect(listLocalInboxItems(B)).toEqual([]);
    const first = sendRequest(A, B, "Oi, vamos conversar?");
    const inbox = listLocalInboxItems(B);
    expect(inbox).toHaveLength(1);
    expect(inbox[0]).toMatchObject({
      kind: "conversation_invite",
      requestId: first.id,
      fromUserId: A,
      toUserId: B,
      message: "Oi, vamos conversar?",
    });
    expect(inbox[0].id).toBe(`conversation-invite:${first.id}`);
    expect(getPendingRequests(B)).toHaveLength(1);

    const second = sendRequest(A, B, "Mensagem atualizada");
    expect(second.id).toBe(first.id);
    expect(listLocalInboxItems(B)).toHaveLength(1);
    expect(listLocalInboxItems(A)).toEqual([]);
    expect(window.localStorage.getItem("connexy.mock.conversation-invites")).toBeNull();

    reloadContext();
    const reloaded = listLocalInboxItems(B);
    expect(reloaded).toHaveLength(1);
    expect(reloaded[0]).toMatchObject({ requestId: first.id, fromUserId: A, toUserId: B });
    expect((window.localStorage as MemoryStorage).keys().filter((key) => key === DB_KEY)).toEqual([
      DB_KEY,
    ]);
  });

  test("ação de aceite remove a notificação sem criar segundo convite", async () => {
    const request = sendRequest(A, B, "Convite acionável");
    expect(listLocalInboxItems(B)[0]?.requestId).toBe(request.id);
    await acceptRequest(A, B);
    expect(getRequestBetween(A, B)?.status).toBe("accepted");
    expect(getPendingRequests(B)).toEqual([]);
    expect(listLocalInboxItems(B)).toEqual([]);
    expect(getPendingRequests(A)).toEqual([]);

    reloadContext();
    expect(listLocalInboxItems(B)).toEqual([]);
    expect(getRequestBetween(A, B)?.status).toBe("accepted");
  });

  test("convite de grupo também é uma projeção, não um segundo convite", async () => {
    sendRequest(A, B, "Base");
    const connection = await acceptRequest(A, B);
    expect(getConnectionBetween(A, B)?.conversationId).toBe(connection.conversationId);
    const group = createDemoGroup(connection.conversationId, A, [B], "Grupo 1D-5");
    const inbox = listLocalInboxItems(B);
    expect(inbox.filter((item) => item.kind === "group_invite")).toHaveLength(1);
    expect(inbox[0]).toMatchObject({
      kind: "group_invite",
      groupId: group.id,
      name: "Grupo 1D-5",
    });
    expect(inbox[0].id).toBe(`group-invite:${group.id}`);
    respondToDemoGroupInvite(group.id, B, true);
    expect(listLocalInboxItems(B).filter((item) => item.kind === "group_invite")).toEqual([]);
  });
});

describe("Fase 1D-5 — History consome a Trip existente", () => {
  test("corrida concluída aparece com dados, detalhe e sem duplicação", () => {
    const completed = finishTrip();
    const history = getHistorySnapshot().filter((trip) => trip.id === completed.id);
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({
      id: completed.id,
      status: "conclusao",
      origin: { label: "Origem 1D-5" },
      destination: { label: "Destino 1D-5" },
      paymentMethod: "pix",
      paymentConfirmed: true,
    });
    expect(history[0].stops.map((item) => item.label)).toEqual(["Parada 1D-5"]);
    expect(history[0].completedAt).toBeTruthy();
    expect(completeTrip()?.id).toBe(completed.id);
    expect(getHistorySnapshot().filter((trip) => trip.id === completed.id)).toHaveLength(1);

    const persisted = persistedTripState();
    expect(persisted.history.filter((trip) => trip.id === completed.id)).toHaveLength(1);
    const detail = persisted.history.find((trip) => trip.id === completed.id);
    expect(detail?.origin.label).toBe("Origem 1D-5");
    expect(detail?.destination?.label).toBe("Destino 1D-5");
  });

  test("reload preserva o histórico e o estado vazio permanece vazio", () => {
    const empty = recoverPersistedTripState(null);
    expect(empty.history).toEqual([]);
    expect(empty.trip).toBeNull();

    const completed = finishTrip();
    reloadContext();
    const recovered = persistedTripState();
    expect(recovered.history.filter((trip) => trip.id === completed.id)).toHaveLength(1);
    expect(recovered.history.find((trip) => trip.id === completed.id)).toMatchObject({
      status: "conclusao",
      origin: { label: "Origem 1D-5" },
      destination: { label: "Destino 1D-5" },
      paymentMethod: "pix",
    });
  });
});

describe("Fase 1D-5 — Settings reutiliza preferências existentes", () => {
  test("presença altera, persiste e recarrega na chave canônica única", () => {
    expect(readStoredPresencePreference()).toBe("invisible");
    writeStoredPresencePreference("available");
    expect(readStoredPresencePreference()).toBe("available");
    expect(window.localStorage.getItem(PRESENCE_PREFERENCE_STORAGE_KEY)).toBe("available");
    expect(
      (window.localStorage as MemoryStorage)
        .keys()
        .filter((key) => key.startsWith("connexy.presence.")),
    ).toEqual([PRESENCE_PREFERENCE_STORAGE_KEY]);

    reloadContext();
    expect(readStoredPresencePreference()).toBe("available");
    writeStoredPresencePreference("invisible");
    expect(readStoredPresencePreference()).toBe("invisible");
  });

  test("modo usa a fonte connexy_roles sem chave paralela", () => {
    expect(getActiveMode()).toBe(UserRole.USER);
    setActiveMode(UserRole.DRIVER);
    expect(getActiveMode()).toBe(UserRole.DRIVER);
    expect(getStoredRoles().lastMode).toBe(UserRole.USER);
    expect(
      (window.localStorage as MemoryStorage).keys().filter((key) => key === ROLES_STORAGE_KEY),
    ).toEqual([ROLES_STORAGE_KEY]);

    reloadContext();
    expect(getActiveMode()).toBe(UserRole.DRIVER);
    expect(JSON.parse(window.localStorage.getItem(ROLES_STORAGE_KEY) ?? "{}").activeMode).toBe(
      UserRole.DRIVER,
    );
  });
});
