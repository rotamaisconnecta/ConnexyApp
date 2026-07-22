import { Tag, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Coupon } from "@/lib/marketplace/business-types";
import {
  getCouponDiscountLabel,
  getCouponColor,
  getCouponDiscountBgColor,
  formatCouponExpiry,
  formatUsageLimit,
  isCouponUsable,
} from "@/lib/marketplace/coupon-utils";

interface CouponCardProps {
  coupon: Coupon;
  onCopy?: (code: string) => void;
}

export function CouponCard({ coupon, onCopy }: CouponCardProps) {
  const usable = isCouponUsable(coupon);

  return (
    <div
      className={cn(
        "rounded-2xl border-2 border-dashed p-3 transition-all",
        getCouponColor(coupon.discountType),
        !usable && "opacity-50",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <span
            className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded-full",
              getCouponDiscountBgColor(coupon.discountType),
            )}
          >
            {getCouponDiscountLabel(coupon)}
          </span>
          <h3 className="text-sm font-semibold leading-tight">{coupon.label}</h3>
          <p className="text-[11px] text-muted-foreground line-clamp-2">{coupon.description}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-2 flex-wrap">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">
            {formatCouponExpiry(coupon.validUntil)}
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground">{formatUsageLimit(coupon)}</span>
      </div>

      {usable && (
        <button
          onClick={() => onCopy?.(coupon.code)}
          className="mt-2 w-full rounded-full bg-primary/10 text-primary text-xs font-semibold py-2 flex items-center justify-center gap-1.5"
        >
          <Tag className="h-3 w-3" />
          Copiar código: {coupon.code}
        </button>
      )}
    </div>
  );
}
