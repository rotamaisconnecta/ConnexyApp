/* =========================================================
   distance-utils.ts — Distance formatting utilities
   Pure TypeScript. No React. No side effects.
========================================================= */

/* ─── formatDistance ─────────────────────────────────────── */

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1).replace(".", ",")}km`;
}

/* ─── distanceLabel ──────────────────────────────────────── */

export function distanceLabel(meters: number): string {
  if (meters <= 200) return "Muito perto";
  if (meters <= 2000) return "Próximo";
  return `${formatDistance(meters)}`;
}

/* ─── distanceTone ───────────────────────────────────────── */

export function distanceTone(meters: number): string {
  if (meters <= 200) return "bg-success/15 text-success";
  if (meters <= 2000) return "bg-accent text-primary";
  return "bg-secondary text-muted-foreground";
}

/* ─── isWithinRadius ─────────────────────────────────────── */

export function isWithinRadius(meters: number, radiusMeters: number): boolean {
  return meters <= radiusMeters;
}
