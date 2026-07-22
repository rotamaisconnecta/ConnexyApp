/* =========================================================
   chat-utils.ts — General chat utility functions
   Pure TypeScript. No React. No side effects. No Supabase.
========================================================= */

import type {
  ChatMessage,
  Conversation,
  ConversationFilters,
  ConversationSortValue,
} from "./chat-types";
import { MessageKind, ConversationSort } from "./chat-types";

/* ─── getMessageAlignment ────────────────────────────────── */

export function getMessageAlignment(message: ChatMessage): "left" | "right" {
  return message.from === "me" ? "right" : "left";
}

/* ─── shouldShowAvatar ───────────────────────────────────── */

export function shouldShowAvatar(current: ChatMessage, previous: ChatMessage | null): boolean {
  if (!previous) return true;
  if (current.from !== previous.from) return true;
  const diffMs = current.at.getTime() - previous.at.getTime();
  return diffMs > 5 * 60 * 1000;
}

/* ─── shouldShowTimestamp ─────────────────────────────────── */

export function shouldShowTimestamp(current: ChatMessage, next: ChatMessage | null): boolean {
  if (!next) return true;
  if (current.from !== next.from) return true;
  const diffMs = next.at.getTime() - current.at.getTime();
  return diffMs > 5 * 60 * 1000;
}

/* ─── hasMediaContent ────────────────────────────────────── */

export function hasMediaContent(message: ChatMessage): boolean {
  return (
    message.kind === MessageKind.IMAGE ||
    message.kind === MessageKind.VIDEO ||
    message.kind === MessageKind.AUDIO
  );
}

/* ─── filterConversations ────────────────────────────────── */

export function filterConversations(
  conversations: readonly Conversation[],
  filters: ConversationFilters,
): Conversation[] {
  let result = [...conversations];

  if (filters.query) {
    const q = filters.query.toLowerCase().trim();
    result = result.filter(
      (c) =>
        c.participant.name.toLowerCase().includes(q) ||
        (c.lastMessage?.kind === MessageKind.TEXT && c.lastMessage.text.toLowerCase().includes(q)),
    );
  }

  if (filters.unreadOnly) {
    result = result.filter((c) => c.unreadCount > 0);
  }

  if (filters.onlineOnly) {
    result = result.filter((c) => c.participant.online);
  }

  return result;
}

/* ─── sortConversations ──────────────────────────────────── */

export function sortConversations(
  conversations: readonly Conversation[],
  sort: ConversationSortValue,
): Conversation[] {
  const sorted = [...conversations];

  switch (sort) {
    case ConversationSort.LAST_MESSAGE:
      return sorted.sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        const aTime = a.lastMessage?.at.getTime() ?? 0;
        const bTime = b.lastMessage?.at.getTime() ?? 0;
        return bTime - aTime;
      });

    case ConversationSort.UNREAD:
      return sorted.sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.unreadCount - a.unreadCount;
      });

    case ConversationSort.ALPHABETICAL:
      return sorted.sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return a.participant.name.localeCompare(b.participant.name, "pt-BR");
      });

    default:
      return sorted;
  }
}

/* ─── getTotalUnread ─────────────────────────────────────── */

export function getTotalUnread(conversations: readonly Conversation[]): number {
  return conversations.reduce((sum, c) => sum + c.unreadCount, 0);
}

/* ─── findConversation ───────────────────────────────────── */

export function findConversation(
  conversations: readonly Conversation[],
  id: string,
): Conversation | undefined {
  return conversations.find((c) => c.id === id);
}
