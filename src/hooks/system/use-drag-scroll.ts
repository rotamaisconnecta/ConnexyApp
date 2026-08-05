import { useCallback, useRef, type PointerEvent as ReactPointerEvent } from "react";

const DRAG_THRESHOLD = 6;

interface DragScrollProps {
  ref: React.RefObject<HTMLDivElement | null>;
  onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerCancel: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onClickCapture: (e: React.MouseEvent<HTMLDivElement>) => void;
}

const IGNORED_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

/**
 * Click-and-drag horizontal scrolling for any `overflow-x-auto` container.
 * Touch is left to native scrolling. Suppresses the click that follows a drag.
 */
export function useDragScroll(): DragScrollProps {
  const ref = useRef<HTMLDivElement | null>(null);
  const startX = useRef(0);
  const startScroll = useRef(0);
  const active = useRef(false);
  const dragged = useRef(false);

  const onPointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch" || e.button !== 0) return;
    const target = e.target as HTMLElement | null;
    if (target && IGNORED_TAGS.has(target.tagName)) return;
    const el = ref.current;
    if (!el || el.scrollWidth <= el.clientWidth + 1) return;

    active.current = true;
    dragged.current = false;
    startX.current = e.clientX;
    startScroll.current = el.scrollLeft;
    el.style.cursor = "grab";
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }, []);

  const onPointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (!active.current) return;
    const el = ref.current;
    if (!el) return;
    const delta = e.clientX - startX.current;
    if (!dragged.current && Math.abs(delta) < DRAG_THRESHOLD) return;
    dragged.current = true;
    el.style.cursor = "grabbing";
    el.style.userSelect = "none";
    el.scrollLeft = startScroll.current - delta;
  }, []);

  const end = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (!active.current) return;
    active.current = false;
    const el = ref.current;
    if (el) {
      el.style.cursor = "";
      el.style.userSelect = "";
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }
    if (dragged.current) {
      window.setTimeout(() => {
        dragged.current = false;
      }, 0);
    }
  }, []);

  const onClickCapture = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (dragged.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  return {
    ref,
    onPointerDown,
    onPointerMove,
    onPointerUp: end,
    onPointerCancel: end,
    onClickCapture,
  };
}
