import type { Reel, ReelCategoryValue, SortAlgorithm } from "./reel-types";
import {
  sortSmart,
  sortByRecent,
  sortByPopularity,
  sortByDistance,
  sortByInterest,
} from "./reel-ranking";

export interface ReelFilterState {
  category: ReelCategoryValue | "ALL";
  searchQuery: string;
  sortBy: SortAlgorithm;
}

export function filterByCategory(reels: Reel[], cat: ReelCategoryValue | "ALL"): Reel[] {
  if (cat === "ALL") return reels;
  return reels.filter((r) => r.category === cat);
}

export function searchByName(reels: Reel[], query: string): Reel[] {
  const q = query.toLowerCase().trim();
  if (!q) return reels;
  return reels.filter(
    (r) => r.author.name.toLowerCase().includes(q) || r.author.handle.toLowerCase().includes(q),
  );
}

export function searchByHashtag(reels: Reel[], tag: string): Reel[] {
  const q = tag.replace(/^#/, "").toLowerCase().trim();
  if (!q) return reels;
  return reels.filter((r) => r.hashtags.some((h) => h.toLowerCase() === q));
}

export function searchByLocation(reels: Reel[], query: string): Reel[] {
  const q = query.toLowerCase().trim();
  if (!q) return reels;
  return reels.filter(
    (r) =>
      r.location?.name.toLowerCase().includes(q) || r.location?.address.toLowerCase().includes(q),
  );
}

export function searchByBusiness(reels: Reel[], query: string): Reel[] {
  const q = query.toLowerCase().trim();
  if (!q) return reels;
  return reels.filter((r) => r.business?.name.toLowerCase().includes(q));
}

export function searchByEvent(reels: Reel[], query: string): Reel[] {
  const q = query.toLowerCase().trim();
  if (!q) return reels;
  return reels.filter((r) => r.event?.name.toLowerCase().includes(q));
}

const sortFns: Record<SortAlgorithm, (reels: Reel[]) => Reel[]> = {
  smart: sortSmart,
  recent: sortByRecent,
  popularity: sortByPopularity,
  distance: sortByDistance,
  interest: sortByInterest,
};

export function filterReels(reels: Reel[], filters: ReelFilterState): Reel[] {
  let result = filterByCategory(reels, filters.category);

  const q = filters.searchQuery.trim();
  if (q) {
    result = result.filter(
      (r) =>
        r.caption.toLowerCase().includes(q.toLowerCase()) ||
        r.author.name.toLowerCase().includes(q.toLowerCase()) ||
        r.hashtags.some((h) => h.toLowerCase().includes(q.toLowerCase())) ||
        r.location?.name.toLowerCase().includes(q.toLowerCase()) ||
        r.business?.name.toLowerCase().includes(q.toLowerCase()) ||
        r.event?.name.toLowerCase().includes(q.toLowerCase()),
    );
  }

  return sortFns[filters.sortBy](result);
}
