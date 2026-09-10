/* =========================================================
   payment.ts — Camada central do método de pagamento.
   payment_method = "como o passageiro pretende pagar a corrida"
   (decisão operacional do fluxo), e NÃO o status de pagamento
   ("pago/confirmado"). Escolha do método e confirmação são
   eventos separados por design.
   Fase 6.4-A: sem gateway, sem chave PIX cadastrada, sem QR
   Code interno. O passageiro paga diretamente ao motorista.
   Pure TypeScript. No React. No side effects.
========================================================= */

import type { PaymentOption } from "./trip/trip-types";

/* ─── Rótulos centrais ──────────────────────────────────── */

export const PAYMENT_METHOD_LABELS: Record<PaymentOption, string> = {
  pix: "PIX",
  dinheiro: "Dinheiro",
};

export function paymentMethodLabel(method: PaymentOption): string {
  return PAYMENT_METHOD_LABELS[method];
}

/* ─── Status de pagamento (apresentação) ───────────────────
   paymentStatus ≠ paymentMethod. O status só é exibido quando
   houve confirmação explícita; nunca é deduzido do método.
   Nenhum dado bancário está envolvido. */

export const PAYMENT_STATUS_LABELS: Record<"confirmado" | "pendente", string> = {
  confirmado: "Pagamento confirmado",
  pendente: "Pagamento pendente",
};

export function paymentStatusLabel(confirmed: boolean): string {
  return confirmed ? PAYMENT_STATUS_LABELS.confirmado : PAYMENT_STATUS_LABELS.pendente;
}
