import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { VehicleCategoryValue } from "@/lib/mobility/ride-types";
import { VEHICLE_CATEGORY_OPTIONS, type PriceEstimate } from "@/lib/mobility/ride-types";
import { getCategoryColor, getCategoryBorder } from "@/lib/mobility/vehicle-utils";
import { formatPrice } from "@/lib/mobility/ride-pricing";

interface RideTypeSelectorProps {
  selected: VehicleCategoryValue;
  onSelect: (category: VehicleCategoryValue) => void;
  estimates: PriceEstimate[];
}

export function RideTypeSelector({ selected, onSelect, estimates }: RideTypeSelectorProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Categoria
      </p>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {VEHICLE_CATEGORY_OPTIONS.map((opt) => {
          const est = estimates.find((e) => e.category === opt.value);
          const isSelected = selected === opt.value;

          return (
            <motion.button
              key={opt.value}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelect(opt.value)}
              className={cn(
                "flex-shrink-0 rounded-2xl border p-3 text-left transition-all min-w-[130px]",
                isSelected
                  ? `${getCategoryBorder(opt.value)} bg-accent/60 shadow-soft`
                  : "border-border bg-surface hover:bg-accent/30",
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{opt.icon}</span>
                <span
                  className={cn(
                    "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                    isSelected ? getCategoryColor(opt.value) : "bg-secondary text-muted-foreground",
                  )}
                >
                  {opt.seats} lugares
                </span>
              </div>
              <div className="font-semibold text-sm">{opt.label}</div>
              <div className="text-[11px] text-muted-foreground">{opt.description}</div>
              {est && (
                <div className="mt-1.5 font-display font-bold text-sm">
                  {formatPrice(est.finalPrice)}
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
