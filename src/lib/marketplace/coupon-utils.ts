/* =========================================================
   coupon-utils.ts — Coupon utility functions
   Pure TypeScript. No React. No side effects.
========================================================= */

import type { Coupon } from "./business-types";
import { DiscountType, type DiscountTypeValue } from "./business-types";

/* ─── isCouponActive ────────────────────────────────────── */

export function isCouponActive(coupon: Coupon): boolean {
  const now = new Date();
  return coupon.isActive && now >= coupon.validFrom && now <= coupon.validUntil;
}

/* ─── isCouponUsable ────────────────────────────────────── */

export function isCouponUsable(coupon: Coupon): boolean {
  if (!isCouponActive(coupon)) return false;
  if (coupon.usageLimit !== undefined && coupon.usageCount >= coupon.usageLimit) {
    return false;
  }
  return true;
}

/* ─── getActiveCoupons ──────────────────────────────────── */

export function getActiveCoupons(coupons: Coupon[]): Coupon[] {
  return coupons.filter(isCouponActive);
}

/* ─── getUsableCoupons ──────────────────────────────────── */

export function getUsableCoupons(coupons: Coupon[]): Coupon[] {
  return coupons.filter(isCouponUsable);
}

/* ─── getCouponDiscountLabel ────────────────────────────── */

export function getCouponDiscountLabel(coupon: Coupon): string {
  switch (coupon.discountType) {
    case DiscountType.PERCENTAGE:
      return `${coupon.discountValue}% OFF`;
    case DiscountType.FIXED:
      return `R$ ${coupon.discountValue.toFixed(2).replace(".", ",")} OFF`;
    case DiscountType.BOGO:
      return `Leve ${coupon.discountValue} pague 1`;
    default:
      return "Cupom";
  }
}

/* ─── getCouponColor ────────────────────────────────────── */

export function getCouponColor(discountType: DiscountTypeValue): string {
  switch (discountType) {
    case DiscountType.PERCENTAGE:
      return "border-success bg-success/5";
    case DiscountType.FIXED:
      return "border-blue-soft bg-blue-soft/5";
    case DiscountType.BOGO:
      return "border-purple-soft bg-purple-soft/5";
    default:
      return "border-border bg-background";
  }
}

/* ─── getCouponDiscountBgColor ──────────────────────────── */

export function getCouponDiscountBgColor(discountType: DiscountTypeValue): string {
  switch (discountType) {
    case DiscountType.PERCENTAGE:
      return "bg-success text-white";
    case DiscountType.FIXED:
      return "bg-blue-soft text-white";
    case DiscountType.BOGO:
      return "bg-purple-soft text-white";
    default:
      return "bg-muted text-muted-foreground";
  }
}

/* ─── formatCouponExpiry ────────────────────────────────── */

export function formatCouponExpiry(validUntil: Date): string {
  const now = new Date();
  const diffMs = validUntil.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "Expirado";
  if (diffDays === 0) return "Expira hoje";
  if (diffDays === 1) return "Expira amanhã";
  if (diffDays <= 7) return `${diffDays} dias restantes`;
  return `Válido até ${validUntil.toLocaleDateString("pt-BR")}`;
}

/* ─── formatUsageLimit ──────────────────────────────────── */

export function formatUsageLimit(coupon: Coupon): string {
  if (coupon.usageLimit === undefined) return "Uso ilimitado";
  const remaining = coupon.usageLimit - coupon.usageCount;
  if (remaining <= 0) return "Esgotado";
  return `${remaining} restante${remaining > 1 ? "s" : ""}`;
}

/* ─── sortByExpiry ──────────────────────────────────────── */

export function sortByExpiry(coupons: Coupon[]): Coupon[] {
  return [...coupons].sort((a, b) => a.validUntil.getTime() - b.validUntil.getTime());
}

/* ─── sortByDiscount ────────────────────────────────────── */

export function sortByDiscount(coupons: Coupon[]): Coupon[] {
  return [...coupons].sort((a, b) => b.discountValue - a.discountValue);
}

/* ─── getCouponSummary ──────────────────────────────────── */

export interface CouponSummary {
  total: number;
  active: number;
  usable: number;
  expired: number;
}

export function getCouponSummary(coupons: Coupon[]): CouponSummary {
  const active = getActiveCoupons(coupons);
  const usable = getUsableCoupons(coupons);
  return {
    total: coupons.length,
    active: active.length,
    usable: usable.length,
    expired: coupons.length - active.length,
  };
}
