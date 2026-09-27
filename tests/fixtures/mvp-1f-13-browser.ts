import {
  CatalogKind,
  LOCAL_CATALOG_STORAGE_KEY,
  createCatalogBusiness,
  createCatalogEvent,
  createCatalogOffer,
  createCatalogPlace,
  getCatalogEntity,
  listCatalogEntities,
  mergeCatalogPlaces,
} from "../../src/lib/catalog/local-catalog";
import { demoStorageKey } from "../../src/lib/demo/demo-config";
import { getDemoIdentity, setDemoIdentity } from "../../src/lib/demo/demo-identity";
import { MORE_MENU_LABELS } from "../../src/lib/navigation/more-menu";
import { resolveLocalEventById } from "../../src/lib/marketplace/local-event-lookup";
import { BusinessCategory } from "../../src/lib/marketplace/business-types";
import { getAllBusinesses, getBusinessById } from "../../src/lib/marketplace/mock-businesses";
import { places } from "../../src/lib/mock-data";
import { SAVED_DETAILS_STORAGE_KEY } from "../../src/lib/marketplace/saved-details";

const originalFetch = window.fetch.bind(window);
let networkCalls = 0;

window.fetch = (...args) => {
  networkCalls += 1;
  return originalFetch(...args);
};

function snapshot() {
  const identity = getDemoIdentity();
  const entities = listCatalogEntities();
  const event = entities.find((item) => item.kind === CatalogKind.EVENT);
  const place = entities.find((item) => item.kind === CatalogKind.PLACE);
  const business = entities.find((item) => item.kind === CatalogKind.BUSINESS);
  const offer = entities.find((item) => item.kind === CatalogKind.OFFER);
  const hosted = business ? getBusinessById(business.id) : undefined;
  return {
    identity,
    catalogKey: LOCAL_CATALOG_STORAGE_KEY,
    postsKey: demoStorageKey("posts"),
    moreMenu: [...MORE_MENU_LABELS],
    ownerIds: entities.map((item) => item.ownerId),
    ids: entities.map((item) => item.id),
    kinds: entities.map((item) => item.kind).sort(),
    eventOverlay: event ? (resolveLocalEventById(event.id)?.id ?? null) : null,
    placeOverlay: place
      ? mergeCatalogPlaces(places).some((item) => item.id === place.id)
        ? place.id
        : null
      : null,
    businessOverlay: business ? (getBusinessById(business.id)?.id ?? null) : null,
    offerOverlay: Boolean(offer && hosted?.promotions.some((item) => item.id === offer.id)),
    offerBusinessId: offer && "businessId" in offer ? offer.businessId : null,
    savedDetails: window.localStorage.getItem(SAVED_DETAILS_STORAGE_KEY),
    fixturePlace: places.some((item) => item.id === "cafe-central"),
    fixtureBusiness: getAllBusinesses().some((item) => item.id === "b1"),
    storedCount: entities.length,
    lookup: {
      event: event ? (getCatalogEntity(event.id)?.id ?? null) : null,
      place: place ? (getCatalogEntity(place.id)?.id ?? null) : null,
      business: business ? (getCatalogEntity(business.id)?.id ?? null) : null,
      offer: offer ? (getCatalogEntity(offer.id)?.id ?? null) : null,
    },
    parallelKeys: {
      events: window.localStorage.getItem("connexy:demo:events"),
      places: window.localStorage.getItem("connexy:demo:places"),
      posts: window.localStorage.getItem("connexy:demo:posts"),
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
  async publishCatalog() {
    const event = createCatalogEvent({
      title: "Sarau persistido 1F-13",
      description: "Catálogo local",
      location: "Praça da República",
      startAt: "2026-10-09T19:30",
      endAt: "2026-10-09T21:00",
    });
    const place = createCatalogPlace({
      name: "Ateliê persistido 1F-13",
      category: "Lojas",
      address: "Rua Augusta, 400",
      description: "Espaço local",
    });
    const business = createCatalogBusiness({
      name: "Padaria persistida 1F-13",
      category: BusinessCategory.CAFE,
      address: "Rua Oscar Freire, 110",
      description: "Café local",
    });
    const offer = createCatalogOffer({
      businessId: business.id,
      title: "Café 18%",
      description: "Oferta no negócio persistido",
      discountValue: 18,
      validUntil: "2026-11-30T23:59:00",
    });
    return {
      eventId: event.id,
      placeId: place.id,
      businessId: business.id,
      offerId: offer.id,
      ownerId: getDemoIdentity().id,
      ...snapshot(),
    };
  },
  snapshot,
};

declare global {
  interface Window {
    __connexyMvp1f13Harness: typeof harness;
  }
}

window.__connexyMvp1f13Harness = harness;
