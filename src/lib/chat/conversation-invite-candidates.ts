import { people } from "@/lib/mock-data";
import {
  getConnectionByConversationId,
  getConnectionPeerId,
  getConnectionsForUser,
  getDemoGroup,
  listDemoGroupsBySource,
} from "@/lib/demo/demo-db";

export type InviteCandidate = {
  id: string;
  name: string;
  photo: string;
  online?: boolean;
};

function uniqueIds(ids: Array<string | null | undefined>): string[] {
  return [...new Set(ids.filter((id): id is string => Boolean(id)))];
}

export function listConversationParticipantIds(
  conversationId: string,
  currentUserId: string,
): string[] {
  const group = getDemoGroup(conversationId);
  if (group) {
    return uniqueIds(
      group.participants
        .filter((participant) => participant.status === "accepted" || participant.status === "pending")
        .map((participant) => participant.userId),
    );
  }
  const connection = getConnectionByConversationId(conversationId, currentUserId);
  const peerId = connection ? getConnectionPeerId(connection, currentUserId) : conversationId;
  return uniqueIds([currentUserId, peerId]);
}

export function listAlreadyInvitedIds(conversationId: string, currentUserId: string): string[] {
  const invited = new Set(listConversationParticipantIds(conversationId, currentUserId));
  for (const group of listDemoGroupsBySource(conversationId)) {
    for (const participant of group.participants) {
      if (participant.status === "pending" || participant.status === "accepted") {
        invited.add(participant.userId);
      }
    }
  }
  return [...invited];
}

export function listConversationInviteCandidates(
  conversationId: string,
  currentUserId: string,
): InviteCandidate[] {
  const participants = listConversationParticipantIds(conversationId, currentUserId);
  const blocked = new Set(listAlreadyInvitedIds(conversationId, currentUserId));
  const seen = new Set<string>();
  const candidates: InviteCandidate[] = [];

  for (const participantId of participants) {
    for (const connection of getConnectionsForUser(participantId)) {
      const peerId = getConnectionPeerId(connection, participantId);
      if (!peerId || blocked.has(peerId) || seen.has(peerId)) continue;
      const person = people.find((entry) => entry.id === peerId);
      if (!person) continue;
      seen.add(peerId);
      candidates.push({
        id: person.id,
        name: person.name,
        photo: person.photo,
        online: person.online,
      });
    }
  }

  return candidates;
}

export function canInviteToConversation(
  conversationId: string,
  currentUserId: string,
  inviteeId: string,
): boolean {
  if (!inviteeId) return false;
  const blocked = new Set(listAlreadyInvitedIds(conversationId, currentUserId));
  if (blocked.has(inviteeId)) return false;
  return listConversationInviteCandidates(conversationId, currentUserId).some(
    (candidate) => candidate.id === inviteeId,
  );
}
