import { sendLocalMessage } from "@/lib/demo/demo-db";

export const DEMO_CALL_FEEDBACK = "Chamadas reais ainda não estão configuradas neste modo demo.";

export type DemoCallMedia = "voice" | "video";
export type DemoCallStatus = "outgoing" | "connected";
export type DemoCallOutcome = "ended" | "declined" | "missed";

export interface DemoCallSession {
  id: string;
  conversationId: string;
  callerId: string;
  calleeId: string;
  media: DemoCallMedia;
  status: DemoCallStatus;
  startedAt: number;
}

const listeners = new Set<() => void>();
let session: DemoCallSession | null = null;

function notify(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeDemoCall(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getDemoCallSession(): DemoCallSession | null {
  return session;
}

export function triggerDemoCallFeedback(notifyUser: (message: string) => void): void {
  notifyUser(DEMO_CALL_FEEDBACK);
}

export function formatDemoCallRecord(media: DemoCallMedia, outcome: DemoCallOutcome): string {
  const kind = media === "voice" ? "Ligação de voz (demo)" : "Videochamada (demo)";
  const status =
    outcome === "ended" ? "encerrada" : outcome === "declined" ? "recusada" : "perdida";
  return `${kind} · ${status}`;
}

export function startDemoCall(input: {
  conversationId: string;
  callerId: string;
  calleeId: string;
  media: DemoCallMedia;
}): DemoCallSession | null {
  if (!input.conversationId || !input.callerId || !input.calleeId) return null;
  if (input.callerId === input.calleeId) return null;
  if (session) return session;

  session = {
    id: `demo-call-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    conversationId: input.conversationId,
    callerId: input.callerId,
    calleeId: input.calleeId,
    media: input.media,
    status: "outgoing",
    startedAt: Date.now(),
  };
  notify();
  return session;
}

export function connectDemoCall(callId = session?.id): DemoCallSession | null {
  if (!session || session.id !== callId || session.status !== "outgoing") return session;
  session = { ...session, status: "connected" };
  notify();
  return session;
}

export function finishDemoCall(
  outcome: DemoCallOutcome,
  sender?: { id: string; name: string },
): ReturnType<typeof sendLocalMessage> | null {
  if (!session) return null;
  const current = session;
  session = null;
  notify();
  return sendLocalMessage(
    current.conversationId,
    "me",
    formatDemoCallRecord(current.media, outcome),
    sender ?? { id: current.callerId, name: current.callerId },
  );
}

export function missDemoCall(sender?: { id: string; name: string }) {
  return finishDemoCall("missed", sender);
}

export function clearDemoCallSession(): void {
  if (!session) return;
  session = null;
  notify();
}
