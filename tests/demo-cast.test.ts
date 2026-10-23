import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { DEMO_ORIGIN } from "../src/components/mobility/ride/ride-data";
import { computeDemoEnabled, setDemoEnabledForTests } from "../src/lib/demo/demo-config";
import {
  DEMO_DRIVER_01,
  DEMO_DRIVER_02,
  DEMO_USER_ANA,
  DEMO_USER_LUCAS,
  DEMO_USER_MARIANA,
  DEMO_USER_RAFAEL,
  getDemoDriverBehavior,
  isDemoCastUser,
  listDemoCastDrivers,
  listDemoSocialPeople,
  setDemoDriverBehavior,
  shouldAutoAcceptDemoConnection,
} from "../src/lib/demo/demo-cast";
import { ensureDemoCastSeeded, resetDemoUsers } from "../src/lib/demo/demo-cast-seed";
import {
  demoRideIsInHistory,
  finalizeDemoCastRideAsPaid,
  maybeAutoCompleteDemoRide,
} from "../src/lib/demo/demo-cast-rides";
import {
  getConnectionBetween,
  getOutgoingPendingRequest,
  isConnected,
  sendRequest,
} from "../src/lib/demo/demo-db";
import { getLocalChatMessages } from "../src/lib/chat/local-chat-persistence";
import { listPeople, people } from "../src/lib/mock-data";
import { buildNearbyPeople } from "../src/lib/feed/home-premium";
import { listRideFriendCandidates, occupancyForCurrentTrip, sendRideFriendInvite } from "../src/lib/mobility/ride-companions";
import { OutingInviteStatus } from "../src/lib/marketplace/outing-invites";
import { buildDemoFleet } from "../src/lib/mobility/dispatch/demo-fleet";
import {
  acceptRideOffer,
  setDemoDispatcherConfig,
  setDemoDriverOnline,
} from "../src/lib/mobility/dispatch/dispatcher";
import { getEntry, resetDispatchState } from "../src/lib/mobility/dispatch/dispatcher-store";
import { canTransition } from "../src/lib/mobility/trip/trip-machine";
import {
  createTrip,
  getHistorySnapshot,
  getTrip,
  patchTrip,
  resetTrip,
  transition,
} from "../src/lib/mobility/trip/trip-store";
import type { TripStatus } from "../src/lib/mobility/trip/trip-types";
import { tripPaymentStatus } from "../src/lib/mobility/payment";

const FROM = "lucas";
const DEST = {
  lat: -23.5874,
  lng: -46.6576,
  label: "Parque Ibirapuera",
  address: "Av. Pedro Álvares Cabral — Ibirapuera",
};
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

function installBrowser(): void {
  const storage = createMemoryStorage();
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
}

async function source(relativePath: string): Promise<string> {
  return readFile(join(projectRoot, relativePath), "utf8");
}

function startRideRequest() {
  createTrip({ origin: DEMO_ORIGIN, destination: DEST, userId: FROM });
  transition("embarque");
  transition("categoria");
  patchTrip({ paymentMethod: "pix", estimatedFare: 22, category: "connexy" });
  transition("buscando");
  const trip = getTrip();
  if (!trip) throw new Error("Trip ausente");
  return trip;
}

function offlineDefaultFleet(): void {
  setDemoDriverOnline("marcos", false);
  setDemoDriverOnline("carla", false);
  setDemoDriverOnline("joao", false);
}

function acceptDemoRide() {
  resetDispatchState();
  offlineDefaultFleet();
  const trip = startRideRequest();
  expect(getEntry(trip.id)?.assigningDriverId).toBe(DEMO_DRIVER_01);
  expect(acceptRideOffer(trip.id, DEMO_DRIVER_01)).toBe(true);
  return trip;
}

function walkLiveRideTo(target: TripStatus): void {
  const steps: TripStatus[] = ["chegando", "chegou", "emviagem", "chegada", "avaliacao"];
  for (const next of steps) {
    const current = getTrip();
    if (!current) throw new Error("Trip ausente");
    if (current.status === target) return;
    if (current.status === next) continue;
    if (!canTransition(current.status, next)) continue;
    transition(next);
  }
  if (getTrip()?.status !== target) {
    throw new Error(`Não chegou em ${target} (atual ${getTrip()?.status})`);
  }
}

