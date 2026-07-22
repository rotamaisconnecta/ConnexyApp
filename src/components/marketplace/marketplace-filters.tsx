import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  MarketplaceFilters,
  BusinessCategoryValue,
  PriceRangeValue,
  SortOptionValue,
} from "@/lib/marketplace/business-types";
import {
  BUSINESS_CATEGORY_OPTIONS,
  PRICE_RANGE_OPTIONS,
  SORT_OPTIONS,
} from "@/lib/marketplace/business-types";
import { getActiveFilterCount, resetFilters } from "@/lib/marketplace/business-filter";
import { getCategoryColor } from "@/lib/marketplace/category-utils";

interface MarketplaceFiltersProps {
  filters: MarketplaceFilters;
  onFiltersChange: (filters: MarketplaceFilters) => void;
}

export function MarketplaceFiltersPanel({ filters, onFiltersChange }: MarketplaceFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const activeCount = getActiveFilterCount(filters);

  function updateFilter<K extends keyof MarketplaceFilters>(key: K, value: MarketplaceFilters[K]) {
    onFiltersChange({ ...filters, [key]: value });
  }

  function handleReset() {
    onFiltersChange(resetFilters());
  }

  function toggleCategory(cat: BusinessCategoryValue) {
    const current = filters.categories;
    if (current.includes(cat)) {
      updateFilter(
        "categories",
        current.filter((c) => c !== cat),
      );
    } else {
      updateFilter("categories", [...current, cat]);
    }
  }

  function togglePrice(price: PriceRangeValue) {
    const current = filters.priceRange;
    if (current.includes(price)) {
      updateFilter(
        "priceRange",
        current.filter((p) => p !== price),
      );
    } else {
      updateFilter("priceRange", [...current, price]);
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "h-9 px-3 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all",
            activeCount > 0
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground",
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filtros
          {activeCount > 0 && (
            <span className="h-4 w-4 rounded-full bg-white/20 text-[10px] grid place-items-center">
              {activeCount}
            </span>
          )}
        </button>

        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => updateFilter("sortBy", opt.value)}
            className={cn(
              "h-9 px-3 rounded-full text-xs font-medium transition-all",
              filters.sortBy === opt.value
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {isOpen && (
        <div className="mt-3 p-4 rounded-2xl bg-surface border border-border/50 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Filtros</h3>
            <div className="flex items-center gap-2">
              {activeCount > 0 && (
                <button onClick={handleReset} className="text-[11px] text-primary font-medium">
                  Limpar tudo
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Fechar filtros"
                className="h-7 w-7 grid place-items-center rounded-full bg-secondary"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground">Categorias</h4>
            <div className="flex flex-wrap gap-1.5">
              {BUSINESS_CATEGORY_OPTIONS.map((opt) => {
                const isActive = filters.categories.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => toggleCategory(opt.value)}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[11px] font-medium transition-all",
                      isActive ? getCategoryColor(opt.value) : "bg-secondary text-muted-foreground",
                    )}
                  >
                    {opt.icon} {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground">Preço</h4>
            <div className="flex gap-1.5">
              {PRICE_RANGE_OPTIONS.map((opt) => {
                const isActive = filters.priceRange.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => togglePrice(opt.value)}
                    className={cn(
                      "flex-1 rounded-full py-1.5 text-[11px] font-medium transition-all text-center",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground",
                    )}
                  >
                    {opt.symbol} {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground">Avaliação mínima</h4>
            <div className="flex gap-1.5">
              {[0, 3, 3.5, 4, 4.5].map((r) => (
                <button
                  key={r}
                  onClick={() => updateFilter("minRating", r)}
                  className={cn(
                    "flex-1 rounded-full py-1.5 text-[11px] font-medium transition-all text-center",
                    filters.minRating === r
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground",
                  )}
                >
                  {r === 0 ? "Todas" : `${r}+`}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground">Outros</h4>
            <div className="space-y-2">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs">Aberto agora</span>
                <button
                  onClick={() => updateFilter("isOpen", !filters.isOpen)}
                  className={cn(
                    "h-6 w-11 rounded-full relative transition-all",
                    filters.isOpen ? "bg-primary" : "bg-border",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all",
                      filters.isOpen ? "left-[22px]" : "left-0.5",
                    )}
                  />
                </button>
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs">Com promoções</span>
                <button
                  onClick={() => updateFilter("hasPromotions", !filters.hasPromotions)}
                  className={cn(
                    "h-6 w-11 rounded-full relative transition-all",
                    filters.hasPromotions ? "bg-primary" : "bg-border",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all",
                      filters.hasPromotions ? "left-[22px]" : "left-0.5",
                    )}
                  />
                </button>
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs">Com eventos</span>
                <button
                  onClick={() => updateFilter("hasEvents", !filters.hasEvents)}
                  className={cn(
                    "h-6 w-11 rounded-full relative transition-all",
                    filters.hasEvents ? "bg-primary" : "bg-border",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all",
                      filters.hasEvents ? "left-[22px]" : "left-0.5",
                    )}
                  />
                </button>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground">
              Distância máxima:{" "}
              {filters.maxDistance < 1000
                ? `${filters.maxDistance}m`
                : `${(filters.maxDistance / 1000).toFixed(0)}km`}
            </h4>
            <input
              type="range"
              min={500}
              max={50000}
              step={500}
              value={filters.maxDistance}
              onChange={(e) => updateFilter("maxDistance", Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
        </div>
      )}
    </>
  );
}
