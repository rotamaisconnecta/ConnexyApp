import { MessageKind, type ChatMessage, type TextMessage, type AudioMessage } from "./chat-types";

interface MessageRowInput {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  kind: string | null;
  media_duration_ms: number | null;
  deleted_at: string | null;
  created_at: string;
}

type MessageKindDb = "text" | "share" | "audio" | "system";

function mapKind(dbKind: string | null): (typeof MessageKind)[keyof typeof MessageKind] | null {
  switch ((dbKind ?? "text") as MessageKindDb) {
    case "text":
      return MessageKind.TEXT;
    case "audio":
      return MessageKind.AUDIO;
    case "share":
      return MessageKind.TEXT;
    case "system":
      return null;
    default:
      return MessageKind.TEXT;
  }
}

export function dbRowToChatMessage(
  row: Record<string, unknown>,
  currentUserId: string,
): ChatMessage | null {
  const r = row as unknown as MessageRowInput;
  if (r.deleted_at) return null;

  const kind = mapKind(r.kind);
  if (!kind) return null;

  const base = {
    id: r.id,
    conversationId: r.conversation_id,
    from: (r.sender_id === currentUserId ? "me" : "them") as "me" | "them",
    at: new Date(r.created_at),
    status: "read" as const,
  };

  if (kind === MessageKind.AUDIO) {
    const msg: AudioMessage = {
      ...base,
      kind: MessageKind.AUDIO,
      durationSec: r.media_duration_ms ? Math.round(r.media_duration_ms / 1000) : 0,
    };
    return msg;
  }

  const text = r.content ?? "";

  if (!text && r.kind !== "share") return null;

  const msg: TextMessage = {
    ...base,
    kind: MessageKind.TEXT,
    text,
  };
  return msg;
}

export function dbRowsToChatMessages(
  rows: Record<string, unknown>[],
  currentUserId: string,
): ChatMessage[] {
  return rows
    .map((row) => dbRowToChatMessage(row, currentUserId))
    .filter((msg): msg is ChatMessage => msg !== null);
}

export function toConversationDisplayName(
  participantNames: string[],
  currentUserName: string,
): string {
  const others = participantNames.filter((n) => n !== currentUserName);
  return others.length > 0 ? others[0] : "Conversa";
}
