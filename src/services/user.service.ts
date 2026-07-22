import { UserRepository } from "@/repositories/user.repository";
import type { ProfileUpdate } from "@/types/database/tables";

const MAX_DISPLAY_NAME_LENGTH = 50;
const MAX_BIO_LENGTH = 500;

export const UserService = {
  async getProfile(userId: string) {
    const profile = await UserRepository.getById(userId);
    return profile;
  },

  async updateProfile(userId: string, data: ProfileUpdate) {
    if (data.name !== undefined && data.name !== null) {
      if (data.name.length === 0) {
        throw new Error("Name cannot be empty");
      }
      if (data.name.length > MAX_DISPLAY_NAME_LENGTH) {
        throw new Error(`Name must be ${MAX_DISPLAY_NAME_LENGTH} characters or less`);
      }
    }

    if (data.bio !== undefined && data.bio !== null && data.bio.length > MAX_BIO_LENGTH) {
      throw new Error(`Bio must be ${MAX_BIO_LENGTH} characters or less`);
    }

    const updated = await UserRepository.update(userId, {
      ...data,
      updated_at: new Date().toISOString(),
    });
    return updated;
  },

  async searchUsers(query: string) {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      throw new Error("Search query must be at least 2 characters");
    }
    const users = await UserRepository.search(trimmed);
    return users;
  },

  async getNearbyUsers(lat: number, lng: number, radius: number) {
    if (lat < -90 || lat > 90) {
      throw new Error("Invalid latitude");
    }
    if (lng < -180 || lng > 180) {
      throw new Error("Invalid longitude");
    }
    if (radius <= 0 || radius > 100) {
      throw new Error("Radius must be between 0 and 100 km");
    }

    const users = await UserRepository.getNearby(lat, lng, radius);
    return users;
  },
};
