import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useAnimationControls } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Eye, MapPin } from "lucide-react";
import { PresenceDot } from "@/components/presence-dot";
import type { NearbyPeopleSectionData } from "@/lib/feed/feed-types";

interface FeedNearbyPeopleProps {
  data: NearbyPeopleSectionData;
}

const AUTOPLAY_INTERVAL = 5000;
const STAGGER_DELAY = 0.05;
const ITEM_GAP = 12;

function useVisibleCount(): number {
  const [count, setCount] = useState(4);
  useEffect(() => {
    const update = () => {
      if (window.innerWidth < 640) setCount(2);
      else if (window.innerWidth < 1024) setCount(3);
      else setCount(4);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return count;
}

function InfiniteCarousel({
  people,
  visibleCount,
  isPaused,
  onInteraction,
}: {
  people: NearbyPeopleSectionData["people"];
  visibleCount: number;
  isPaused: boolean;
  onInteraction: () => void;
}) {
  const controls = useAnimationControls();
  const [index, setIndex] = useState(people.length);
  const [isAnimating, setIsAnimating] = useState(false);
  const jumpRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const base = people.length;
  const looped = [...people, ...people, ...people];
  const [cardWidth, setCardWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const update = () => {
      const w = containerRef.current!.offsetWidth;
      const gapTotal = ITEM_GAP * (visibleCount - 1);
      setCardWidth((w - gapTotal) / visibleCount);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [visibleCount]);

  const totalItems = looped.length;
  const trackWidth = totalItems * cardWidth + (totalItems - 1) * ITEM_GAP;
  const xTarget = -(index * (cardWidth + ITEM_GAP));

  const goTo = useCallback(
    (nextIndex: number, animated: boolean) => {
      if (nextIndex < 0) nextIndex = 0;
      if (nextIndex > totalItems - visibleCount) nextIndex = totalItems - visibleCount;
      setIndex(nextIndex);
      jumpRef.current = !animated;
    },
    [totalItems, visibleCount],
  );

  const snapToSlide = useCallback(
    (rawIndex: number) => {
      const clamped = Math.max(0, Math.min(rawIndex, totalItems - visibleCount));
      controls.start({ x: -(clamped * (cardWidth + ITEM_GAP)) });
      return clamped;
    },
    [controls, cardWidth, totalItems, visibleCount],
  );

  const animateTo = useCallback(
    (targetIndex: number) => {
      setIsAnimating(true);
      const clamped = Math.max(0, Math.min(targetIndex, totalItems - visibleCount));
      controls
        .start({
          x: -(clamped * (cardWidth + ITEM_GAP)),
          transition: { type: "spring", stiffness: 300, damping: 30 },
        })
        .then(() => {
          setIndex(clamped);
          setIsAnimating(false);
        });
    },
    [controls, cardWidth, totalItems, visibleCount],
  );

  const slideNext = useCallback(() => {
    onInteraction();
    const next = index + 1;
    if (next + visibleCount > totalItems) {
      jumpRef.current = true;
      setIndex(base);
      controls.set({ x: -(base * (cardWidth + ITEM_GAP)) });
    } else {
      animateTo(next);
    }
  }, [index, visibleCount, totalItems, base, controls, cardWidth, animateTo, onInteraction]);

  const slidePrev = useCallback(() => {
    onInteraction();
    const prev = index - 1;
    if (prev < 0) {
      jumpRef.current = true;
      const wrapIndex = base * 2 - visibleCount;
      setIndex(wrapIndex);
      controls.set({ x: -(wrapIndex * (cardWidth + ITEM_GAP)) });
    } else {
      animateTo(prev);
    }
  }, [index, base, visibleCount, controls, cardWidth, animateTo, onInteraction]);

  useEffect(() => {
    if (isPaused || isAnimating) return;
    const timer = setInterval(slideNext, AUTOPLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [isPaused, isAnimating, slideNext]);

  const handleDragEnd = useCallback(
    (
      _: MouseEvent | TouchEvent | PointerEvent,
      info: { offset: { x: number }; velocity: { x: number } },
    ) => {
      onInteraction();
      const threshold = cardWidth * 0.25;
      if (info.offset.x > threshold || info.velocity.x > 500) {
        slidePrev();
      } else if (info.offset.x < -threshold || info.velocity.x < -500) {
        slideNext();
      }
    },
    [cardWidth, slideNext, slidePrev, onInteraction],
  );

  const rawIndex = Math.round(index);
  const slideIndex = ((rawIndex % people.length) + people.length) % people.length;

  return (
    <div className="relative" ref={containerRef}>
      <motion.div
        className="flex"
        style={{ gap: ITEM_GAP, width: trackWidth }}
        animate={
          jumpRef.current
            ? { x: xTarget, transition: { duration: 0 } }
            : { x: xTarget, transition: { type: "spring", stiffness: 300, damping: 30 } }
        }
        onAnimationComplete={() => {
          jumpRef.current = false;
        }}
        drag="x"
        dragConstraints={containerRef}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        whileTap={{ cursor: "grabbing" }}
      >
        {looped.map((person, i) => (
          <motion.div
            key={`${person.id}-${i}`}
            className="shrink-0"
            style={{ width: cardWidth }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: (i % people.length) * STAGGER_DELAY,
              duration: 0.4,
              ease: "easeOut",
            }}
            whileHover={{ scale: 1.03, boxShadow: "0 12px 32px rgba(0,0,0,0.12)" }}
            whileTap={{ scale: 0.97 }}
          >
            <div className="rounded-2xl bg-surface border border-border shadow-soft overflow-hidden transition-shadow duration-200 h-full flex flex-col">
              <div className="relative" style={{ paddingBottom: "100%" }}>
                <img
                  src={person.photo}
                  alt={person.name}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute top-2 right-2 z-10">
                  <PresenceDot online={person.online} size={10} />
                </div>
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 to-transparent" />
                <span className="absolute bottom-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/90 text-gray-800 shadow-soft flex items-center gap-1 z-10">
                  <MapPin className="h-2.5 w-2.5" />
                  {person.distance}
                </span>
              </div>
              <div className="p-2.5 flex flex-col gap-1.5 flex-1">
                <div className="flex items-center gap-1">
                  <span className="font-display font-bold text-xs truncate">{person.name}</span>
                  {person.age != null && (
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {person.age} anos
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {person.interests.slice(0, 3).map((interest) => (
                    <span
                      key={interest}
                      className="text-[9px] bg-secondary rounded-full px-1.5 py-0.5 truncate max-w-full"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-1 mt-auto">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${person.online ? "bg-green-500" : "bg-gray-300"}`}
                  />
                  <span
                    className={`text-[9px] font-medium ${person.online ? "text-green-600" : "text-gray-400"}`}
                  >
                    {person.online ? "Online" : "Offline"}
                  </span>
                </div>
                <Link
                  to="/perfil/$id"
                  params={{ id: person.id }}
                  className="mt-1 w-full flex items-center justify-center gap-1 rounded-full bg-primary/10 text-primary text-[10px] font-semibold py-1.5 transition-colors hover:bg-primary/20"
                >
                  <Eye className="h-3 w-3" />
                  Visualizar
                </Link>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {visibleCount >= 4 && (
        <>
          <button
            onClick={slidePrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-lg border border-border text-foreground transition-all hover:scale-110 hover:shadow-xl"
            aria-label="Anterior"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            onClick={slideNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-lg border border-border text-foreground transition-all hover:scale-110 hover:shadow-xl"
            aria-label="Próximo"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </>
      )}

      <div className="flex justify-center gap-1.5 mt-3">
        {people.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              onInteraction();
              animateTo(base + i);
            }}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === slideIndex
                ? "w-5 bg-primary"
                : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
            }`}
            aria-label={`Ir para pessoa ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export function FeedNearbyPeople({ data }: FeedNearbyPeopleProps) {
  const [isPaused, setIsPaused] = useState(false);
  const visibleCount = useVisibleCount();
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleInteraction = useCallback(() => {
    setIsPaused(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setIsPaused(false), 5000);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="mx-4"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm" aria-hidden>
              👥
            </span>
            <h3 className="font-display text-base font-bold truncate">Pessoas Próximas</h3>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Conheça pessoas que compartilham seus interesses
          </p>
        </div>
        <Link
          to="/pessoas"
          className="shrink-0 text-xs font-semibold text-primary flex items-center gap-0.5 transition-all duration-200 hover:gap-1"
        >
          Ver todas <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <InfiniteCarousel
        people={data.people}
        visibleCount={visibleCount}
        isPaused={isPaused}
        onInteraction={handleInteraction}
      />
    </motion.div>
  );
}
