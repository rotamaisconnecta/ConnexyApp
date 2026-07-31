import { useCallback, useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  animate,
  useMotionValueEvent,
  AnimatePresence,
  LayoutGroup,
} from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";

const GAP = 24;
const CARD_HEIGHT = 420;
const STAGGER = 0.05;
const STORAGE_PREFIX = "connexy.carousel.position";

type Breakpoint = "desktop" | "tablet" | "mobile";

function getBreakpoint(): Breakpoint {
  if (window.innerWidth >= 1024) return "desktop";
  if (window.innerWidth >= 640) return "tablet";
  return "mobile";
}

const CARD_WIDTH: Record<Breakpoint, number> = {
  desktop: 320,
  tablet: 300,
  mobile: 290,
};

function getCardWidth(bp: Breakpoint): number {
  return CARD_WIDTH[bp];
}

interface DepthStyle {
  scale: number;
  opacity: number;
}

function getDepthStyle(distance: number): DepthStyle {
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
  const containerRef = useRef<HTMLDivElement>(null);
  const stepRef = useRef(0);
  const restoredRef = useRef(false);
  const saveTimerRef = useRef<number | null>(null);
  const [bp, setBp] = useState<Breakpoint>("desktop");
  const [maxScroll, setMaxScroll] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const x = useMotionValue(0);

  useEffect(() => {
    setBp(getBreakpoint());
    const onResize = () => setBp(getBreakpoint());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const cardWidth = getCardWidth(bp);
  const step = cardWidth + GAP;
  stepRef.current = step;

  useEffect(() => {
    if (!containerRef.current) return;
    const measure = () => {
      const el = containerRef.current!;
      const w = el.offsetWidth;
      const total = items.length * cardWidth + Math.max(0, items.length - 1) * GAP;
      const next = Math.max(0, total - w);
      setMaxScroll(next);

      const key = section ? `${STORAGE_PREFIX}.${section}` : null;
      if (key && !restoredRef.current && next > 0) {
        restoredRef.current = true;
        const saved = Number(localStorage.getItem(key));
        if (Number.isFinite(saved)) {
          const clamped = Math.max(-next, Math.min(0, saved));
          animate(x, clamped, { type: "spring", stiffness: 260, damping: 32 });
        }
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [cardWidth, items.length, section, x]);

  useEffect(() => {
    const clamped = Math.max(-maxScroll, Math.min(0, x.get()));
    if (Math.abs(clamped - x.get()) > 0.5) {
      animate(x, clamped, { duration: 0 });
    }
  }, [maxScroll, x]);

  useMotionValueEvent(x, "change", (latest) => {
    const stepNow = stepRef.current || step;
    const index = Math.max(0, Math.min(items.length - 1, Math.round(-latest / stepNow)));
    setActiveIndex(index);

    const key = section ? `${STORAGE_PREFIX}.${section}` : null;
    if (!key) return;
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(() => {
      localStorage.setItem(key, String(latest));
    }, 200);
  });

  useEffect(() => {
    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  const scrollByStep = useCallback(
    (dir: 1 | -1) => {
      const target = Math.max(-maxScroll, Math.min(0, x.get() - dir * step));
      animate(x, target, { type: "spring", stiffness: 320, damping: 34 });
    },
    [x, step, maxScroll],
  );

  return (
    <div className={className}>
      <LayoutGroup>
        <div className="relative group" ref={containerRef}>
          <motion.div
            className="flex cursor-grab active:cursor-grabbing"
            style={{ gap: GAP, x, touchAction: "pan-y" }}
            drag={maxScroll > 0 ? "x" : false}
            dragConstraints={{ left: -maxScroll, right: 0 }}
            dragElastic={0.12}
            dragMomentum
            whileDrag={{ scale: 0.99, cursor: "grabbing" }}
          >
            <AnimatePresence initial={false}>
              {items.map((item, i) => {
                const depth = getDepthStyle(Math.abs(i - activeIndex));
                return (
                  <motion.div
                    key={i}
                    className="shrink-0"
                    style={{ width: cardWidth, height: CARD_HEIGHT }}
                    initial={{ opacity: 0, y: 20, scale: 0.96 }}
                    animate={{
                      opacity: depth.opacity,
                      y: 0,
                      scale: depth.scale,
                      transition: {
                        y: { delay: i * STAGGER, type: "spring", stiffness: 300, damping: 30 },
                        opacity: { type: "spring", stiffness: 300, damping: 30 },
                        scale: { type: "spring", stiffness: 300, damping: 30 },
                      },
                    }}
                    exit={{ opacity: 0, y: 20, scale: 0.96 }}
                    whileTap={{ scale: depth.scale * 0.98 }}
                  >
                    <div className="h-full">{renderCard(item, i)}</div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>

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
      </LayoutGroup>
    </div>
  );
}
