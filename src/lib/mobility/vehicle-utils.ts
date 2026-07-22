/* =========================================================
   vehicle-utils.ts — Vehicle category and info utilities
   Pure TypeScript. No React. No side effects.
========================================================= */

import {
  VehicleCategory,
  VEHICLE_CATEGORY_OPTIONS,
  type VehicleCategoryValue,
  type VehicleInfo,
} from "./ride-types";

/* ─── getCategoryLabel ───────────────────────────────────── */

export function getCategoryLabel(category: VehicleCategoryValue): string {
  const opt = VEHICLE_CATEGORY_OPTIONS.find((o) => o.value === category);
  return opt?.label ?? "";
}

/* ─── getCategoryDescription ─────────────────────────────── */

export function getCategoryDescription(category: VehicleCategoryValue): string {
  const opt = VEHICLE_CATEGORY_OPTIONS.find((o) => o.value === category);
  return opt?.description ?? "";
}

/* ─── getCategoryIcon ────────────────────────────────────── */

export function getCategoryIcon(category: VehicleCategoryValue): string {
  const opt = VEHICLE_CATEGORY_OPTIONS.find((o) => o.value === category);
  return opt?.icon ?? "🚗";
}

/* ─── getCategorySeats ───────────────────────────────────── */

export function getCategorySeats(category: VehicleCategoryValue): number {
  const opt = VEHICLE_CATEGORY_OPTIONS.find((o) => o.value === category);
  return opt?.seats ?? 4;
}

/* ─── getCategoryColor ───────────────────────────────────── */

export function getCategoryColor(category: VehicleCategoryValue): string {
  switch (category) {
    case VehicleCategory.ECONOMICO:
      return "bg-success/15 text-success";
    case VehicleCategory.CONFORTO:
      return "bg-primary/15 text-primary";
    case VehicleCategory.PREMIUM:
      return "bg-amber-500/15 text-amber-600";
    case VehicleCategory.MOTO:
      return "bg-pink/15 text-pink";
    case VehicleCategory.COMPARTILHADO:
      return "bg-accent text-accent-foreground";
    default:
      return "bg-secondary text-muted-foreground";
  }
}

/* ─── getCategoryBorder ──────────────────────────────────── */

export function getCategoryBorder(category: VehicleCategoryValue): string {
  switch (category) {
    case VehicleCategory.ECONOMICO:
      return "border-success/30";
    case VehicleCategory.CONFORTO:
      return "border-primary/30";
    case VehicleCategory.PREMIUM:
      return "border-amber-500/30";
    case VehicleCategory.MOTO:
      return "border-pink/30";
    case VehicleCategory.COMPARTILHADO:
      return "border-accent";
    default:
      return "border-border";
  }
}

/* ─── getVehicleLabel ────────────────────────────────────── */

export function getVehicleLabel(vehicle: VehicleInfo): string {
  return `${vehicle.color} ${vehicle.name}`;
}

/* ─── getVehicleSummary ──────────────────────────────────── */

export function getVehicleSummary(vehicle: VehicleInfo): string {
  return `${vehicle.name} · ${vehicle.plate}`;
}

/* ─── isCategoryAvailable ────────────────────────────────── */

export function isCategoryAvailable(
  category: VehicleCategoryValue,
  _availableCategories: VehicleCategoryValue[],
): boolean {
  return _availableCategories.includes(category);
}

/* ─── getAllCategories ───────────────────────────────────── */

export function getAllCategories(): VehicleCategoryValue[] {
  return Object.values(VehicleCategory);
}
