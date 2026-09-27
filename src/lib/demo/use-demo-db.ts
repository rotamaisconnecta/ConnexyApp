import { useCallback, useEffect, useState } from "react";
import {
  getMessages,
  getConversationLastMessage,
  getConnectionsCount,
  getDemoGroupsForUser,
  getDemoGroupInvitesForUser,
  getOutgoingPendingRequest,
  getPendingRequests,
  isConnected,
  isFollowing,
  resetDemoData,
  sendLocalMessage,
  subscribeDemoDB,
  type DemoMessage,
  type DemoRequest,
  type DemoGroup,
} from "./demo-db";

function useDemoVersion(): number {
  const [version, setVersion] = useState(0);
  useEffect(() => subscribeDemoDB(() => setVersion((v) => v + 1)), []);
  return version;
}

/** Reactive count of local demo connections. */
export function useDemoConnectionsCount(userId?: string): number {
  const version = useDemoVersion();

  void version;
  const [count, setCount] = useState(() => getConnectionsCount(userId));
  useEffect(() => setCount(getConnectionsCount(userId)), [version, userId]);
  return count;
}

/** Reactive "is this peer connected?" flag. */
export function useDemoIsConnected(peerUserId: string, userId?: string): boolean {
  const version = useDemoVersion();

  void version;
  const [connected, setConnected] = useState(() => isConnected(peerUserId, userId));
  useEffect(() => setConnected(isConnected(peerUserId, userId)), [version, peerUserId, userId]);
  return connected;
}

/** Reactive follow state for a demo identity. */
export function useDemoIsFollowing(followeeId: string, followerId?: string): boolean {
  const version = useDemoVersion();
  void version;
  const [following, setFollowing] = useState(() => isFollowing(followeeId, followerId));
  useEffect(
    () => setFollowing(isFollowing(followeeId, followerId)),
    [version, followeeId, followerId],
  );
  return following;
}

/** Reactive list of pending local conversation requests. */
export function useDemoPendingRequests(toUserId?: string): DemoRequest[] {
  const version = useDemoVersion();
  const [requests, setRequests] = useState<DemoRequest[]>(() => getPendingRequests(toUserId));
  useEffect(() => setRequests(getPendingRequests(toUserId)), [version, toUserId]);
  return requests;
}

export function useDemoOutgoingRequest(
  fromUserId: string | undefined,
  toUserId: string,
): DemoRequest | null {
  const version = useDemoVersion();
  const [request, setRequest] = useState<DemoRequest | null>(() =>
    fromUserId ? getOutgoingPendingRequest(fromUserId, toUserId) : null,
  );
  useEffect(
    () => setRequest(fromUserId ? getOutgoingPendingRequest(fromUserId, toUserId) : null),
    [version, fromUserId, toUserId],
  );
  return request;
}

export function useDemoGroups(userId: string): DemoGroup[] {
  const version = useDemoVersion();
  const [groups, setGroups] = useState<DemoGroup[]>(() => getDemoGroupsForUser(userId));
  useEffect(() => setGroups(getDemoGroupsForUser(userId)), [version, userId]);
  return groups;
}

export function useDemoGroupInvites(userId: string): DemoGroup[] {
  const version = useDemoVersion();
  const [groups, setGroups] = useState<DemoGroup[]>(() => getDemoGroupInvitesForUser(userId));
  useEffect(() => setGroups(getDemoGroupInvitesForUser(userId)), [version, userId]);
  return groups;
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
