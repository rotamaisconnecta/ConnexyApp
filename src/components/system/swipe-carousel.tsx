import { useEffect, useRef, useState, type ReactNode, type UIEvent } from "react";
import { cn } from "@/lib/utils";
import { CAROUSEL_SWIPE_HINT_KEY, prefersReducedMotion } from "@/lib/carousel/hint";

interface SwipeCarouselProps {
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
  hint?: boolean;
  hintLabel?: string;
  scrollRef?: React.Ref<HTMLDivElement>;
  onScroll?: (event: UIEvent<HTMLDivElement>) => void;
  autoplay?: boolean;
  autoplayMs?: number;
}

export function SwipeCarousel({
  children,
  className,
  ariaLabel = "Carrossel",
  hint = true,
  hintLabel = "Deslize para ver mais",
  scrollRef,
  onScroll,
  autoplay = false,
  autoplayMs = 4500,
}: SwipeCarouselProps) {
  const innerRef = useRef<HTMLDivElement>(null);
  const seenRef = useRef(
    typeof window === "undefined" ? false : localStorage.getItem(CAROUSEL_SWIPE_HINT_KEY) === "1",
  );
  const [overflows, setOverflows] = useState(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    const element = innerRef.current;
    if (!element) return;
    const measure = () => {
      const next = element.scrollWidth > element.clientWidth + 1;
      setOverflows((previous) => (previous === next ? previous : next));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hint || !overflows || seenRef.current) {
      setShowHint(false);
      return;
    }
    setShowHint(true);
  }, [hint, overflows]);

  useEffect(() => {
    if (!showHint) return;
    const element = innerRef.current;
    if (!element) return;
    const onUserScroll = () => {
      if (element.scrollLeft <= 0) return;
      seenRef.current = true;
      try {
        localStorage.setItem(CAROUSEL_SWIPE_HINT_KEY, "1");
      } catch {
        // Storage may be unavailable; the hint simply returns next time.
      }
      setShowHint(false);
    };
    element.addEventListener("scroll", onUserScroll, { passive: true });
    return () => element.removeEventListener("scroll", onUserScroll);
  }, [showHint]);

  const reduced = prefersReducedMotion();

  useEffect(() => {
    if (!autoplay || reduced) return;
    const element = innerRef.current;
    if (!element) return;
    let timer: number | null = null;
    const tick = () => {
      const max = element.scrollWidth - element.clientWidth;
      if (max <= 1) return;
      const first = element.firstElementChild as HTMLElement | null;
      const styles = window.getComputedStyle(element);
      const gap = Number.parseFloat(styles.columnGap || styles.gap || "8") || 8;
      const step = first ? first.offsetWidth + gap : Math.max(120, element.clientWidth * 0.72);
      const next = element.scrollLeft + step;
      element.scrollTo({
        left: next >= max - 8 ? 0 : next,
        behavior: "smooth",
      });
    };
    const start = () => {
      if (timer != null) window.clearInterval(timer);
      timer = window.setInterval(tick, Math.max(4000, autoplayMs));
    };
    start();
    element.addEventListener("pointerdown", start);
    element.addEventListener("touchstart", start, { passive: true });
    return () => {
      if (timer != null) window.clearInterval(timer);
      element.removeEventListener("pointerdown", start);
      element.removeEventListener("touchstart", start);
    };
  }, [autoplay, autoplayMs, reduced, children]);

  return (
    <div className="relative">
      <div
        ref={(node) => {
          innerRef.current = node;
          if (typeof scrollRef === "function") scrollRef(node);
          else if (scrollRef) scrollRef.current = node;
        }}
        role="region"
        aria-label={ariaLabel}
        onScroll={onScroll}
        className={cn(
          "flex touch-pan-x overflow-x-auto overscroll-x-contain no-scrollbar",
          className,
        )}
      >
        {children}
      </div>

      {hint && showHint && (
        <div
          className="pointer-events-none absolute right-3 top-1/2 z-20"
          style={{
            transform: "translateY(-50%)",
            animation: reduced
              ? undefined
              : "swipe-hint-fade-in 0.3s ease-out, swipe-hint-nudge 1.6s ease-in-out 0.6s infinite",
          }}
        >
          <span className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-foreground/90 px-3 py-1.5 text-xs font-semibold text-background shadow-soft">
            {hintLabel}
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </span>
        </div>
      )}
    </div>
  );
}
