import { PresenceRepository } from "@/repositories/presence.repository";
import type { PresencePreference } from "@/types/phase-13b";

export const PresenceService = {
  listVisible: () => PresenceRepository.listVisible(),
  async publish(userId: string, preference: PresencePreference): Promise<void> {
    if (preference === "invisible") {
      await PresenceRepository.setInvisible(userId);
      return;
    }
    await PresenceRepository.heartbeat(userId, preference);
  },
  subscribe: PresenceRepository.subscribe,
  unsubscribe: PresenceRepository.unsubscribe,
};