beforeEach(() => {
  installBrowser();
  setDemoEnabledForTests(null);
  resetTrip();
  resetDispatchState();
  setDemoDispatcherConfig({ autoAccept: false, delayMs: 60_000 });
});

afterEach(() => {
  setDemoEnabledForTests(null);
});

describe("gatilho DEMO_ENABLED", () => {
  test("DEV + VITE_CONNEXY_DEMO=true ativa demo", () => {
    expect(computeDemoEnabled({ DEV: true, VITE_CONNEXY_DEMO: "true" })).toBe(true);
  });

  test("DEV sem flag não ativa", () => {
    expect(computeDemoEnabled({ DEV: true })).toBe(false);
    expect(computeDemoEnabled({ DEV: true, VITE_CONNEXY_DEMO: undefined })).toBe(false);
  });

  test("DEV com flag false não ativa", () => {
    expect(computeDemoEnabled({ DEV: true, VITE_CONNEXY_DEMO: "false" })).toBe(false);
  });

  test("produção/build não ativa mesmo com a flag", () => {
    expect(computeDemoEnabled({ DEV: false, VITE_CONNEXY_DEMO: "true" })).toBe(false);
    expect(computeDemoEnabled({ VITE_CONNEXY_DEMO: "true" })).toBe(false);
  });

  test("preview não ativa", () => {
    expect(computeDemoEnabled({ DEV: false, VITE_CONNEXY_DEMO: "true", VITE_APP_DEMO_MODE: "true" })).toBe(
      false,
    );
  });

  test("alias legado VITE_APP_DEMO_MODE só vale em DEV", () => {
    expect(computeDemoEnabled({ DEV: true, VITE_APP_DEMO_MODE: "true" })).toBe(true);
    expect(computeDemoEnabled({ DEV: false, VITE_APP_DEMO_MODE: "true" })).toBe(false);
  });

  test("seed não executa quando DEMO_ENABLED=false", async () => {
    await ensureDemoCastSeeded({ enabled: false });
    expect(getConnectionBetween(FROM, DEMO_USER_ANA)).toBeNull();
    expect(listPeople(false).some((person) => person.id === DEMO_USER_MARIANA)).toBe(false);
  });

  test("automações de demo não executam quando DEMO_ENABLED=false", () => {
    expect(shouldAutoAcceptDemoConnection(DEMO_USER_MARIANA, false)).toBe(false);
    sendRequest(FROM, DEMO_USER_MARIANA);
    expect(isConnected(DEMO_USER_MARIANA, FROM)).toBe(false);
    expect(getOutgoingPendingRequest(FROM, DEMO_USER_MARIANA)?.status).toBe("pending");
    expect(finalizeDemoCastRideAsPaid({ enabled: false })).toBeNull();
  });
});

