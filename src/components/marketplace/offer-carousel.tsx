import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Promotion } from "@/lib/marketplace/business-types";
import { OfferCard } from "./offer-card";

interface OfferCarouselProps {
  promotions: Promotion[];
  onSelect?: (id: string) => void;
}

export function OfferCarousel({ promotions, onSelect }: OfferCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scroll(direction: "left" | "right") {
    if (!scrollRef.current) return;
    const amount = direction === "left" ? -220 : 220;
    scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
  }

  if (promotions.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Promoções</h3>
        <div className="flex gap-1">
          <button
            onClick={() => scroll("left")}
            aria-label="Anterior"
            className="h-7 w-7 grid place-items-center rounded-full bg-secondary"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => scroll("right")}
            aria-label="Próximo"
            className="h-7 w-7 grid place-items-center rounded-full bg-secondary"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {promotions.map((promo) => (
          <OfferCard key={promo.id} promotion={promo} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}
