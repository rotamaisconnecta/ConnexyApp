import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Colors, Radius } from "@/lib/branding/brand-config";

interface CarouselItem {
  id: string;
  content: ReactNode;
}

interface CarouselProps {
  items: CarouselItem[];
  autoPlay?: boolean;
  interval?: number;
  showDots?: boolean;
  className?: string;
}

export function Carousel({
  items,
  autoPlay = false,
  interval = 3000,
  showDots = true,
  className,
}: CarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>(null);

  const scrollToIndex = useCallback((index: number) => {
    const container = containerRef.current;
    if (!container) return;
    const child = container.children[index] as HTMLElement | undefined;
    if (!child) return;
    container.scrollTo({ left: child.offsetLeft, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!autoPlay || items.length <= 1) return;
    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % items.length;
        scrollToIndex(next);
        return next;
      });
    }, interval);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoPlay, interval, items.length, scrollToIndex]);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const scrollLeft = container.scrollLeft;
    const childWidth = container.children[0]
      ? (container.children[0] as HTMLElement).offsetWidth
      : 1;
    const index = Math.round(scrollLeft / childWidth);
    setActiveIndex(index);
  }, []);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none"
        style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
      >
        {items.map((item) => (
          <div key={item.id} className="min-w-full snap-center flex-shrink-0">
            {item.content}
          </div>
        ))}
      </div>
      {showDots && items.length > 1 && (
        <div className="flex justify-center gap-2">
          {items.map((item, i) => (
            <motion.button
              key={item.id}
              onClick={() => {
                setActiveIndex(i);
                scrollToIndex(i);
              }}
              animate={{
                scale: i === activeIndex ? 1.2 : 1,
                opacity: i === activeIndex ? 1 : 0.4,
              }}
              transition={{ duration: 0.2 }}
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: i === activeIndex ? Colors.brand.primary : Colors.border,
                borderRadius: Radius.floating,
              }}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
