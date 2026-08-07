import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { SwipeCarousel } from "@/components/system/swipe-carousel";
import { prefersReducedMotion } from "@/lib/carousel/hint";

const GAP = 24;
const CARD_HEIGHT = 300;
const STORAGE_PREFIX = "connexy.carousel.position";

type Breakpoint = "desktop" | "tablet" | "mobile";

function getBreakpoint(): Breakpoint {
  if (typeof window === "undefined") return "mobile";
  if (window.innerWidth >= 1024) return "desktop";
  if (window.innerWidth >= 640) return "tablet";
  return "mobile";
}

const CARD_WIDTH: Record<Breakpoint, number> = {
  desktop: 290,
  tablet: 270,
  mobile: 260,
};

function depthStyle(distance: number): { scale: number; opacity: number } {
  if (distance === 0) return { scale: 1, opacity: 1 };
  if (distance === 1) return { scale: 0.96, opacity: 0.85 };
  return { scale: 0.92, opacity: 0.7 };
}

interface PremiumCarouselProps<T> {
  items: T[];
  renderCard: (item: T, index: number) => React.ReactNode;
  className?: string;
  section?: string;
}

export function PremiumCarousel<T>({
  items,
  renderCard,
  className,
  section,
}: PremiumCarouselProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const restoredRef = useRef(false);
  const saveTimerRef = useRef<number | null>(null);
  const [bp, setBp] = useState<Breakpoint>("mobile");
  const [maxScroll, setMaxScroll] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setBp(getBreakpoint());
    const onResize = () => setBp(getBreakpoint());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const cardWidth = CARD_WIDTH[bp];
  const step = cardWidth + GAP;
  const reduced = prefersReducedMotion();

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      const total = items.length * cardWidth + Math.max(0, items.length - 1) * GAP;
      const next = Math.max(0, total - w);
      setMaxScroll(next);
      if (next > 0 && section && !restoredRef.current) {
        const saved = Number(localStorage.getItem(`${STORAGE_PREFIX}.${section}`));
        if (Number.isFinite(saved)) {
          restoredRef.current = true;
          el.scrollTo({ left: Math.max(0, Math.min(next, -saved)), behavior: "auto" });
        }
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [cardWidth, items.length, section]);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / step);
    setActiveIndex(Math.max(0, Math.min(items.length - 1, index)));
    if (!section) return;
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(() => {
      localStorage.setItem(`${STORAGE_PREFIX}.${section}`, String(-el.scrollLeft));
    }, 200);
  }, [step, items.length, section]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  const scrollByStep = useCallback(
    (dir: 1 | -1) => {
      const el = scrollRef.current;
      if (!el) return;
      el.scrollBy({ left: dir * step, behavior: reduced ? "auto" : "smooth" });
    },
    [step, reduced],
  );

  const transition = reduced ? undefined : "transform 0.35s ease, opacity 0.35s ease";

  return (
    <div className={className}>
      <div className="relative group">
        <SwipeCarousel
          scrollRef={scrollRef}
          onScroll={onScroll}
          ariaLabel={section ? `Carrossel ${section}` : "Carrossel"}
          className="gap-6"
        >
          {items.map((item, i) => {
            const depth = depthStyle(Math.abs(i - activeIndex));
            return (
              <div
                key={i}
                className="shrink-0"
                style={{
                  width: cardWidth,
                  height: CARD_HEIGHT,
                  transform: `scale(${depth.scale})`,
                  opacity: depth.opacity,
                  transition,
                }}
              >
                {renderCard(item, i)}
              </div>
            );
          })}
        </SwipeCarousel>

        {maxScroll > 0 && bp === "desktop" && (
          <>
            <button
              onClick={() => scrollByStep(-1)}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-lg border border-border text-foreground opacity-0 group-hover:opacity-100 transition-all hover:scale-110 hover:shadow-xl"
              aria-label="Anterior"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => scrollByStep(1)}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-lg border border-border text-foreground opacity-0 group-hover:opacity-100 transition-all hover:scale-110 hover:shadow-xl"
              aria-label="Próximo"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
