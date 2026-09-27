import { isRemoteAuthEnabled } from "@/lib/auth/schema-a-auth-flag";

export function isSchemaAConversationsFlagEnabled(): boolean {
  return import.meta.env.VITE_APP_SCHEMA_A_CONVERSATIONS === "true";
}

export type RemoteConversationsGate = {
  isFlagEnabled: () => boolean;
};

const defaultGate: RemoteConversationsGate = {
  isFlagEnabled: isSchemaAConversationsFlagEnabled,
};

let gate: RemoteConversationsGate = defaultGate;

/** Test-only. Production callers must not replace the gate. */
export function setRemoteConversationsGateForTests(
  next: Partial<RemoteConversationsGate> | null,
): void {
  gate = next ? { ...defaultGate, ...next } : defaultGate;
}

/**
 * Conversations cutover is on only when Auth remote is on AND this domain flag is on.
 * Demo always wins through the Auth gate.
 */
export function isRemoteConversationsEnabled(): boolean {
  if (!isRemoteAuthEnabled()) return false;
  return gate.isFlagEnabled();
}
