import { RideRepository } from "@/repositories/ride.repository";

const VALID_STATUSES = ["pending", "accepted", "in_progress", "completed", "cancelled"] as const;
const MAX_RATING = 5;
const MIN_RATING = 1;

export interface RideOrigin {
  lat: number;
  lng: number;
  address: string;
}

export interface RideDestination {
  lat: number;
  lng: number;
  address: string;
}

export const RideService = {
  async getActiveRide(userId: string) {
    const ride = await RideRepository.getActiveRide(userId);
    return ride;
  },

  async requestRide(userId: string, origin: RideOrigin, destination: RideDestination) {
    if (origin.lat < -90 || origin.lat > 90) {
      throw new Error("Invalid origin latitude");
    }
    if (origin.lng < -180 || origin.lng > 180) {
      throw new Error("Invalid origin longitude");
    }
    if (destination.lat < -90 || destination.lat > 90) {
      throw new Error("Invalid destination latitude");
    }
    if (destination.lng < -180 || destination.lng > 180) {
      throw new Error("Invalid destination longitude");
    }
    if (origin.address.trim().length === 0) {
      throw new Error("Origin address is required");
    }
    if (destination.address.trim().length === 0) {
      throw new Error("Destination address is required");
    }

    const ride = await RideRepository.createRequest(userId, origin, destination);
    return ride;
  },

  async updateRideStatus(rideId: string, status: string) {
    if (!VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
      throw new Error(`Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`);
    }

    const ride = await RideRepository.updateStatus(
      rideId,
      status as typeof VALID_STATUSES[number]
    );
    return ride;
  },

  async getRideHistory(userId: string, page: number) {
    const offset = page * 20;
    const rides = await RideRepository.getHistory(userId, offset, 20);
    return rides;
  },

  async rateRide(rideId: string, rating: number, comment?: string) {
    if (rating < MIN_RATING || rating > MAX_RATING) {
      throw new Error(`Rating must be between ${MIN_RATING} and ${MAX_RATING}`);
    }

    if (comment !== undefined && comment.trim().length > 500) {
      throw new Error("Comment must be 500 characters or less");
    }

    const result = await RideRepository.rateRide(rideId, rating, comment?.trim());
    return result;
  },
};
