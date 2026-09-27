import { isRemoteAuthEnabled } from "@/lib/auth/schema-a-auth-flag";

export function isSchemaASocialFlagEnabled(): boolean {
  return import.meta.env.VITE_APP_SCHEMA_A_SOCIAL === "true";
}

export type RemoteSocialGate = {
  isFlagEnabled: () => boolean;
};

const defaultGate: RemoteSocialGate = {
  isFlagEnabled: isSchemaASocialFlagEnabled,
};

let gate: RemoteSocialGate = defaultGate;

/** Test-only. Production callers must not replace the gate. */
export function setRemoteSocialGateForTests(next: Partial<RemoteSocialGate> | null): void {
  gate = next ? { ...defaultGate, ...next } : defaultGate;
}

/**
 * Social cutover is on only when Auth remote is on AND this domain flag is on.
 * Demo always wins through the Auth gate.
 */
export function isRemoteSocialEnabled(): boolean {
  if (!isRemoteAuthEnabled()) return false;
  return gate.isFlagEnabled();
}
