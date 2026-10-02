import type { RideCategory } from "./demo-fare";
import { seatsForRideCategory } from "@/components/mobility/ride/ride-data";
import type { Trip } from "./trip/trip-types";

export type RideOccupancy = {
  capacity: number;
  requester: number;
  friends: number;
  occupied: number;
  available: number;
  atLimit: boolean;
  passengerLabel: string;
  vacancyLabel: string;
};

export function seatsForTrip(trip: Pick<Trip, "category" | "driver">): number {
  const vehicleSeats = trip.driver?.vehicle.seats;
  if (typeof vehicleSeats === "number" && vehicleSeats > 0) return vehicleSeats;
  return seatsForRideCategory(trip.category);
}

export function rideOccupancy(
  capacity: number,
  reservedFriendIds: readonly string[],
  requester = 1,
): RideOccupancy {
  const uniqueFriends = [...new Set(reservedFriendIds.filter(Boolean))];
  const occupied = requester + uniqueFriends.length;
  const available = Math.max(0, capacity - occupied);
  const friends = uniqueFriends.length;
  return {
    capacity,
    requester,
    friends,
    occupied,
    available,
    atLimit: available === 0,
    passengerLabel: friends === 0 ? "Você" : `Você + ${friends} amigo${friends === 1 ? "" : "s"}`,
    vacancyLabel:
      available === 0
        ? "Capacidade máxima atingida"
        : available === 1
          ? "Última vaga disponível"
          : `${available} vagas disponíveis`,
  };
}

export function occupancyForTrip(
  trip: Pick<Trip, "category" | "driver">,
  reservedFriendIds: readonly string[],
): RideOccupancy {
  return rideOccupancy(seatsForTrip(trip), reservedFriendIds);
}

export function occupancyForCategory(
  category: RideCategory,
  reservedFriendIds: readonly string[],
): RideOccupancy {
  return rideOccupancy(seatsForRideCategory(category), reservedFriendIds);
}

export function canAddFriend(
  occupancy: RideOccupancy,
  friendId: string,
  reservedFriendIds: readonly string[],
): boolean {
  if (!friendId) return false;
  if (reservedFriendIds.includes(friendId)) return false;
  return occupancy.available > 0;
}
