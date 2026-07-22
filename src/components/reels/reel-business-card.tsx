import { Star, Tag, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReelBusiness } from "@/lib/reels/reel-types";

interface ReelBusinessCardProps {
  business: ReelBusiness;
  onViewOffers: () => void;
}

export function ReelBusinessCard({ business, onViewOffers }: ReelBusinessCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-surface/90 backdrop-blur-xl p-4 border border-border",
        "max-w-[280px]",
      )}
    >
      <div className="flex items-center gap-3">
        <img
          src={business.logo}
          alt={business.name}
          className="h-10 w-10 rounded-xl object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{business.name}</p>
          <p className="text-xs text-muted-foreground">{business.category}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <span className="text-xs font-semibold text-foreground">{business.rating}</span>
        </div>
        <span className="text-xs text-muted-foreground">({business.reviewCount} avaliações)</span>
      </div>
      {business.offers.length > 0 && (
        <button
          onClick={onViewOffers}
          className={cn(
            "mt-3 flex w-full items-center justify-between rounded-xl",
            "bg-gradient-brand px-3 py-2 text-white",
          )}
        >
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            <span className="text-xs font-semibold">Ver Ofertas</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-white/20 text-[10px] font-bold">
              {business.offers.length}
            </span>
            <ChevronRight className="h-4 w-4" />
          </div>
        </button>
      )}
    </div>
  );
}
