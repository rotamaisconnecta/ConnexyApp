import { useState } from "react";
import { cn } from "@/lib/utils";
import type { PaymentMethodValue } from "@/lib/mobility/ride-types";
import { PAYMENT_METHOD_OPTIONS } from "@/lib/mobility/ride-types";
import { Check } from "lucide-react";

interface PaymentSelectorProps {
  selected: PaymentMethodValue;
  onSelect: (method: PaymentMethodValue) => void;
}

export function PaymentSelector({ selected, onSelect }: PaymentSelectorProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Pagamento
      </p>
      <div className="rounded-2xl border border-border bg-surface divide-y divide-border overflow-hidden">
        {PAYMENT_METHOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
              selected === opt.value ? "bg-accent/60" : "hover:bg-accent/30",
            )}
          >
            <span className="text-lg">{opt.icon}</span>
            <span className="flex-1 text-sm font-medium">{opt.label}</span>
            {selected === opt.value && <Check className="h-4 w-4 text-primary" />}
          </button>
        ))}
      </div>
    </div>
  );
}
