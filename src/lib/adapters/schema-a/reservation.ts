import {
  ReservationResourceType,
  ReservationStatus,
  type Reservation,
  type ReservationResourceTypeValue,
  type ReservationStatusValue,
} from "@/lib/reservations/reservation-store";
import type {
  ReservationResourceType as RemoteResourceType,
  ReservationRow,
  ReservationStatus as RemoteStatus,
} from "@/integrations/supabase/remote/types";
import type { Database } from "../../../../supabase/schema-a.generated.ts";
import { AdapterMappingCode, AdapterMappingError } from "./errors";
import {
  epochMsToIso,
  fromRemoteTime,
  isoToEpochMs,
  requireSchemaAUuid,
  toRemoteTime,
} from "./ids";

type ReservationInsert = Database["public"]["Tables"]["reservations"]["Insert"];

export function toRemoteReservationStatus(status: ReservationStatusValue): RemoteStatus {
  if (status === ReservationStatus.REQUESTED) return "pending";
  if (status === ReservationStatus.CONFIRMED) return "confirmed";
  if (status === ReservationStatus.CANCELLED) return "cancelled";
  throw new AdapterMappingError(
    "ReservationStatus.completed is not in Schema A",
    AdapterMappingCode.UNMAPPED_STATUS,
    "status",
  );
}

export function toDomainReservationStatus(status: string): ReservationStatusValue {
  if (status === "pending") return ReservationStatus.REQUESTED;
  if (status === "confirmed") return ReservationStatus.CONFIRMED;
  if (status === "cancelled") return ReservationStatus.CANCELLED;
  throw new AdapterMappingError(
    `Remote reservation status ${status} is not in the local domain`,
    AdapterMappingCode.UNMAPPED_STATUS,
    "status",
  );
}

/**
 * Insert mapping uses Schema A canonical initial status `pending`.
 * Demo auto-confirm (`confirmed` on create) is a local policy, not transported.
 */
export function toRemoteReservationInsert(
  reservation: Reservation,
  userId: string,
): ReservationInsert {
  const resourceType = reservation.resourceType as RemoteResourceType;
  const resourceId = requireSchemaAUuid(reservation.resourceId, "reservations.resource_id");
  return {
    user_id: requireSchemaAUuid(userId, "reservations.user_id"),
    resource_type: resourceType,
    business_id: resourceType === ReservationResourceType.BUSINESS ? resourceId : null,
    place_id: resourceType === ReservationResourceType.PLACE ? resourceId : null,
    resource_name: reservation.resourceName,
    slot_date: reservation.date,
    slot_time: toRemoteTime(reservation.time),
    party_size: reservation.partySize,
    status: "pending",
  };
}

export function toDomainReservation(row: ReservationRow): Reservation {
  const resourceType = row.resource_type as ReservationResourceTypeValue;
  const resourceId =
    resourceType === ReservationResourceType.BUSINESS ? row.business_id : row.place_id;
  if (!resourceId) {
    throw new AdapterMappingError(
      "Reservation row is missing the XOR target id",
      AdapterMappingCode.UNMAPPED_STATUS,
      "resourceId",
    );
  }
  return {
    id: row.id,
    userId: row.user_id,
    resourceId,
    resourceType,
    resourceName: row.resource_name,
    date: row.slot_date,
    time: fromRemoteTime(row.slot_time),
    partySize: row.party_size,
    status: toDomainReservationStatus(row.status),
    createdAt: isoToEpochMs(row.created_at),
  };
}

export function toRemoteReservationStatusUpdate(status: ReservationStatusValue): RemoteStatus {
  return toRemoteReservationStatus(status);
}

export function epochCreatedAtIso(reservation: Reservation): string {
  return epochMsToIso(reservation.createdAt);
}
