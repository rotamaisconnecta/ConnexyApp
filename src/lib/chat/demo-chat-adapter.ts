import type { ChatMessage } from "@/lib/chat/chat-types";
import { MessageKind } from "@/lib/chat/chat-types";
import type { StoredMessage } from "@/lib/persistence/domain/chat-entities";
import { visibleMediaCaption } from "@/lib/chat/visible-media-caption";

export function demoMessageToChatMessage(
  conversationId: string,
  message: StoredMessage,
  currentUserId: string | null,
): ChatMessage {
  const from: "me" | "them" = message.senderId
    ? message.senderId === currentUserId
      ? "me"
      : "them"
    : message.from;
  const senderName =
    message.senderName ?? (message.senderId === currentUserId ? "Você" : undefined);
  const at = new Date(message.at);
  const conversation = message.conversationId || conversationId;

  if (message.kind === "image" && (message.payload?.mediaId || message.payload?.dataUrl)) {
    return {
      id: message.id,
      conversationId: conversation,
      from,
      kind: MessageKind.IMAGE,
      url: message.payload.dataUrl ?? "",
      mediaId: message.payload.mediaId,
      caption: visibleMediaCaption(undefined, {
        fileName: message.payload.fileName,
        mediaId: message.payload.mediaId,
      }),
      at,
      status: "read",
      senderName,
    };
  }

  if (message.kind === "video" && (message.payload?.mediaId || message.payload?.dataUrl)) {
    return {
      id: message.id,
      conversationId: conversation,
      from,
      kind: MessageKind.VIDEO,
      url: message.payload.dataUrl ?? "",
      mediaId: message.payload.mediaId,
      at,
      status: "read",
      senderName,
    };
  }

  if (message.kind === "audio" && (message.payload?.mediaId || message.payload?.durationSec)) {
    return {
      id: message.id,
      conversationId: conversation,
      from,
      kind: MessageKind.AUDIO,
      durationSec: message.payload.durationSec ?? 1,
      mediaId: message.payload.mediaId,
      url: message.payload.dataUrl,
      at,
      status: "read",
      senderName,
    };
  }

  if (message.kind === "file") {
    return {
      id: message.id,
      conversationId: conversation,
      from,
      kind: MessageKind.FILE,
      fileName: message.payload?.fileName ?? message.text,
      fileSize: message.payload?.fileSize ?? 0,
      mimeType: message.payload?.mimeType ?? "application/octet-stream",
      mediaId: message.payload?.mediaId,
      at,
      status: "read",
      senderName,
    };
  }

  if (message.kind === "event" && message.payload) {
    return {
      id: message.id,
      conversationId: conversation,
      from,
      kind: MessageKind.EVENT,
      title: message.payload.title ?? message.text,
      cover: message.payload.cover,
      dateText: message.payload.dateText,
      location: message.payload.location,
      contentId: message.payload.id,
      contentType: "event",
      route: message.payload.route,
      at,
      status: "read",
      senderName,
    };
  }

  if (message.kind === "location" && message.payload) {
    return {
      id: message.id,
      conversationId: conversation,
      from,
      kind: MessageKind.LOCATION,
      label: message.payload.title ?? message.text,
      proximity: message.payload.proximity ?? "Local compartilhado",
      cover: message.payload.cover,
      lat: message.payload.lat,
      lng: message.payload.lng,
      contentId: message.payload.id,
      contentType: "place",
      route: message.payload.route,
      at,
      status: "read",
      senderName,
    };
  }

  return {
    id: message.id,
    conversationId: conversation,
    from,
    kind: MessageKind.TEXT,
    text: message.text,
    at,
    status: "read",
    senderName,
  };
}

export function demoRowsToChatMessages(
  conversationId: string,
  rows: StoredMessage[],
  currentUserId: string | null,
): ChatMessage[] {
  return rows.map((row) => demoMessageToChatMessage(conversationId, row, currentUserId));
}
