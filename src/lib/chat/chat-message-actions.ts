import type { ChatMessage } from "@/lib/chat/chat-types";
import { MessageKind } from "@/lib/chat/chat-types";
import type { StoredMessage } from "@/lib/persistence/domain/chat-entities";
import { downloadLocalBlob, fileNameForMedia } from "@/lib/media/download-local-media";
import {
  getLocalMediaBlob,
  getLocalMediaRecord,
  removeLocalMedia,
} from "@/lib/media/local-media-storage";
import {
  getLocalChatMessage,
  listCachedLocalChatMessages,
  persistDeleteLocalChatMessage,
  refreshLocalConversationSummary,
} from "@/lib/chat/local-chat-persistence";

export const DeleteFailureReason = {
  NOT_FOUND: "not-found",
  WRONG_CONVERSATION: "wrong-conversation",
  NOT_OWNER: "not-owner",
  PERSIST_FAILED: "persist-failed",
} as const;

export type DeleteFailureReasonValue =
  (typeof DeleteFailureReason)[keyof typeof DeleteFailureReason];

export type DeleteMessageFailure = {
  messageId: string;
  reason: DeleteFailureReasonValue;
};

export type DeleteOwnMessagesResult = {
  deletedIds: string[];
  failed: DeleteMessageFailure[];
};

export function isOwnStoredMessage(message: StoredMessage, currentUserId: string): boolean {
  if (!currentUserId) return false;
  if (message.senderId) return message.senderId === currentUserId;
  return message.from === "me";
}

export function evaluateMessageDeletion(input: {
  message: StoredMessage | null;
  conversationId: string;
  currentUserId: string;
  messageId: string;
}): { ok: true; message: StoredMessage } | { ok: false; failure: DeleteMessageFailure } {
  if (!input.message) {
    return {
      ok: false,
      failure: { messageId: input.messageId, reason: DeleteFailureReason.NOT_FOUND },
    };
  }
  if (input.message.id !== input.messageId) {
    return {
      ok: false,
      failure: { messageId: input.messageId, reason: DeleteFailureReason.NOT_FOUND },
    };
  }
  if (input.message.conversationId !== input.conversationId) {
    return {
      ok: false,
      failure: { messageId: input.messageId, reason: DeleteFailureReason.WRONG_CONVERSATION },
    };
  }
  if (!isOwnStoredMessage(input.message, input.currentUserId)) {
    return {
      ok: false,
      failure: { messageId: input.messageId, reason: DeleteFailureReason.NOT_OWNER },
    };
  }
  return { ok: true, message: input.message };
}

export function isOpenableChatMedia(
  message: ChatMessage,
): message is Extract<ChatMessage, { kind: typeof MessageKind.IMAGE | typeof MessageKind.VIDEO }> {
  return message.kind === MessageKind.IMAGE || message.kind === MessageKind.VIDEO;
}

export function isOpenableChatDocument(
  message: ChatMessage,
): message is Extract<ChatMessage, { kind: typeof MessageKind.FILE }> {
  return message.kind === MessageKind.FILE;
}

export function isChatMediaActionTarget(target: EventTarget | null): boolean {
  if (!target || typeof target !== "object" || !("closest" in target)) return false;
  const closest = (target as { closest?: (selector: string) => unknown }).closest;
  return typeof closest === "function" && closest.call(target, "[data-chat-media-action]") != null;
}

export function isDownloadableChatMedia(
  message: ChatMessage,
): message is Extract<
  ChatMessage,
  { kind: typeof MessageKind.IMAGE | typeof MessageKind.VIDEO | typeof MessageKind.AUDIO | typeof MessageKind.FILE }
> {
  return (
    (message.kind === MessageKind.IMAGE ||
      message.kind === MessageKind.VIDEO ||
      message.kind === MessageKind.AUDIO ||
      message.kind === MessageKind.FILE) &&
    Boolean(
      ("mediaId" in message && message.mediaId) || ("url" in message && message.url),
    )
  );
}

const INTERNAL_MEDIA_FILE_NAME = /^(media-|connexy-|foto-\d|video-\d|audio-\d|reel-|blob:|opfs)/i;

export function chatMediaDownloadFileName(input: {
  kind: ChatMessage["kind"];
  mimeType?: string | null;
  storedFileName?: string | null;
  messageFileName?: string | null;
}): string {
  if (input.kind === MessageKind.FILE) {
    const named = input.messageFileName?.trim();
    if (named && named !== "undefined" && named !== "null") return named;
  }

  const stored = input.storedFileName?.trim();
  if (
    stored &&
    stored !== "undefined" &&
    stored !== "null" &&
    !INTERNAL_MEDIA_FILE_NAME.test(stored)
  ) {
    return stored;
  }

  const prefix =
    input.kind === MessageKind.VIDEO ? "video" : input.kind === MessageKind.AUDIO ? "audio" : "foto";
  const fallbackMime =
    input.kind === MessageKind.VIDEO
      ? "video/mp4"
      : input.kind === MessageKind.AUDIO
        ? "audio/webm"
        : "image/jpeg";
  return fileNameForMedia(input.mimeType || fallbackMime, prefix);
}

type DeleteDeps = {
  getMessage: (conversationId: string, messageId: string) => StoredMessage | null;
  persistDelete: (conversationId: string, messageId: string) => Promise<void>;
  refreshSummary: (conversationId: string) => Promise<void>;
  listMessages: () => StoredMessage[];
  removeMediaFile?: (mediaId: string) => Promise<void>;
};

