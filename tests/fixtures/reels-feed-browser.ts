import { getDemoIdentity, setDemoIdentity } from "../../src/lib/demo/demo-identity";
import { reelsPersistenceSchema } from "../../src/lib/persistence/domain/reels-schema";
import { IndexedDbAdapter } from "../../src/lib/persistence/local/indexed-db";
import { getReelFeed } from "../../src/lib/reels/reel-feed";
import {
  addPersistedReelComment,
  getPersistedReelComments,
  getPersistedReelInteractionState,
  getPersistedReels,
  togglePersistedReelLike,
} from "../../src/lib/reels/persisted-reels-reader";
import { publishReel } from "../../src/lib/reels/reel-publish";
import { COMMENTS_KEY, LIKES_KEY, PUBLISHED_KEY } from "../../src/lib/reels/reel-local-storage";
import { ReelCommentRepository } from "../../src/repositories/reel-comment.repository";
import { ReelLikeRepository } from "../../src/repositories/reel-like.repository";

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

function legacySources() {
  return {
    published: localStorage.getItem(PUBLISHED_KEY),
    likes: localStorage.getItem(LIKES_KEY),
    comments: localStorage.getItem(COMMENTS_KEY),
  };
}

async function snapshot(reelId: string) {
  const adapter = new IndexedDbAdapter(reelsPersistenceSchema);
  const likes = new ReelLikeRepository(adapter);
  const comments = new ReelCommentRepository(adapter);
  try {
    const [reels, feed, storedLikes, storedComments, tree, interaction] = await Promise.all([
      getPersistedReels(),
      getReelFeed(),
      likes.listByReel(reelId),
      comments.listByReel(reelId),
      getPersistedReelComments(reelId),
      getPersistedReelInteractionState(reelId, getDemoIdentity().id),
    ]);
    return {
      identity: getDemoIdentity(),
      reels,
      feedIds: feed.map((reel) => reel.id),
      demoIds: feed.filter((reel) => reel.id.startsWith("reel-00")).map((reel) => reel.id),
      likes: storedLikes,
      comments: storedComments,
      tree,
      interaction,
      legacy: legacySources(),
      networkCalls,
      databases: (await indexedDB.databases()).map((database) => database.name),
    };
  } finally {
    await adapter.close();
  }
}

window.__connexyReelsFeedHarness = {
  async reset() {
    localStorage.clear();
    await deleteDatabase(reelsPersistenceSchema.name);
    await deleteDatabase(MEDIA_DB_NAME);
    localStorage.setItem(PUBLISHED_KEY, '{"legacy":"published-sentinel"}');
    localStorage.setItem(LIKES_KEY, '{"legacy":"likes-sentinel"}');
    localStorage.setItem(COMMENTS_KEY, '{"legacy":"comments-sentinel"}');
    setDemoIdentity("lucas");
    networkCalls = 0;
    return legacySources();
  },
  asIdentity(id: string) {
    setDemoIdentity(id);
    return getDemoIdentity();
  },
  async publish() {
    return publishReel({
      file: new File([new Uint8Array([0, 1, 2, 3])], "fase-1d-3.mp4", {
        type: "video/mp4",
      }),
      caption: "Reel persistido da Fase 1D-3 #local",
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
  reply(reelId: string, parentId: string, text: string, id: string, createdAt: string) {
    const identity = getDemoIdentity();
    return addPersistedReelComment({
      reelId,
      parentId,
      text,
      id,
      createdAt,
      author: { id: identity.id, name: identity.name, photoUrl: identity.photo },
    });
  },
  snapshot,
  async readWithoutLegacy(reelId: string) {
    const originalGetItem = Storage.prototype.getItem;
    const trackedFetch = window.fetch;
    Storage.prototype.getItem = () => {
      throw new Error("Fonte legada não pode ser consultada");
    };
    window.fetch = () => {
      throw new Error("Rede/Supabase não pode ser consultado");
    };
    try {
      const [reels, feed, comments, interaction] = await Promise.all([
        getPersistedReels(),
        getReelFeed(),
        getPersistedReelComments(reelId),
        getPersistedReelInteractionState(reelId, "lucas"),
      ]);
      return { reels, feedIds: feed.map((reel) => reel.id), comments, interaction };
    } finally {
      Storage.prototype.getItem = originalGetItem;
      window.fetch = trackedFetch;
    }
  },
};

declare global {
  interface Window {
    __connexyReelsFeedHarness: {
      reset(): Promise<unknown>;
      asIdentity(id: string): unknown;
      publish(): Promise<unknown>;
      like(reelId: string): Promise<unknown>;
      comment(reelId: string, text: string, id: string, createdAt: string): Promise<unknown>;
      reply(
        reelId: string,
        parentId: string,
        text: string,
        id: string,
        createdAt: string,
      ): Promise<unknown>;
      snapshot(reelId: string): Promise<unknown>;
      readWithoutLegacy(reelId: string): Promise<unknown>;
    };
  }
}
