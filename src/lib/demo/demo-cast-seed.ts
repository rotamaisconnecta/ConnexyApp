/* =========================================================
   demo-cast-seed.ts — Seed idempotente do elenco demo.
   Só corre quando isDemoMode() é verdadeiro. Reusa demo-db
   e IndexedDB de chat. Não cria um segundo banco.
========================================================= */

import {
  DEMO_CAST_SEED_VERSION,
  DEMO_USER_ANA,
  DEMO_USER_RAFAEL,
  isDemoCastUser,
  listDemoSocialPeople,
} from "./demo-cast";
import { demoStorageKey, isDemoMode } from "./demo-config";
import { getDemoIdentity } from "./demo-identity";
import {
  connectUser,
  getConnectionBetween,
  getOutgoingPendingRequest,
  purgeDemoCastGraph,
  sendRequest,
} from "./demo-db";
import {
  ensureLocalConversation,
  getLocalChatMessages,
  putLocalChatMessage,
} from "@/lib/chat/local-chat-persistence";

function conversationIdFor(userAId: string, userBId: string): string {
  return `demo-direct-${[userAId, userBId].sort().join("--")}`;
}

type ScriptedMessage = {
  id: string;
  from: "me" | "them";
  text: string;
  minutesAgo: number;
};

const ANA_SCRIPT: ScriptedMessage[] = [
  { id: "ana-1", from: "them", text: "Oi! Tudo bem?", minutesAgo: 60 * 26 },
  { id: "ana-2", from: "me", text: "Tudo sim! Você também está por essa região?", minutesAgo: 60 * 25 },
  { id: "ana-3", from: "them", text: "Estou! Vi sua mensagem agora.", minutesAgo: 60 * 18 },
  { id: "ana-4", from: "me", text: "Podemos combinar de ir juntos.", minutesAgo: 60 * 17 },
  { id: "ana-5", from: "them", text: "Top. Tem um café a uns 400 m daqui.", minutesAgo: 60 * 12 },
  { id: "ana-6", from: "me", text: "Perfeito. Te chamo quando sair.", minutesAgo: 60 * 11 },
  { id: "ana-7", from: "them", text: "Estou chegando.", minutesAgo: 8 },
  { id: "ana-8", from: "them", text: "Fico na porta, de jaqueta azul.", minutesAgo: 3 },
];

async function seedConversation(
  conversationId: string,
  viewerId: string,
  peerId: string,
  peerName: string,
  script: ScriptedMessage[],
  now: number,
): Promise<void> {
  await ensureLocalConversation(conversationId);
  const existing = getLocalChatMessages(conversationId);
  const existingIds = new Set(existing.map((item) => item.id));
  for (const line of script) {
    const id = `demo-cast-msg-${line.id}`;
    if (existingIds.has(id)) continue;
    await putLocalChatMessage({
      id,
      conversationId,
      from: line.from,
      senderId: line.from === "me" ? viewerId : peerId,
      senderName: line.from === "me" ? undefined : peerName,
      text: line.text,
      at: now - line.minutesAgo * 60_000,
      kind: "text",
    });
  }
}

export async function ensureDemoCastSeeded(options?: { enabled?: boolean; now?: number }): Promise<void> {
  const enabled = options?.enabled ?? isDemoMode();
  if (!enabled || typeof window === "undefined") return;
  const viewerId = getDemoIdentity().id;
  if (isDemoCastUser(viewerId)) return;
  const now = options?.now ?? Date.now();

  try {
    const raw = window.localStorage.getItem(demoStorageKey("cast-seed"));
    const parsed = raw ? (JSON.parse(raw) as { version?: string }) : null;
    if (parsed?.version && parsed.version !== DEMO_CAST_SEED_VERSION) {
      purgeDemoCastGraph();
    }
  } catch {
    /* marker ausente ou inválido: segue o seed idempotente */
  }

  const anaConnection = getConnectionBetween(viewerId, DEMO_USER_ANA);
  if (!anaConnection) {
    await connectUser(DEMO_USER_ANA, viewerId);
  }
  const anaThread = conversationIdFor(viewerId, DEMO_USER_ANA);
  const anaName = listDemoSocialPeople().find((person) => person.id === DEMO_USER_ANA)?.name ?? "Ana Beatriz";
  await seedConversation(anaThread, viewerId, DEMO_USER_ANA, anaName, ANA_SCRIPT, now);

  if (!getOutgoingPendingRequest(DEMO_USER_RAFAEL, viewerId)) {
    sendRequest(DEMO_USER_RAFAEL, viewerId, "Oi, vi que estamos por perto. Bora conectar?");
  }

  try {
    window.localStorage.setItem(
      demoStorageKey("cast-seed"),
      JSON.stringify({ version: DEMO_CAST_SEED_VERSION, viewerId, at: now }),
    );
  } catch {
    /* storage unavailable */
  }
}

export function resetDemoCastMarker(): void {
  if (!isDemoMode() || typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(demoStorageKey("cast-seed"));
    window.localStorage.removeItem(demoStorageKey("driver-behavior"));
  } catch {
    /* storage unavailable */
  }
}

/** Limpa e re-seeda apenas o elenco demo. No-op fora de DEMO_ENABLED. */
export async function resetDemoUsers(): Promise<void> {
  if (!isDemoMode()) return;
  resetDemoCastMarker();
  purgeDemoCastGraph();
  await ensureDemoCastSeeded();
}