describe("elenco demo — seed", () => {
  test("cria os usuários demo com IDs estáveis e sem duplicar", () => {
    const first = listDemoSocialPeople();
    const second = listDemoSocialPeople();
    const ids = first.map((person) => person.id);
    expect(ids).toEqual([DEMO_USER_MARIANA, DEMO_USER_LUCAS, DEMO_USER_ANA, DEMO_USER_RAFAEL]);
    expect(second.map((person) => person.id)).toEqual(ids);
    expect(new Set(ids).size).toBe(ids.length);
    expect(first.every((person) => person.isDemoUser)).toBe(true);
    expect(listDemoCastDrivers().map((driver) => driver.id)).toEqual([DEMO_DRIVER_01, DEMO_DRIVER_02]);
  });

  test("listPeople só mescla o elenco com o demo ligado", () => {
    expect(listPeople(false).some((person) => person.id === DEMO_USER_MARIANA)).toBe(false);
    expect(listPeople(false).map((person) => person.id)).toEqual(people.map((person) => person.id));
    const merged = listPeople(true);
    expect(merged.filter((person) => person.id === DEMO_USER_MARIANA)).toHaveLength(1);
    expect(merged.filter((person) => person.id === FROM)).toHaveLength(0);
    expect(isDemoCastUser(DEMO_USER_MARIANA)).toBe(true);
    expect(isDemoCastUser(FROM)).toBe(false);
  });

  test("seed é idempotente e o reset reconstrói o elenco", async () => {
    setDemoEnabledForTests(true);
    await ensureDemoCastSeeded();
    await ensureDemoCastSeeded();
    expect(getConnectionBetween(FROM, DEMO_USER_ANA)).not.toBeNull();
    const anaMessages = getLocalChatMessages(`demo-direct-${[FROM, DEMO_USER_ANA].sort().join("--")}`);
    expect(anaMessages).toHaveLength(8);
    await resetDemoUsers();
    expect(getConnectionBetween(FROM, DEMO_USER_ANA)).not.toBeNull();
    expect(listPeople(true).filter((person) => person.id === DEMO_USER_ANA)).toHaveLength(1);
  });

  test("reset não corre com demo desligado", async () => {
    setDemoEnabledForTests(true);
    await ensureDemoCastSeeded();
    setDemoEnabledForTests(false);
    await resetDemoUsers();
    setDemoEnabledForTests(true);
    expect(getConnectionBetween(FROM, DEMO_USER_ANA)).not.toBeNull();
  });
});

describe("elenco demo — conexão", () => {
  test("pedido para usuário demo auto-aceita só quando configurado", async () => {
    setDemoEnabledForTests(true);
    expect(shouldAutoAcceptDemoConnection(DEMO_USER_MARIANA)).toBe(true);
    expect(shouldAutoAcceptDemoConnection(DEMO_USER_RAFAEL)).toBe(false);
    sendRequest(FROM, DEMO_USER_MARIANA, "Bora conectar?");
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(isConnected(DEMO_USER_MARIANA, FROM)).toBe(true);
    expect(getOutgoingPendingRequest(FROM, DEMO_USER_MARIANA)).toBeNull();
  });

  test("usuário real não é auto-aceito", () => {
    setDemoEnabledForTests(true);
    expect(shouldAutoAcceptDemoConnection("beatriz")).toBe(false);
    sendRequest(FROM, "beatriz", "Oi Bea");
    expect(isConnected("beatriz", FROM)).toBe(false);
    expect(getOutgoingPendingRequest(FROM, "beatriz")?.status).toBe("pending");
  });
});

describe("elenco demo — chat", () => {
  test("conversas demo são criadas com histórico e sobrevivem a novo seed", async () => {
    setDemoEnabledForTests(true);
    await ensureDemoCastSeeded();
    const conversationId = `demo-direct-${[FROM, DEMO_USER_ANA].sort().join("--")}`;
    const first = getLocalChatMessages(conversationId);
    expect(first.length).toBeGreaterThanOrEqual(5);
    expect(first.some((item) => item.text === "Oi! Tudo bem?")).toBe(true);
    expect(first[first.length - 1]?.from).toBe("them");
    await ensureDemoCastSeeded();
    expect(getLocalChatMessages(conversationId)).toHaveLength(first.length);
  });
});

describe("elenco demo — mapa e proximidade", () => {
  test("usuários demo têm localização relativa à origem demo", () => {
    const mariana = listDemoSocialPeople().find((person) => person.id === DEMO_USER_MARIANA);
    expect(mariana?.latitude).toBeDefined();
    expect(mariana?.longitude).toBeDefined();
    expect(mariana?.latitude).not.toBe(DEMO_ORIGIN.lat);
    expect(mariana?.longitude).not.toBe(DEMO_ORIGIN.lng);
    expect(Math.abs((mariana?.latitude ?? 0) - DEMO_ORIGIN.lat)).toBeLessThan(0.02);
    expect(Math.abs((mariana?.longitude ?? 0) - DEMO_ORIGIN.lng)).toBeLessThan(0.02);
    expect(mariana?.distanceMeters).toBeGreaterThan(0);
    expect(mariana?.distanceMeters).toBeLessThan(2000);
  });

  test("aparecem na fonte usada pelo mapa e por Pessoas próximas", async () => {
    setDemoEnabledForTests(true);
    await ensureDemoCastSeeded();
    expect(listPeople().some((person) => person.id === DEMO_USER_MARIANA)).toBe(true);
    const nearby = buildNearbyPeople();
    expect(nearby.people.some((person) => person.id === DEMO_USER_MARIANA)).toBe(true);
    expect(nearby.people.some((person) => person.id === DEMO_USER_ANA)).toBe(false);
  });
});

