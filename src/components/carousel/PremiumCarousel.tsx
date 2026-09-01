import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { SwipeCarousel } from "@/components/system/swipe-carousel";
import { prefersReducedMotion } from "@/lib/carousel/hint";

const GAP = 16;
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

interface PremiumCarouselProps<T> {
  items: T[];
  renderCard: (item: T, index: number) => React.ReactNode;
  className?: string;
  section?: string;
  cardWidths?: Partial<Record<Breakpoint, number>>;
  cardHeight?: number;
}

export function PremiumCarousel<T>({
  items,
  renderCard,
  className,
  section,
  cardWidths,
  cardHeight: cardHeightProp,
}: PremiumCarouselProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const restoredRef = useRef(false);
  const saveTimerRef = useRef<number | null>(null);
  const [breakpoint, setBreakpoint] = useState<Breakpoint>("mobile");
  const [maxScroll, setMaxScroll] = useState(0);

  useEffect(() => {
    setBreakpoint(getBreakpoint());
    const onResize = () => setBreakpoint(getBreakpoint());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const cardWidth = cardWidths?.[breakpoint] ?? CARD_WIDTH[breakpoint];
  const cardHeight = cardHeightProp ?? CARD_HEIGHT;
  const step = cardWidth + GAP;
  const reduced = prefersReducedMotion();

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const measure = () => {
      const total = items.length * cardWidth + Math.max(0, items.length - 1) * GAP;
      const next = Math.max(0, total - element.clientWidth);
      setMaxScroll(next);
      if (next > 0 && section && !restoredRef.current) {
        const saved = Number(localStorage.getItem(`${STORAGE_PREFIX}.${section}`));
        if (Number.isFinite(saved)) {
          restoredRef.current = true;
          element.scrollTo({ left: Math.max(0, Math.min(next, -saved)), behavior: "auto" });
        }
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [cardWidth, items.length, section]);

  const onScroll = useCallback(() => {
    const element = scrollRef.current;
    if (!element || !section) return;
    if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      localStorage.setItem(`${STORAGE_PREFIX}.${section}`, String(-element.scrollLeft));
    }, 200);
  }, [section]);

  useEffect(
    () => () => {
      if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
    },
    [],
  );

  const scrollByStep = useCallback(
    (direction: 1 | -1) => {
      scrollRef.current?.scrollBy({
        left: direction * step,
        behavior: reduced ? "auto" : "smooth",
      });
    },
    [step, reduced],
  );

  return (
    <div className={className}>
      <div className="group relative">
        <SwipeCarousel
          scrollRef={scrollRef}
          onScroll={onScroll}
          ariaLabel={section ? `Carrossel ${section}` : "Carrossel"}
          className="gap-4"
        >
          {items.map((item, index) => (
            <div
              key={index}
              className="shrink-0"
              style={{ width: cardWidth, height: cardHeight }}
            >
              {renderCard(item, index)}
            </div>
          ))}
        </SwipeCarousel>

        {maxScroll > 0 && breakpoint === "desktop" && (
          <>
            <button
              type="button"
              onClick={() => scrollByStep(-1)}
              className="absolute left-0 top-1/2 z-20 flex h-9 w-9 -translate-x-3 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white text-foreground opacity-0 shadow-lg transition-all hover:scale-110 hover:shadow-xl group-hover:opacity-100"
              aria-label="Anterior"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollByStep(1)}
              className="absolute right-0 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 translate-x-3 items-center justify-center rounded-full border border-border bg-white text-foreground opacity-0 shadow-lg transition-all hover:scale-110 hover:shadow-xl group-hover:opacity-100"
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
