/* ==== integration-utils.ts -- Shared utility functions for integration
   Pure TypeScript. No React. No side effects. ==== */

import type {
  HeatLevelValue,
  PlaceStatusValue,
  TrendingDirectionValue,
  IntegrationTargetValue,
  MapMarkerTypeValue,
  CheckinTransitionValue,
} from "./integration-types";
import {
  HeatLevel,
  PlaceStatus,
  TrendingDirection,
  CheckinTransition,
  HeatMeta,
  PlaceStatusMeta,
  TrendingMeta,
  CheckinTransitionMeta,
} from "./integration-types";

/* ==== Formatting ==== */

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

export function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `${diffMin}min`;
  if (diffHr < 24) return `${diffHr}h`;
  if (diffDay < 7) return `${diffDay}d`;
  return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function formatCount(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1000000) return `${(n / 1000).toFixed(1)}K`;
  return `${(n / 1000000).toFixed(1)}M`;
}

export function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function formatDiscount(percent: number): string {
  return `-${percent}%`;
}

export function formatPrice(value: number, currency = "R$"): string {
  return `${currency} ${value.toFixed(2).replace(".", ",")}`;
}

export function formatEta(minutes: number): string {
  if (minutes < 1) return "chegando";
  if (minutes === 1) return "1 min";
  return `${minutes} min`;
}

/* ==== Heat level ==== */

export function getHeatLevel(
  count: number,
  thresholds: { warm: number; hot: number; burning: number } = {
    warm: 5,
    hot: 15,
    burning: 30,
  },
): HeatLevelValue {
  if (count >= thresholds.burning) return HeatLevel.BURNING;
  if (count >= thresholds.hot) return HeatLevel.HOT;
  if (count >= thresholds.warm) return HeatLevel.WARM;
  return HeatLevel.COLD;
}

export function getHeatColor(level: HeatLevelValue): string {
  return HeatMeta[level].color;
}

export function getHeatLabel(level: HeatLevelValue): string {
  return HeatMeta[level].label;
}

export function shouldPulse(level: HeatLevelValue): boolean {
  return HeatMeta[level].pulse;
}

/* ==== Place status ==== */

export function getPlaceStatus(checkinCount: number, eventHappening: boolean): PlaceStatusValue {
  if (eventHappening) return PlaceStatus.EVENTO_ACONTECENDO;
  if (checkinCount >= 30) return PlaceStatus.MUITO_CHEIO;
  if (checkinCount >= 15) return PlaceStatus.BOMBANDO;
  if (checkinCount >= 5) return PlaceStatus.MOVIMENTADO;
  return PlaceStatus.CALMO;
}

export function getPlaceStatusColor(status: PlaceStatusValue): string {
  return PlaceStatusMeta[status].color;
}

export function getPlaceStatusBg(status: PlaceStatusValue): string {
  return PlaceStatusMeta[status].bg;
}

export function getPlaceStatusBorder(status: PlaceStatusValue): string {
  return PlaceStatusMeta[status].border;
}

export function getPlaceStatusEmoji(status: PlaceStatusValue): string {
  return PlaceStatusMeta[status].emoji;
}

/* ==== Trending direction ==== */

export function getTrendingDirection(
  currentCount: number,
  previousCount: number,
  threshold = 0.1,
): TrendingDirectionValue {
  const diff = currentCount - previousCount;
  const change = previousCount === 0 ? (currentCount > 0 ? 1 : 0) : diff / previousCount;

  if (change > threshold) return TrendingDirection.UP;
  if (change < -threshold) return TrendingDirection.DOWN;
  return TrendingDirection.STABLE;
}

export function getTrendingIcon(direction: TrendingDirectionValue): string {
  return TrendingMeta[direction].icon;
}

export function getTrendingColor(direction: TrendingDirectionValue): string {
  return TrendingMeta[direction].color;
}

/* ==== ID generation ==== */

let idCounter = 0;

export function generateIntegrationId(prefix = "int"): string {
  idCounter += 1;
  return `${prefix}_${Date.now()}_${idCounter}`;
}

/* ==== Distance helpers ==== */

export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function isWithinRadius(
  userLat: number,
  userLng: number,
  targetLat: number,
  targetLng: number,
  radiusMeters: number,
): boolean {
  return haversineDistance(userLat, userLng, targetLat, targetLng) <= radiusMeters;
}

/* ==== Target helpers ==== */

