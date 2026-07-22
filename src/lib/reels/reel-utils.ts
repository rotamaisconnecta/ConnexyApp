import type { Reel, ReelCategoryValue } from "./reel-types";
import { REEL_CATEGORY_META } from "./reel-types";

export function formatReelCount(n: number): string {
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    return `${v % 1 === 0 ? v : v.toFixed(1)}M`;
  }
  if (n >= 1_000) {
    const v = n / 1_000;
    return `${v % 1 === 0 ? v : v.toFixed(1)}k`;
  }
  return String(n);
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));

  if (diffSec < 60) return "agora";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}min atrás`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h atrás`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d atrás`;
  const diffW = Math.floor(diffD / 7);
  if (diffW < 4) return `${diffW}sem atrás`;
  const diffMo = Math.floor(diffD / 30);
  if (diffMo < 12) return `${diffMo}m atrás`;
  const diffY = Math.floor(diffD / 365);
  return `${diffY}a atrás`;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  const km = meters / 1000;
  return `${km.toFixed(1).replace(".", ",")}km`;
}

const metaMap = new Map<ReelCategoryValue, (typeof REEL_CATEGORY_META)[number]>(
  REEL_CATEGORY_META.map((m) => [m.value, m]),
);

export function getCategoryEmoji(cat: ReelCategoryValue): string {
  return metaMap.get(cat)?.emoji ?? "❓";
}

export function getCategoryLabel(cat: ReelCategoryValue): string {
  return metaMap.get(cat)?.label ?? cat;
}

export function getCategoryColor(cat: ReelCategoryValue): string {
  return metaMap.get(cat)?.color ?? "bg-gray-500/15 text-gray-400";
}

export function truncateCaption(text: string, maxLen = 120): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1).trimEnd() + "…";
}

export function extractHashtags(text: string): string[] {
  return Array.from(text.matchAll(/#(\w+)/g)).map((m) => m[1]);
}

export function isReelActive(reel: Reel, idx: number, activeIdx: number): boolean {
  return idx === activeIdx;
}

export function getNextReelIndex(current: number, total: number): number {
  return (current + 1) % total;
}

export function getPrevReelIndex(current: number): number {
  return Math.max(0, current - 1);
}