describe("elenco demo — Pegar amigo", () => {
  test("usuários demo conectados aparecem na mesma lista de elegibilidade", async () => {
    setDemoEnabledForTests(true);
    await ensureDemoCastSeeded();
    const trip = createTrip({ origin: DEMO_ORIGIN, destination: DEST, userId: FROM });
    const ids = listRideFriendCandidates(FROM, trip).map((item) => item.id);
    expect(ids).toContain(DEMO_USER_ANA);
    expect(ids).toContain(DEMO_USER_MARIANA);
    expect(ids).toContain("beatriz");
    expect(ids.indexOf(DEMO_USER_ANA)).toBeLessThan(ids.indexOf(DEMO_USER_MARIANA));
  });

  test("passageiro demo ocupa vaga e destino final não ocupa", async () => {
    setDemoEnabledForTests(true);
    const trip = createTrip({ origin: DEMO_ORIGIN, destination: DEST, userId: FROM });
    const before = occupancyForCurrentTrip(trip, FROM);
    const passenger = sendRideFriendInvite({
      trip,
      fromUserId: FROM,
      friendId: DEMO_USER_MARIANA,
    });
    expect(passenger?.status).toBe(OutingInviteStatus.PENDING);
    const afterPassenger = occupancyForCurrentTrip(getTrip()!, FROM);
    expect(afterPassenger.occupied).toBe(before.occupied + 1);
    expect(afterPassenger.friends).toBe(before.friends + 1);

    const destination = sendRideFriendInvite({
      trip: getTrip()!,
      fromUserId: FROM,
      friendId: DEMO_USER_ANA,
      asDestination: true,
    });
    expect(destination?.asDestination).toBe(true);
    const afterDestination = occupancyForCurrentTrip(getTrip()!, FROM);
    expect(afterDestination.occupied).toBe(afterPassenger.occupied);
    expect(afterDestination.friends).toBe(afterPassenger.friends);
  });
});

