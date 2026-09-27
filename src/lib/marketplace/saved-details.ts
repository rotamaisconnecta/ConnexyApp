import { toast } from "sonner";

export const SAVED_DETAILS_STORAGE_KEY = "connexy:demo:saved-details";
export const SAVED_DETAILS_EVENT = "connexy:demo:saved-details";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    return JSON.parse(window.localStorage.getItem(key) ?? "") as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(SAVED_DETAILS_EVENT));
    }
  } catch {
    toast.error("Não foi possível salvar neste dispositivo.");
  }
}

export function subscribeSavedDetails(listener: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const onCustom = () => listener();
  const onStorage = (event: StorageEvent) => {
    if (event.key === SAVED_DETAILS_STORAGE_KEY) listener();
  };
  window.addEventListener(SAVED_DETAILS_EVENT, onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(SAVED_DETAILS_EVENT, onCustom);
    window.removeEventListener("storage", onStorage);
  };
}

export function listSavedDetailIds(): string[] {
  const value = readJson<unknown>(SAVED_DETAILS_STORAGE_KEY, []);
  const ids = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.length > 0)
    : [];
  return [...new Set(ids)];
}

export function isDetailSaved(targetId: string): boolean {
  return listSavedDetailIds().includes(targetId);
}

export function toggleSavedDetail(targetId: string): boolean {
  const current = listSavedDetailIds();
  const next = current.includes(targetId)
    ? current.filter((id) => id !== targetId)
    : [...current, targetId];
  writeJson(SAVED_DETAILS_STORAGE_KEY, next);
  return next.includes(targetId);
}
