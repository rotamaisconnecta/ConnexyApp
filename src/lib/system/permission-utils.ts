/* =========================================================
   permission-utils.ts — Permission helper functions
   Pure TypeScript. No React. No side effects.
========================================================= */

import { PermissionStatus } from "./system-types";
import type { PermissionStatusValue } from "./system-types";

/* ─── Permission name mapping ────────────────────────────── */

export type PermissionKind = "camera" | "location" | "notification" | "microphone";

const PERMISSION_API_MAP: Record<PermissionKind, string> = {
  camera: "camera",
  location: "geolocation",
  notification: "notifications",
  microphone: "microphone",
};

/* ─── Check permission (browser only) ────────────────────── */

export async function checkPermission(kind: PermissionKind): Promise<PermissionStatusValue> {
  if (typeof navigator === "undefined" || !navigator.permissions) {
    return PermissionStatus.UNAVAILABLE;
  }

  try {
    const name = PERMISSION_API_MAP[kind] as PermissionName;
    const status = await navigator.permissions.query({ name });
    if (status.state === "granted") return PermissionStatus.GRANTED;
    if (status.state === "denied") return PermissionStatus.DENIED;
    return PermissionStatus.PROMPT;
  } catch {
    return PermissionStatus.UNAVAILABLE;
  }
}

/* ─── Request permission (browser only) ──────────────────── */

export async function requestPermission(kind: PermissionKind): Promise<PermissionStatusValue> {
  if (typeof navigator === "undefined") return PermissionStatus.UNAVAILABLE;

  if (kind === "location") {
    try {
      const result = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      return PermissionStatus.GRANTED;
    } catch {
      return PermissionStatus.DENIED;
    }
  }

  return checkPermission(kind);
}
