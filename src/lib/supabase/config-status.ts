import { isPublicSupabaseConfigured } from "./config";

/**
 * Checks whether the backend connection settings are available, without ever
 * instantiating the client (which throws when they are missing).
 */
export function isBackendConfigured(): boolean {
  return isPublicSupabaseConfigured();
}

/**
 * Configuration errors are actionable deployment errors, not temporary backend
 * outages. Keep the offline UI for actual network failures only.
 */
export function isBackendUnavailableError(error: unknown): boolean {
  return error instanceof TypeError && /(?:fetch|network|failed to fetch)/i.test(error.message);
}
