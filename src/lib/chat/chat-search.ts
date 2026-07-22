/* =========================================================
   chat-search.ts — Message search utilities
   Pure TypeScript. No React. No side effects. No Supabase.
========================================================= */

import type { ChatMessage, ChatSearchResult } from "./chat-types";
import { MessageKind } from "./chat-types";

/* ─── searchMessages ─────────────────────────────────────── */

export function searchMessages(
  messages: readonly ChatMessage[],
  query: string,
): ChatSearchResult[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const results: ChatSearchResult[] = [];

  for (const msg of messages) {
    const text = extractText(msg);
    if (!text) continue;

    const lowerText = text.toLowerCase();
    const matchIndex = lowerText.indexOf(q);

    if (matchIndex === -1) continue;

    const matchEnd = matchIndex + q.length;
    const snippetStart = Math.max(0, matchIndex - 20);
    const snippetEnd = Math.min(text.length, matchEnd + 20);
    const prefix = snippetStart > 0 ? "…" : "";
    const suffix = snippetEnd < text.length ? "…" : "";

    results.push({
      messageId: msg.id,
      conversationId: msg.conversationId,
      snippet: `${prefix}${text.slice(snippetStart, snippetEnd)}${suffix}`,
      matchStart: matchIndex - snippetStart + prefix.length,
      matchEnd: matchEnd - snippetStart + prefix.length,
    });
  }

  return results;
}

/* ─── highlightMatch ─────────────────────────────────────── */

export interface TextSegment {
  text: string;
  highlighted: boolean;
}

export function highlightMatch(text: string, query: string): TextSegment[] {
  const q = query.toLowerCase().trim();
  if (!q) return [{ text, highlighted: false }];

  const lowerText = text.toLowerCase();
  const segments: TextSegment[] = [];
  let lastIndex = 0;

  let searchIndex = lowerText.indexOf(q, lastIndex);
  while (searchIndex !== -1) {
    if (searchIndex > lastIndex) {
      segments.push({ text: text.slice(lastIndex, searchIndex), highlighted: false });
    }
    segments.push({
      text: text.slice(searchIndex, searchIndex + q.length),
      highlighted: true,
    });
    lastIndex = searchIndex + q.length;
    searchIndex = lowerText.indexOf(q, lastIndex);
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), highlighted: false });
  }

  return segments;
}

/* ─── searchConversations ────────────────────────────────── */

import type { Conversation } from "./chat-types";

export function searchConversations(
  conversations: readonly Conversation[],
  query: string,
): Conversation[] {
  const q = query.toLowerCase().trim();
  if (!q) return [...conversations];

  return conversations.filter((c) => {
    if (c.participant.name.toLowerCase().includes(q)) return true;
    if (c.lastMessage) {
      const text = extractText(c.lastMessage);
      if (text?.toLowerCase().includes(q)) return true;
    }
    return false;
  });
}

/* ─── extractText (internal) ─────────────────────────────── */

function extractText(message: ChatMessage): string | null {
  switch (message.kind) {
    case MessageKind.TEXT:
      return message.text;
    case MessageKind.IMAGE:
      return message.caption ?? null;
    case MessageKind.FILE:
      return message.fileName;
    case MessageKind.LOCATION:
      return message.label;
    default:
      return null;
  }
}
