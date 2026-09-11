import { describe, expect, test } from "bun:test";
import { recoverPersistedTripState, sanitizeTrip } from "../src/lib/mobility/trip/trip-store";
import { isTerminal } from "../src/lib/mobility/trip/trip-machine";
import { tripPaymentStatus } from "../src/lib/mobility/payment";
import type { Trip, TripDriver, TripStatus } from "../src/lib/mobility/trip/trip-types";

const driver: TripDriver = {
  id: "driver-1",
  name: "Motorista Demo",
  rating: 4.9,
  totalRides: 100,
  photo: "",
  vehicle: { name: "Connexy", color: "Prata", plate: "ABC1D23", seats: 4 },
  boardingCode: "1234",
  verified: true,
};

function makeTrip(status: TripStatus, patch: Partial<Trip> = {}): Trip {
  return {
    id: `trip-${status}`,
    status,
    origin: { lat: -23.55, lng: -46.64, label: "Origem" },
    destination: { lat: -23.56, lng: -46.65, label: "Destino" },
    stops: [],
    pickupLabel: "Entrada principal",
    pickupPoint: "Entrada principal",
    category: "connexy",
    paymentMethod: "dinheiro",
    driver,
    distanceMeters: 2500,
    durationMinutes: 12,
    estimatedFare: 18.5,
    finalFare: 19,
    paymentConfirmed: false,
    userId: "passenger-1",
    currentStopIndex: 0,
    rating: null,
    createdAt: "2026-09-11T12:00:00.000Z",
    startedAt: null,
    completedAt: null,
    cancelledAt: null,
    ...patch,
  };
}

describe("Phase 1A persisted trip recovery", () => {
  test.each(["conclusao", "cancelada"] as const)(
    "preserves terminal state %s after reload",
    (status) => {
      const trip = makeTrip(status);
      expect(sanitizeTrip(trip)).toEqual(trip);
      expect(isTerminal(status)).toBe(true);
    },
  );

  test("restores a legitimate active trip without changing payment data", () => {
    const trip = makeTrip("buscando", {
      driver: null,
      paymentMethod: "pix",
      paymentConfirmed: false,
    });

    expect(sanitizeTrip(trip)).toEqual(trip);
  });

  test("restores a legitimate in-progress trip with driver", () => {
    const trip = makeTrip("emviagem", { paymentMethod: "dinheiro" });
    expect(sanitizeTrip(trip)).toEqual(trip);
  });

  test("recovers an invalid transient trip without changing history", () => {
    const staleTrip = makeTrip("emviagem", { driver: null });
    const history = [
      makeTrip("conclusao", {
        paymentMethod: "pix",
        paymentConfirmed: true,
      }),
    ];

    const recovered = recoverPersistedTripState({ trip: staleTrip, history });

    expect(recovered.trip).toBeNull();
    expect(recovered.history).toEqual(history);
    expect(recoverPersistedTripState(recovered)).toEqual(recovered);
  });

  test("allows a new request after a terminal trip remains terminal", () => {
    const completed = makeTrip("conclusao", { paymentConfirmed: true, paymentMethod: "pix" });
    const recovered = recoverPersistedTripState({ trip: completed, history: [completed] });

    expect(recovered.trip?.status).toBe("conclusao");
    expect(isTerminal(recovered.trip!.status)).toBe(true);
  });

  test("preserves explicit nonpayment semantics during valid recovery", () => {
    const unpaid = makeTrip("chegada", {
      paymentConfirmed: false,
      paymentIssue: "user_not_paid",
    });

    expect(sanitizeTrip(unpaid)).toEqual(unpaid);
    expect(tripPaymentStatus(unpaid)).toBe("unpaid");
  });

  test("does not treat paymentConfirmed=false as nonpayment", () => {
    const pending = makeTrip("chegada", {
      paymentConfirmed: false,
      paymentMethod: "pix",
    });

    expect(sanitizeTrip(pending)).toEqual(pending);
    expect(tripPaymentStatus(pending)).toBe("pending");
    expect(pending.paymentIssue).toBeUndefined();
  });

  test("preserves PIX, cash, fare and confirmation across recovery", () => {
    const pixPaid = makeTrip("conclusao", {
      paymentMethod: "pix",
      paymentConfirmed: true,
      finalFare: 22.4,
    });
    const cashPending = makeTrip("chegada", {
      paymentMethod: "dinheiro",
      paymentConfirmed: false,
      finalFare: 18.5,
    });

    expect(sanitizeTrip(pixPaid)?.paymentMethod).toBe("pix");
    expect(sanitizeTrip(pixPaid)?.paymentConfirmed).toBe(true);
    expect(sanitizeTrip(pixPaid)?.finalFare).toBe(22.4);
    expect(sanitizeTrip(cashPending)?.paymentMethod).toBe("dinheiro");
    expect(sanitizeTrip(cashPending)?.paymentConfirmed).toBe(false);
    expect(tripPaymentStatus(cashPending)).toBe("pending");
  });
});
