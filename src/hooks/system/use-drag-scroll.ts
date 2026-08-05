import { useEffect } from "react";

const DRAG_THRESHOLD = 6;
const IGNORED_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT", "VIDEO"]);

function findScroller(start: EventTarget | null): HTMLElement | null {
  let el = start instanceof HTMLElement ? start : null;
  while (el) {
    if (el.scrollWidth > el.clientWidth + 1) {
      const overflowX = getComputedStyle(el).overflowX;
      if (overflowX === "auto" || overflowX === "scroll") return el;
    }
    el = el.parentElement;
  }
  return null;
}

/**
 * Enables click-and-drag horizontal scrolling on every horizontally
 * scrollable container in the app (filters, carousels, galleries, tabs).
 * Touch input keeps native scrolling. A drag never turns into a click.
 */
export function useGlobalDragScroll() {
  useEffect(() => {
    let scroller: HTMLElement | null = null;
    let startX = 0;
    let startScroll = 0;
    let dragging = false;
    let moved = false;

    function onPointerDown(e: PointerEvent) {
      if (e.pointerType === "touch" || e.button !== 0) return;
      const target = e.target as HTMLElement | null;
      if (target && (IGNORED_TAGS.has(target.tagName) || target.isContentEditable)) return;
      const found = findScroller(target);
      if (!found) return;

      scroller = found;
      dragging = true;
      moved = false;
      startX = e.clientX;
      startScroll = found.scrollLeft;
    }

    function onPointerMove(e: PointerEvent) {
      if (!dragging || !scroller) return;
      const delta = e.clientX - startX;
      if (!moved) {
        if (Math.abs(delta) < DRAG_THRESHOLD) return;
        moved = true;
        scroller.style.cursor = "grabbing";
        scroller.style.userSelect = "none";
        scroller.style.scrollSnapType = "none";
      }
      scroller.scrollLeft = startScroll - delta;
      e.preventDefault();
    }

    function reset() {
      if (scroller) {
        scroller.style.cursor = "";
        scroller.style.userSelect = "";
        scroller.style.scrollSnapType = "";
      }
      scroller = null;
      dragging = false;
      window.setTimeout(() => {
        moved = false;
      }, 0);
    }

    function onPointerUp() {
      if (!dragging) return;
      reset();
    }

    function onClickCapture(e: MouseEvent) {
      if (!moved) return;
      e.preventDefault();
      e.stopPropagation();
    }

    function onDragStart(e: Event) {
      if (moved || dragging) e.preventDefault();
    }

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("pointermove", onPointerMove, { passive: false });
    document.addEventListener("pointerup", onPointerUp, true);
    document.addEventListener("pointercancel", onPointerUp, true);
    document.addEventListener("click", onClickCapture, true);
    document.addEventListener("dragstart", onDragStart, true);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp, true);
      document.removeEventListener("pointercancel", onPointerUp, true);
      document.removeEventListener("click", onClickCapture, true);
      document.removeEventListener("dragstart", onDragStart, true);
    };
  }, []);
}
