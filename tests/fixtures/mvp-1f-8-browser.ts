import { demoStorageKey } from "../../src/lib/demo/demo-config";
import { getDemoIdentity, setDemoIdentity } from "../../src/lib/demo/demo-identity";
import { getDemoPosts, saveDemoPost, type DemoPost } from "../../src/lib/demo/demo-posts";
import {
  CANONICAL_MOMENT_CATEGORY,
  CANONICAL_POST_PUBLISH_ROUTE,
  CREATE_TYPE_UNAVAILABLE_MESSAGE,
} from "../../src/lib/create/create-hub-destinations";
import { CREATE_MOMENT_REDIRECT_TO } from "../../src/routes/_app/create/moment";
import { resolveLocalEventById } from "../../src/lib/marketplace/local-event-lookup";
import { findPlace } from "../../src/lib/mock-data";
import { getBusinessById } from "../../src/lib/marketplace/mock-businesses";

const originalFetch = window.fetch.bind(window);
let networkCalls = 0;
const CAPTION = "Momento persistido da Fase 1F-8 via Create Hub";

window.fetch = (...args) => {
  networkCalls += 1;
  return originalFetch(...args);
};

function snapshot() {
  const posts = getDemoPosts().filter((post) => post.text === CAPTION);
  return {
    identity: getDemoIdentity(),
    momentRoute: CREATE_MOMENT_REDIRECT_TO,
    postRoute: CANONICAL_POST_PUBLISH_ROUTE,
    momentCategory: CANONICAL_MOMENT_CATEGORY,
    unavailable: CREATE_TYPE_UNAVAILABLE_MESSAGE,
    postsKey: demoStorageKey("posts"),
    publishedIds: posts.map((post) => post.id),
    publishedCategories: posts.map((post) => post.category),
    storedCount: posts.length,
    eventOverlay: resolveLocalEventById(posts[0]?.id ?? "missing") ?? null,
    placeOverlay: findPlace(posts[0]?.id ?? "missing") ?? null,
    businessOverlay: getBusinessById(posts[0]?.id ?? "missing") ?? null,
    parallelKeys: {
      moments: localStorage.getItem("connexy:demo:moments"),
      events: localStorage.getItem("connexy:demo:events"),
      places: localStorage.getItem("connexy:demo:places"),
    },
    networkCalls,
  };
}

const harness = {
  async reset() {
    localStorage.clear();
    setDemoIdentity("lucas");
    networkCalls = 0;
    return snapshot();
  },
  async publishMomentFromCanonicalPostFlow() {
    const identity = getDemoIdentity();
    const post: DemoPost = {
      id: `demo-post-1f-8-${Date.now()}`,
      authorId: identity.id,
      authorName: identity.name,
      authorPhoto: identity.photo,
      authorHandle: "lucas",
      text: CAPTION,
      media: [],
      category: CANONICAL_MOMENT_CATEGORY,
      privacy: "PUBLIC",
      locationLabel: null,
      hashtags: [],
      createdAt: Date.now(),
    };
    saveDemoPost(post);
    return { id: post.id, ...snapshot() };
  },
  snapshot,
};

declare global {
  interface Window {
    __connexyMvp1f8Harness: typeof harness;
  }
}

window.__connexyMvp1f8Harness = harness;
