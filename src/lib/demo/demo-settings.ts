import { demoStorageKey } from "./demo-config";
import { getDemoIdentity } from "./demo-identity";

export const DEMO_SETTINGS_STORAGE_KEY = demoStorageKey("settings");
export const DEMO_SETTINGS_EVENT = "connexy:demo:settings";

export type DemoLocalSettings = {
  twoFactor: boolean;
  payment: string;
  language: string;
};

export const DEFAULT_DEMO_SETTINGS: DemoLocalSettings = {
  twoFactor: false,
  payment: "Cartão final 4821",
  language: "Português",
};

type SettingsMap = Record<string, DemoLocalSettings>;

function readMap(): SettingsMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(DEMO_SETTINGS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as SettingsMap;
  } catch {
    return {};
  }
}

function normalize(value: Partial<DemoLocalSettings> | undefined): DemoLocalSettings {
  return {
    twoFactor: value?.twoFactor === true,
    payment: value?.payment?.trim() || DEFAULT_DEMO_SETTINGS.payment,
    language: value?.language?.trim() || DEFAULT_DEMO_SETTINGS.language,
  };
}

export function readDemoSettings(userId = getDemoIdentity().id): DemoLocalSettings {
  if (!userId) return { ...DEFAULT_DEMO_SETTINGS };
  return normalize(readMap()[userId]);
}

export function writeDemoSettings(
  patch: Partial<DemoLocalSettings>,
  userId = getDemoIdentity().id,
): DemoLocalSettings {
  const next = normalize({ ...readDemoSettings(userId), ...patch });
  if (typeof window === "undefined" || !userId) return next;
  try {
    const map = readMap();
    map[userId] = next;
    window.localStorage.setItem(DEMO_SETTINGS_STORAGE_KEY, JSON.stringify(map));
    window.dispatchEvent(new CustomEvent(DEMO_SETTINGS_EVENT));
  } catch {
    // storage unavailable
  }
  return next;
}
