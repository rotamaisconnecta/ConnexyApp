import { demoStorageKey } from "@/lib/demo/demo-config";
import { getDemoIdentity } from "@/lib/demo/demo-identity";

export const RESERVATIONS_STORAGE_KEY = demoStorageKey("reservations");
export const RESERVATIONS_EVENT = "connexy:demo:reservations";

export const ReservationStatus = {
  REQUESTED: "requested",
  CONFIRMED: "confirmed",
  CANCELLED: "cancelled",
  COMPLETED: "completed",
} as const;

export type ReservationStatusValue = (typeof ReservationStatus)[keyof typeof ReservationStatus];

export const ReservationResourceType = {
  BUSINESS: "business",
  PLACE: "place",
} as const;

export type ReservationResourceTypeValue =
  (typeof ReservationResourceType)[keyof typeof ReservationResourceType];

export type Reservation = {
  id: string;
  userId: string;
  resourceId: string;
  resourceType: ReservationResourceTypeValue;
  resourceName: string;
  date: string;
  time: string;
  partySize: number;
  status: ReservationStatusValue;
  createdAt: number;
};

export type CreateReservationInput = {
  resourceId: string;
  resourceType: ReservationResourceTypeValue;
  resourceName: string;
  date: string;
  time: string;
  partySize: number;
  userId?: string;
};

function read(): Reservation[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(RESERVATIONS_STORAGE_KEY) ?? "");
    return Array.isArray(parsed) ? parsed.filter(isReservation) : [];
  } catch {
    return [];
  }
}

function isReservation(value: unknown): value is Reservation {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.userId === "string" &&
    typeof record.resourceId === "string" &&
    (record.resourceType === "business" || record.resourceType === "place") &&
    typeof record.resourceName === "string" &&
    typeof record.date === "string" &&
    typeof record.time === "string" &&
    typeof record.partySize === "number" &&
    (record.status === "requested" ||
      record.status === "confirmed" ||
      record.status === "cancelled" ||
      record.status === "completed") &&
    typeof record.createdAt === "number"
  );
}

function write(reservations: Reservation[]): void {
  if (typeof window === "undefined") throw new Error("Não foi possível salvar a reserva.");
  window.localStorage.setItem(RESERVATIONS_STORAGE_KEY, JSON.stringify(reservations));
  window.dispatchEvent(new CustomEvent(RESERVATIONS_EVENT));
}

export function subscribeReservations(listener: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const onCustom = () => listener();
  const onStorage = (event: StorageEvent) => {
    if (event.key === RESERVATIONS_STORAGE_KEY) listener();
  };
  window.addEventListener(RESERVATIONS_EVENT, onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(RESERVATIONS_EVENT, onCustom);
    window.removeEventListener("storage", onStorage);
  };
}

export function listReservations(userId = getDemoIdentity().id): Reservation[] {
  return read()
    .filter((item) => item.userId === userId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function getReservation(id: string, userId = getDemoIdentity().id): Reservation | null {
  return listReservations(userId).find((item) => item.id === id) ?? null;
}

export function createReservation(input: CreateReservationInput): Reservation {
  const userId = input.userId ?? getDemoIdentity().id;
  const partySize = Math.max(1, Math.min(20, Math.round(input.partySize)));
  const reservation: Reservation = {
    id: `reservation-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    userId,
    resourceId: input.resourceId,
    resourceType: input.resourceType,
    resourceName: input.resourceName,
    date: input.date,
    time: input.time,
    partySize,
    status: ReservationStatus.CONFIRMED,
    createdAt: Date.now(),
  };
  write([reservation, ...read()]);
  return reservation;
}

export function cancelReservation(id: string, userId = getDemoIdentity().id): Reservation | null {
  const current = read();
  const index = current.findIndex((item) => item.id === id && item.userId === userId);
  if (index < 0) return null;
  const next = { ...current[index], status: ReservationStatus.CANCELLED };
  current[index] = next;
  write(current);
  return next;
}
