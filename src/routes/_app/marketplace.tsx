import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { SearchBar } from "@/components/marketplace/search-bar";
import { CategoryFilter } from "@/components/marketplace/category-filter";
import { MarketplaceFiltersPanel } from "@/components/marketplace/marketplace-filters";
import { BusinessGrid } from "@/components/marketplace/business-grid";
import { OfferCarousel } from "@/components/marketplace/offer-carousel";
import { LoadingMarketplace } from "@/components/marketplace/loading-marketplace";
import { EmptyMarketplace } from "@/components/marketplace/empty-marketplace";
import { BackButton } from "@/components/navigation/back-button";
import { useState, useMemo } from "react";
import type { MarketplaceFilters } from "@/lib/marketplace/business-types";
import { SortOption } from "@/lib/marketplace/business-types";
import { MOCK_BUSINESSES } from "@/lib/marketplace/mock-businesses";
import { filterBusinesses, DEFAULT_FILTERS } from "@/lib/marketplace/business-filter";
import { sortBusinesses } from "@/lib/marketplace/business-ranking";

export const Route = createFileRoute("/_app/marketplace")({
  head: () => ({ meta: [{ title: "Marketplace" }] }),
  component: MarketplacePage,
});

function MarketplacePage() {
  const nav = useNavigate();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<MarketplaceFilters>({
    ...DEFAULT_FILTERS,
    sortBy: SortOption.NEAREST,
  });
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredBusinesses = useMemo(() => {
    const result = filterBusinesses(MOCK_BUSINESSES, {
      ...filters,
      searchQuery: search,
    });
    return sortBusinesses(result, filters.sortBy);
  }, [filters, search]);

  const allPromotions = MOCK_BUSINESSES.flatMap((b) => b.promotions);

  function handleSelectBusiness(id: string) {
    nav({ to: "/business/$businessId", params: { businessId: id } });
  }

  return (
    <div className="flex-1 flex flex-col">
      <StatusBar />

      <div className="flex items-center gap-3 px-5 pt-1 pb-3">
        <BackButton
          fallbackTo="/home"
          className="h-9 w-9 grid place-items-center rounded-full bg-secondary"
        />
        <div className="flex-1">
          <h1 className="font-display font-bold text-base">Marketplace</h1>
          <p className="text-[11px] text-muted-foreground">
            Descubra empresas e promoções perto de você
          </p>
        </div>
      </div>

      <div className="flex-1 px-5 pb-4 space-y-4 overflow-y-auto no-scrollbar">
        <SearchBar value={search} onChange={setSearch} businesses={MOCK_BUSINESSES} />

        <CategoryFilter
          selected={filters.categories}
          onSelect={(cats) => setFilters({ ...filters, categories: cats })}
        />

        <MarketplaceFiltersPanel filters={filters} onFiltersChange={setFilters} />

        {allPromotions.length > 0 && <OfferCarousel promotions={allPromotions} />}

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {filteredBusinesses.length} empresa{filteredBusinesses.length !== 1 ? "s" : ""}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`h-7 px-2 rounded-md text-[11px] font-medium transition-all ${
                viewMode === "grid"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              Grade
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`h-7 px-2 rounded-md text-[11px] font-medium transition-all ${
                viewMode === "list"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              Lista
            </button>
          </div>
        </div>

        {filteredBusinesses.length === 0 ? (
          <EmptyMarketplace message="Nenhuma empresa encontrada" />
        ) : viewMode === "grid" ? (
          <BusinessGrid businesses={filteredBusinesses} onSelect={handleSelectBusiness} />
        ) : (
          <div className="space-y-3">
            {filteredBusinesses.map((b) => (
              <button
                key={b.id}
                onClick={() => handleSelectBusiness(b.id)}
                className="w-full text-left rounded-2xl bg-surface border border-border/50 p-3 flex gap-3 shadow-soft transition-all active:scale-[0.98]"
              >
                {b.photos[0] && (
                  <img
                    src={b.photos[0].url}
                    alt={b.name}
                    className="h-20 w-20 rounded-xl object-cover shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1 space-y-1">
                  <h3 className="font-semibold text-sm truncate">{b.name}</h3>
                  <p className="text-[11px] text-muted-foreground line-clamp-1">{b.description}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-amber font-medium">★ {b.rating.average}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {b.distanceMeters < 1000
                        ? `${b.distanceMeters}m`
                        : `${(b.distanceMeters / 1000).toFixed(1)}km`}
                    </span>
                    {b.isOpen ? (
                      <span className="text-[10px] text-success font-medium">Aberto</span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">Fechado</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
