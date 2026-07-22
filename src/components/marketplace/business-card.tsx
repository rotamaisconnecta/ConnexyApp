import { cn } from "@/lib/utils";
import { Star, MapPin, Tag } from "lucide-react";
import type { Business } from "@/lib/marketplace/business-types";
import { getCategoryLabel, getCategoryColor } from "@/lib/marketplace/category-utils";
import { formatDistance } from "@/lib/marketplace/distance-utils";
import { getDiscountLabel, getPromotionColor } from "@/lib/marketplace/offer-utils";

interface BusinessCardProps {
  business: Business;
  onSelect?: (id: string) => void;
}

export function BusinessCard({ business, onSelect }: BusinessCardProps) {
  const primaryPhoto = business.photos.find((p) => p.isPrimary) ?? business.photos[0];
  const firstPromo = business.promotions[0];

  return (
    <button
      onClick={() => onSelect?.(business.id)}
      aria-label={`Abrir ${business.name}`}
      className="w-full text-left rounded-2xl bg-surface border border-border/50 overflow-hidden shadow-soft transition-all active:scale-[0.98]"
    >
      <div className="relative h-36 overflow-hidden">
        {primaryPhoto ? (
          <img
            src={primaryPhoto.url}
            alt={primaryPhoto.alt}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/5 grid place-items-center text-3xl">
            📍
          </div>
        )}

        <div className="absolute top-2 left-2 flex gap-1.5">
          <span
            className={cn(
              "text-[10px] font-semibold px-2 py-0.5 rounded-full",
              getCategoryColor(business.category),
            )}
          >
            {getCategoryLabel(business.category)}
          </span>
          {business.isOpen ? (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-success/15 text-success">
              Aberto
            </span>
          ) : (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              Fechado
            </span>
          )}
        </div>

        {firstPromo && (
          <div
            className={cn(
              "absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full text-white",
              getPromotionColor(firstPromo.discountType).split(" ")[0],
            )}
          >
            {getDiscountLabel(firstPromo.discountType, firstPromo.discountValue)}
          </div>
        )}

        <div className="absolute bottom-2 right-2 rounded-full bg-surface/90 backdrop-blur px-2 py-0.5 text-[10px] font-medium flex items-center gap-1">
          <MapPin className="h-3 w-3 text-primary" />
          {formatDistance(business.distanceMeters)}
        </div>
      </div>

      <div className="p-3 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm leading-tight truncate">{business.name}</h3>
          <div className="flex items-center gap-0.5 shrink-0">
            <Star className="h-3 w-3 fill-amber text-amber" />
            <span className="text-xs font-semibold">{business.rating.average}</span>
            <span className="text-[10px] text-muted-foreground">
              ({business.rating.totalReviews})
            </span>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground line-clamp-2">{business.description}</p>

        {business.tags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            {business.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground"
              >
                <Tag className="h-2 w-2" />
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-muted-foreground truncate max-w-[60%]">
            {business.address}
          </span>
          {business.couponCount > 0 && (
            <span className="text-[10px] font-medium text-primary">
              {business.couponCount} cupom{business.couponCount > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
