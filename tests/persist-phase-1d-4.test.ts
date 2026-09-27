import { describe, expect, test } from "bun:test";
import {
  MAX_ROUTE_STOPS,
  addStop,
  buildRoutePoints,
  createStop,
  removeStop,
  reorderStops,
} from "../src/lib/mobility/route-utils";
import { buildCompanionStops, parseCompanions } from "../src/lib/mobility/ride-search";
import { PAYMENT_METHOD_LABELS, tripPaymentStatus } from "../src/lib/mobility/payment";
import {
  TRIP_TRANSITIONS,
  canComplete,
  canTransition,
  isTerminal,
} from "../src/lib/mobility/trip/trip-machine";
import type { Trip } from "../src/lib/mobility/trip/trip-types";

const origin = { lat: -23.55, lng: -46.64, label: "Origem" };
const destination = { lat: -23.58, lng: -46.67, label: "Destino" };

function trip(patch: Partial<Trip> = {}): Trip {
  return {
    id: "trip-1d-4",
    status: "chegada",
    origin,
    destination,
    stops: [],
    pickupLabel: "Entrada principal",
    pickupPoint: "Entrada principal",
    category: "connexy",
    paymentMethod: "pix",
    driver: null,
    distanceMeters: 4000,
    durationMinutes: 20,
    estimatedFare: 25,
    finalFare: null,
    paymentConfirmed: false,
    userId: "lucas",
    currentStopIndex: 0,
    rating: null,
    createdAt: "2026-09-17T03:00:00.000Z",
    startedAt: null,
    completedAt: null,
    cancelledAt: null,
    ...patch,
  };
}

describe("Fase 1D-4 — máquina canônica de Trip", () => {
  test("preserva a sequência existente e rejeita atalhos inválidos", () => {
    expect(canTransition("solicitar", "rota")).toBe(true);
    expect(canTransition("categoria", "buscando")).toBe(true);
    expect(canTransition("buscando", "encontrado")).toBe(true);
    expect(canTransition("chegou", "emviagem")).toBe(true);
    expect(canTransition("emviagem", "parada")).toBe(true);
    expect(canTransition("emviagem", "chegada")).toBe(true);
    expect(canTransition("chegada", "avaliacao")).toBe(true);
    expect(canTransition("avaliacao", "conclusao")).toBe(true);
    expect(canTransition("chegada", "conclusao")).toBe(false);
    expect(canComplete("chegada")).toBe(false);
    expect(canComplete("avaliacao")).toBe(true);
    expect(isTerminal("conclusao")).toBe(true);
    expect(isTerminal("cancelada")).toBe(true);
    expect(Object.keys(TRIP_TRANSITIONS)).toHaveLength(14);
  });
});

describe("Fase 1D-4 — paradas", () => {
  test("aceita zero, uma, duas e três paradas e bloqueia a quarta", () => {
    let stops = [] as ReturnType<typeof addStop>;
    expect(stops).toHaveLength(0);
    stops = addStop(stops, { ...origin, label: "Parada 1" }, "Parada 1");
    expect(stops.map((stop) => stop.order)).toEqual([1]);
    stops = addStop(stops, { ...origin, label: "Parada 2" }, "Parada 2");
    expect(stops.map((stop) => stop.order)).toEqual([1, 2]);
    stops = addStop(stops, { ...origin, label: "Parada 3" }, "Parada 3");
    expect(stops.map((stop) => stop.order)).toEqual([1, 2, 3]);
    const same = addStop(stops, { ...origin, label: "Parada 4" }, "Parada 4");
    expect(same).toBe(stops);
    expect(same).toHaveLength(MAX_ROUTE_STOPS);
  });

  test("remoção, reordenação e rota preservam a ordem", () => {
    const stops = ["A", "B", "C"].map((label, index) =>
      createStop({ lat: -23.551 - index / 1000, lng: -46.641, label }, label, index + 1),
    );
    const removed = removeStop(stops, stops[1].id);
    expect(removed.map((stop) => stop.label)).toEqual(["A", "C"]);
    expect(removed.map((stop) => stop.order)).toEqual([1, 2]);
    const reordered = reorderStops(stops, 2, 0);
    expect(reordered.map((stop) => stop.label)).toEqual(["C", "A", "B"]);
    expect(reordered.map((stop) => stop.order)).toEqual([1, 2, 3]);
    expect(buildRoutePoints(origin, destination, reordered).map((point) => point.label)).toEqual([
      "Origem",
      "C",
      "A",
      "B",
      "Destino",
    ]);
  });

  test("Ir junto usa a mesma estrutura e respeita o limite", () => {
    const companions = parseCompanions(
      JSON.stringify(
        ["Ana", "Bia", "Caio", "Duda"].map((name, index) => ({
          id: `friend-${index}`,
          name,
          address: `Endereço ${index + 1}`,
          lat: -23.551 - index / 1000,
          lng: -46.641,
        })),
      ),
    );
    const stops = buildCompanionStops(origin, companions);
    expect(companions).toHaveLength(4);
    expect(stops).toHaveLength(3);
    expect(stops.map((stop) => stop.order)).toEqual([1, 2, 3]);
    expect(stops.every((stop) => stop.id.startsWith("stop-"))).toBe(true);
  });
});

describe("Fase 1D-4 — pagamento manual", () => {
  test("mantém somente Dinheiro e Pix e separa método de confirmação", () => {
    expect(PAYMENT_METHOD_LABELS).toEqual({ pix: "PIX", dinheiro: "Dinheiro" });
    expect(tripPaymentStatus(trip({ paymentMethod: "dinheiro" }))).toBe("pending");
    expect(tripPaymentStatus(trip({ paymentMethod: "pix", paymentConfirmed: true }))).toBe("paid");
    expect(
      tripPaymentStatus(
        trip({
          paymentMethod: "dinheiro",
          paymentConfirmed: false,
          paymentIssue: "user_not_paid",
        }),
      ),
    ).toBe("unpaid");
  });
});
