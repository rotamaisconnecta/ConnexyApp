import { isRemoteAuthEnabled } from "@/lib/auth/schema-a-auth-flag";

/**
 * D-M3/P3 — flag de habilitacao da assinatura de URL de midia.
 * DESATIVADA por padrao. Nao ativar neste lote.
 */
export function isMediaUrlFlagEnabled(): boolean {
  return import.meta.env.VITE_APP_SCHEMA_A_MEDIA_URL === "true";
}

export type MediaUrlGate = {
  isFlagEnabled: () => boolean;
};

const defaultGate: MediaUrlGate = {
  isFlagEnabled: isMediaUrlFlagEnabled,
};

let gate: MediaUrlGate = defaultGate;

/** Test-only. Production callers must not replace the gate. */
export function setMediaUrlGateForTests(next: Partial<MediaUrlGate> | null): void {
  gate = next ? { ...defaultGate, ...next } : defaultGate;
}

/** So habilita quando o Auth remoto esta ligado E a flag de midia esta ligada. */
export function isMediaUrlSigningEnabled(): boolean {
  if (!isRemoteAuthEnabled()) return false;
  return gate.isFlagEnabled();
}
