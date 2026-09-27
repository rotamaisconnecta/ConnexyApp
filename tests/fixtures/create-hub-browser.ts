import { demoStorageKey } from "../../src/lib/demo/demo-config";
import { getDemoIdentity, setDemoIdentity } from "../../src/lib/demo/demo-identity";
import { getDemoPosts, saveDemoPost, type DemoPost } from "../../src/lib/demo/demo-posts";
import {
  CANONICAL_POST_PUBLISH_ROUTE,
  CANONICAL_RIDE_CREATE_ROUTE,
  CREATE_TYPE_UNAVAILABLE_MESSAGE,
} from "../../src/lib/create/create-hub-destinations";
import { CANONICAL_REEL_PUBLISH_ROUTE } from "../../src/lib/reels/canonical-reel-publish-route";
import { CREATE_PHOTO_REDIRECT_TO } from "../../src/routes/_app/create/photo";
import { CREATE_VIDEO_REDIRECT_TO } from "../../src/routes/_app/create/video";
import { CREATE_TEXT_REDIRECT_TO } from "../../src/routes/_app/create/text";
import { CREATE_RIDE_REDIRECT_TO } from "../../src/routes/_app/create/ride";
import { CREATE_REEL_REDIRECT_TO } from "../../src/routes/_app/create/reel";

const originalFetch = window.fetch.bind(window);
let networkCalls = 0;
const CAPTION = "Publicação persistida da Fase 1F-3 via Create Hub";

window.fetch = (...args) => {
  networkCalls += 1;
  return originalFetch(...args);
};

function snapshot() {
  const posts = getDemoPosts().filter((post) => post.text === CAPTION);
  return {
    identity: getDemoIdentity(),
    photoRoute: CREATE_PHOTO_REDIRECT_TO,
    videoRoute: CREATE_VIDEO_REDIRECT_TO,
    textRoute: CREATE_TEXT_REDIRECT_TO,
    postRoute: CANONICAL_POST_PUBLISH_ROUTE,
    rideRoute: CREATE_RIDE_REDIRECT_TO,
    rideCanonical: CANONICAL_RIDE_CREATE_ROUTE,
    reelRoute: CREATE_REEL_REDIRECT_TO,
    reelCanonical: CANONICAL_REEL_PUBLISH_ROUTE,
    unavailable: CREATE_TYPE_UNAVAILABLE_MESSAGE,
    postsKey: demoStorageKey("posts"),
    publishedIds: posts.map((post) => post.id),
    storedCount: posts.length,
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
  async publishFromCanonicalPostFlow() {
    const identity = getDemoIdentity();
    const post: DemoPost = {
      id: `demo-post-1f-3-${Date.now()}`,
      authorId: identity.id,
      authorName: identity.name,
      authorPhoto: identity.photo,
      authorHandle: "lucas",
      text: CAPTION,
      media: [],
      category: "TEXT",
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
    __connexyMvp1f3Harness: typeof harness;
  }
}

window.__connexyMvp1f3Harness = harness;
