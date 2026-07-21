/* =========================================================
   moment-expiry.ts — Moment lifecycle management
   Pure TypeScript. No React. No side effects.
========================================================= */

/* ─── Data contract ──────────────────────────────────────── */

export interface MomentData {
  id: string;
  text: string;
  createdAt: Date;
  expiresAt?: Date;
  endedAt?: Date;
  place?: { name: string };
  active: boolean;
}

/* ─── Status ─────────────────────────────────────────────── */

export type MomentStatusLabel = "active" | "recent" | "expiring" | "expired" | "ended";

export interface MomentStatus {
  status: MomentStatusLabel;
  label: string;
  remainingMs: number;
  expired: boolean;
}

/* ─── Expiry rule ────────────────────────────────────────── */

export type MomentExpiryRuleType = "ended" | "expiresAt" | "textTime" | "textToday" | "default24h";

export interface MomentExpiryRule {
  type: MomentExpiryRuleType;
  priority: number;
}

/* ─── Constants ──────────────────────────────────────────── */

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

const EXPIRY_RULES: Record<MomentExpiryRuleType, MomentExpiryRule> = {
  ended: { type: "ended", priority: 1 },
  expiresAt: { type: "expiresAt", priority: 2 },
  textTime: { type: "textTime", priority: 3 },
  textToday: { type: "textToday", priority: 4 },
  default24h: { type: "default24h", priority: 5 },
};

const RECENT_MS = 30 * 60 * 1000;
const EXPIRING_MS = 2 * 60 * 60 * 1000;

/* ─── Text parsers ───────────────────────────────────────── */

const TIME_PATTERN = /até as (\d{1,2})h/i;
const TODAY_PATTERN = /hoje/i;

function parseTimeFromText(text: string): Date | null {
  const timeMatch = text.match(TIME_PATTERN);
  if (timeMatch?.[1]) {
    const hour = parseInt(timeMatch[1], 10);
    if (hour >= 0 && hour <= 23) {
      const d = new Date();
      d.setHours(hour, 59, 59, 999);
      return d;
    }
  }

  const todayMatch = text.match(TODAY_PATTERN);
  if (todayMatch) {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d;
  }

  return null;
}

/* ─── Expiry calculation ─────────────────────────────────── */

function resolveExpiryRule(moment: MomentData): MomentExpiryRuleType {
  if (moment.endedAt) return "ended";
  if (moment.expiresAt) return "expiresAt";

  const textDate = parseTimeFromText(moment.text);
  if (textDate) {
    const isTime = TIME_PATTERN.test(moment.text);
    return isTime ? "textTime" : "textToday";
  }

  return "default24h";
}

export function calculateExpiry(moment: MomentData): Date {
  if (moment.endedAt) return moment.endedAt;
  if (moment.expiresAt) return moment.expiresAt;

  const textDate = parseTimeFromText(moment.text);
  if (textDate) return textDate;

  return new Date(moment.createdAt.getTime() + TWENTY_FOUR_HOURS_MS);
}

/* ─── Remaining time ─────────────────────────────────────── */

export function getRemainingTime(moment: MomentData): number {
  if (moment.endedAt) return 0;
  const expiry = calculateExpiry(moment);
  return Math.max(0, expiry.getTime() - Date.now());
}

/* ─── Format ─────────────────────────────────────────────── */

export function formatRemainingTime(ms: number): string {
  if (ms <= 0) return "Expirado";

  const totalMinutes = Math.floor(ms / (1000 * 60));

  if (totalMinutes < 60) return `${totalMinutes} min`;

  const hours = Math.floor(totalMinutes / 60);
  if (hours < 24) return `${hours} h`;

  const days = Math.floor(hours / 24);
  return `${days}d`;
}

/* ─── Status resolution ──────────────────────────────────── */

export function getMomentStatus(moment: MomentData): MomentStatus {
  if (moment.endedAt) {
    return {
      status: "ended",
      label: "Encerrado",
      remainingMs: 0,
      expired: true,
    };
  }

  const remaining = getRemainingTime(moment);

  if (remaining <= 0) {
    return {
      status: "expired",
      label: "Expirado",
      remainingMs: 0,
      expired: true,
    };
  }

  const age = Date.now() - moment.createdAt.getTime();

  if (remaining <= EXPIRING_MS) {
    return {
      status: "expiring",
      label: formatRemainingTime(remaining),
      remainingMs: remaining,
      expired: false,
    };
  }

  if (age <= RECENT_MS) {
    return {
      status: "recent",
      label: "Novo",
      remainingMs: remaining,
      expired: false,
    };
  }

  return {
    status: "active",
    label: formatRemainingTime(remaining),
    remainingMs: remaining,
    expired: false,
  };
}

/* ─── Active check ───────────────────────────────────────── */

export function isMomentActive(moment: MomentData): boolean {
  if (!moment.active) return false;
  if (moment.endedAt) return false;
  return getRemainingTime(moment) > 0;
}

/* ─── End moment ─────────────────────────────────────────── */

export function endMoment(moment: MomentData): MomentData {
  return {
    ...moment,
    endedAt: new Date(),
    active: false,
  };
}
