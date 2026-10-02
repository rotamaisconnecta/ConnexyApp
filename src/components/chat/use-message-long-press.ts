import { useCallback, useRef } from "react";
import {
  LONG_PRESS_MOVE_CANCEL_PX,
  SELECTION_LONG_PRESS_MS,
  movementCancelsLongPress,
} from "@/lib/chat/message-long-press";

export function useMessageLongPress({
  enabled,
  onLongPress,
  delayMs = SELECTION_LONG_PRESS_MS,
}: {
  enabled: boolean;
  onLongPress: () => void;
  delayMs?: number;
}) {
  const timerRef = useRef<number | null>(null);
  const originRef = useRef<{ x: number; y: number; pointerId: number } | null>(null);
  const suppressNextClickRef = useRef(false);
  const onLongPressRef = useRef(onLongPress);
  const enabledRef = useRef(enabled);
  onLongPressRef.current = onLongPress;
  enabledRef.current = enabled;

  const clearTimer = useCallback(() => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const restoreTouchAction = (target: EventTarget | null) => {
    if (target instanceof HTMLElement) target.style.touchAction = "";
  };

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (!enabledRef.current) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;

      originRef.current = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
      clearTimer();

      const target = event.currentTarget;
      target.style.touchAction = "none";
      try {
        target.setPointerCapture(event.pointerId);
      } catch {
        /* capture é best-effort */
      }

      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        suppressNextClickRef.current = true;
        onLongPressRef.current();
      }, delayMs);
    },
    [clearTimer, delayMs],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const origin = originRef.current;
      if (!origin || timerRef.current == null) return;
      if (
        movementCancelsLongPress(event.clientX - origin.x, event.clientY - origin.y, LONG_PRESS_MOVE_CANCEL_PX)
      ) {
        clearTimer();
        originRef.current = null;
        restoreTouchAction(event.currentTarget);
        try {
          event.currentTarget.releasePointerCapture(event.pointerId);
        } catch {
          /* ignore */
        }
      }
    },
    [clearTimer],
  );

  const finishPointer = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      clearTimer();
      originRef.current = null;
      restoreTouchAction(event.currentTarget);
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        /* ignore */
      }
    },
    [clearTimer],
  );

  const consumeClickSuppression = useCallback(() => {
    if (!suppressNextClickRef.current) return false;
    suppressNextClickRef.current = false;
    return true;
  }, []);

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: finishPointer,
    onPointerCancel: finishPointer,
    consumeClickSuppression,
  };
}
