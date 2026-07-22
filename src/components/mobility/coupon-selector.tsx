import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Coupon } from "@/lib/mobility/ride-types";
import { Tag, X, Check } from "lucide-react";

interface CouponSelectorProps {
  coupons: Coupon[];
  selectedCode: string | null;
  onSelect: (code: string | null) => void;
}

export function CouponSelector({ coupons, selectedCode, onSelect }: CouponSelectorProps) {
  const [input, setInput] = useState("");
  const activeCoupons = coupons.filter((c) => c.active);

  function handleApply() {
    const found = activeCoupons.find((c) => c.code.toLowerCase() === input.toLowerCase());
    if (found) {
      onSelect(found.code);
      setInput("");
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Cupom de desconto
      </p>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            placeholder="Digite o cupom"
            className="w-full h-10 rounded-xl border border-border bg-surface pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <button
          onClick={handleApply}
          disabled={!input.trim()}
          className="h-10 rounded-xl bg-primary text-primary-foreground text-xs font-semibold px-4 disabled:opacity-50"
        >
          Aplicar
        </button>
      </div>

      {selectedCode && (
        <div className="flex items-center gap-2 rounded-xl bg-success/15 text-success px-3 py-2">
          <Check className="h-4 w-4 shrink-0" />
          <span className="text-sm font-medium flex-1">Cupom {selectedCode} aplicado</span>
          <button onClick={() => onSelect(null)} aria-label="Remover cupom">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {activeCoupons.length > 0 && (
        <div className="space-y-1.5">
          {activeCoupons.map((coupon) => (
            <button
              key={coupon.id}
              onClick={() => onSelect(coupon.code)}
              className={cn(
                "w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                selectedCode === coupon.code
                  ? "border-primary bg-accent/60"
                  : "border-border hover:bg-accent/30",
              )}
            >
              <span className="text-lg">🎁</span>
              <div className="flex-1">
                <div className="text-sm font-semibold">{coupon.label}</div>
                <div className="text-[11px] text-muted-foreground">{coupon.description}</div>
              </div>
              <span className="text-sm font-bold text-primary">{coupon.discountPercent}% OFF</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