describe("elenco demo — motorista", () => {
  test("frota extra só existe com demo ligado", () => {
    expect(buildDemoFleet().some((driver) => driver.id === DEMO_DRIVER_01)).toBe(false);
    setDemoEnabledForTests(true);
    expect(buildDemoFleet().some((driver) => driver.id === DEMO_DRIVER_01)).toBe(true);
    expect(getDemoDriverBehavior()).toEqual({ autoAcceptRide: true, autoCompleteRide: true });
    setDemoDriverBehavior({ autoAcceptRide: false });
    expect(getDemoDriverBehavior().autoAcceptRide).toBe(false);
    expect(getDemoDriverBehavior().autoCompleteRide).toBe(true);
  });

  test("motorista demo aceita e não pula o fluxo ao vivo", () => {
    setDemoEnabledForTests(true);
    const trip = acceptDemoRide();
    expect(getTrip()?.status).toBe("encontrado");
    expect(getTrip()?.driver?.id).toBe(DEMO_DRIVER_01);
    expect(getTrip()?.userId).toBe(FROM);
    expect(finalizeDemoCastRideAsPaid()?.status).toBe("encontrado");
    expect(tripPaymentStatus(getTrip()!)).toBe("pending");
    expect(demoRideIsInHistory(trip.id)).toBe(false);
  });

  test("corrida avança pelos estados reais até a chegada", () => {
    setDemoEnabledForTests(true);
    setDemoDriverBehavior({ autoCompleteRide: false });
    acceptDemoRide();
    for (const status of ["chegando", "chegou", "emviagem", "chegada"] as const) {
      walkLiveRideTo(status);
      expect(getTrip()?.status).toBe(status);
    }
    expect(tripPaymentStatus(getTrip()!)).toBe("pending");
  });

  test("autoComplete dá baixa, confirma pagamento, completeTrip e histórico", () => {
    setDemoEnabledForTests(true);
    setDemoDriverBehavior({ autoCompleteRide: false });
    const trip = acceptDemoRide();
    walkLiveRideTo("chegada");
    expect(getTrip()?.status).toBe("chegada");
    expect(tripPaymentStatus(getTrip()!)).toBe("pending");
    setDemoDriverBehavior({ autoCompleteRide: true });
    const finished = maybeAutoCompleteDemoRide();
    expect(finished?.status).toBe("conclusao");
    expect(finished?.paymentConfirmed).toBe(true);
    expect(tripPaymentStatus(finished!)).toBe("paid");
    expect(finished?.driver?.id).toBe(DEMO_DRIVER_01);
    expect(finished?.origin.label).toBe(DEMO_ORIGIN.label);
    expect(finished?.destination?.label).toBe(DEST.label);
    expect(finished?.estimatedFare).toBeGreaterThan(0);
    expect(finished?.paymentMethod).toBe("pix");
    expect(demoRideIsInHistory(trip.id)).toBe(true);
    const archived = getHistorySnapshot().find((item) => item.id === trip.id);
    expect(archived?.status).toBe("conclusao");
    expect(tripPaymentStatus(archived!)).toBe("paid");
  });

  test("autoComplete desligado não finaliza", () => {
    setDemoEnabledForTests(true);
    setDemoDriverBehavior({ autoCompleteRide: false });
    const trip = acceptDemoRide();
    walkLiveRideTo("chegada");
    expect(maybeAutoCompleteDemoRide()?.status).toBe("chegada");
    expect(tripPaymentStatus(getTrip()!)).toBe("pending");
    expect(getTrip()?.paymentConfirmed).toBe(false);
    expect(demoRideIsInHistory(trip.id)).toBe(false);
  });

  test("corrida já em chegada continua dali", () => {
    setDemoEnabledForTests(true);
    setDemoDriverBehavior({ autoCompleteRide: false });
    const trip = acceptDemoRide();
    walkLiveRideTo("chegada");
    expect(getTrip()?.status).toBe("chegada");
    const finished = finalizeDemoCastRideAsPaid();
    expect(finished?.status).toBe("conclusao");
    expect(tripPaymentStatus(finished!)).toBe("paid");
    expect(demoRideIsInHistory(trip.id)).toBe(true);
  });

  test("corrida em avaliacao confirma pagamento e completa", () => {
    setDemoEnabledForTests(true);
    setDemoDriverBehavior({ autoCompleteRide: false });
    const trip = acceptDemoRide();
    walkLiveRideTo("chegada");
    transition("avaliacao");
    expect(getTrip()?.status).toBe("avaliacao");
    expect(tripPaymentStatus(getTrip()!)).toBe("pending");
    setDemoDriverBehavior({ autoCompleteRide: true });
    const finished = maybeAutoCompleteDemoRide();
    expect(finished?.status).toBe("conclusao");
    expect(tripPaymentStatus(finished!)).toBe("paid");
    expect(demoRideIsInHistory(trip.id)).toBe(true);
  });

  test("pagamento só fica paid após confirmDriverPayment", () => {
    setDemoEnabledForTests(true);
    setDemoDriverBehavior({ autoCompleteRide: false });
    acceptDemoRide();
    walkLiveRideTo("chegada");
    transition("avaliacao");
    expect(getTrip()?.paymentConfirmed).toBe(false);
    expect(tripPaymentStatus(getTrip()!)).toBe("pending");
    const finished = finalizeDemoCastRideAsPaid();
    expect(finished?.paymentConfirmed).toBe(true);
    expect(tripPaymentStatus(finished!)).toBe("paid");
  });

  test("finalização é idempotente", () => {
    setDemoEnabledForTests(true);
    setDemoDriverBehavior({ autoCompleteRide: false });
    const trip = acceptDemoRide();
    walkLiveRideTo("chegada");
    finalizeDemoCastRideAsPaid();
    const historyAfterFirst = getHistorySnapshot().filter((item) => item.id === trip.id);
    expect(historyAfterFirst).toHaveLength(1);
    const length = getHistorySnapshot().length;
    expect(finalizeDemoCastRideAsPaid()?.status).toBe("conclusao");
    expect(maybeAutoCompleteDemoRide()?.status).toBe("conclusao");
    expect(getHistorySnapshot().filter((item) => item.id === trip.id)).toHaveLength(1);
    expect(getHistorySnapshot()).toHaveLength(length);
  });

  test("corrida já concluída não é alterada", () => {
    setDemoEnabledForTests(true);
    setDemoDriverBehavior({ autoCompleteRide: false });
    acceptDemoRide();
    walkLiveRideTo("chegada");
    const completed = finalizeDemoCastRideAsPaid();
    const snapshot = JSON.stringify(completed);
    const history = JSON.stringify(getHistorySnapshot());
    expect(finalizeDemoCastRideAsPaid()?.status).toBe("conclusao");
    expect(JSON.stringify(getTrip())).toBe(snapshot);
    expect(JSON.stringify(getHistorySnapshot())).toBe(history);
  });

  test("demo desligado não executa baixa automática", () => {
    setDemoEnabledForTests(true);
    setDemoDriverBehavior({ autoCompleteRide: false });
    const trip = acceptDemoRide();
    walkLiveRideTo("chegada");
    setDemoEnabledForTests(false);
    expect(maybeAutoCompleteDemoRide()?.status).toBe("chegada");
    expect(finalizeDemoCastRideAsPaid({ enabled: false })?.status).toBe("chegada");
    expect(tripPaymentStatus(getTrip()!)).toBe("pending");
    expect(demoRideIsInHistory(trip.id)).toBe(false);
  });

  test("dispatcher dispara a baixa ao chegar em chegada", () => {
    setDemoEnabledForTests(true);
    setDemoDriverBehavior({ autoCompleteRide: false });
    const trip = acceptDemoRide();
    walkLiveRideTo("emviagem");
    expect(getTrip()?.status).toBe("emviagem");
    setDemoDriverBehavior({ autoCompleteRide: true });
    transition("chegada");
    expect(getTrip()?.status).toBe("conclusao");
    expect(tripPaymentStatus(getTrip()!)).toBe("paid");
    expect(demoRideIsInHistory(trip.id)).toBe(true);
  });
});

