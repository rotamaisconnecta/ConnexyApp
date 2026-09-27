import {
  getConnectionPeerId,
  getConnectionsForUser,
  getConversationLastMessage,
  getDemoGroupsForUser,
} from "@/lib/demo/demo-db";
import { getLocalConversations } from "@/lib/chat/local-chat-persistence";
import { deriveListGesture, isPinnedForUser } from "@/lib/chat/conversation-list-state";
import { currentUser, people } from "@/lib/mock-data";
import {
  LastMessageType,
  ThreadIcon,
  type LastMessageTypeValue,
  type MockConversation,
} from "@/lib/chat/mock-conversations";
import type {
  StoredConversation,
  StoredMessage,
  StoredMessageKindValue,
} from "@/lib/persistence/domain/chat-entities";

export function resolveDemoCatalogPerson(peerId: string) {
  const nearbyPerson = people.find((item) => item.id === peerId);
  if (nearbyPerson) return nearbyPerson;
  if (peerId === currentUser.id) {
    return {
      ...currentUser,
      online: true,
      distanceMeters: 0,
      age: null as number | null,
    };
  }
  return null;
}

function toUiLastMessageType(
  kind: StoredMessageKindValue | null | undefined,
): LastMessageTypeValue {
  if (kind === "audio") return LastMessageType.AUDIO;
  if (kind === "event") return LastMessageType.EVENT;
  if (kind === "location") return LastMessageType.LOCATION;
  if (kind === "image") return LastMessageType.IMAGE;
  return LastMessageType.TEXT;
}

export function decorateFunctionalConversation(
  item: Omit<MockConversation, "isPinned" | "nextGesture" | "lastMessageType"> & {
    lastMessageType?: LastMessageTypeValue;
  },
  userId: string,
  aggregate: StoredConversation | undefined,
  last: StoredMessage | null,
): MockConversation {
  return {
    ...item,
    lastMessageType: toUiLastMessageType(last?.kind ?? aggregate?.lastMessageType),
    isPinned: isPinnedForUser(aggregate?.pinnedByUserIds, userId),
    nextGesture: deriveListGesture({
      last,
      viewerId: userId,
      lastMessageType: last?.kind ?? aggregate?.lastMessageType,
      gestureHandledAt: aggregate?.gestureHandledAt,
    }),
  };
}

/** Lista funcional: conexões + grupos aceitos + agregado persistido. Sem catálogo fixture. */
export function listFunctionalDemoConversations(userId: string): MockConversation[] {
  const persisted = new Map(
    getLocalConversations().map((conversation) => [conversation.id, conversation]),
  );
  const items = new Map<string, MockConversation>();

  for (const connection of getConnectionsForUser(userId)) {
    const peerId = getConnectionPeerId(connection, userId);
    if (!peerId) continue;
    const person = resolveDemoCatalogPerson(peerId);
    if (!person) continue;
    const aggregate = persisted.get(connection.conversationId);
    const last = getConversationLastMessage(connection.conversationId);
    items.set(
      connection.conversationId,
      decorateFunctionalConversation(
        {
          id: connection.conversationId,
          participant: { id: peerId, name: person.name, photo: person.photo },
          initials: person.name.slice(0, 2).toUpperCase(),
          isOnline: person.online,
          proximityMeters: person.distanceMeters,
          currentThread: "Conexão local",
          threadIcon: ThreadIcon.COFFEE,
          lastMessage: aggregate?.lastMessageText ?? last?.text ?? "Vocês estão conectados",
          updatedAt: new Date(aggregate?.updatedAt ?? last?.at ?? connection.connectedAt),
          unreadCount: last && last.senderId && last.senderId !== userId ? 1 : 0,
          isMuted: false,
          sharedInterest: person.interests[0],
        },
        userId,
        aggregate,
        last,
      ),
    );
  }

  for (const group of getDemoGroupsForUser(userId)) {
    const accepted = group.participants.filter((participant) => participant.status === "accepted");
    const last = getConversationLastMessage(group.id);
    const aggregate = persisted.get(group.id);
    items.set(
      group.id,
      decorateFunctionalConversation(
        {
          id: group.id,
          participant: { id: group.id, name: group.name },
          initials: group.name.slice(0, 2).toUpperCase(),
          isOnline: true,
          currentThread: `${accepted.length} participante${accepted.length === 1 ? "" : "s"}`,
          threadIcon: ThreadIcon.EVENT,
          lastMessage:
            aggregate?.lastMessageText ?? last?.text ?? "Grupo criado — aguardando convites",
          updatedAt: new Date(aggregate?.updatedAt ?? last?.at ?? group.createdAt),
          unreadCount: 0,
          isMuted: false,
        },
        userId,
        aggregate,
        last,
      ),
    );
  }

  return [...items.values()];
}
