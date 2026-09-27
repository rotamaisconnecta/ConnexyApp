import {
  acceptRequest,
  createDemoGroup,
  declineRequest,
  getPendingRequests,
  respondToDemoGroupInvite,
  sendRequest,
} from "../../src/lib/demo/demo-db";
import { listLocalInboxItems } from "../../src/lib/notifications/local-invite-inbox";
import {
  OUTING_INVITES_STORAGE_KEY,
  getOutingRideSearch,
  isOutingRideAvailable,
  listOutingInvites,
  respondToOutingInvite,
  sendOutingInvite,
} from "../../src/lib/marketplace/outing-invites";
import { buildCompanionStops, parseCompanions } from "../../src/lib/mobility/ride-search";
import { createTrip, getTrip, resetTrip } from "../../src/lib/mobility/trip/trip-store";
import { enterDemoSession } from "../../src/lib/demo/demo-auth";
import { DEMO_STORAGE_PREFIX } from "../../src/lib/demo/demo-config";
import { getDemoIdentity, setDemoIdentity } from "../../src/lib/demo/demo-identity";

const nativeFetch = window.fetch.bind(window);
let networkCalls = 0;
window.fetch = (...args) => {
  networkCalls += 1;
  return nativeFetch(...args);
};

const TARGET = {
  id: "cafe-central",
  title: "Café Central",
  address: "Rua Augusta, 1200 — São Paulo, SP",
  latitude: -23.561,
  longitude: -46.656,
};
const ORIGIN = { lat: -23.55, lng: -46.64, label: "Sua localização" };

function startOutingRide(fromUserId: string, targetId: string) {
  const search = getOutingRideSearch(fromUserId, targetId);
  if (!search) return null;
  const current = getTrip();
  if (current && current.status !== "conclusao" && current.status !== "cancelada") {
    return current;
  }
  return createTrip({
    origin: ORIGIN,
    destination: {
      lat: search.destinationLat ?? -23.58,
      lng: search.destinationLng ?? -46.65,
      label: search.destinationAddress || search.destinationName || "",
    },
    stops: buildCompanionStops(ORIGIN, parseCompanions(search.companions)),
    source: search.source,
    companionLabel: search.source === "invite" ? "Ir juntos" : undefined,
    userId: fromUserId,
  });
}

function snapshot() {
  const identity = getDemoIdentity();
  return {
    identity,
    invites: listOutingInvites(),
    inbox: listLocalInboxItems(identity.id),
    pendingRequests: getPendingRequests(identity.id),
    rideAvailable: isOutingRideAvailable("lucas", TARGET.id),
    rideSearch: getOutingRideSearch("lucas", TARGET.id),
    trip: getTrip(),
    outingKey: OUTING_INVITES_STORAGE_KEY,
    parallelOutingKey: window.localStorage.getItem("connexy:demo:outing-invites-v2"),
    demoKeys: Object.keys(window.localStorage)
      .filter((key) => key.startsWith(DEMO_STORAGE_PREFIX) || key === "connexy_demo_trip")
      .sort(),
    catalogNotificationIds: ["n1", "n2", "n3", "n4"].filter((id) =>
      listLocalInboxItems(identity.id).some((item) => item.id === id),
    ),
    networkCalls,
  };
}

const harness = {
  reset() {
    window.localStorage.clear();
    resetTrip();
    setDemoIdentity("lucas");
    enterDemoSession();
    networkCalls = 0;
    return snapshot();
  },
  asIdentity(id: string) {
    setDemoIdentity(id);
    return getDemoIdentity();
  },
  sendOuting(toUserId = "beatriz") {
    return sendOutingInvite({
      fromUserId: getDemoIdentity().id,
      toUserId,
      target: TARGET,
      message: "Vamos juntos para Café Central?",
      stop: { address: "Rua Augusta, 1544 — Consolação", lat: -23.5501, lng: -46.6398 },
    });
  },
  respondOuting(inviteId: string, accepted: boolean) {
    return respondToOutingInvite(inviteId, getDemoIdentity().id, accepted);
  },
  openRide() {
    return startOutingRide(getDemoIdentity().id, TARGET.id);
  },
  inviteFriend(fromUserId: string, toUserId: string, message: string) {
    return sendRequest(fromUserId, toUserId, message);
  },
  async acceptFriend(fromUserId: string) {
    return acceptRequest(fromUserId, getDemoIdentity().id);
  },
  declineFriend(fromUserId: string) {
    return declineRequest(fromUserId, getDemoIdentity().id);
  },
  createGroup(conversationId: string, invitedUserId: string, name: string) {
    return createDemoGroup(conversationId, getDemoIdentity().id, [invitedUserId], name);
  },
  respondGroup(groupId: string, accepted: boolean) {
    return respondToDemoGroupInvite(groupId, getDemoIdentity().id, accepted);
  },
  snapshot,
};

declare global {
  interface Window {
    __connexyMvp1f6Harness: typeof harness;
  }
}

window.__connexyMvp1f6Harness = harness;
