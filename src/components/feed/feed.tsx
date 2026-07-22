import { useState, useMemo, useCallback } from "react";
import { Search } from "lucide-react";
import { FeedFilters } from "./feed-filters";
import { FeedComposer } from "./feed-composer";
import { FeedSection } from "./feed-section";
import { FeedSkeleton } from "./feed-skeleton";
import { FeedEmpty } from "./feed-empty";
import {
  type FeedItem,
  type FeedFilterValue,
  type FeedSortMode,
  FEED_SORT_OPTIONS,
} from "@/lib/feed/feed-types";
import { applyFilters } from "@/lib/feed/feed-filter";
import { sortSmart, sortByRecent, sortByDistance, sortByPopularity } from "@/lib/feed/feed-ranking";

interface FeedProps {
  items: FeedItem[];
  loading?: boolean;
  userName: string;
  userPhoto: string;
}

const SORT_FNS: Record<FeedSortMode, (items: FeedItem[]) => FeedItem[]> = {
  smart: sortSmart,
  recent: sortByRecent,
  distance: sortByDistance,
  popular: sortByPopularity,
};

export function Feed({ items, loading = false, userName, userPhoto }: FeedProps) {
  const [filter, setFilter] = useState<FeedFilterValue>("ALL");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<FeedSortMode>("smart");

  const filtered = useMemo(() => {
    let result = applyFilters(items, filter, search);
    result = SORT_FNS[sort](result);
    return result;
  }, [items, filter, search, sort]);

  const handleSearch = useCallback((q: string) => {
    setSearch(q);
  }, []);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Pesquisar pessoas, lugares ou eventos"
          className="w-full rounded-xl border border-border bg-surface pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Pesquisar no feed"
        />
      </div>

      {/* Filters */}
      <FeedFilters value={filter} onChange={setFilter} />

      {/* Sort */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {FEED_SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setSort(opt.value)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors ${
              sort === opt.value
                ? "bg-accent text-primary"
                : "text-muted-foreground hover:bg-secondary"
            }`}
            aria-label={`Ordenar por ${opt.label}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Composer */}
      <FeedComposer userName={userName} userPhoto={userPhoto} />

      {/* Content */}
      {loading ? (
        <FeedSkeleton />
      ) : filtered.length === 0 ? (
        <FeedEmpty filter={filter} />
      ) : (
        <FeedSection items={filtered} />
      )}
    </div>
  );
}
