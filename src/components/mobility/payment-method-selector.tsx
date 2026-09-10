/* =========================================================
   payment-method-selector.tsx — Seleção de método de pagamento.
   Reutiliza o ListRow do fluxo de mobilidade (design Connexy).
   O ícone QrCode representa o método PIX; NÃO gera QR Code.
   Fase 6.4-A: pagamento direto entre passageiro e motorista.
========================================================= */

import { Banknote, QrCode } from "lucide-react";
import { ListRow } from "./ride/ride-sheet";
import { paymentMethodLabel } from "@/lib/mobility/payment";
import type { PaymentOption } from "@/lib/mobility/trip/trip-types";

const OPTIONS: { value: PaymentOption; title: string; subtitle: string }[] = [
  {
    value: "dinheiro",
    title: paymentMethodLabel("dinheiro"),
    subtitle: "Pagamento direto ao motorista.",
  },
  {
    value: "pix",
    title: paymentMethodLabel("pix"),
    subtitle: "Você paga diretamente ao motorista após a corrida.",
  },
];

const ICONS: Record<PaymentOption, typeof Banknote> = {
  pix: QrCode,
  dinheiro: Banknote,
};

export function PaymentMethodSelector({
  value,
  onSelect,
}: {
  value: PaymentOption;
  onSelect: (payment: PaymentOption) => void;
}) {
  return (
    <div className="divide-y divide-zinc-100" role="radiogroup" aria-label="Método de pagamento">
      {OPTIONS.map((option) => {
        const Icon = ICONS[option.value];
        return (
          <ListRow
            key={option.value}
            title={option.title}
            subtitle={option.subtitle}
            leading={<Icon className="h-4 w-4 text-[#111111]" />}
            selected={value === option.value}
            onClick={() => onSelect(option.value)}
          />
        );
      })}
    </div>
  );
}
