/* =========================================================
   typing-utils.ts — Typing indicator utilities
   Pure TypeScript. No React. No side effects. No Supabase.
========================================================= */

import type { TypingIndicator } from "./chat-types";

/* ─── TYPING_TIMEOUT_MS ──────────────────────────────────── */

export const TYPING_TIMEOUT_MS = 3000;

/* ─── isTypingActive ─────────────────────────────────────── */

export function isTypingActive(
  typing: TypingIndicator | null,
  timeoutMs: number = TYPING_TIMEOUT_MS,
): boolean {
  if (!typing) return false;
  const elapsed = Date.now() - typing.startedAt.getTime();
  return elapsed < timeoutMs;
}

/* ─── formatTypingText ───────────────────────────────────── */

export function formatTypingText(userName: string): string {
  return `${userName} está digitando`;
}

/* ─── getTypingDots ──────────────────────────────────────── */

export function getTypingDots(): number[] {
  return [0, 1, 2];
}

/* ─── shouldStopTyping ───────────────────────────────────── */

export function shouldStopTyping(
  typing: TypingIndicator | null,
  timeoutMs: number = TYPING_TIMEOUT_MS,
): boolean {
  return typing !== null && !isTypingActive(typing, timeoutMs);
}

/* ─── createTypingIndicator ──────────────────────────────── */

export function createTypingIndicator(conversationId: string, userId: string): TypingIndicator {
  return {
    conversationId,
    userId,
    startedAt: new Date(),
  };
}
