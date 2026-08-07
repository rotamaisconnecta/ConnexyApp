/* =========================================================
   mock-conversation-invites.ts — Simulated conversation invite
   status for people cards and public profiles.
   Dados simulados locais. Banco de dados ainda não conectado.
   Pure TypeScript. No React. SSR-safe storage helpers.
========================================================= */

export type ConversationInviteStatus = "available" | "invited" | "connected" | "rejected";

const STORAGE_KEY = "connexy.mock.conversation-invites";

/* People already connected. value = conversationId (must match
   an id present in MOCK_CONVERSATIONS). */
const MOCK_CONNECTED: Record<string, string> = {
  beatriz: "beatriz",
  rafael: "rafael",
};

/* People with a pending outgoing invite. */
const MOCK_INVITED: string[] = ["juliana"];

export function getConversationId(personId: string): string | null {
  return MOCK_CONNECTED[personId] ?? null;
}

export function readStoredInvites(): Record<string, ConversationInviteStatus> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};
    return parsed as Record<string, ConversationInviteStatus>;
  } catch {
    return {};
  }
}

export function writeStoredInvite(personId: string, status: ConversationInviteStatus): void {
  if (typeof window === "undefined") return;
  try {
    const current = readStoredInvites();
    current[personId] = status;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // storage may be unavailable; the invite stays in memory for this visit
  }
}

export function getConversationInviteStatus(personId: string): ConversationInviteStatus {
  if (personId in MOCK_CONNECTED) return "connected";
  const stored = readStoredInvites()[personId];
  if (stored === "connected" || stored === "invited" || stored === "rejected") return stored;
  if (MOCK_INVITED.includes(personId)) return "invited";
  return "available";
}
