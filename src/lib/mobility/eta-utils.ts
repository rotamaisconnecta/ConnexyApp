/* =========================================================
   eta-utils.ts — ETA calculation and display utilities
   Pure TypeScript. No React. No side effects.
========================================================= */

/* ─── calculateEta ───────────────────────────────────────── */

export function calculateEta(distanceMeters: number, averageSpeedKmh: number = 30): number {
  const km = distanceMeters / 1000;
  const hours = km / averageSpeedKmh;
  return Math.max(1, Math.round(hours * 60));
}

/* ─── formatEta ──────────────────────────────────────────── */

export function formatEta(minutes: number): string {
  if (minutes <= 0) return "Chegando";
  if (minutes === 1) return "1 min";
  return `${minutes} min`;
}

/* ─── formatEtaRange ─────────────────────────────────────── */

export function formatEtaRange(min: number, max: number): string {
  if (min === max) return formatEta(min);
  return `${min}–${max} min`;
}

/* ─── getEtaLabel ────────────────────────────────────────── */

export function getEtaLabel(minutes: number): string {
  if (minutes <= 1) return "Chegando agora";
  if (minutes <= 3) return "Muito rápido";
  if (minutes <= 7) return "Rápido";
  if (minutes <= 15) return "Moderado";
  return "Distante";
}

/* ─── getEtaColor ────────────────────────────────────────── */

export function getEtaColor(minutes: number): string {
  if (minutes <= 3) return "text-success";
  if (minutes <= 7) return "text-primary";
  if (minutes <= 15) return "text-amber-500";
  return "text-muted-foreground";
}

/* ─── getEtaBgColor ──────────────────────────────────────── */

export function getEtaBgColor(minutes: number): string {
  if (minutes <= 3) return "bg-success/15 text-success";
  if (minutes <= 7) return "bg-primary/15 text-primary";
  if (minutes <= 15) return "bg-amber-500/15 text-amber-600";
  return "bg-secondary text-muted-foreground";
}

/* ─── isUrgent ───────────────────────────────────────────── */

export function isUrgent(minutes: number): boolean {
  return minutes <= 2;
}

/* ─── getArrivalWindow ───────────────────────────────────── */

export function getArrivalWindow(etaMinutes: number): { earliest: number; latest: number } {
  return {
    earliest: Math.max(1, etaMinutes - 1),
    latest: etaMinutes + 2,
  };
}

/* ─── formatCountdown ────────────────────────────────────── */

export function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
