import { filterNearbyPlaces, places } from "../../src/lib/mock-data";
import { getDiscoverItemNavigation } from "../../src/lib/discovery/discover-navigation";
import {
  listNearbyPlaceEvents,
  resolveLocalEventById,
} from "../../src/lib/marketplace/local-event-lookup";
import {
  isDetailSaved,
  listSavedDetailIds,
  SAVED_DETAILS_STORAGE_KEY,
  toggleSavedDetail,
} from "../../src/lib/marketplace/saved-details";

const nativeFetch = window.fetch.bind(window);
let networkCalls = 0;
window.fetch = (...args) => {
  networkCalls += 1;
  return nativeFetch(...args);
};

function snapshot() {
  return {
    burger: filterNearbyPlaces(places, "Burger").map((place) => place.id),
    burgerCase: filterNearbyPlaces(places, "  BURGER ").map((place) => place.id),
    emptyQueryCafes: filterNearbyPlaces(places, "", "Cafés").map((place) => place.id),
    burgerAndCafes: filterNearbyPlaces(places, "Burger", "Cafés").map((place) => place.id),
    none: filterNearbyPlaces(places, "xyzzy-inexistente").map((place) => place.id),
    sunset: listNearbyPlaceEvents().find((event) => event.title.includes("Sunset")),
    sunsetNav: getDiscoverItemNavigation({
      id: "evt-sunset-parque",
      type: "eventos",
      targetId: "sunset-parque",
    }),
    sunsetDetail: resolveLocalEventById("sunset-parque"),
    savedIds: listSavedDetailIds(),
    b1Saved: isDetailSaved("b1"),
    savedKey: SAVED_DETAILS_STORAGE_KEY,
    outingKey: "connexy:demo:outing-invites",
    parallelFavoriteKey: window.localStorage.getItem("connexy:demo:business-favorites"),
    storageKeys: Object.keys(window.localStorage).sort(),
    networkCalls,
  };
}

const harness = {
  reset() {
    window.localStorage.clear();
    networkCalls = 0;
    return snapshot();
  },
  favorite(id: string) {
    return { saved: toggleSavedDetail(id), ids: listSavedDetailIds() };
  },
  snapshot,
};

declare global {
  interface Window {
    __connexyMvp1f1Harness: typeof harness;
  }
}

window.__connexyMvp1f1Harness = harness;
