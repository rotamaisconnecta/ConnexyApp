import type { Coupon } from "@/lib/marketplace/business-types";
import { CouponCard } from "./coupon-card";
import { EmptyMarketplace } from "./empty-marketplace";

interface CouponListProps {
  coupons: Coupon[];
  title?: string;
  onCopy?: (code: string) => void;
}

export function CouponList({ coupons, title = "Cupons", onCopy }: CouponListProps) {
  if (coupons.length === 0) {
    return (
      <div className="space-y-2">
        <h3 className="font-semibold text-sm">{title}</h3>
        <EmptyMarketplace message="Nenhum cupom disponível" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-sm">{title}</h3>
      <div className="space-y-2">
        {coupons.map((coupon) => (
          <CouponCard key={coupon.id} coupon={coupon} onCopy={onCopy} />
        ))}
      </div>
    </div>
  );
}
