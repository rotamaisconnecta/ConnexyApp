import { getDemoIdentity, setDemoIdentity } from "../../src/lib/demo/demo-identity";
import { reelsPersistenceSchema } from "../../src/lib/persistence/domain/reels-schema";
import { IndexedDbAdapter } from "../../src/lib/persistence/local/indexed-db";
import { getReelFeed } from "../../src/lib/reels/reel-feed";
import { getPersistedReels } from "../../src/lib/reels/persisted-reels-reader";
import { publishReel } from "../../src/lib/reels/reel-publish";
import { CREATE_REEL_REDIRECT_TO } from "../../src/routes/_app/create/reel";
import { CANONICAL_REEL_PUBLISH_ROUTE } from "../../src/lib/reels/canonical-reel-publish-route";
import { ReelRepository } from "../../src/repositories/reel.repository";

const MEDIA_DB_NAME = "connexy-reels-local-db";
const originalFetch = window.fetch.bind(window);
let networkCalls = 0;
const CAPTION = "Reel persistido da Fase 1F-2 via Create Hub";

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

async function snapshot() {
  const adapter = new IndexedDbAdapter(reelsPersistenceSchema);
  const repository = new ReelRepository(adapter);
  try {
    const [persisted, feed, stored] = await Promise.all([
      getPersistedReels(),
      getReelFeed(),
      repository.list(),
    ]);
    const published = persisted.filter((reel) => reel.caption === CAPTION);
    return {
      identity: getDemoIdentity(),
      hubRoute: CANONICAL_REEL_PUBLISH_ROUTE,
      redirectTo: CREATE_REEL_REDIRECT_TO,
      publishedIds: published.map((reel) => reel.id),
      feedHasPublished: published.every((reel) => feed.some((item) => item.id === reel.id)),
      storedCount: stored.filter((reel) => reel.caption === CAPTION).length,
      persistence: reelsPersistenceSchema.name,
      store: "reels",
      networkCalls,
    };
  } finally {
    await adapter.close();
  }
}

const harness = {
  async reset() {
    localStorage.clear();
    await deleteDatabase(reelsPersistenceSchema.name);
    await deleteDatabase(MEDIA_DB_NAME);
    setDemoIdentity("lucas");
    networkCalls = 0;
    return snapshot();
  },
  async publishFromCanonicalFlow() {
    const result = await publishReel({
      file: new File([new Uint8Array([0, 1, 2, 3])], "fase-1f-2.mp4", {
        type: "video/mp4",
      }),
      caption: CAPTION,
      context: null,
      posterBlob: null,
      durationS: 1,
    });
    return { id: result.reel.id, publishMode: result.persistence, ...(await snapshot()) };
  },
  snapshot,
};

declare global {
  interface Window {
    __connexyMvp1f2Harness: typeof harness;
  }
}

window.__connexyMvp1f2Harness = harness;
