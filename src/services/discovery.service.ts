import { ConnectionsService } from "@/services/connections.service";

export const DiscoveryService = {
  getNearbyPeople(radiusKm = 25, limit = 50) {
    return ConnectionsService.listNearby(radiusKm, limit);
  },

  sendConnectionRequest(receiverId: string) {
    return ConnectionsService.sendRequest(receiverId);
  },

  async acceptConnectionRequest(requestId: string) {
    return ConnectionsService.acceptRequest(requestId);
  },
};
