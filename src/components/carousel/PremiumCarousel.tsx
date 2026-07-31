import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";

const GAP = 16;
const PEEK_RATIO = 0.15;
const STAGGER = 0.05;

type Breakpoint = "desktop" | "tablet" | "mobile";

function getBreakpoint(): Breakpoint {
  if (window.innerWidth >= 1024) return "desktop";
  if (window.innerWidth >= 640) return "tablet";
  return "mobile";
}

function getVisibleCount(bp: Breakpoint): number {
  if (bp === "desktop") return 4;
  if (bp === "tablet") return 3;
  return 2;
}

interface PremiumCarouselProps<T> {
  items: T[];
  renderCard: (item: T, index: number) => React.ReactNode;
  className?: string;
}

export function PremiumCarousel<T>({ items, renderCard, className }: PremiumCarouselProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [bp, setBp] = useState<Breakpoint>("desktop");
  const [cardWidth, setCardWidth] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);
  const x = useMotionValue(0);

  useEffect(() => {
    setBp(getBreakpoint());
    const onResize = () => setBp(getBreakpoint());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const visibleCount = getVisibleCount(bp);

  useEffect(() => {
    if (!containerRef.current) return;
    const measure = () => {
      const el = containerRef.current!;
      const w = el.offsetWidth;
      const cw = (w - (visibleCount - 1) * GAP) / (visibleCount + PEEK_RATIO);
      setCardWidth(cw);
      const total = items.length * (cw + GAP) - GAP;
      setMaxScroll(Math.max(0, total - w));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [visibleCount, items.length]);

  useEffect(() => {
    const clamped = Math.max(-maxScroll, Math.min(0, x.get()));
    if (Math.abs(clamped - x.get()) > 0.5) {
      animate(x, clamped, { duration: 0 });
    }
  }, [maxScroll, x]);

  const step = cardWidth + GAP;

  const scrollByStep = useCallback(
    (dir: 1 | -1) => {
      const target = Math.max(-maxScroll, Math.min(0, x.get() - dir * step));
      animate(x, target, { type: "spring", stiffness: 320, damping: 34 });
    },
    [x, step, maxScroll],
  );

  return (
    <div className={className}>
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
          {items.map((item, i) => (
            <motion.div
              key={i}
              className="shrink-0"
              style={{ width: cardWidth }}
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * STAGGER, duration: 0.4, ease: "easeOut" }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <div className="h-full">{renderCard(item, i)}</div>
            </motion.div>
          ))}
        </motion.div>

        {maxScroll > 0 && bp === "desktop" && (
          <>
            <button
              onClick={() => scrollByStep(-1)}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-lg border border-border text-foreground opacity-0 group-hover:opacity-100 transition-all hover:scale-110 hover:shadow-xl"
              aria-label="Anterior"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => scrollByStep(1)}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-lg border border-border text-foreground opacity-0 group-hover:opacity-100 transition-all hover:scale-110 hover:shadow-xl"
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
