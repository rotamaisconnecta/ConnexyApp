import { isDemoMode } from "@/lib/demo/demo-config";
import { isPublicSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Independent of VITE_APP_DEMO_MODE. Demo always wins: when demo is on,
 * remote Auth stays disabled even if this flag is true.
 */
export function isSchemaAAuthFlagEnabled(): boolean {
  return import.meta.env.VITE_APP_SCHEMA_A_AUTH === "true";
}

export type RemoteAuthGate = {
  isDemoMode: () => boolean;
  isFlagEnabled: () => boolean;
  isPublicSupabaseConfigured: () => boolean;
};

const defaultGate: RemoteAuthGate = {
  isDemoMode,
  isFlagEnabled: isSchemaAAuthFlagEnabled,
  isPublicSupabaseConfigured,
};

let gate: RemoteAuthGate = defaultGate;

/** Test-only. Production callers must not replace the gate. */
export function setRemoteAuthGateForTests(next: Partial<RemoteAuthGate> | null): void {
  gate = next ? { ...defaultGate, ...next } : defaultGate;
}

/**
 * Foundation gate: Demo off AND flag on AND public Supabase configured.
 * Does not replace isDemoMode() or the demo identity helper.
 */
export function isRemoteAuthEnabled(): boolean {
  if (gate.isDemoMode()) return false;
  if (!gate.isFlagEnabled()) return false;
  return gate.isPublicSupabaseConfigured();
}
