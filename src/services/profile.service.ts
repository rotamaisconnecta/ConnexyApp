import { ProfileRepository } from "@/repositories/profile.repository";
import type { ProfileUpdate } from "@/types/database/tables";

const MAX_MOMENT_LENGTH = 1000;

export interface MomentData {
  text: string;
  media_url?: string;
  media_kind?: string;
}

export const ProfileService = {
  async getProfile(userId: string) {
    const profile = await ProfileRepository.getProfile(userId);
    return profile;
  },

  async updateProfile(userId: string, data: ProfileUpdate) {
    if (data.name !== undefined && data.name !== null) {
      if (data.name.trim().length === 0) {
        throw new Error("Name cannot be empty");
      }
    }

    const updated = await ProfileRepository.updateProfile(userId, {
      ...data,
      updated_at: new Date().toISOString(),
    });
    return updated;
  },

  async getMoments(userId: string) {
    const moments = await ProfileRepository.getMoments(userId);
    return moments;
  },

  async createMoment(userId: string, data: MomentData) {
    const trimmed = data.text.trim();
    if (trimmed.length === 0) {
      throw new Error("Moment text cannot be empty");
    }
    if (trimmed.length > MAX_MOMENT_LENGTH) {
      throw new Error(`Moment must be ${MAX_MOMENT_LENGTH} characters or less`);
    }

    const moment = await ProfileRepository.createMoment(userId, {
      text: trimmed,
      media_url: data.media_url,
      media_kind: data.media_kind,
      created_at: new Date().toISOString(),
    });
    return moment;
  },

  async deleteMoment(momentId: string, userId: string) {
    const moments = await ProfileRepository.getMoments(userId);
    const moment = moments.find((m) => m.id === momentId);

    if (!moment) {
      throw new Error("Moment not found");
    }

    await ProfileRepository.deleteMoment(momentId);
  },
};
