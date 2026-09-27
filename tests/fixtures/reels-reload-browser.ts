import { IndexedDbAdapter } from "../../src/lib/persistence/local/indexed-db";
import { reelsPersistenceSchema } from "../../src/lib/persistence/domain/reels-schema";
import { ReelRepository } from "../../src/repositories/reel.repository";
import { ReelLikeRepository } from "../../src/repositories/reel-like.repository";
import { ReelCommentRepository } from "../../src/repositories/reel-comment.repository";
import {
  migrateLegacyPublishedReels,
  migrateLegacyReelLikes,
  migrateLegacyReelComments,
  REELS_MIGRATION_MARKER_KEY,
  type LocalReelsMigrationIO,
} from "../../src/lib/reels/local-reel-persistence";
import { COMMENTS_KEY, LIKES_KEY, PUBLISHED_KEY } from "../../src/lib/reels/reel-local-storage";
import { getPersistedReels } from "../../src/lib/reels/persisted-reels-reader";

interface LegacySources {
  published: string;
  likes: string;
  comments: string;
}

async function deleteReelsDatabase(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(reelsPersistenceSchema.name);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("deleteDatabase bloqueado"));
  });
}

function migrationIO(): LocalReelsMigrationIO {
  return {
    readLegacy: () => localStorage.getItem(PUBLISHED_KEY),
    readLikes: () => localStorage.getItem(LIKES_KEY),
    readComments: () => localStorage.getItem(COMMENTS_KEY),
    readMarker: () => localStorage.getItem(REELS_MIGRATION_MARKER_KEY),
    writeMarker: (value) => {
      localStorage.setItem(REELS_MIGRATION_MARKER_KEY, value);
      return true;
    },
  };
}

async function runMigrations(userId: string) {
  const adapter = new IndexedDbAdapter(reelsPersistenceSchema);
  const reels = new ReelRepository(adapter);
  const likes = new ReelLikeRepository(adapter);
  const comments = new ReelCommentRepository(adapter);
  try {
    const reelResult = await migrateLegacyPublishedReels(reels, migrationIO());
    const likeResult = await migrateLegacyReelLikes(reels, likes, migrationIO(), userId);
    const commentResult = await migrateLegacyReelComments(reels, comments, migrationIO());
    return { reelResult, likeResult, commentResult };
  } finally {
    await adapter.close();
  }
}

function calculateMaxDepth(comments: Array<{ id: string; parentId?: string | null }>): number {
  const byId = new Map(comments.map((comment) => [comment.id, comment]));
  let maximum = 0;
  for (const comment of comments) {
    let depth = 1;
    let parentId = comment.parentId ?? null;
    const visited = new Set<string>([comment.id]);
    while (parentId) {
      if (visited.has(parentId)) throw new Error("ciclo persistido");
      visited.add(parentId);
      const parent = byId.get(parentId);
      if (!parent) throw new Error(`parentId quebrado: ${parentId}`);
      depth += 1;
      parentId = parent.parentId ?? null;
    }
    maximum = Math.max(maximum, depth);
  }
  return maximum;
}

async function snapshot() {
  const reels = await getPersistedReels();
  const adapter = new IndexedDbAdapter(reelsPersistenceSchema);
  const likes = new ReelLikeRepository(adapter);
  const comments = new ReelCommentRepository(adapter);
  try {
    const storedLikes = await likes.list();
    const storedComments = await comments.list();
    return {
      reels,
      likes: storedLikes.sort((a, b) => a.id.localeCompare(b.id)),
      comments: storedComments.sort((a, b) => a.id.localeCompare(b.id)),
      rootsReel1: await comments.listByParent("reel-local-1", null),
      repliesA: await comments.listByParent("reel-local-1", "comment-a"),
      repliesB: await comments.listByParent("reel-local-1", "reply-b"),
      marker: localStorage.getItem(REELS_MIGRATION_MARKER_KEY),
      sources: {
        published: localStorage.getItem(PUBLISHED_KEY),
        likes: localStorage.getItem(LIKES_KEY),
        comments: localStorage.getItem(COMMENTS_KEY),
      },
      replyCount: storedComments.filter((comment) => (comment.parentId ?? null) !== null).length,
      maxDepth: calculateMaxDepth(storedComments),
    };
  } finally {
    await adapter.close();
  }
}

async function readWithoutLocalStorage() {
  const original = Storage.prototype.getItem;
  const originalFetch = window.fetch;
  Storage.prototype.getItem = () => {
    throw new Error("localStorage não pode ser consultado por esta leitura");
  };
  window.fetch = () => {
    throw new Error("Supabase/rede não pode ser consultado por esta leitura");
  };
  try {
    return await getPersistedReels();
  } finally {
    Storage.prototype.getItem = original;
    window.fetch = originalFetch;
  }
}

window.__connexyReloadHarness = {
  async reset(sources: LegacySources) {
    await deleteReelsDatabase();
    localStorage.removeItem(REELS_MIGRATION_MARKER_KEY);
    localStorage.setItem(PUBLISHED_KEY, sources.published);
    localStorage.setItem(LIKES_KEY, sources.likes);
    localStorage.setItem(COMMENTS_KEY, sources.comments);
  },
  runMigrations,
  snapshot,
  readWithoutLocalStorage,
  setMarker(raw: string) {
    localStorage.setItem(REELS_MIGRATION_MARKER_KEY, raw);
  },
  getMarker() {
    return localStorage.getItem(REELS_MIGRATION_MARKER_KEY);
  },
  async cleanup() {
    await deleteReelsDatabase();
    localStorage.removeItem(PUBLISHED_KEY);
    localStorage.removeItem(LIKES_KEY);
    localStorage.removeItem(COMMENTS_KEY);
    localStorage.removeItem(REELS_MIGRATION_MARKER_KEY);
  },
};

declare global {
  interface Window {
    __connexyReloadHarness: {
      reset(sources: LegacySources): Promise<void>;
      runMigrations(userId: string): Promise<unknown>;
      snapshot(): Promise<unknown>;
      readWithoutLocalStorage(): Promise<unknown>;
      setMarker(raw: string): void;
      getMarker(): string | null;
      cleanup(): Promise<void>;
    };
  }
}
