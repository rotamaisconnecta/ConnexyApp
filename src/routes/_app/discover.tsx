import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { BottomNav } from "@/components/bottom-nav";
import { PeopleGrid } from "@/components/discovery/people-grid";
import { PeopleList } from "@/components/discovery/people-list";
import { DiscoverySearch } from "@/components/discovery/discovery-search";
import { DiscoveryFiltersPanel } from "@/components/discovery/discovery-filters";
import { EmptyDiscovery } from "@/components/discovery/empty-discovery";
import { LoadingDiscovery } from "@/components/discovery/loading-discovery";
import { Grid3X3, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { currentUser, people, type Person } from "@/lib/mock-data";
import { calculateCompatibility } from "@/lib/profile/compatibility";
import {
  type DiscoveryPerson,
  type DiscoveryFilters,
  type DiscoveryMoment,
  type DiscoverySortValue,
  INITIAL_FILTERS,
  DiscoverySort,
} from "@/lib/discovery/discovery-types";
import { searchPeople, filterPeople } from "@/lib/discovery/discovery-filter";
import { sortPeople } from "@/lib/discovery/discovery-ranking";

export const Route = createFileRoute("/_app/discover")({
  head: () => ({ meta: [{ title: "Descobrir — Connexy" }] }),
  component: DiscoverPage,
});

function mapPersonToDiscovery(p: Person): DiscoveryPerson {
  const compatibility = calculateCompatibility(
    {
      interests: currentUser.interests,
      vibeTags: currentUser.vibeTags,
      favoritePlaceIds: currentUser.favoritePlaceIds,
    },
    {
      interests: p.interests,
      vibeTags: p.vibeTags,
      favoritePlaceIds: p.favoritePlaceIds,
      distanceMeters: p.distanceMeters,
      moments: p.moments,
    },
  );

  const moment: DiscoveryMoment | null = p.moments?.[0]
    ? {
        text: p.moments[0].text,
        placeName: p.moments[0].placeId ?? null,
        remainingMs: 2 * 60 * 60 * 1000,
        status: "active",
        statusLabel: "Ativo",
        expired: false,
      }
    : null;

  return {
    id: p.id,
    name: p.name,
    age: p.age,
    photo: p.photo,
    handle: p.handle ?? "",
    headline: p.headline ?? null,
    bio: p.bio ?? null,
    lastSeen: p.lastSeen ?? null,
    interests: p.interests,
    vibeTags: p.vibeTags ?? [],
    favoritePlaceIds: p.favoritePlaceIds ?? [],
    profession: p.bio ?? null,
    distanceMeters: p.distanceMeters,
    online: p.online,
    moment,
    compatibilityScore: compatibility.score,
    compatibilityTier: compatibility.tier,
    compatibilityLabel: compatibility.tierLabel,
  };
}

function DiscoverPage() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<DiscoveryFilters>(INITIAL_FILTERS);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState<DiscoverySortValue>(DiscoverySort.DISTANCE);
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set());
  const [loading] = useState(false);

  const discoveryPeople = useMemo(() => people.map(mapPersonToDiscovery), []);

  const result = useMemo(() => {
    const searched = searchPeople(discoveryPeople, search);
    const filtered = filterPeople(searched, filters);
    const sorted = sortPeople(filtered, sort);
    return sorted;
  }, [discoveryPeople, search, filters, sort]);

  function handleConnect(id: string) {
    setConnectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleFavorite(id: string) {
    setFavoritedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleIgnore(_id: string) {}

  return (
    <div className="flex-1 pb-20">
      <StatusBar />

      <header className="px-5 pt-1 pb-3 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="font-display font-bold text-lg">Descobrir</h1>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={cn(
                "h-8 w-8 rounded-lg grid place-items-center transition-colors",
                viewMode === "grid"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground",
              )}
              aria-label="Vista em grelha"
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={cn(
                "h-8 w-8 rounded-lg grid place-items-center transition-colors",
                viewMode === "list"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground",
              )}
              aria-label="Vista em lista"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        <DiscoverySearch value={search} onChange={setSearch} />
        <DiscoveryFiltersPanel filters={filters} onChange={setFilters} />
      </header>

      <div className="px-4">
        {loading ? (
          <LoadingDiscovery />
        ) : result.length === 0 ? (
          <EmptyDiscovery />
        ) : viewMode === "grid" ? (
          <PeopleGrid
            people={result}
            onConnect={handleConnect}
            onFavorite={handleFavorite}
            onIgnore={handleIgnore}
            connectedIds={connectedIds}
            favoritedIds={favoritedIds}
          />
        ) : (
          <PeopleList
            people={result}
            onConnect={handleConnect}
            onFavorite={handleFavorite}
            onIgnore={handleIgnore}
            connectedIds={connectedIds}
            favoritedIds={favoritedIds}
          />
        )}
      </div>

      <BottomNav />
    </div>
  );
}
