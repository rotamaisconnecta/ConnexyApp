import {
  acceptRequest,
  createDemoGroup,
  declineRequest,
  getConnectionPeerId,
  getConnectionsForUser,
  getPendingRequests,
  respondToDemoGroupInvite,
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
import { listFunctionalDemoConversations } from "../../src/lib/chat/functional-conversation-list";
import { MOCK_CONVERSATIONS } from "../../src/lib/chat/mock-conversations";
import { listLocalInboxItems } from "../../src/lib/notifications/local-invite-inbox";
import { enterDemoSession } from "../../src/lib/demo/demo-auth";
import { DEMO_STORAGE_PREFIX } from "../../src/lib/demo/demo-config";
import { getDemoIdentity, setDemoIdentity } from "../../src/lib/demo/demo-identity";
import { matchesConnectaListFilter } from "../../src/lib/discovery/connecta-list-filter";
import { people } from "../../src/lib/mock-data";

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
  const conversations = listFunctionalDemoConversations(identity.id);
  const mockIds = MOCK_CONVERSATIONS.map((item) => item.id);
  return {
    identity,
    incoming: getPendingRequests(identity.id),
    inbox: listLocalInboxItems(identity.id),
    connections: connections.map((connection) => ({
      ...connection,
      peerId: getConnectionPeerId(connection, identity.id),
    })),
    conversations,
    persistedConversations: getLocalConversations(),
    messages: getLocalConversations().flatMap((conversation) =>
      getLocalChatMessages(conversation.id),
    ),
    mockIdsInFunctionalList: conversations
      .filter((item) => mockIds.includes(item.id))
      .map((item) => item.id),
    filter: {
      beatrizOnlineNearby: matchesConnectaListFilter(
        people.find((item) => item.id === "beatriz"),
        { onlyOnline: true, onlyNearby: true },
      ),
      carlosOnline: matchesConnectaListFilter(
        people.find((item) => item.id === "carlos"),
        {
          onlyOnline: true,
          onlyNearby: false,
        },
      ),
      marinaNearby: matchesConnectaListFilter(
        people.find((item) => item.id === "marina"),
        {
          onlyOnline: false,
          onlyNearby: true,
        },
      ),
    },
    demoKeys: Object.keys(window.localStorage)
      .filter((key) => key.startsWith(DEMO_STORAGE_PREFIX))
      .sort(),
    parallelInviteSource: window.localStorage.getItem("connexy.mock.conversation-invites"),
    catalogNotificationIds: ["n1", "n2", "n3", "n4"].filter((id) =>
      listLocalInboxItems(identity.id).some((item) => item.id === id),
    ),
    networkCalls,
  };
}

const harness = {
  async reset() {
    window.localStorage.clear();
    await clearLocalChat();
    setDemoIdentity("lucas");
    enterDemoSession();
    networkCalls = 0;
    return snapshot();
  },
  asIdentity(id: string) {
    setDemoIdentity(id);
    return getDemoIdentity();
  },
  invite(fromUserId: string, toUserId: string, message: string) {
    return sendRequest(fromUserId, toUserId, message);
  },
  async accept(fromUserId: string) {
    return acceptRequest(fromUserId, getDemoIdentity().id);
  },
  decline(fromUserId: string) {
    return declineRequest(fromUserId, getDemoIdentity().id);
  },
  async sendMessage(conversationId: string, text: string) {
    const identity = getDemoIdentity();
    const message = sendLocalMessage(conversationId, "me", text, identity);
    await flushLocalChatPersistence();
    return message;
  },
  async createGroup(conversationId: string, invitedUserId: string, name: string) {
    const identity = getDemoIdentity();
    const group = createDemoGroup(conversationId, identity.id, [invitedUserId], name);
    await flushLocalChatPersistence();
    return group;
  },
  respondGroup(groupId: string, accepted: boolean) {
    return respondToDemoGroupInvite(groupId, getDemoIdentity().id, accepted);
  },
  async snapshot() {
    return snapshot();
  },
};

declare global {
  interface Window {
    __connexyMvp1f5Harness: typeof harness;
  }
}

window.__connexyMvp1f5Harness = harness;
