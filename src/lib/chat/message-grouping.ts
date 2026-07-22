/* =========================================================
   message-grouping.ts — Group messages by date and sender
   Pure TypeScript. No React. No side effects. No Supabase.
========================================================= */

import type { ChatMessage } from "./chat-types";

/* ─── DateGroup ──────────────────────────────────────────── */

export interface DateGroup {
  date: Date;
  label: string;
  messages: ChatMessage[];
}

/* ─── groupMessagesByDate ────────────────────────────────── */

export function groupMessagesByDate(messages: readonly ChatMessage[]): DateGroup[] {
  const groups = new Map<string, DateGroup>();

  for (const msg of messages) {
    const key = toDateKey(msg.at);
    const existing = groups.get(key);

    if (existing) {
      existing.messages.push(msg);
    } else {
      groups.set(key, {
        date: new Date(msg.at.getFullYear(), msg.at.getMonth(), msg.at.getDate()),
        label: formatDateLabel(msg.at),
        messages: [msg],
      });
    }
  }

  return Array.from(groups.values());
}

/* ─── shouldGroupWithPrevious ────────────────────────────── */

export function shouldGroupWithPrevious(
  current: ChatMessage,
  previous: ChatMessage | null,
): boolean {
  if (!previous) return false;
  if (current.from !== previous.from) return false;

  const diffMs = current.at.getTime() - previous.at.getTime();
  const diffMin = diffMs / (1000 * 60);

  return diffMin < 5;
}

/* ─── shouldShowSender ───────────────────────────────────── */

export function shouldShowSender(current: ChatMessage, previous: ChatMessage | null): boolean {
  if (!previous) return true;
  if (current.from !== previous.from) return true;
  return false;
}

/* ─── Internal Helpers ───────────────────────────────────── */

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDateLabel(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffMs = today.getTime() - target.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Ontem";
  if (diffDays < 7) {
    return date.toLocaleDateString("pt-BR", { weekday: "long" });
  }
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}
