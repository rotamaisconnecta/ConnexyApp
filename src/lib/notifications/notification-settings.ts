/* =========================================================
   notification-settings.ts — Default settings and helpers
   for notification preferences. Pure TypeScript.
   No React. No side effects.
========================================================= */

import type { NotificationSettingsState } from "./notification-types";

/* ─── Default settings (all enabled) ────────────────────── */

export function createDefaultSettings(): NotificationSettingsState {
  return {
    message: true,
    connectionRequest: true,
    connectionAccepted: true,
    nearbyPerson: true,
    nearbyMoment: true,
    nearbyOffer: true,
    nearbyEvent: true,
    driverFound: true,
    rideStarted: true,
    rideFinished: true,
    businessFollow: true,
    couponAvailable: true,
    like: true,
    comment: true,
    mention: true,
    share: true,
  };
}

/* ─── Toggle a single setting ────────────────────────────── */

export function toggleSetting(
  settings: NotificationSettingsState,
  key: keyof NotificationSettingsState,
): NotificationSettingsState {
  return { ...settings, [key]: !settings[key] };
}

/* ─── Check if any setting is enabled ────────────────────── */

export function hasAnyEnabled(settings: NotificationSettingsState): boolean {
  return Object.values(settings).some(Boolean);
}

/* ─── Disable all ────────────────────────────────────────── */

export function disableAll(settings: NotificationSettingsState): NotificationSettingsState {
  const result = { ...settings };
  for (const key of Object.keys(result) as Array<keyof NotificationSettingsState>) {
    result[key] = false;
  }
  return result;
}

/* ─── Enable all ─────────────────────────────────────────── */

export function enableAll(settings: NotificationSettingsState): NotificationSettingsState {
  const result = { ...settings };
  for (const key of Object.keys(result) as Array<keyof NotificationSettingsState>) {
    result[key] = true;
  }
  return result;
}