export function getTargetLabel(target: IntegrationTargetValue): string {
  const labels: Record<IntegrationTargetValue, string> = {
    FEED: "Feed",
    REELS: "Reels",
    MARKETPLACE: "Marketplace",
    CHAT: "Chat",
    RIDE: "Corrida",
    DRIVER: "Motorista",
    DISCOVERY: "Descobrir",
    PROFILE: "Perfil",
    NOTIFICATIONS: "Notificações",
    ENGINE: "Motor",
    EVENTS: "Eventos",
    MAP: "Mapa",
    MOMENTS: "Momentos",
    CHECKIN: "Check-in",
  };
  return labels[target];
}

export function getMarkerTypeLabel(type: MapMarkerTypeValue): string {
  const labels: Record<MapMarkerTypeValue, string> = {
    PERSON: "Pessoa",
    DRIVER: "Motorista",
    EVENT: "Evento",
    BUSINESS: "Comércio",
    OFFER: "Oferta",
    REEL: "Reel",
    MOMENT: "Momento",
    PLACE: "Local",
  };
  return labels[type];
}

export function getMarkerTypeEmoji(type: MapMarkerTypeValue): string {
  const emojis: Record<MapMarkerTypeValue, string> = {
    PERSON: "👤",
    DRIVER: "🚗",
    EVENT: "📅",
    BUSINESS: "🏪",
    OFFER: "🏷️",
    REEL: "🎬",
    MOMENT: "✨",
    PLACE: "📍",
  };
  return emojis[type];
}

/* ==== Sorting helpers ==== */

export function sortByDistance<T extends { distanceMeters: number }>(
  items: T[],
  order: "asc" | "desc" = "asc",
): T[] {
  return [...items].sort((a, b) =>
    order === "asc" ? a.distanceMeters - b.distanceMeters : b.distanceMeters - a.distanceMeters,
  );
}

export function sortByDate<T extends { timestamp: string }>(
  items: T[],
  order: "asc" | "desc" = "desc",
): T[] {
  return [...items].sort((a, b) => {
    const dA = new Date(a.timestamp).getTime();
    const dB = new Date(b.timestamp).getTime();
    return order === "asc" ? dA - dB : dB - dA;
  });
}

export function sortByScore<T extends { score: number }>(
  items: T[],
  order: "desc" | "asc" = "desc",
): T[] {
  return [...items].sort((a, b) => (order === "desc" ? b.score - a.score : a.score - b.score));
}

/* ==== Filtering helpers ==== */

export function filterOnline<T extends { online: boolean }>(items: T[]): T[] {
  return items.filter((i) => i.online);
}

export function filterOpen<T extends { isOpen: boolean }>(items: T[]): T[] {
  return items.filter((i) => i.isOpen);
}

export function filterAvailable<T extends { isAvailable: boolean }>(items: T[]): T[] {
  return items.filter((i) => i.isAvailable);
}

export function filterWithinRadius<T extends { lat: number; lng: number }>(
  items: T[],
  centerLat: number,
  centerLng: number,
  radiusMeters: number,
): T[] {
  return items.filter((i) => isWithinRadius(centerLat, centerLng, i.lat, i.lng, radiusMeters));
}

/* ==== Time helpers ==== */

export function isWithinTimeWindow(timestampStr: string, windowMs: number): boolean {
  const now = Date.now();
  const timestamp = new Date(timestampStr).getTime();
  return now - timestamp <= windowMs;
}

/* ==== Checkin transition helpers ==== */

export function getCheckinTransitionLabel(transition: CheckinTransitionValue): string {
  return CheckinTransitionMeta[transition].label;
}

export function getCheckinTransitionEmoji(transition: CheckinTransitionValue): string {
  return CheckinTransitionMeta[transition].emoji;
}

export function getTimeSince(timestampStr: string): number {
  return Date.now() - new Date(timestampStr).getTime();
}

export function isEventActive(startDate: string, endDate: string): boolean {
  const now = Date.now();
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  return now >= start && now <= end;
}

export function isEventUpcoming(startDate: string, windowMs = 3600000): boolean {
  const now = Date.now();
  const start = new Date(startDate).getTime();
  return start > now && start - now <= windowMs;
}

/* ==== Intersection helpers ==== */

export function findCommonElements<T>(a: T[], b: T[]): T[] {
  return a.filter((item) => b.includes(item));
}

export function getOverlapScore(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const common = findCommonElements(a, b);
  return common.length / Math.max(a.length, b.length);
}
