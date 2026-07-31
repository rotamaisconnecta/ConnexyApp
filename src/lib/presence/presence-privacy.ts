/* ==== presence-privacy.ts -- Presence Privacy System
   Pure TypeScript. No React. No side effects on import.
   Phase 10.7.1 — Sistema de Privacidade da Presença. ==== */

import {
  PresenceVisibility,
  type PresenceRecord,
  type PresenceVisibilityValue,
  type PresenceTargetType,
} from "@/lib/event-checkin/checkin-types";
import { PlaceStatus, type PlaceStatusValue } from "@/lib/integration/integration-types";

export const PRESENCE_PREF_KEY = "connexy.presence.visibility";
export const PRESENCE_RECORDS_KEY = "connexy.presence.checkins";

/* ==== Persisted preference ==== */

export function getStoredPresenceVisibility(
  fallback: PresenceVisibilityValue = PresenceVisibility.PUBLIC,
): PresenceVisibilityValue {
  if (typeof window === "undefined") return fallback;
  const stored = window.localStorage.getItem(PRESENCE_PREF_KEY);
  const value = stored as PresenceVisibilityValue | null;
  return value && value in PresenceVisibility ? value : fallback;
}

export function setStoredPresenceVisibility(visibility: PresenceVisibilityValue): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PRESENCE_PREF_KEY, visibility);
}

export function loadPresenceRecords(): PresenceRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PRESENCE_RECORDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PresenceRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function savePresenceRecords(records: PresenceRecord[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PRESENCE_RECORDS_KEY, JSON.stringify(records));
}

/* ==== Visibility guards ==== */

export function isPublic(visibility: PresenceVisibilityValue): boolean {
  return visibility === PresenceVisibility.PUBLIC;
}

export function isFriendsOnly(visibility: PresenceVisibilityValue): boolean {
  return visibility === PresenceVisibility.FRIENDS;
}

export function isAnonymous(visibility: PresenceVisibilityValue): boolean {
  return visibility === PresenceVisibility.ANONYMOUS;
}

export function canAppearOnMap(visibility: PresenceVisibilityValue): boolean {
  return visibility === PresenceVisibility.PUBLIC;
}

export function canPublishToFeed(visibility: PresenceVisibilityValue): boolean {
  return visibility !== PresenceVisibility.ANONYMOUS;
}

export function canNotifyUsers(visibility: PresenceVisibilityValue): boolean {
  return visibility !== PresenceVisibility.ANONYMOUS;
}

/* ==== Visibility labels for the Presentes list (spec 21) ==== */

export function visibilityTypeLabel(visibility: PresenceVisibilityValue): string {
  return visibility === PresenceVisibility.PUBLIC ? "Público" : "Amigos";
}

/* ==== Presentes list filtering (spec 21) ====
   Público -> everyone sees. Apenas amigos -> only friends.
   Anônimo -> never listed by name; only an aggregated count. */

export function anonymizePresenceList(
  records: PresenceRecord[],
  friendIds: string[],
  viewerId: string,
): { visible: PresenceRecord[]; anonymousCount: number } {
  const visible: PresenceRecord[] = [];
  let anonymousCount = 0;

  for (const record of records) {
    if (isAnonymous(record.visibility)) {
      anonymousCount += 1;
      continue;
    }
    if (isFriendsOnly(record.visibility)) {
      if (record.userId === viewerId || friendIds.includes(record.userId)) {
        visible.push(record);
      }
      continue;
    }
    visible.push(record);
  }

  return { visible, anonymousCount };
}

/* ==== Presence summary (spec 25) ==== */

export function summarizePresence(records: PresenceRecord[]): {
  publicCount: number;
  friendsCount: number;
  anonymousCount: number;
  total: number;
} {
  let publicCount = 0;
  let friendsCount = 0;
  let anonymousCount = 0;

  for (const record of records) {
    if (isAnonymous(record.visibility)) anonymousCount += 1;
    else if (isFriendsOnly(record.visibility)) friendsCount += 1;
    else publicCount += 1;
  }

  return { publicCount, friendsCount, anonymousCount, total: records.length };
}

/* ==== Target helpers ==== */

export function getPresenceForTarget(
  records: PresenceRecord[],
  targetId: string,
): PresenceRecord[] {
  return records.filter((r) => r.targetId === targetId && !r.leftAt);
}

export function getPresenceForTargets(
  records: PresenceRecord[],
  targetIds: string[],
): PresenceRecord[] {
  return records.filter((r) => targetIds.includes(r.targetId) && !r.leftAt);
}

/* ==== Movement / analytics metrics (spec 25) ==== */

export interface PresenceMetrics {
  present: number;
  arriving: number;
  visited: number;
  anonymous: number;
  avgStayMinutes: number;
  peakHour: number;
  movement: PlaceStatusValue;
}

export function computeMovementMetrics(records: PresenceRecord[]): PresenceMetrics {
  const now = Date.now();
  const present = records.filter((r) => !r.leftAt);
  const arriving = present.filter((r) => now - new Date(r.checkedInAt).getTime() <= 15 * 60000);

  const visited = records.filter((r) => !!r.leftAt);
  const anonymous = present.filter((r) => isAnonymous(r.visibility)).length;

  const stays = records
    .filter((r) => !!r.leftAt)
    .map((r) => (new Date(r.leftAt!).getTime() - new Date(r.checkedInAt).getTime()) / 60000)
    .filter((m) => m > 0);
  const avgStayMinutes =
    stays.length > 0 ? Math.round(stays.reduce((sum, m) => sum + m, 0) / stays.length) : 45;

  const hourCounts = new Array<number>(24).fill(0);
  for (const record of records) {
    hourCounts[new Date(record.checkedInAt).getHours()] += 1;
  }
  let peakHour = 0;
  for (let hour = 0; hour < 24; hour++) {
    if (hourCounts[hour] > hourCounts[peakHour]) peakHour = hour;
  }

  const capacity = Math.max(10, present.length * 2);
  const capacityPercent = present.length / capacity;
  const movement =
    capacityPercent >= 0.8
      ? PlaceStatus.MUITO_CHEIO
      : capacityPercent >= 0.55
        ? PlaceStatus.BOMBANDO
        : capacityPercent >= 0.3
          ? PlaceStatus.MOVIMENTADO
          : PlaceStatus.CALMO;

  return {
    present: present.length,
    arriving: arriving.length,
    visited: visited.length,
    anonymous,
    avgStayMinutes,
    peakHour,
    movement,
  };
}

/* ==== Map heatmap cells (spec 25) ==== */

export interface HeatCell {
  id: string;
  x: number;
  y: number;
  weight: number;
}

export function computeHeatmap(records: PresenceRecord[], grid = 6): HeatCell[] {
  const total = records.length;
  if (total === 0) return [];

  const buckets = new Array(grid * grid).fill(0);
  for (let i = 0; i < records.length; i++) {
    const index = (i * 7 + 3) % (grid * grid);
    buckets[index] += 1;
  }

  const max = Math.max(1, ...buckets);
  return buckets
    .map((count, index) => {
      const row = Math.floor(index / grid);
      const col = index % grid;
      return {
        id: `heat-${row}-${col}`,
        x: (col + 0.5) / grid,
        y: (row + 0.5) / grid,
        weight: count / max,
      };
    })
    .filter((cell) => cell.weight > 0);
}

export type PresenceTargetInput = {
  id: string;
  name: string;
  type: PresenceTargetType;
  lat?: number;
  lng?: number;
};
