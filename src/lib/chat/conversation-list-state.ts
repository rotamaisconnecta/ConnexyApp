import { NextGesture, type NextGestureValue } from "@/lib/chat/mock-conversations";
import type { StoredMessage, StoredMessageKindValue } from "@/lib/persistence/domain/chat-entities";

export const LIST_GESTURES = [NextGesture.LISTEN, NextGesture.CONFIRM, NextGesture.RESUME] as const;
export type ListGesture = (typeof LIST_GESTURES)[number];

const STALE_MS = 8 * 60 * 60 * 1000;
const CONFIRM_HINT = /\b(confirm(?:ar|e|ado)?|horário|reunião|encontro|amanhã|\d{1,2}h)\b/i;

export function isListGesture(value: NextGestureValue | undefined): value is ListGesture {
  return (
    value === NextGesture.LISTEN || value === NextGesture.CONFIRM || value === NextGesture.RESUME
  );
}

export function isPinnedForUser(
  pinnedByUserIds: readonly string[] | undefined,
  userId: string,
): boolean {
  return Boolean(userId) && (pinnedByUserIds?.includes(userId) ?? false);
}

export function withPinnedUser(
  pinnedByUserIds: readonly string[] | undefined,
  userId: string,
  pinned: boolean,
): string[] {
  const unique = [...new Set(pinnedByUserIds ?? [])].filter(Boolean);
  if (!userId) return unique;
  if (pinned) return unique.includes(userId) ? unique : [...unique, userId];
  return unique.filter((id) => id !== userId);
}

export function isAudioLastMessage(
  last: Pick<StoredMessage, "kind" | "text"> | null | undefined,
  lastMessageType?: StoredMessageKindValue | null,
): boolean {
  if (last?.kind === "audio" || lastMessageType === "audio") return true;
  return (last?.text ?? "").toLocaleLowerCase("pt-BR").includes("áudio");
}

export function isConfirmableLastMessage(
  last: Pick<StoredMessage, "text"> | null | undefined,
): boolean {
  return CONFIRM_HINT.test(last?.text ?? "");
}

export function isMessageFromOther(
  last: Pick<StoredMessage, "from" | "senderId"> | null | undefined,
  viewerId: string,
): boolean {
  if (!last) return false;
  if (last.senderId) return last.senderId !== viewerId;
  return last.from === "them";
}

export function deriveListGesture(input: {
  last: StoredMessage | null | undefined;
  viewerId: string;
  lastMessageType?: StoredMessageKindValue | null;
  gestureHandledAt?: number;
  now?: number;
}): ListGesture | undefined {
  const last = input.last;
  if (!last || !input.viewerId) return undefined;
  if (input.gestureHandledAt && last.at <= input.gestureHandledAt) return undefined;

  if (isAudioLastMessage(last, input.lastMessageType)) return NextGesture.LISTEN;

  const fromOther = isMessageFromOther(last, input.viewerId);
  if (fromOther && isConfirmableLastMessage(last)) return NextGesture.CONFIRM;

  const now = input.now ?? Date.now();
  if (fromOther && now - last.at >= STALE_MS) return NextGesture.RESUME;
  return undefined;
}
