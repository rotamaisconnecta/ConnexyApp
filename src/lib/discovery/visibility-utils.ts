/* =========================================================
   visibility-utils.ts — Visibility mode utilities
   Pure TypeScript. No React. No side effects.
========================================================= */

import type { VisibilityMode } from "./discovery-types";

/* ─── canSeeProfile ──────────────────────────────────────── */

export function canSeeProfile(
  viewerId: string,
  profileId: string,
  visibility: VisibilityMode,
  connectionIds: string[],
): boolean {
  if (viewerId === profileId) return true;
  if (visibility === "visible") return true;
  if (visibility === "connections_only") {
    return connectionIds.includes(profileId);
  }
  return false;
}

/* ─── canSeeDistance ─────────────────────────────────────── */

export function canSeeDistance(visibility: VisibilityMode, distanceMeters: number): boolean {
  if (visibility === "hidden") return false;
  return true;
}

/* ─── canContact ─────────────────────────────────────────── */

export function canContact(
  visibility: VisibilityMode,
  connectionIds: string[],
  targetId: string,
): boolean {
  if (visibility === "visible") return true;
  if (visibility === "connections_only") {
    return connectionIds.includes(targetId);
  }
  return false;
}

/* ─── getVisibilityLabel ─────────────────────────────────── */

export function getVisibilityLabel(visibility: VisibilityMode): string {
  switch (visibility) {
    case "visible":
      return "Visível para todos";
    case "connections_only":
      return "Visível para conexões";
    case "hidden":
      return "Modo invisível";
  }
}

/* ─── getVisibilityIcon ──────────────────────────────────── */

export function getVisibilityIcon(visibility: VisibilityMode): string {
  switch (visibility) {
    case "visible":
      return "👁️";
    case "connections_only":
      return "👥";
    case "hidden":
      return "🫥";
  }
}