describe("elenco demo — invariantes de código", () => {
  test("ocupação continua filtrando destino final e o gatilho exige DEV", async () => {
    const companions = await source("src/lib/mobility/ride-companions.ts");
    const config = await source("src/lib/demo/demo-config.ts");
    expect(companions).toContain("invite.asDestination !== true");
    expect(config).toContain("env.DEV !== true");
    expect(config).toContain('env.VITE_CONNEXY_DEMO === "true"');
    expect(config).toContain("computeDemoEnabled");
    expect(config).not.toContain("localStorage.getItem(\"demo\")");
    expect(companions).toContain("isConnected(left.id, fromUserId)");
  });

  test("baixa demo usa actions reais e não cria estratégia manual", async () => {
    const rides = await source("src/lib/demo/demo-cast-rides.ts");
    const dispatcher = await source("src/lib/mobility/dispatch/dispatcher.ts");
    const flow = await source("src/components/mobility/ride/ride-flow.tsx");
    const demoPanel = await source("src/routes/__dev/demo.tsx");
    const occupancy = await source("src/lib/mobility/ride-companions.ts");
    expect(rides).toContain("confirmDriverPayment()");
    expect(rides).toContain("completeTrip()");
    expect(rides).not.toMatch(/paymentConfirmed:\s*true/);
    expect(rides).not.toMatch(/status:\s*"conclusao"/);
    expect(dispatcher).toContain("maybeAutoCompleteDemoRide()");
    expect(dispatcher).not.toContain("finalizeDemoCastRideAsPaid");
    expect(flow).not.toContain("Finalizar como motorista");
    expect(flow).not.toContain("Dar baixa");
    expect(demoPanel).not.toContain("Finalizar corrida");
    expect(occupancy).toContain("invite.asDestination !== true");
  });
});
