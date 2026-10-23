import { isRemoteAuthEnabled } from "@/lib/auth/schema-a-auth-flag";

export function isSchemaAContentFlagEnabled(): boolean {
  return import.meta.env.VITE_APP_SCHEMA_A_CONTENT === "true";
}

export type RemoteContentGate = {
  isFlagEnabled: () => boolean;
};

const defaultGate: RemoteContentGate = {
  isFlagEnabled: isSchemaAContentFlagEnabled,
};

let gate: RemoteContentGate = defaultGate;

/** Test-only. Production callers must not replace the gate. */
export function setRemoteContentGateForTests(next: Partial<RemoteContentGate> | null): void {
  gate = next ? { ...defaultGate, ...next } : defaultGate;
}

/**
 * Content cutover is on only when Auth remote is on AND this domain flag is on.
 * Demo always wins through the Auth gate.
 */
export function isRemoteContentEnabled(): boolean {
  if (!isRemoteAuthEnabled()) return false;
  return gate.isFlagEnabled();
}
