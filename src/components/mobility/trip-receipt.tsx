import type { TripReceipt as TripReceiptType } from "@/lib/mobility/ride-types";
import { formatPrice } from "@/lib/mobility/ride-pricing";
import { PAYMENT_METHOD_OPTIONS } from "@/lib/mobility/ride-types";
import { CheckCircle } from "lucide-react";

interface TripReceiptProps {
  receipt: TripReceiptType;
  onDone?: () => void;
}

export function TripReceipt({ receipt, onDone }: TripReceiptProps) {
  const paymentLabel =
    PAYMENT_METHOD_OPTIONS.find((p) => p.value === receipt.paymentMethod)?.label ?? "";

  return (
    <div className="flex flex-col items-center px-6 pt-6 flex-1">
      <div className="h-16 w-16 rounded-full bg-success/15 grid place-items-center">
        <CheckCircle className="h-8 w-8 text-success" />
      </div>

      <h1 className="mt-4 font-display text-xl font-bold">Viagem concluída!</h1>
      <p className="text-sm text-muted-foreground mt-1">Obrigado por viajar com a RotaMais</p>

      <div className="mt-6 w-full rounded-2xl border border-border bg-surface p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Tarifa base</span>
          <span className="text-sm">{formatPrice(receipt.baseFare)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Distância</span>
          <span className="text-sm">{formatPrice(receipt.distanceFare)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Tempo</span>
          <span className="text-sm">{formatPrice(receipt.timeFare)}</span>
        </div>
        {receipt.discount > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-success">Desconto</span>
            <span className="text-sm text-success">-{formatPrice(receipt.discount)}</span>
          </div>
        )}
        <div className="border-t border-border pt-2 flex items-center justify-between">
          <span className="font-semibold">Total</span>
          <span className="font-display text-lg font-bold text-primary">
            {formatPrice(receipt.total)}
          </span>
        </div>
        <div className="text-xs text-muted-foreground">Pago via {paymentLabel}</div>
      </div>

      {onDone && (
        <button
          onClick={onDone}
          className="mt-6 w-full rounded-full bg-gradient-brand py-4 text-white font-semibold shadow-elegant"
        >
          Concluir
        </button>
      )}
    </div>
  );
}
