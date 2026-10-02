import { SELECTION_LONG_PRESS_MS } from "@/lib/chat/chat-selection";

export { SELECTION_LONG_PRESS_MS };

/** Distância em px a partir da qual o gesto vira rolagem e o long press é cancelado. */
export const LONG_PRESS_MOVE_CANCEL_PX = 12;

/** Janela em que o clique seguinte ao long press é ignorado. */
export const LONG_PRESS_CLICK_SUPPRESS_MS = 450;

export type MessageGestureResult =
  | "enter-selection"
  | "toggle-selection"
  | "open-media"
  | "normal-tap"
  | "peer-ignore-select"
  | "cancel-scroll";

export function movementCancelsLongPress(
  deltaX: number,
  deltaY: number,
  thresholdPx = LONG_PRESS_MOVE_CANCEL_PX,
): boolean {
  return Math.hypot(deltaX, deltaY) > thresholdPx;
}

export function resolveMessageGesture(input: {
  from: "me" | "them";
  selecting: boolean;
  heldMs: number;
  movedPx: number;
  isMedia: boolean;
  longPressMs?: number;
  moveCancelPx?: number;
}): MessageGestureResult {
  const longPressMs = input.longPressMs ?? SELECTION_LONG_PRESS_MS;
  const moveCancelPx = input.moveCancelPx ?? LONG_PRESS_MOVE_CANCEL_PX;

  if (input.movedPx > moveCancelPx && input.heldMs < longPressMs) {
    return "cancel-scroll";
  }

  const heldLongEnough = input.heldMs >= longPressMs && input.movedPx <= moveCancelPx;

  if (input.from !== "me") {
    if (heldLongEnough) return "peer-ignore-select";
    if (input.selecting) return "peer-ignore-select";
    return input.isMedia ? "open-media" : "normal-tap";
  }

  if (heldLongEnough) return "enter-selection";
  if (input.selecting) return "toggle-selection";
  return input.isMedia ? "open-media" : "normal-tap";
}

export function shouldOpenMediaOnPointerEnd(input: {
  selecting: boolean;
  longPressRecognized: boolean;
}): boolean {
  return !input.selecting && !input.longPressRecognized;
}

export function beginOwnMessageSelection(selectedIds: readonly string[], messageId: string): string[] {
  return selectedIds.includes(messageId) ? [...selectedIds] : [...selectedIds, messageId];
}

export function toggleOwnMessageSelection(selectedIds: readonly string[], messageId: string): string[] {
  return selectedIds.includes(messageId)
    ? selectedIds.filter((id) => id !== messageId)
    : [...selectedIds, messageId];
}
