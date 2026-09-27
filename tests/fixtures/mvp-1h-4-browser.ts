import { enterDemoSession } from "../../src/lib/demo/demo-auth";
import { getDemoIdentity, setDemoIdentity } from "../../src/lib/demo/demo-identity";
import {
  clearLocalChat,
  ensureLocalChatLoaded,
  flushLocalChatPersistence,
  getLocalConversation,
  markLocalListGestureHandled,
  setLocalConversationPinned,
} from "../../src/lib/chat/local-chat-persistence";
import { decorateFunctionalConversation } from "../../src/lib/chat/functional-conversation-list";
import { NextGesture, ThreadIcon } from "../../src/lib/chat/mock-conversations";
import { MORE_MENU_LABELS } from "../../src/lib/navigation/more-menu";
import { readDemoSettings, writeDemoSettings } from "../../src/lib/demo/demo-settings";
import { getTrip } from "../../src/lib/mobility/trip/trip-store";
import { getDispatchSnapshot } from "../../src/lib/mobility/dispatch/dispatcher-store";

const originalFetch = window.fetch.bind(window);
let networkCalls = 0;
window.fetch = (...args) => {
  networkCalls += 1;
  return originalFetch(...args);
};

const CONVERSATION_ID = "demo-direct-beatriz--lucas";
const LAST_AT = 1_700_000_000_000;

async function snapshot() {
  await ensureLocalChatLoaded();
  await flushLocalChatPersistence();
  const identity = getDemoIdentity();
  const last = {
    id: "audio-1",
    conversationId: CONVERSATION_ID,
    from: "them" as const,
    senderId: "beatriz",
    text: "áudio 0:08",
    at: LAST_AT,
    kind: "audio" as const,
  };
  const item = decorateFunctionalConversation(
    {
      id: CONVERSATION_ID,
      participant: { id: "beatriz", name: "Beatriz" },
      initials: "BE",
      isOnline: true,
      currentThread: "Conexão local",
      threadIcon: ThreadIcon.COFFEE,
      lastMessage: last.text,
      updatedAt: new Date(last.at),
      unreadCount: 1,
      isMuted: false,
    },
    identity.id,
    getLocalConversation(CONVERSATION_ID) ?? undefined,
    last,
  );
  return {
    identity,
    pinnedForA: Boolean(getLocalConversation(CONVERSATION_ID)?.pinnedByUserIds?.includes("lucas")),
    pinnedForB: Boolean(
      getLocalConversation(CONVERSATION_ID)?.pinnedByUserIds?.includes("beatriz"),
    ),
    gesture: item.nextGesture ?? null,
    settings: readDemoSettings(identity.id),
    moreMenu: [...MORE_MENU_LABELS],
    tripKey: "connexy_demo_trip",
    dispatcherKey: "connexy_demo_dispatcher",
    tripPresent: Boolean(getTrip()),
    dispatcherEntries: getDispatchSnapshot().entries.length,
    databases: await indexedDB.databases().then((items) => items.map((item) => item.name)),
    networkCalls,
  };
}

async function reset() {
  networkCalls = 0;
  enterDemoSession();
  setDemoIdentity("lucas");
  await clearLocalChat();
  await ensureLocalChatLoaded();
  return snapshot();
}

async function pin(userId: string, value: boolean) {
  setDemoIdentity(userId);
  await setLocalConversationPinned(CONVERSATION_ID, userId, value);
  await flushLocalChatPersistence();
  return snapshot();
}

async function listen() {
  await markLocalListGestureHandled(CONVERSATION_ID, LAST_AT);
  await flushLocalChatPersistence();
  return snapshot();
}

function saveSettings() {
  setDemoIdentity("lucas");
  writeDemoSettings({ language: "English", twoFactor: true, payment: "Pix" }, "lucas");
  return snapshot();
}

function asIdentity(id: string) {
  setDemoIdentity(id);
  return snapshot();
}

declare global {
  interface Window {
    __connexyMvp1h4Harness: {
      reset: typeof reset;
      snapshot: typeof snapshot;
      pin: typeof pin;
      listen: typeof listen;
      saveSettings: typeof saveSettings;
      asIdentity: typeof asIdentity;
    };
  }
}

window.__connexyMvp1h4Harness = {
  reset,
  snapshot,
  pin,
  listen,
  saveSettings,
  asIdentity,
};
