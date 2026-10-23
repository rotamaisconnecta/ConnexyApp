/* =========================================================
   splash-store.ts — Persistência local da configuração da
   splash screen. Dados sob a chave connexy:demo:splash-config.
   Sem Supabase, sem serviços remotos. JSON inválido ou campos
   incompatíveis caem no fallback padrão.
========================================================= */

import { demoStorageKey } from "@/lib/demo/demo-config";
import {
  defaultSplashConfig,
  sanitizeSplashConfig,
  type SplashConfig,
} from "./splash-config";

export const SPLASH_STORAGE_KEY = demoStorageKey("splash-config");

/** Le a configuração salva; sem dados ou com dados inválidos, usa o padrão. */
export function loadSplashConfig(): SplashConfig {
  if (typeof window === "undefined") return defaultSplashConfig();
  try {
    const raw = window.localStorage.getItem(SPLASH_STORAGE_KEY);
    if (!raw) return defaultSplashConfig();
    return sanitizeSplashConfig(JSON.parse(raw));
  } catch {
    return defaultSplashConfig();
  }
}

/** Persiste a configuração validada localmente. Ignora erros de storage. */
export function saveSplashConfig(config: SplashConfig): void {
  const safe = sanitizeSplashConfig(config);
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SPLASH_STORAGE_KEY, JSON.stringify(safe));
  } catch {
    // Storage unavailable: the app keeps running with the current config.
  }
}

/** Remove a configuração salva e volta ao fallback padrão. */
export function resetSplashConfig(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SPLASH_STORAGE_KEY);
  } catch {
    // Storage unavailable: nothing to reset.
  }
}