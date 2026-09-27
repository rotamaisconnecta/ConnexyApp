import {
  acceptRequest,
  getConnectionPeerId,
  getConnectionsForUser,
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
import {
  clearDemoCallSession,
  connectDemoCall,
  finishDemoCall,
  formatDemoCallRecord,
  getDemoCallSession,
  missDemoCall,
  startDemoCall,
  type DemoCallMedia,
  type DemoCallOutcome,
} from "../../src/lib/chat/demo-call";
import { enterDemoSession } from "../../src/lib/demo/demo-auth";
import { DEMO_STORAGE_PREFIX } from "../../src/lib/demo/demo-config";
import { getDemoIdentity, setDemoIdentity } from "../../src/lib/demo/demo-identity";

const nativeFetch = window.fetch.bind(window);
let networkCalls = 0;
window.fetch = (...args) => {
  networkCalls += 1;
  return nativeFetch(...args);
};

async function snapshot() {
  await ensureLocalChatLoaded();
  await flushLocalChatPersistence();
  const identity = getDemoIdentity();
  const connections = getConnectionsForUser(identity.id);
  const conversations = getLocalConversations();
  return {
    identity,
    session: getDemoCallSession(),
    connections: connections.map((connection) => ({
      conversationId: connection.conversationId,
      peerId: getConnectionPeerId(connection, identity.id),
      userAId: connection.userAId,
      userBId: connection.userBId,
    })),
    conversations,
    messages: conversations.flatMap((conversation) => getLocalChatMessages(conversation.id)),
    demoKeys: Object.keys(window.localStorage)
      .filter((key) => key.startsWith(DEMO_STORAGE_PREFIX))
      .sort(),
    storageKeys: Object.keys(window.localStorage).sort(),
    parallelKeys: {
      calls: window.localStorage.getItem("connexy:demo:calls"),
      callStore: window.localStorage.getItem("connexy_demo_call"),
    },
    databases:
      typeof indexedDB.databases === "function"
        ? (await indexedDB.databases()).map((database) => database.name).sort()
        : [],
    networkCalls,
  };
}

async function persistOutcome(outcome: DemoCallOutcome) {
  const identity = getDemoIdentity();
  const record = outcome === "missed" ? missDemoCall(identity) : finishDemoCall(outcome, identity);
  await flushLocalChatPersistence();
  return { record, session: getDemoCallSession() };
}

const harness = {
  async reset() {
    window.localStorage.clear();
    await clearLocalChat();
    clearDemoCallSession();
    setDemoIdentity("lucas");
    enterDemoSession();
    networkCalls = 0;
    return snapshot();
  },
  asIdentity(id: string) {
    setDemoIdentity(id);
    return getDemoIdentity();
  },
  async connectPeer(peerId = "beatriz") {
    const identity = getDemoIdentity();
    sendRequest(identity.id, peerId, "Conversa 1F-10");
    const connection = await acceptRequest(identity.id, peerId);
    await flushLocalChatPersistence();
    return connection;
  },
  async sendMessage(conversationId: string, text: string) {
    const identity = getDemoIdentity();
    const message = sendLocalMessage(conversationId, "me", text, identity);
    await flushLocalChatPersistence();
    return message;
  },
  start(conversationId: string, calleeId: string, media: DemoCallMedia) {
    const identity = getDemoIdentity();
    return startDemoCall({
      conversationId,
      callerId: identity.id,
      calleeId,
      media,
    });
  },
  accept() {
    return connectDemoCall();
  },
  hangup() {
    return persistOutcome("ended");
  },
  decline() {
    return persistOutcome("declined");
  },
  miss() {
    return persistOutcome("missed");
  },
  format: formatDemoCallRecord,
  async snapshot() {
    return snapshot();
  },
};

declare global {
  interface Window {
    __connexyMvp1f10Harness: typeof harness;
  }
}

window.__connexyMvp1f10Harness = harness;
