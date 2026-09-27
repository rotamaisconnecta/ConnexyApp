import { isRemoteAuthEnabled } from "@/lib/auth/schema-a-auth-flag";

export function isSchemaAProfileFlagEnabled(): boolean {
  return import.meta.env.VITE_APP_SCHEMA_A_PROFILE === "true";
}

export type RemoteProfileGate = {
  isFlagEnabled: () => boolean;
};

const defaultGate: RemoteProfileGate = {
  isFlagEnabled: isSchemaAProfileFlagEnabled,
};

let gate: RemoteProfileGate = defaultGate;

/** Test-only. Production callers must not replace the gate. */
export function setRemoteProfileGateForTests(next: Partial<RemoteProfileGate> | null): void {
  gate = next ? { ...defaultGate, ...next } : defaultGate;
}

/**
 * Profile cutover is on only when Auth remote is on AND this domain flag is on.
 * Demo always wins through the Auth gate.
 */
export function isRemoteProfileEnabled(): boolean {
  if (!isRemoteAuthEnabled()) return false;
  return gate.isFlagEnabled();
}
