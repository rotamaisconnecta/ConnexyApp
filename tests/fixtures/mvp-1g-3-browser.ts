import {
  acceptRequest,
  isConnected,
  isFollowing,
  sendRequest,
  toggleFollow,
} from "../../src/lib/demo/demo-db";
import { enterDemoSession } from "../../src/lib/demo/demo-auth";
import { getDemoIdentity, setDemoIdentity } from "../../src/lib/demo/demo-identity";
import { MORE_MENU_ITEMS, MORE_MENU_LABELS } from "../../src/lib/navigation/more-menu";
import {
  isDetailSaved,
  listSavedDetailIds,
  toggleSavedDetail,
} from "../../src/lib/marketplace/saved-details";
import { reelsPersistenceSchema } from "../../src/lib/persistence/domain/reels-schema";
import { getReelFeed } from "../../src/lib/reels/reel-feed";
import {
  addPersistedReelComment,
  getPersistedReelComments,
  getPersistedReelInteractionState,
  getPersistedReels,
  togglePersistedReelLike,
} from "../../src/lib/reels/persisted-reels-reader";
import { publishReel } from "../../src/lib/reels/reel-publish";
import { applyReelSocialState, getReelConnectStatus } from "../../src/lib/reels/reel-social-state";
import { MOCK_REELS } from "../../src/lib/reels/reel-mocks";

const MEDIA_DB_NAME = "connexy-reels-local-db";
const originalFetch = window.fetch.bind(window);
let networkCalls = 0;

window.fetch = (...args) => {
  networkCalls += 1;
  return originalFetch(...args);
};

async function deleteDatabase(name: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error(`Falha ao remover ${name}`));
    request.onblocked = () => reject(new Error(`Remoção bloqueada de ${name}`));
  });
}

function catalogReel() {
  const reel = MOCK_REELS.find((item) => item.author.id === "beatriz");
  if (!reel) throw new Error("reel de beatriz ausente");
  return reel;
}

async function snapshot(publishedId?: string | null) {
  const identity = getDemoIdentity();
  const catalog = catalogReel();
  const social = applyReelSocialState(catalog, identity.id);
  const feed = await getReelFeed();
  const published = publishedId
    ? {
        interaction: await getPersistedReelInteractionState(publishedId, identity.id),
        comments: await getPersistedReelComments(publishedId),
      }
    : { interaction: null, comments: [] as Awaited<ReturnType<typeof getPersistedReelComments>> };
  const databases =
    typeof indexedDB.databases === "function"
      ? (await indexedDB.databases()).map((database) => database.name)
      : [];
  return {
    identity,
    moreMenu: [...MORE_MENU_LABELS],
    agoraRoute: MORE_MENU_ITEMS.find((item) => item.label === "Agora")?.to ?? null,
    feedIds: feed.map((reel) => reel.id),
    persistedIds: (await getPersistedReels()).map((reel) => reel.id),
    catalogId: catalog.id,
    following: isFollowing(catalog.author.id, identity.id),
    saved: isDetailSaved(catalog.id),
    savedIds: listSavedDetailIds(),
    connectStatus: getReelConnectStatus(catalog.author.id, identity.id),
    connected: isConnected(catalog.author.id, identity.id),
    applied: {
      savedByMe: social.savedByMe,
      isFollowing: social.author.isFollowing,
    },
    published,
    databases,
    networkCalls,
  };
}

const harness = {
  async reset() {
    localStorage.clear();
    await deleteDatabase(reelsPersistenceSchema.name);
    await deleteDatabase(MEDIA_DB_NAME);
    setDemoIdentity("lucas");
    enterDemoSession();
    networkCalls = 0;
    return snapshot(null);
  },
  asIdentity(id: string) {
    setDemoIdentity(id);
    return getDemoIdentity();
  },
  async publish() {
    return publishReel({
      file: new File([new Uint8Array([0, 1, 2, 3])], "fase-1g-3.mp4", {
        type: "video/mp4",
      }),
      caption: "Momento local da fase 1G-3",
      context: null,
      posterBlob: null,
      durationS: 1,
    });
  },
  like(reelId: string) {
    return togglePersistedReelLike(reelId, getDemoIdentity().id);
  },
  comment(reelId: string, text: string, id: string, createdAt: string) {
    const identity = getDemoIdentity();
    return addPersistedReelComment({
      reelId,
      text,
      id,
      createdAt,
      author: { id: identity.id, name: identity.name, photoUrl: identity.photo },
    });
  },
  follow() {
    return toggleFollow("beatriz", getDemoIdentity().id);
  },
  save() {
    return toggleSavedDetail(catalogReel().id);
  },
  inviteAuthor() {
    return sendRequest(getDemoIdentity().id, "beatriz", "Vi no Agora");
  },
  async acceptAuthor() {
    return acceptRequest("lucas", getDemoIdentity().id);
  },
  snapshot,
};

declare global {
  interface Window {
    __connexyMvp1g3Harness: typeof harness;
  }
}

window.__connexyMvp1g3Harness = harness;
