import { people } from "@/lib/mock-data";
import { estimateDemoFare } from "./demo-fare";
import {
  OutingInviteStatus,
  cancelOutingInvite,
  listReservedOutingInvites,
  respondToOutingInvite,
  sendOutingInvite,
  type OutingInvite,
} from "@/lib/marketplace/outing-invites";
import { occupancyForTrip, type RideOccupancy } from "./ride-occupancy";
import {
  addStop,
  MAX_ROUTE_STOPS,
  orderStopsForRoute,
  removeStop,
  type RouteStop,
} from "./route-utils";
import { getTrip, patchTrip } from "./trip/trip-store";
import type { Trip } from "./trip/trip-types";
import type { GeoLocation } from "./ride-types";

export type RideFriendCandidate = {
  id: string;
  name: string;
  photo: string;
  address: string;
  lat: number;
  lng: number;
};

function friendLocation(personId: string): RideFriendCandidate | null {
  const person = people.find((item) => item.id === personId);
  if (!person) return null;
  return {
    id: person.id,
    name: person.name,
    photo: person.photo,
    address: person.address ?? person.name,
    lat: person.latitude ?? 0,
    lng: person.longitude ?? 0,
  };
}

export function reservedFriendIdsForTrip(fromUserId: string, tripId: string): string[] {
  return [
    ...new Set(listReservedOutingInvites(fromUserId, tripId).map((invite) => invite.personId)),
  ];
}

export function occupancyForCurrentTrip(trip: Trip, fromUserId: string): RideOccupancy {
  return occupancyForTrip(trip, reservedFriendIdsForTrip(fromUserId, trip.id));
}

export function listRideFriendInvites(fromUserId: string, tripId: string): OutingInvite[] {
  return listReservedOutingInvites(fromUserId, tripId);
}

export function listRideFriendCandidates(fromUserId: string, trip: Trip): RideFriendCandidate[] {
  const reserved = new Set(reservedFriendIdsForTrip(fromUserId, trip.id));
  return people
    .filter((person) => person.id !== fromUserId && !reserved.has(person.id))
    .map((person) => friendLocation(person.id))
    .filter((item): item is RideFriendCandidate => item != null);
}

function companionLabel(friend: RideFriendCandidate): string {
  return `${friend.name.split(" ")[0]} — ${friend.address}`;
}

function companionLocation(friend: RideFriendCandidate): GeoLocation {
  return { lat: friend.lat, lng: friend.lng, label: friend.address, address: friend.address };
}

function fareForTrip(trip: Trip, stops: RouteStop[]): number {
  return estimateDemoFare(trip.category, trip.distanceMeters, trip.durationMinutes, stops.length);
}

/* Reordena as paradas com o mecanismo de rota existente (vizinho mais
   próximo), mas preserva as paradas já percorridas: durante a viagem o
   motorista não pode voltar para trás. O ponto de partida da ordenação
   é a parada que ele já estava seguindo; antes da viagem é a origem. */
function orderCompanionStops(trip: Trip, stops: RouteStop[]): RouteStop[] {
  const visitedCount = Math.min(Math.max(trip.currentStopIndex, 0), stops.length);
  const visited = stops.slice(0, visitedCount);
  const remaining = stops.slice(visitedCount);
  const anchor = remaining[0]?.location ?? visited[visitedCount - 1]?.location ?? trip.origin;
  if (!anchor) return stops;
  return [...visited, ...orderStopsForRoute(anchor, remaining)].map((stop, index) => ({
    ...stop,
    order: index + 1,
  }));
}

export function applyOutingInviteToTrip(invite: OutingInvite): Trip | null {
  const trip = getTrip();
  if (!trip || !invite.tripId || invite.tripId !== trip.id) return trip;
  const friend = friendLocation(invite.personId);
  if (!friend) return trip;

  if (invite.status === OutingInviteStatus.DECLINED) {
    const stop = trip.stops.find((item) => item.companionId === invite.personId);
    if (!stop) return trip;
    const nextStops = removeStop(trip.stops, stop.id);
    const patched = patchTrip({ stops: nextStops });
    if (!patched) return trip;
    return patchTrip({ estimatedFare: fareForTrip(patched, patched.stops) }) ?? patched;
  }

  if (invite.status !== OutingInviteStatus.ACCEPTED) return trip;

  if (invite.asDestination) {
    const patched = patchTrip({ destination: companionLocation(friend) });
    if (!patched) return trip;
    return patchTrip({ estimatedFare: fareForTrip(patched, patched.stops) }) ?? patched;
  }

  if (trip.stops.some((stop) => stop.companionId === invite.personId)) return trip;
  const withStop = addStop(
    trip.stops,
    companionLocation(friend),
    companionLabel(friend),
    friend.id,
  );
  const patched = patchTrip({ stops: orderCompanionStops(trip, withStop) });
  if (!patched) return trip;
  return patchTrip({ estimatedFare: fareForTrip(patched, patched.stops) }) ?? patched;
}

export function sendRideFriendInvite(input: {
  trip: Trip;
  fromUserId: string;
  friendId: string;
  asDestination?: boolean;
}): OutingInvite | null {
  const occupancy = occupancyForCurrentTrip(input.trip, input.fromUserId);
  const reserved = reservedFriendIdsForTrip(input.fromUserId, input.trip.id);
  if (reserved.includes(input.friendId)) return null;
  if (occupancy.available <= 0) return null;
  if (!input.asDestination && input.trip.stops.length >= MAX_ROUTE_STOPS) return null;
  const friend = friendLocation(input.friendId);
  if (!friend) return null;
  const destination = input.trip.destination;
  return sendOutingInvite({
    fromUserId: input.fromUserId,
    toUserId: friend.id,
    tripId: input.trip.id,
    asDestination: input.asDestination === true,
    target: {
      id: destination?.address ?? input.trip.id,
      title: destination?.label ?? "Corrida Connexy",
      address: destination?.address ?? destination?.label,
      latitude: destination?.lat,
      longitude: destination?.lng,
    },
    message: `Vem comigo na corrida? Te pego em ${friend.address}.`,
    stop: { address: friend.address, lat: friend.lat, lng: friend.lng },
  });
}

export function respondToRideFriendInvite(
  inviteId: string,
  actorId: string,
  accepted: boolean,
): OutingInvite | null {
  const updated = respondToOutingInvite(inviteId, actorId, accepted);
  if (updated) applyOutingInviteToTrip(updated);
  return updated;
}

export function cancelRideFriend(inviteId: string, actorId: string): OutingInvite | null {
  const updated = cancelOutingInvite(inviteId, actorId);
  if (updated) applyOutingInviteToTrip(updated);
  return updated;
}

export function cancelRideFriendByPerson(
  fromUserId: string,
  tripId: string,
  personId: string,
): OutingInvite | null {
  const invite = listRideFriendInvites(fromUserId, tripId).find(
    (item) => item.personId === personId,
  );
  if (!invite) return null;
  return cancelRideFriend(invite.id, fromUserId);
}
