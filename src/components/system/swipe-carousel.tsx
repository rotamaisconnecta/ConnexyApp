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
}

export function SwipeCarousel({
  children,
  className,
  ariaLabel = "Carrossel",
  hint = true,
  hintLabel = "Deslize para ver mais",
  scrollRef,
  onScroll,
}: SwipeCarouselProps) {
  const innerRef = useRef<HTMLDivElement>(null);
  const seenRef = useRef(
    typeof window === "undefined" ? false : localStorage.getItem(CAROUSEL_SWIPE_HINT_KEY) === "1",
  );
  const [overflows, setOverflows] = useState(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const measure = () => {
      const next = el.scrollWidth > el.clientWidth + 1;
      setOverflows((prev) => (prev === next ? prev : next));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
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
    const el = innerRef.current;
    if (!el) return;
    const onUserScroll = () => {
      if (el.scrollLeft <= 0) return;
      seenRef.current = true;
      try {
        localStorage.setItem(CAROUSEL_SWIPE_HINT_KEY, "1");
      } catch {
        // storage may be unavailable; hint simply stays until next swipe
      }
      setShowHint(false);
    };
    el.addEventListener("scroll", onUserScroll, { passive: true });
    return () => el.removeEventListener("scroll", onUserScroll);
  }, [showHint]);

  const reduced = prefersReducedMotion();

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
        className={cn("flex overflow-x-auto snap-x snap-proximity no-scrollbar", className)}
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
