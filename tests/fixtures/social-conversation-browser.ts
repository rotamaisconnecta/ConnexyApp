import {
  acceptRequest,
  getConnectionPeerId,
  getConnectionsForUser,
  getPendingRequests,
  getRequestBetween,
  sendLocalMessage,
  sendRequest,
} from "../../src/lib/demo/demo-db";
import {
  clearLocalChat,
  ensureLocalChatLoaded,
  flushLocalChatPersistence,
  getLocalChatMessages,
  getLocalConversations,
} from "../../src/lib/chat/local-chat-persistence";
import { enterDemoSession } from "../../src/lib/demo/demo-auth";
import { DEMO_STORAGE_PREFIX } from "../../src/lib/demo/demo-config";
import { getDemoIdentity, setDemoIdentity } from "../../src/lib/demo/demo-identity";

async function snapshot() {
  await ensureLocalChatLoaded();
  await flushLocalChatPersistence();
  const identity = getDemoIdentity();
  const connections = getConnectionsForUser(identity.id);
  const conversations = getLocalConversations();
  return {
    identity,
    incoming: getPendingRequests(identity.id),
    connections: connections.map((connection) => ({
      ...connection,
      peerId: getConnectionPeerId(connection, identity.id),
    })),
    conversations,
    messages: conversations.flatMap((conversation) => getLocalChatMessages(conversation.id)),
    demoKeys: Object.keys(window.localStorage)
      .filter((key) => key.startsWith(DEMO_STORAGE_PREFIX))
      .sort(),
    parallelInviteSource: window.localStorage.getItem("connexy.mock.conversation-invites"),
    databases:
      typeof indexedDB.databases === "function"
        ? (await indexedDB.databases()).map((database) => database.name).sort()
        : [],
  };
}

const harness = {
  async reset() {
    window.localStorage.clear();
    await clearLocalChat();
    setDemoIdentity("lucas");
    enterDemoSession();
    return snapshot();
  },
  asIdentity(id: string) {
    setDemoIdentity(id);
    return getDemoIdentity();
  },
  invite(toUserId: string, message: string) {
    return sendRequest(getDemoIdentity().id, toUserId, message);
  },
  request(fromUserId: string, toUserId: string) {
    return getRequestBetween(fromUserId, toUserId);
  },
  async accept(fromUserId: string) {
    return acceptRequest(fromUserId, getDemoIdentity().id);
  },
  async sendMessage(conversationId: string, text: string) {
    const identity = getDemoIdentity();
    const message = sendLocalMessage(conversationId, "me", text, identity);
    await flushLocalChatPersistence();
    return message;
  },
  async snapshot() {
    return snapshot();
  },
  async snapshotWithoutNetwork() {
    const originalFetch = window.fetch;
    window.fetch = (() => {
      throw new Error("network access is forbidden in local social test");
    }) as typeof window.fetch;
    try {
      return await snapshot();
    } finally {
      window.fetch = originalFetch;
    }
  },
};

declare global {
  interface Window {
    __connexySocialHarness: typeof harness;
  }
}

window.__connexySocialHarness = harness;
