import { CREATE_TYPE_UNAVAILABLE_MESSAGE } from "../../src/lib/create/create-hub-destinations";
import { CANONICAL_REEL_PUBLISH_ROUTE } from "../../src/lib/reels/canonical-reel-publish-route";

const originalFetch = window.fetch.bind(window);
let networkCalls = 0;

window.fetch = (...args) => {
  networkCalls += 1;
  return originalFetch(...args);
};

function snapshot() {
  const storageKeys = Object.keys(localStorage);
  return {
    unavailable: CREATE_TYPE_UNAVAILABLE_MESSAGE,
    reelRoute: CANONICAL_REEL_PUBLISH_ROUTE,
    negocio: "/create/place-business",
    evento: "/create/event",
    local: "/create/place",
    oferta: "/create/offer",
    storageKeys,
    networkCalls,
  };
}

const harness = {
  async reset() {
    networkCalls = 0;
    return snapshot();
  },
  snapshot,
};

declare global {
  interface Window {
    __connexyMvp1f4Harness: typeof harness;
  }
}

window.__connexyMvp1f4Harness = harness;
