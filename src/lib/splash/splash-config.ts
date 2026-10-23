/**
 * Splash screen configuration.
 * Minimal, safe abstraction prepared for future admin management.
 * No backend/API/migrations created in this phase.
 */
export type SplashType = "institutional" | "promotional" | "sponsored";

export type SplashConfig = {
  enabled: boolean;
  /** Image path/URL (local asset or remote). Remote not used unless explicitly provided. */
  image?: string;
  title?: string;
  subtitle?: string;
  type?: SplashType;
  startAt?: string; // ISO
  endAt?: string;   // ISO
  priority?: number;
};

const DEFAULT_SPLASH_CONFIG: SplashConfig = {
  enabled: true,
  type: "institutional",
};

export function getSplashConfig(): SplashConfig {
  // Frontend-only, local fallback. Prepared for future remote merge.
  return { ...DEFAULT_SPLASH_CONFIG };
}

/** Validates config; returns safe fallback if invalid. */
export function getSafeSplashConfig(): SplashConfig {
  const cfg = getSplashConfig();
  if (typeof cfg.enabled !== "boolean") {
    return { ...DEFAULT_SPLASH_CONFIG };
  }
  if (cfg.startAt && Number.isNaN(Date.parse(cfg.startAt))) delete cfg.startAt;
  if (cfg.endAt && Number.isNaN(Date.parse(cfg.endAt))) delete cfg.endAt;
  if (cfg.priority !== undefined && !Number.isFinite(cfg.priority)) delete cfg.priority;
  return cfg;
}

/** Checks if splash is currently active by schedule (if provided). */
export function isSplashActiveNow(config: SplashConfig = getSafeSplashConfig()): boolean {
  if (!config.enabled) return false;
  const now = Date.now();
  if (config.startAt) {
    const t = Date.parse(config.startAt);
    if (!Number.isNaN(t) && now < t) return false;
  }
  if (config.endAt) {
    const t = Date.parse(config.endAt);
    if (!Number.isNaN(t) && now > t) return false;
  }
  return true;
}
