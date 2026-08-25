import { ConnectionsRepository } from "@/repositories/connections.repository";
import type { UserLocationInput } from "@/types/phase-13b";

export const ConnectionsService = {
  listNearby: (radiusKm?: number, limit?: number) =>
    ConnectionsRepository.listNearby(radiusKm, limit),
  sendRequest: (receiverId: string) => ConnectionsRepository.sendRequest(receiverId),
  acceptRequest: (requestId: string) => ConnectionsRepository.respond(requestId, "accepted"),
  rejectRequest: (requestId: string) => ConnectionsRepository.respond(requestId, "rejected"),
  cancelRequest: (requestId: string) => ConnectionsRepository.cancel(requestId),
  listConnections: () => ConnectionsRepository.list(),
  removeConnection: (connectionId: string) => ConnectionsRepository.remove(connectionId),
  blockUser: (userId: string) => ConnectionsRepository.block(userId),
  unblockUser: (userId: string) => ConnectionsRepository.unblock(userId),
  findIncomingPendingRequest: (senderId: string) =>
    ConnectionsRepository.findIncomingPendingRequest(senderId),
  getDirectConversation: (otherUserId: string) =>
    ConnectionsRepository.getDirectConversation(otherUserId),
  updateLocation: (userId: string, location: UserLocationInput) =>
    ConnectionsRepository.updateLocation(userId, location),
};
