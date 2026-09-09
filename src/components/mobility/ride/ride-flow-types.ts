/* =========================================================
   ride-flow-types.ts — Re-exporta os tipos centrais da Trip.
   Mantém compatibilidade com imports existentes do fluxo
   (FlowState e PaymentOption agora vêm do domínio central).
========================================================= */

export type { PaymentOption, TripStatus as FlowState } from "@/lib/mobility/trip/trip-types";
