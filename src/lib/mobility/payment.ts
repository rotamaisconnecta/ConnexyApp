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

import type { PaymentOption, Trip } from "./trip/trip-types";

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

/* ─── Status de pagamento derivado da Trip ──────────────────
   Regra central (Fase 6.4-C): "não confirmado" NÃO é "não
   pago". Apenas paymentIssue = "user_not_paid" representa
   inadimplência. Três estados válidos:
   - paid    → paymentConfirmed = true
   - pending → paymentConfirmed = false (sem issue)
   - unpaid  → paymentConfirmed = false + paymentIssue
   O estado inválido (paymentConfirmed=true + paymentIssue)
   nunca deve ocorrer (invariante). */

export type TripPaymentStatus = "paid" | "pending" | "unpaid";

export const TRIP_PAYMENT_STATUS_LABELS: Record<TripPaymentStatus, string> = {
  paid: "Pagamento confirmado",
  pending: "Aguardando pagamento",
  unpaid: "Corrida não paga",
};

export function tripPaymentStatus(trip: Trip): TripPaymentStatus {
  if (trip.paymentConfirmed) return "paid";
  if (trip.paymentIssue === "user_not_paid") return "unpaid";
  return "pending";
}
