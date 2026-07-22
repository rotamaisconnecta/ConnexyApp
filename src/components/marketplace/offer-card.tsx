import { cn } from "@/lib/utils";
import { Clock, Tag } from "lucide-react";
import type { Promotion } from "@/lib/marketplace/business-types";
import {
  getDiscountLabel,
  getPromotionColor,
  formatPromotionExpiry,
} from "@/lib/marketplace/offer-utils";

interface OfferCardProps {
  promotion: Promotion;
  onSelect?: (id: string) => void;
}

export function OfferCard({ promotion, onSelect }: OfferCardProps) {
  return (
    <button
      onClick={() => onSelect?.(promotion.id)}
      aria-label={`Ver promoção ${promotion.title}`}
      className={cn(
        "w-56 shrink-0 rounded-2xl border p-3 text-left transition-all active:scale-[0.98]",
        getPromotionColor(promotion.discountType),
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 min-w-0">
          <span className="text-lg font-bold">
            {getDiscountLabel(promotion.discountType, promotion.discountValue)}
          </span>
          <h3 className="text-xs font-semibold leading-tight truncate">{promotion.title}</h3>
          <p className="text-[10px] opacity-70 line-clamp-2">{promotion.description}</p>
        </div>
      </div>

      <div className="flex items-center gap-1 mt-2">
        <Clock className="h-3 w-3 opacity-60" />
        <span className="text-[10px] opacity-70">
          {formatPromotionExpiry(promotion.validUntil)}
        </span>
      </div>

      {promotion.couponCode && (
        <div className="flex items-center gap-1 mt-1.5">
          <Tag className="h-3 w-3 opacity-60" />
          <span className="text-[10px] font-mono font-semibold opacity-80">
            {promotion.couponCode}
          </span>
        </div>
      )}
    </button>
  );
}
