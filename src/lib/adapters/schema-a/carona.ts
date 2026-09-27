import type { CaronaOffer, CaronaRequest } from "@/lib/carona/carona-store";
import type { CaronaOfferRow, CaronaRequestRow } from "@/integrations/supabase/remote/types";
import type { Database } from "../../../../supabase/schema-a.generated.ts";
import { AdapterMappingCode, AdapterMappingError } from "./errors";
import {
  epochMsToIso,
  fromRemoteTime,
  isoToEpochMs,
  optionalSchemaAUuid,
  requireSchemaAUuid,
  toRemoteTime,
} from "./ids";

type OfferInsert = Database["public"]["Tables"]["carona_offers"]["Insert"];
type RequestInsert = Database["public"]["Tables"]["carona_requests"]["Insert"];

export function toRemoteCaronaOfferInsert(offer: CaronaOffer, ownerId: string): OfferInsert {
  if (!ownerId) {
    throw new AdapterMappingError(
      "Carona owner is required",
      AdapterMappingCode.MISSING_OWNER,
      "carona_offers.owner_id",
    );
  }
  return {
    owner_id: requireSchemaAUuid(ownerId, "carona_offers.owner_id"),
    origin: offer.origin,
    destination: offer.destination,
    meetup: offer.meetup,
    ride_date: offer.date,
    ride_time: toRemoteTime(offer.time),
    available_seats: offer.availableSeats,
    status: offer.status,
  };
}

export function toDomainCaronaOffer(row: CaronaOfferRow): CaronaOffer {
  return {
    id: row.id,
    ownerId: row.owner_id,
    origin: row.origin,
    destination: row.destination,
    meetup: row.meetup,
    date: row.ride_date,
    time: fromRemoteTime(row.ride_time),
    availableSeats: row.available_seats,
    status: row.status as CaronaOffer["status"],
    createdAt: isoToEpochMs(row.created_at),
  };
}

export function toRemoteCaronaRequestInsert(
  request: CaronaRequest,
  requesterId: string,
): RequestInsert {
  return {
    ride_offer_id: requireSchemaAUuid(request.rideOfferId, "carona_requests.ride_offer_id"),
    requester_id: requireSchemaAUuid(requesterId, "carona_requests.requester_id"),
    status: request.status,
    conversation_id: optionalSchemaAUuid(request.conversationId ?? null),
  };
}

export function toDomainCaronaRequest(row: CaronaRequestRow): CaronaRequest {
  return {
    id: row.id,
    rideOfferId: row.ride_offer_id,
    requesterId: row.requester_id,
    status: row.status as CaronaRequest["status"],
    createdAt: isoToEpochMs(row.created_at),
    conversationId: row.conversation_id ?? undefined,
  };
}

export function epochCreatedAtIso(value: number): string {
  return epochMsToIso(value);
}
