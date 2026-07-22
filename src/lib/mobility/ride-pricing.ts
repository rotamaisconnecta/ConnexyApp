/* =========================================================
   ride-pricing.ts — Price estimation and calculation
   Pure TypeScript. No React. No side effects.
========================================================= */

import { VehicleCategory, type VehicleCategoryValue, type PriceEstimate } from "./ride-types";

/* ─── Constants ──────────────────────────────────────────── */

const BASE_PRICES: Record<VehicleCategoryValue, number> = {
  [VehicleCategory.ECONOMICO]: 5.0,
  [VehicleCategory.CONFORTO]: 7.5,
  [VehicleCategory.PREMIUM]: 12.0,
  [VehicleCategory.MOTO]: 4.0,
  [VehicleCategory.COMPARTILHADO]: 4.5,
};

const PRICE_PER_KM: Record<VehicleCategoryValue, number> = {
  [VehicleCategory.ECONOMICO]: 1.2,
  [VehicleCategory.CONFORTO]: 1.8,
  [VehicleCategory.PREMIUM]: 2.5,
  [VehicleCategory.MOTO]: 0.9,
  [VehicleCategory.COMPARTILHADO]: 1.0,
};

const PRICE_PER_MIN: Record<VehicleCategoryValue, number> = {
  [VehicleCategory.ECONOMICO]: 0.2,
  [VehicleCategory.CONFORTO]: 0.3,
  [VehicleCategory.PREMIUM]: 0.5,
  [VehicleCategory.MOTO]: 0.15,
  [VehicleCategory.COMPARTILHADO]: 0.18,
};

const MIN_FARE: Record<VehicleCategoryValue, number> = {
  [VehicleCategory.ECONOMICO]: 8.0,
  [VehicleCategory.CONFORTO]: 12.0,
  [VehicleCategory.PREMIUM]: 18.0,
  [VehicleCategory.MOTO]: 6.0,
  [VehicleCategory.COMPARTILHADO]: 7.0,
};

/* ─── calculateBasePrice ─────────────────────────────────── */

export function calculateBasePrice(
  category: VehicleCategoryValue,
  distanceMeters: number,
  durationMinutes: number,
): number {
  const km = distanceMeters / 1000;
  const raw =
    BASE_PRICES[category] + km * PRICE_PER_KM[category] + durationMinutes * PRICE_PER_MIN[category];
  return Math.max(raw, MIN_FARE[category]);
}

/* ─── applySurge ─────────────────────────────────────────── */

export function applySurge(price: number, multiplier: number): number {
  return price * multiplier;
}

/* ─── applyCoupon ────────────────────────────────────────── */

export function applyCoupon(price: number, discountPercent: number, maxDiscount: number): number {
  const discount = Math.min(price * (discountPercent / 100), maxDiscount);
  return Math.max(price - discount, 0);
}

/* ─── formatPrice ────────────────────────────────────────── */

export function formatPrice(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

/* ─── estimatePrice ──────────────────────────────────────── */

export function estimatePrice(
  category: VehicleCategoryValue,
  distanceMeters: number,
  durationMinutes: number,
  surgeMultiplier: number = 1,
  discountPercent: number = 0,
  maxDiscount: number = 50,
): PriceEstimate {
  const base = calculateBasePrice(category, distanceMeters, durationMinutes);
  const surged = applySurge(base, surgeMultiplier);
  const finalPrice = applyCoupon(surged, discountPercent, maxDiscount);
  const discount = surged - finalPrice;

  return {
    category,
    basePrice: base,
    discount,
    finalPrice,
    currency: "BRL",
    label: formatPrice(finalPrice),
    description: formatDescription(category),
    etaMinutes: estimateEtaMinutes(category, distanceMeters),
    surgeMultiplier,
  };
}

/* ─── estimateAllCategories ──────────────────────────────── */

export function estimateAllCategories(
  distanceMeters: number,
  durationMinutes: number,
  surgeMultiplier: number = 1,
): PriceEstimate[] {
  return (Object.values(VehicleCategory) as VehicleCategoryValue[]).map((cat) =>
    estimatePrice(cat, distanceMeters, durationMinutes, surgeMultiplier),
  );
}

/* ─── estimateEtaMinutes ─────────────────────────────────── */

export function estimateEtaMinutes(
  _category: VehicleCategoryValue,
  distanceMeters: number,
): number {
  const km = distanceMeters / 1000;
  return Math.max(2, Math.round(km * 2.5));
}

/* ─── getSurgeLabel ──────────────────────────────────────── */

export function getSurgeLabel(multiplier: number): string | null {
  if (multiplier <= 1) return null;
  if (multiplier < 1.5) return "Leve aumento";
  if (multiplier < 2) return "Preço alto";
  return "Preço muito alto";
}

/* ─── getSurgeColor ──────────────────────────────────────── */

export function getSurgeColor(multiplier: number): string {
  if (multiplier <= 1) return "";
  if (multiplier < 1.5) return "text-amber-500";
  return "text-destructive";
}

/* ─── Internal ───────────────────────────────────────────── */

function formatDescription(category: VehicleCategoryValue): string {
  switch (category) {
    case VehicleCategory.ECONOMICO:
      return "Até 4 passageiros";
    case VehicleCategory.CONFORTO:
      return "Carro confortável · até 4";
    case VehicleCategory.PREMIUM:
      return "Veículo premium · até 4";
    case VehicleCategory.MOTO:
      return "1 passageiro · mais rápido";
    case VehicleCategory.COMPARTILHADO:
      return "Compartilhe com outros";
    default:
      return "";
  }
}