export async function executeOwnMessageDeletion(
  input: {
    conversationId: string;
    currentUserId: string;
    messageIds: readonly string[];
  },
  deps: DeleteDeps,
): Promise<DeleteOwnMessagesResult> {
  const deletedIds: string[] = [];
  const failed: DeleteMessageFailure[] = [];
  const seen = new Set<string>();

  for (const messageId of input.messageIds) {
    if (seen.has(messageId)) continue;
    seen.add(messageId);
    const evaluated = evaluateMessageDeletion({
      message: deps.getMessage(input.conversationId, messageId),
      conversationId: input.conversationId,
      currentUserId: input.currentUserId,
      messageId,
    });
    if (!evaluated.ok) {
      failed.push(evaluated.failure);
      continue;
    }

    try {
      await deps.persistDelete(input.conversationId, evaluated.message.id);
      deletedIds.push(evaluated.message.id);
      const mediaId = evaluated.message.payload?.mediaId;
      if (mediaId) {
        const stillUsed = deps
          .listMessages()
          .some((row) => row.id !== evaluated.message.id && row.payload?.mediaId === mediaId);
        if (!stillUsed && deps.removeMediaFile) {
          try {
            await deps.removeMediaFile(mediaId);
          } catch {
            // A mensagem já foi removida; o arquivo órfão não reabre a bolha.
          }
        }
      }
    } catch {
      failed.push({ messageId, reason: DeleteFailureReason.PERSIST_FAILED });
    }
  }

  if (deletedIds.length > 0) {
    await deps.refreshSummary(input.conversationId);
  }

  return { deletedIds, failed };
}

const defaultDeleteDeps: DeleteDeps = {
  getMessage: getLocalChatMessage,
  persistDelete: persistDeleteLocalChatMessage,
  refreshSummary: refreshLocalConversationSummary,
  listMessages: listCachedLocalChatMessages,
  removeMediaFile: removeLocalMedia,
};

export async function deleteOwnChatMessages(input: {
  conversationId: string;
  currentUserId: string;
  messageIds: readonly string[];
}): Promise<DeleteOwnMessagesResult> {
  return executeOwnMessageDeletion(input, defaultDeleteDeps);
}

export async function resolveChatMediaDownload(
  message: ChatMessage,
): Promise<{ blob: Blob; fileName: string }> {
  if (message.kind === MessageKind.TEXT) {
    return {
      blob: new Blob([message.text], { type: "text/plain;charset=utf-8" }),
      fileName: "mensagem-connexy.txt",
    };
  }

  if (!isDownloadableChatMedia(message)) {
    throw new Error("Esta mensagem não possui arquivo para baixar.");
  }

  if (message.mediaId) {
    const blob = await getLocalMediaBlob(message.mediaId);
    if (!blob.size) throw new Error("empty-media");
    const record = await getLocalMediaRecord(message.mediaId);
    return {
      blob,
      fileName: chatMediaDownloadFileName({
        kind: message.kind,
        mimeType: record?.mimeType ?? blob.type,
        storedFileName: record?.fileName,
        messageFileName: message.kind === MessageKind.FILE ? message.fileName : undefined,
      }),
    };
  }

  if (!("url" in message) || !message.url) {
    throw new Error("Esta mensagem não possui arquivo para baixar.");
  }
  const response = await fetch(message.url);
  if (!response.ok) throw new Error("download failed");
  const blob = await response.blob();
  if (!blob.size) throw new Error("empty-media");
  return {
    blob,
    fileName: chatMediaDownloadFileName({
      kind: message.kind,
      mimeType: blob.type,
    }),
  };
}

export async function downloadChatMessage(message: ChatMessage): Promise<void> {
  const { blob, fileName } = await resolveChatMediaDownload(message);
  await downloadLocalBlob({ blob, fileName });
}

export async function openChatDocument(message: ChatMessage): Promise<void> {
  if (!isOpenableChatDocument(message)) {
    throw new Error("Esta mensagem não é um documento.");
  }
  const { blob } = await resolveChatMediaDownload(message);
  if (!blob.size) throw new Error("empty-media");
  const mimeType = message.mimeType || blob.type || "application/octet-stream";
  const typed = blob.type === mimeType ? blob : new Blob([blob], { type: mimeType });
  const objectUrl = URL.createObjectURL(typed);
  const opened = typeof window !== "undefined" ? window.open(objectUrl, "_blank", "noopener,noreferrer") : null;
  if (!opened) {
    const link = document.createElement("a");
    link.href = objectUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.type = mimeType;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}

export function copyableTextForMessage(message: ChatMessage): string | null {
  switch (message.kind) {
    case MessageKind.TEXT: {
      const text = message.text.trim();
      return text || null;
    }
    case MessageKind.FILE:
      return message.fileName?.trim() || null;
    case MessageKind.LOCATION: {
      const text = [message.label, message.proximity].filter(Boolean).join(" · ").trim();
      return text || null;
    }
    case MessageKind.EVENT: {
      const text = [message.title, message.location, message.dateText].filter(Boolean).join(" · ").trim();
      return text || null;
    }
    case MessageKind.IMAGE: {
      const caption = message.caption?.trim();
      return caption || null;
    }
    default:
      return null;
  }
}

export function copyableTextForMessages(messages: readonly ChatMessage[]): string {
  return messages
    .map((message) => copyableTextForMessage(message))
    .filter((text): text is string => Boolean(text))
    .join("\n\n");
}
