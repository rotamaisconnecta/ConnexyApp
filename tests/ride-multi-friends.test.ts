import { beforeEach, describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  DEMO_ORIGIN,
  MOCK_DRIVER,
  seatsForRideCategory,
} from "../src/components/mobility/ride/ride-data";
import { estimateDemoFare } from "../src/lib/mobility/demo-fare";
import { OutingInviteStatus, listOutingInvites } from "../src/lib/marketplace/outing-invites";
import {
  applyOutingInviteToTrip,
  cancelRideFriend,
  listRideFriendCandidates,
  occupancyForCurrentTrip,
  respondToRideFriendInvite,
  sendRideFriendInvite,
} from "../src/lib/mobility/ride-companions";
import {
  canAddFriend,
  occupancyForCategory,
  occupancyForTrip,
  rideOccupancy,
  seatsForTrip,
} from "../src/lib/mobility/ride-occupancy";
import { createStop } from "../src/lib/mobility/route-utils";
import { createTrip, getTrip, patchTrip, resetTrip } from "../src/lib/mobility/trip/trip-store";

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

function installBrowser() {
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

function planningTrip() {
  return createTrip({ origin: DEMO_ORIGIN, destination: DEST, userId: FROM });
}

beforeEach(() => {
  installBrowser();
  resetTrip();
});

describe("capacidade dinâmica de pegar amigo", () => {
  test("usuário sozinho conta como 1 e libera as demais vagas do veículo", () => {
    const occupancy = rideOccupancy(4, []);
    expect(occupancy.requester).toBe(1);
    expect(occupancy.occupied).toBe(1);
    expect(occupancy.available).toBe(3);
    expect(occupancy.passengerLabel).toBe("Você");
    expect(occupancy.vacancyLabel).toBe("3 vagas disponíveis");
    expect(occupancy.atLimit).toBe(false);
  });

  test("usuário + 1 amigo reserva uma vaga", () => {
    const occupancy = rideOccupancy(4, ["beatriz"]);
    expect(occupancy.friends).toBe(1);
    expect(occupancy.available).toBe(2);
    expect(occupancy.passengerLabel).toBe("Você + 1 amigo");
  });

  test("usuário + múltiplos amigos atualiza ocupação e rótulos", () => {
    const occupancy = rideOccupancy(4, ["beatriz", "rafael"]);
    expect(occupancy.occupied).toBe(3);
    expect(occupancy.available).toBe(1);
    expect(occupancy.vacancyLabel).toBe("Última vaga disponível");
    expect(occupancy.passengerLabel).toBe("Você + 2 amigos");
  });

  test("limite exato de capacidade", () => {
    const occupancy = rideOccupancy(4, ["beatriz", "rafael", "juliana"]);
    expect(occupancy.available).toBe(0);
    expect(occupancy.atLimit).toBe(true);
    expect(occupancy.vacancyLabel).toBe("Capacidade máxima atingida");
  });

  test("não permite adicionar acima da capacidade", () => {
    const reserved = ["beatriz", "rafael", "juliana"];
    const occupancy = rideOccupancy(4, reserved);
    expect(canAddFriend(occupancy, "carlos", reserved)).toBe(false);
    const trip = planningTrip();
    expect(sendRideFriendInvite({ trip, fromUserId: FROM, friendId: "beatriz" })).not.toBeNull();
    expect(sendRideFriendInvite({ trip, fromUserId: FROM, friendId: "rafael" })).not.toBeNull();
    expect(sendRideFriendInvite({ trip, fromUserId: FROM, friendId: "juliana" })).not.toBeNull();
    expect(sendRideFriendInvite({ trip, fromUserId: FROM, friendId: "carlos" })).toBeNull();
  });

  test("capacidade muda conforme categoria e veículo, sem hardcode 4", () => {
    expect(seatsForRideCategory("moto")).toBe(1);
    expect(seatsForRideCategory("connexy")).toBe(4);
    expect(occupancyForCategory("moto", []).available).toBe(0);
    expect(occupancyForCategory("connexy", []).available).toBe(3);
    const trip = planningTrip();
    patchTrip({
      category: "moto",
      driver: { ...MOCK_DRIVER, vehicle: { ...MOCK_DRIVER.vehicle, seats: 1 } },
    });
    const moto = getTrip();
    expect(moto).not.toBeNull();
    expect(seatsForTrip(moto!)).toBe(1);
    expect(occupancyForCurrentTrip(moto!, FROM).atLimit).toBe(true);
    expect(sendRideFriendInvite({ trip: moto!, fromUserId: FROM, friendId: "beatriz" })).toBeNull();
  });

  test("o veículo do motorista prevalece sobre a categoria e libera mais vagas", () => {
    const trip = planningTrip();
    patchTrip({ driver: { ...MOCK_DRIVER, vehicle: { ...MOCK_DRIVER.vehicle, seats: 6 } } });
    const large = getTrip()!;
    expect(seatsForTrip(large)).toBe(6);
    expect(occupancyForCurrentTrip(large, FROM).available).toBe(5);
    const invite = sendRideFriendInvite({ trip: large, fromUserId: FROM, friendId: "beatriz" });
    respondToRideFriendInvite(invite!.id, "beatriz", true);
    expect(occupancyForCurrentTrip(getTrip()!, FROM).available).toBe(4);
  });

  test("várias solicitações pendentes nunca ultrapassam a capacidade", () => {
    const trip = planningTrip();
    const invited = ["beatriz", "rafael", "juliana"] as const;
    const pending = invited.map((friendId) =>
      sendRideFriendInvite({ trip: getTrip() ?? trip, fromUserId: FROM, friendId }),
    );
    const occupancy = occupancyForCurrentTrip(getTrip()!, FROM);
    expect(occupancy.friends).toBe(invited.length);
    expect(occupancy.occupied).toBe(1 + invited.length);
    expect(occupancy.available).toBe(0);
    expect(canAddFriend(occupancy, "carlos", invited)).toBe(false);
    expect(
      sendRideFriendInvite({ trip: getTrip()!, fromUserId: FROM, friendId: "carlos" }),
    ).toBeNull();
    expect(respondToRideFriendInvite(pending[1]!.id, "rafael", false)?.status).toBe(
      OutingInviteStatus.DECLINED,
    );
    expect(occupancyForCurrentTrip(getTrip()!, FROM).available).toBe(1);
    expect(
      sendRideFriendInvite({ trip: getTrip()!, fromUserId: FROM, friendId: "carlos" }),
    ).not.toBeNull();
  });

  test("capacidade zero bloqueia qualquer amigo e o rótulo informa o limite", () => {
    const occupancy = occupancyForTrip({ category: "moto", driver: null }, []);
    expect(occupancy.capacity).toBe(1);
    expect(occupancy.occupied).toBe(1);
    expect(occupancy.available).toBe(0);
    expect(occupancy.atLimit).toBe(true);
    expect(occupancy.vacancyLabel).toBe("Capacidade máxima atingida");
    expect(canAddFriend(occupancy, "beatriz", [])).toBe(false);
  });
});

describe("convites de amigos na mesma corrida", () => {
  test("amigo recusando não entra, não vira parada e libera a vaga", () => {
    const trip = planningTrip();
    const invite = sendRideFriendInvite({ trip, fromUserId: FROM, friendId: "beatriz" });
    expect(invite?.status).toBe(OutingInviteStatus.PENDING);
    expect(occupancyForCurrentTrip(getTrip()!, FROM).available).toBe(2);
    const declined = respondToRideFriendInvite(invite!.id, "beatriz", false);
    expect(declined?.status).toBe(OutingInviteStatus.DECLINED);
    expect(getTrip()?.stops).toHaveLength(0);
    expect(occupancyForCurrentTrip(getTrip()!, FROM).available).toBe(3);
  });

  test("solicitação pendente reserva vaga", () => {
    const trip = planningTrip();
    sendRideFriendInvite({ trip, fromUserId: FROM, friendId: "beatriz" });
    sendRideFriendInvite({ trip, fromUserId: FROM, friendId: "rafael" });
    const occupancy = occupancyForCurrentTrip(getTrip()!, FROM);
    expect(occupancy.friends).toBe(2);
    expect(occupancy.available).toBe(1);
    expect(listRideFriendCandidates(FROM, getTrip()!).map((item) => item.id)).not.toContain(
      "beatriz",
    );
    expect(listRideFriendCandidates(FROM, getTrip()!).map((item) => item.id)).not.toContain(
      "rafael",
    );
  });

  test("amigo aceitando vira parada, recalcula rota e valor", () => {
    const trip = planningTrip();
    const beforeDistance = trip.distanceMeters;
    const beforeFare = estimateDemoFare(
      trip.category,
      trip.distanceMeters,
      trip.durationMinutes,
      trip.stops.length,
    );
    const invite = sendRideFriendInvite({ trip, fromUserId: FROM, friendId: "beatriz" });
    const accepted = respondToRideFriendInvite(invite!.id, "beatriz", true);
    expect(accepted?.status).toBe(OutingInviteStatus.ACCEPTED);
    const next = getTrip()!;
    expect(next.id).toBe(trip.id);
    expect(next.stops).toHaveLength(1);
    expect(next.stops[0]?.companionId).toBe("beatriz");
    expect(next.distanceMeters).not.toBe(beforeDistance);
    expect(next.estimatedFare).not.toBe(beforeFare);
    expect(next.estimatedFare).toBe(
      estimateDemoFare(next.category, next.distanceMeters, next.durationMinutes, next.stops.length),
    );
  });

  test("múltiplos amigos viram múltiplas paradas na mesma corrida", () => {
    const trip = planningTrip();
    for (const friendId of ["beatriz", "rafael", "juliana"] as const) {
      const invite = sendRideFriendInvite({ trip: getTrip() ?? trip, fromUserId: FROM, friendId });
      respondToRideFriendInvite(invite!.id, friendId, true);
    }
    const next = getTrip()!;
    expect(next.id).toBe(trip.id);
    expect(next.stops).toHaveLength(3);
    expect(next.stops.map((stop) => stop.companionId).sort()).toEqual(
      ["beatriz", "juliana", "rafael"].sort(),
    );
    expect(occupancyForCurrentTrip(next, FROM).atLimit).toBe(true);
    expect(sendRideFriendInvite({ trip: next, fromUserId: FROM, friendId: "carlos" })).toBeNull();
  });

  test("mesmo amigo não aparece nem pode ser convidado de novo", () => {
    const trip = planningTrip();
    const invite = sendRideFriendInvite({ trip, fromUserId: FROM, friendId: "beatriz" });
    expect(sendRideFriendInvite({ trip, fromUserId: FROM, friendId: "beatriz" })).toBeNull();
    respondToRideFriendInvite(invite!.id, "beatriz", true);
    expect(listRideFriendCandidates(FROM, getTrip()!).map((item) => item.id)).not.toContain(
      "beatriz",
    );
    expect(
      sendRideFriendInvite({ trip: getTrip()!, fromUserId: FROM, friendId: "beatriz" }),
    ).toBeNull();
  });

  test("cancelamento libera vaga, remove só aquela parada e recalcula", () => {
    const trip = planningTrip();
    const first = sendRideFriendInvite({ trip, fromUserId: FROM, friendId: "beatriz" });
    const second = sendRideFriendInvite({ trip, fromUserId: FROM, friendId: "rafael" });
    respondToRideFriendInvite(first!.id, "beatriz", true);
    respondToRideFriendInvite(second!.id, "rafael", true);
    const withTwo = getTrip()!;
    expect(withTwo.stops).toHaveLength(2);
    const fareWithTwo = withTwo.estimatedFare;
    cancelRideFriend(first!.id, FROM);
    const next = getTrip()!;
    expect(next.stops.map((stop) => stop.companionId)).toEqual(["rafael"]);
    expect(occupancyForCurrentTrip(next, FROM).friends).toBe(1);
    expect(next.estimatedFare).not.toBe(fareWithTwo);
    expect(next.destination?.label).toBe(DEST.label);
  });

  test("amigo pode ser o destino final sem parada redundante", () => {
    const trip = planningTrip();
    const beforeOccupied = occupancyForCurrentTrip(trip, FROM).occupied;
    const invite = sendRideFriendInvite({
      trip,
      fromUserId: FROM,
      friendId: "beatriz",
      asDestination: true,
    });
    expect(occupancyForCurrentTrip(getTrip()!, FROM).occupied).toBe(beforeOccupied);
    respondToRideFriendInvite(invite!.id, "beatriz", true);
    const next = getTrip()!;
    expect(next.stops).toHaveLength(0);
    expect(next.destination?.address).toContain("Augusta");
    expect(next.id).toBe(trip.id);
    expect(occupancyForCurrentTrip(next, FROM).occupied).toBe(beforeOccupied);
    expect(occupancyForCurrentTrip(next, FROM).friends).toBe(0);
  });

  test("recalcula rota e valor após cada novo amigo", () => {
    const trip = planningTrip();
    const fares: number[] = [];
    const distances: number[] = [];
    for (const friendId of ["beatriz", "rafael"] as const) {
      const invite = sendRideFriendInvite({ trip: getTrip() ?? trip, fromUserId: FROM, friendId });
      respondToRideFriendInvite(invite!.id, friendId, true);
      const next = getTrip()!;
      fares.push(next.estimatedFare);
      distances.push(next.distanceMeters);
    }
    expect(fares[1]).not.toBe(fares[0]);
    expect(distances[1]).not.toBe(distances[0]);
    expect(listOutingInvites().every((invite) => invite.tripId === trip.id)).toBe(true);
  });

  test("pegar amigo durante a corrida continua na mesma trip", () => {
    const trip = planningTrip();
    patchTrip({
      status: "emviagem",
      driver: MOCK_DRIVER,
      startedAt: new Date().toISOString(),
    });
    const invite = sendRideFriendInvite({
      trip: getTrip()!,
      fromUserId: FROM,
      friendId: "beatriz",
    });
    respondToRideFriendInvite(invite!.id, "beatriz", true);
    const next = getTrip()!;
    expect(next.id).toBe(trip.id);
    expect(next.status).toBe("emviagem");
    expect(next.stops).toHaveLength(1);
    expect(next.driver?.id).toBe(MOCK_DRIVER.id);
  });

  test("applyOutingInviteToTrip ignora convite de outra corrida", () => {
    planningTrip();
    const other = {
      id: "outing-other",
      targetId: "x",
      personId: "beatriz",
      fromUserId: FROM,
      message: "",
      status: OutingInviteStatus.ACCEPTED,
      createdAt: Date.now(),
      tripId: "outra-corrida",
    } as const;
    const before = getTrip()!;
    applyOutingInviteToTrip(other);
    expect(getTrip()?.stops).toEqual(before.stops);
  });

  test("paradas já percorridas não voltam atrás quando um amigo entra na viagem", () => {
    const visitedStop = createStop(
      { lat: -23.468, lng: -46.601, label: "Av. Interlagos", address: "Av. Interlagos" },
      "Parada 1 — já percorrida",
      1,
    );
    createTrip({ origin: DEMO_ORIGIN, destination: DEST, stops: [visitedStop], userId: FROM });
    patchTrip({ status: "emviagem", driver: MOCK_DRIVER, currentStopIndex: 1 });
    const invite = sendRideFriendInvite({
      trip: getTrip()!,
      fromUserId: FROM,
      friendId: "beatriz",
    });
    respondToRideFriendInvite(invite!.id, "beatriz", true);
    const next = getTrip()!;
    expect(next.stops.map((stop) => stop.order)).toEqual([1, 2]);
    expect(next.stops[0]?.label).toBe("Parada 1 — já percorrida");
    expect(next.stops[1]?.companionId).toBe("beatriz");
    expect(next.currentStopIndex).toBe(1);
  });

  test("a corrida continua e recarrega rota e valor a cada embarque durante a viagem", () => {
    createTrip({ origin: DEMO_ORIGIN, destination: DEST, userId: FROM });
    patchTrip({ status: "emviagem", driver: MOCK_DRIVER, startedAt: new Date().toISOString() });
    const tripId = getTrip()!.id;
    const fares: number[] = [];
    for (const friendId of ["beatriz", "rafael"] as const) {
      const invite = sendRideFriendInvite({ trip: getTrip()!, fromUserId: FROM, friendId });
      expect(invite).not.toBeNull();
      respondToRideFriendInvite(invite!.id, friendId, true);
      const next = getTrip()!;
      expect(next.id).toBe(tripId);
      expect(next.status).toBe("emviagem");
      expect(next.driver?.id).toBe(MOCK_DRIVER.id);
      fares.push(next.estimatedFare);
    }
    expect(getTrip()!.stops).toHaveLength(2);
    expect(fares[1]).toBeGreaterThan(fares[0]);
    expect(occupancyForCurrentTrip(getTrip()!, FROM).available).toBe(1);
    expect(listRideFriendCandidates(FROM, getTrip()!).length).toBeGreaterThan(0);
  });

  test("recusa durante a viagem mantém a corrida e devolve o amigo à lista", () => {
    createTrip({ origin: DEMO_ORIGIN, destination: DEST, userId: FROM });
    patchTrip({ status: "emviagem", driver: MOCK_DRIVER });
    const invite = sendRideFriendInvite({
      trip: getTrip()!,
      fromUserId: FROM,
      friendId: "beatriz",
    });
    respondToRideFriendInvite(invite!.id, "beatriz", false);
    const next = getTrip()!;
    expect(next.status).toBe("emviagem");
    expect(next.stops).toHaveLength(0);
    expect(occupancyForCurrentTrip(next, FROM).available).toBe(3);
    expect(listRideFriendCandidates(FROM, next).map((item) => item.id)).toContain("beatriz");
  });
});

describe("interface de pegar vários amigos", () => {
  test("fluxo e painel ativo expõem Pegar amigo limitado pela ocupação", async () => {
    const flow = await readFile(
      join(projectRoot, "src/components/mobility/ride/ride-flow.tsx"),
      "utf8",
    );
    const itinerary = await readFile(
      join(projectRoot, "src/components/mobility/ride/ride-itinerary.tsx"),
      "utf8",
    );
    const overlays = await readFile(
      join(projectRoot, "src/components/mobility/ride/ride-overlays.tsx"),
      "utf8",
    );
    const occupancy = await readFile(
      join(projectRoot, "src/lib/mobility/ride-occupancy.ts"),
      "utf8",
    );
    const live = await readFile(
      join(projectRoot, "src/components/mobility/ride/ride-live-panels.tsx"),
      "utf8",
    );

    expect(flow).toContain("handleOpenPickFriend");
    expect(flow).toContain("onPickFriend={handleOpenPickFriend}");
    expect(flow).not.toContain("pickFriendDisabled={!canPickFriend}");
    expect(flow).toContain("PickFriendOverlay");
    expect(flow).toContain("occupancyForCurrentTrip");
    expect(itinerary).toContain("Pegar amigo");
    expect(overlays).toContain("Capacidade máxima atingida");
    expect(overlays).toContain("Usar como destino final");
    expect(overlays).toContain("destinationOnly={stopLimitReached || occupancy.atLimit}");
    expect(occupancy).not.toContain("capacity = 4");
    expect(occupancy).toContain("seatsForRideCategory");
    expect(occupancy).toContain("trip.driver?.vehicle.seats");
    expect(live).toContain("Pegar amigo");
    expect(live).toContain("Durante a viagem");
  });
});

describe("destino final não ocupa capacidade", () => {
  test("moto lotada ainda permite destino final e bloqueia passageiro", () => {
    const trip = planningTrip();
    patchTrip({
      category: "moto",
      driver: { ...MOCK_DRIVER, vehicle: { ...MOCK_DRIVER.vehicle, seats: 1 } },
    });
    const moto = getTrip()!;
    expect(occupancyForCurrentTrip(moto, FROM).available).toBe(0);
    expect(occupancyForCurrentTrip(moto, FROM).occupied).toBe(1);
    expect(sendRideFriendInvite({ trip: moto, fromUserId: FROM, friendId: "beatriz" })).toBeNull();
    const invite = sendRideFriendInvite({
      trip: moto,
      fromUserId: FROM,
      friendId: "beatriz",
      asDestination: true,
    });
    expect(invite).not.toBeNull();
    expect(invite?.asDestination).toBe(true);
    expect(occupancyForCurrentTrip(getTrip()!, FROM).occupied).toBe(1);
    expect(occupancyForCurrentTrip(getTrip()!, FROM).available).toBe(0);
    expect(occupancyForCurrentTrip(getTrip()!, FROM).friends).toBe(0);
  });

  test("PENDING de destino final não reserva vaga", () => {
    const trip = planningTrip();
    const before = occupancyForCurrentTrip(trip, FROM);
    const invite = sendRideFriendInvite({
      trip,
      fromUserId: FROM,
      friendId: "beatriz",
      asDestination: true,
    });
    expect(invite?.status).toBe(OutingInviteStatus.PENDING);
    const pending = occupancyForCurrentTrip(getTrip()!, FROM);
    expect(pending.occupied).toBe(before.occupied);
    expect(pending.available).toBe(before.available);
    expect(pending.friends).toBe(0);
  });

  test("ACCEPTED de destino final não reserva vaga, não cria parada e refaz rota e tarifa", () => {
    const trip = planningTrip();
    const beforeDistance = trip.distanceMeters;
    const beforeFare = estimateDemoFare(
      trip.category,
      trip.distanceMeters,
      trip.durationMinutes,
      trip.stops.length,
    );
    const invite = sendRideFriendInvite({
      trip,
      fromUserId: FROM,
      friendId: "beatriz",
      asDestination: true,
    });
    respondToRideFriendInvite(invite!.id, "beatriz", true);
    const next = getTrip()!;
    expect(next.stops).toHaveLength(0);
    expect(next.destination?.address).toContain("Augusta");
    expect(next.distanceMeters).not.toBe(beforeDistance);
    expect(next.estimatedFare).not.toBe(beforeFare);
    expect(next.estimatedFare).toBe(
      estimateDemoFare(next.category, next.distanceMeters, next.durationMinutes, next.stops.length),
    );
    const occupancy = occupancyForCurrentTrip(next, FROM);
    expect(occupancy.occupied).toBe(1);
    expect(occupancy.friends).toBe(0);
    expect(occupancy.available).toBe(3);
  });

  test("DECLINED de destino final não ocupa vaga", () => {
    const trip = planningTrip();
    const invite = sendRideFriendInvite({
      trip,
      fromUserId: FROM,
      friendId: "beatriz",
      asDestination: true,
    });
    respondToRideFriendInvite(invite!.id, "beatriz", false);
    const next = getTrip()!;
    expect(next.stops).toHaveLength(0);
    expect(next.destination?.label).toBe(DEST.label);
    expect(occupancyForCurrentTrip(next, FROM).occupied).toBe(1);
    expect(occupancyForCurrentTrip(next, FROM).available).toBe(3);
    expect(listRideFriendCandidates(FROM, next).map((item) => item.id)).toContain("beatriz");
  });

  test("novo destino final substitui o anterior sem consumir assento", () => {
    const trip = planningTrip();
    const first = sendRideFriendInvite({
      trip,
      fromUserId: FROM,
      friendId: "beatriz",
      asDestination: true,
    });
    respondToRideFriendInvite(first!.id, "beatriz", true);
    const afterFirst = getTrip()!;
    const second = sendRideFriendInvite({
      trip: afterFirst,
      fromUserId: FROM,
      friendId: "rafael",
      asDestination: true,
    });
    expect(second).not.toBeNull();
    respondToRideFriendInvite(second!.id, "rafael", true);
    const next = getTrip()!;
    expect(next.id).toBe(trip.id);
    expect(next.stops).toHaveLength(0);
    expect(next.destination?.address).not.toContain("Augusta");
    expect(occupancyForCurrentTrip(next, FROM).occupied).toBe(1);
    expect(occupancyForCurrentTrip(next, FROM).friends).toBe(0);
  });
});
