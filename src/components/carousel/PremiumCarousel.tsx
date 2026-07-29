import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useAnimationControls } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";

const AUTOPLAY_MS = 5000;
const AUTOPLAY_RESUME_MS = 8000;
const GAP = 12;
const PEEK_DESKTOP = 48;
const PEEK_TABLET = 40;
const PEEK_MOBILE = 32;
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

function getPeek(bp: Breakpoint): number {
  if (bp === "desktop") return PEEK_DESKTOP;
  if (bp === "tablet") return PEEK_TABLET;
  return PEEK_MOBILE;
}

interface PremiumCarouselProps<T> {
  items: T[];
  renderCard: (item: T, index: number, isActive: boolean) => React.ReactNode;
  className?: string;
}

export function PremiumCarousel<T>({ items, renderCard, className }: PremiumCarouselProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const controls = useAnimationControls();
  const [bp, setBp] = useState<Breakpoint>("desktop");
  const [index, setIndex] = useState(items.length);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const jumpRef = useRef(false);

  useEffect(() => {
    setBp(getBreakpoint());
    const onResize = () => setBp(getBreakpoint());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const visibleCount = getVisibleCount(bp);
  const peek = getPeek(bp);
  const total = items.length;
  const looped = [...items, ...items, ...items];
  const base = total;

  const [cardWidth, setCardWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const measure = () => {
      const w = containerRef.current!.offsetWidth;
      const cw = (w - (visibleCount - 1) * GAP - peek) / visibleCount;
      setCardWidth(cw);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [visibleCount, peek]);

  const step = cardWidth + GAP;

  const animateTo = useCallback(
    (target: number) => {
      if (isAnimating) return;
      setIsAnimating(true);
      const clamped = Math.max(0, Math.min(target, looped.length - visibleCount));
      controls
        .start({
          x: -(clamped * step),
          transition: { type: "spring", stiffness: 300, damping: 30 },
        })
        .then(() => {
          setIndex(clamped);
          setIsAnimating(false);
        });
    },
    [controls, step, looped.length, visibleCount, isAnimating],
  );

  const slideNext = useCallback(() => {
    setHasInteracted(true);
    const next = index + 1;
    if (next + visibleCount > looped.length) {
      jumpRef.current = true;
      setIndex(base);
      controls.set({ x: -(base * step) });
    } else {
      animateTo(next);
    }
  }, [index, visibleCount, looped.length, base, controls, step, animateTo]);

  const slidePrev = useCallback(() => {
    setHasInteracted(true);
    const prev = index - 1;
    if (prev < 0) {
      jumpRef.current = true;
      const wrapTo = base * 2 - visibleCount;
      setIndex(wrapTo);
      controls.set({ x: -(wrapTo * step) });
    } else {
      animateTo(prev);
    }
  }, [index, base, visibleCount, controls, step, animateTo]);

  useEffect(() => {
    if (hasInteracted || isAnimating) return;
    const timer = setInterval(slideNext, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [hasInteracted, isAnimating, slideNext]);

  useEffect(() => {
    if (!hasInteracted) return;
    const timer = setTimeout(() => setHasInteracted(false), AUTOPLAY_RESUME_MS);
    return () => clearTimeout(timer);
  }, [hasInteracted]);

  const handleDragEnd = useCallback(
    (
      _: MouseEvent | TouchEvent | PointerEvent,
      info: { offset: { x: number }; velocity: { x: number } },
    ) => {
      setHasInteracted(true);
      const threshold = step * 0.15;
      if (info.offset.x > threshold || info.velocity.x > 300) {
        slidePrev();
      } else if (info.offset.x < -threshold || info.velocity.x < -300) {
        slideNext();
      }
    },
    [step, slideNext, slidePrev],
  );

  const rawIndex = Math.round(index);
  const realIndex = ((rawIndex % total) + total) % total;
  const progress = ((realIndex + 1) / total) * 100;

  return (
    <div className={className}>
      <div className="relative group" ref={containerRef}>
        <motion.div
          className="flex cursor-grab active:cursor-grabbing"
          style={{ gap: GAP }}
          animate={
            jumpRef.current
              ? { x: -(index * step), transition: { duration: 0 } }
              : { x: -(index * step), transition: { type: "spring", stiffness: 300, damping: 30 } }
          }
          onAnimationComplete={() => {
            jumpRef.current = false;
          }}
          drag="x"
          dragElastic={0.15}
          dragMomentum
          onDragEnd={handleDragEnd}
          whileDrag={{ scale: 0.98, cursor: "grabbing" }}
        >
          {looped.map((item, i) => {
            const itemRealIndex = i % total;
            const isActive = itemRealIndex === realIndex;
            return (
              <motion.div
                key={`${itemRealIndex}-${i}`}
                className="shrink-0"
                style={{ width: cardWidth }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: isActive ? 1 : 0.7, y: 0 }}
                transition={{
                  delay: itemRealIndex * STAGGER,
                  duration: 0.4,
                  ease: "easeOut",
                }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onHoverStart={() => setHasInteracted(true)}
              >
                <div
                  className="h-full"
                  style={{ boxShadow: isActive ? "0 8px 24px rgba(0,0,0,0.08)" : "none" }}
                >
                  {renderCard(item, i, isActive)}
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {bp === "desktop" && (
          <>
            <button
              onClick={slidePrev}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-lg border border-border text-foreground opacity-0 group-hover:opacity-100 transition-all hover:scale-110 hover:shadow-xl"
              aria-label="Anterior"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              onClick={slideNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-lg border border-border text-foreground opacity-0 group-hover:opacity-100 transition-all hover:scale-110 hover:shadow-xl"
              aria-label="Próximo"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </>
        )}

        <div className="flex items-center gap-2 mt-3 px-1">
          <div className="flex-1 h-1 rounded-full bg-muted-foreground/20 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60"
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
            />
          </div>
          <span className="text-[10px] font-medium text-muted-foreground shrink-0 tabular-nums">
            {realIndex + 1}/{total}
          </span>
        </div>
      </div>
    </div>
  );
}
