/* =========================================================
   offer-utils.ts — Promotion and offer utility functions
   Pure TypeScript. No React. No side effects.
========================================================= */

import type { Promotion } from "./business-types";
import { DiscountType, type DiscountTypeValue } from "./business-types";

/* ─── getDiscountLabel ──────────────────────────────────── */

export function getDiscountLabel(discountType: DiscountTypeValue, discountValue: number): string {
  switch (discountType) {
    case DiscountType.PERCENTAGE:
      return `${discountValue}% OFF`;
    case DiscountType.FIXED:
      return `R$ ${discountValue.toFixed(2).replace(".", ",")} OFF`;
    case DiscountType.BOGO:
      return `Leve ${discountValue} pague 1`;
    default:
      return "Oferta";
  }
}

/* ─── isPromotionActive ─────────────────────────────────── */

export function isPromotionActive(promo: Promotion): boolean {
  const now = new Date();
  return promo.isActive && now >= promo.validFrom && now <= promo.validUntil;
}

/* ─── getActivePromotions ───────────────────────────────── */

export function getActivePromotions(promos: Promotion[]): Promotion[] {
  return promos.filter(isPromotionActive);
}

/* ─── getExpiringPromotions ─────────────────────────────── */

export function getExpiringPromotions(promos: Promotion[], withinDays: number = 3): Promotion[] {
  const now = new Date();
  const limit = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000);
  return promos.filter((p) => p.isActive && p.validUntil <= limit && p.validUntil >= now);
}

/* ─── formatPromotionExpiry ─────────────────────────────── */

export function formatPromotionExpiry(validUntil: Date): string {
  const now = new Date();
  const diffMs = validUntil.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "Expirada";
  if (diffDays === 0) return "Expira hoje";
  if (diffDays === 1) return "Expira amanhã";
  if (diffDays <= 7) return `Expira em ${diffDays} dias`;
  return `Válida até ${validUntil.toLocaleDateString("pt-BR")}`;
}

/* ─── getPromotionColor ─────────────────────────────────── */

export function getPromotionColor(discountType: DiscountTypeValue): string {
  switch (discountType) {
    case DiscountType.PERCENTAGE:
      return "bg-success/15 text-success";
    case DiscountType.FIXED:
      return "bg-blue-soft/15 text-blue-soft";
    case DiscountType.BOGO:
      return "bg-purple-soft/15 text-purple-soft";
    default:
      return "bg-muted text-muted-foreground";
  }
}

/* ─── getPromotionBadgeBg ───────────────────────────────── */

export function getPromotionBadgeBg(discountType: DiscountTypeValue): string {
  switch (discountType) {
    case DiscountType.PERCENTAGE:
      return "bg-success";
    case DiscountType.FIXED:
      return "bg-blue-soft";
    case DiscountType.BOGO:
      return "bg-purple-soft";
    default:
      return "bg-muted-foreground";
  }
}

/* ─── calculateDiscountedPrice ──────────────────────────── */

export function calculateDiscountedPrice(
  originalPrice: number,
  discountType: DiscountTypeValue,
  discountValue: number,
): number {
  switch (discountType) {
    case DiscountType.PERCENTAGE: {
      const discount = originalPrice * (discountValue / 100);
      return Math.max(0, originalPrice - discount);
    }
    case DiscountType.FIXED:
      return Math.max(0, originalPrice - discountValue);
    case DiscountType.BOGO:
      return originalPrice;
    default:
      return originalPrice;
  }
}

/* ─── getPromotionSummary ───────────────────────────────── */

export interface PromotionSummary {
  total: number;
  active: number;
  expiringSoon: number;
  bestDiscount: number;
}

export function getPromotionSummary(promos: Promotion[]): PromotionSummary {
  const active = getActivePromotions(promos);
  const expiringSoon = getExpiringPromotions(promos);

  const bestDiscount = active.reduce((max, p) => {
    if (p.discountType === DiscountType.PERCENTAGE) {
      return Math.max(max, p.discountValue);
    }
    return max;
  }, 0);

  return {
    total: promos.length,
    active: active.length,
    expiringSoon: expiringSoon.length,
    bestDiscount,
  };
}
