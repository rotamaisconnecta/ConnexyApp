/* =========================================================
   category-utils.ts — Business category utility functions
   Pure TypeScript. No React. No side effects.
========================================================= */

import { BusinessCategory, type BusinessCategoryValue } from "./business-types";

/* ─── getCategoryLabel ──────────────────────────────────── */

export function getCategoryLabel(category: BusinessCategoryValue): string {
  switch (category) {
    case BusinessCategory.RESTAURANT:
      return "Restaurante";
    case BusinessCategory.BAR:
      return "Bar";
    case BusinessCategory.CAFE:
      return "Café";
    case BusinessCategory.HOTEL:
      return "Hotel";
    case BusinessCategory.GYM:
      return "Academia";
    case BusinessCategory.EVENTS:
      return "Evento";
    case BusinessCategory.STORE:
      return "Loja";
    case BusinessCategory.HEALTH:
      return "Saúde";
    case BusinessCategory.SERVICE:
      return "Serviço";
    case BusinessCategory.ENTERTAINMENT:
      return "Entretenimento";
    default:
      return category;
  }
}

/* ─── getCategoryIcon ───────────────────────────────────── */

export function getCategoryIcon(category: BusinessCategoryValue): string {
  switch (category) {
    case BusinessCategory.RESTAURANT:
      return "🍽️";
    case BusinessCategory.BAR:
      return "🍺";
    case BusinessCategory.CAFE:
      return "☕";
    case BusinessCategory.HOTEL:
      return "🏨";
    case BusinessCategory.GYM:
      return "💪";
    case BusinessCategory.EVENTS:
      return "🎭";
    case BusinessCategory.STORE:
      return "🛍️";
    case BusinessCategory.HEALTH:
      return "🏥";
    case BusinessCategory.SERVICE:
      return "🔧";
    case BusinessCategory.ENTERTAINMENT:
      return "🎬";
    default:
      return "📍";
  }
}

/* ─── getCategoryColor ──────────────────────────────────── */

export function getCategoryColor(category: BusinessCategoryValue): string {
  switch (category) {
    case BusinessCategory.RESTAURANT:
      return "bg-orange-soft/15 text-orange-soft";
    case BusinessCategory.BAR:
      return "bg-purple-soft/15 text-purple-soft";
    case BusinessCategory.CAFE:
      return "bg-amber/15 text-amber";
    case BusinessCategory.HOTEL:
      return "bg-blue-soft/15 text-blue-soft";
    case BusinessCategory.GYM:
      return "bg-success/15 text-success";
    case BusinessCategory.EVENTS:
      return "bg-pink/15 text-pink";
    case BusinessCategory.STORE:
      return "bg-teal-soft/15 text-teal-soft";
    case BusinessCategory.HEALTH:
      return "bg-error/15 text-error";
    case BusinessCategory.SERVICE:
      return "bg-muted-foreground/15 text-muted-foreground";
    case BusinessCategory.ENTERTAINMENT:
      return "bg-violet-soft/15 text-violet-soft";
    default:
      return "bg-muted text-muted-foreground";
  }
}

/* ─── getCategoryBorder ─────────────────────────────────── */

export function getCategoryBorder(category: BusinessCategoryValue): string {
  switch (category) {
    case BusinessCategory.RESTAURANT:
      return "border-orange-soft";
    case BusinessCategory.BAR:
      return "border-purple-soft";
    case BusinessCategory.CAFE:
      return "border-amber";
    case BusinessCategory.HOTEL:
      return "border-blue-soft";
    case BusinessCategory.GYM:
      return "border-success";
    case BusinessCategory.EVENTS:
      return "border-pink";
    case BusinessCategory.STORE:
      return "border-teal-soft";
    case BusinessCategory.HEALTH:
      return "border-error";
    case BusinessCategory.SERVICE:
      return "border-muted-foreground";
    case BusinessCategory.ENTERTAINMENT:
      return "border-violet-soft";
    default:
      return "border-border";
  }
}

/* ─── filterByCategory ──────────────────────────────────── */

export function filterByCategory<T extends { category: BusinessCategoryValue }>(
  items: T[],
  category: BusinessCategoryValue,
): T[] {
  return items.filter((item) => item.category === category);
}

/* ─── filterByCategories ────────────────────────────────── */

export function filterByCategories<T extends { category: BusinessCategoryValue }>(
  items: T[],
  categories: BusinessCategoryValue[],
): T[] {
  if (categories.length === 0) return items;
  return items.filter((item) => categories.includes(item.category));
}

/* ─── groupByCategory ───────────────────────────────────── */

export function groupByCategory<T extends { category: BusinessCategoryValue }>(
  items: T[],
): Record<BusinessCategoryValue, T[]> {
  const groups = {} as Record<BusinessCategoryValue, T[]>;
  for (const item of items) {
    if (!groups[item.category]) {
      groups[item.category] = [];
    }
    groups[item.category].push(item);
  }
  return groups;
}

/* ─── getAvailableCategories ────────────────────────────── */

export function getAvailableCategories(
  categories: BusinessCategoryValue[],
): BusinessCategoryValue[] {
  return [...new Set(categories)];
}
