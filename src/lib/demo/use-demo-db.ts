import { useCallback, useEffect, useState } from "react";
import {
  getMessages,
  getConversationLastMessage,
  getConnectionsCount,
  isConnected,
  resetDemoData,
  sendLocalMessage,
  subscribeDemoDB,
  type DemoMessage,
} from "./demo-db";

function useDemoVersion(): number {
  const [version, setVersion] = useState(0);
  useEffect(() => subscribeDemoDB(() => setVersion((v) => v + 1)), []);
  return version;
}

/** Reactive count of local demo connections. */
export function useDemoConnectionsCount(): number {
  const version = useDemoVersion();

  void version;
  const [count, setCount] = useState(getConnectionsCount);
  useEffect(() => setCount(getConnectionsCount()), [version]);
  return count;
}

/** Reactive "is this peer connected?" flag. */
export function useDemoIsConnected(userId: string): boolean {
  const version = useDemoVersion();

  void version;
  const [connected, setConnected] = useState(isConnected(userId));
  useEffect(() => setConnected(isConnected(userId)), [version, userId]);
  return connected;
}

/** Reactive message list for one demo conversation. */
export function useDemoMessages(conversationId: string): DemoMessage[] {
  const version = useDemoVersion();
  const [messages, setMessages] = useState<DemoMessage[]>([]);
  useEffect(() => {
    setMessages(getMessages(conversationId));
  }, [version, conversationId]);
  return messages;
}

/** Reactive "last message" for a conversation (conversation list). */
export function useDemoLastMessage(conversationId: string): DemoMessage | null {
  const version = useDemoVersion();
  const [last, setLast] = useState<DemoMessage | null>(() =>
    getConversationLastMessage(conversationId),
  );
  useEffect(() => setLast(getConversationLastMessage(conversationId)), [version, conversationId]);
  return last;
}

/** Sends a local demo message. */
export function useDemoSendMessage(): (
  conversationId: string,
  from: "me" | "them",
  text: string,
) => DemoMessage {
  return useCallback(sendLocalMessage, []);
}

/** Wipes every demo record (dev panel "reiniciar demonstração"). */
export function useDemoReset(): () => void {
  return useCallback(() => {
    resetDemoData();
  }, []);
}
