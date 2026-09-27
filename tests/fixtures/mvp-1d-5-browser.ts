import {
  acceptRequest,
  createDemoGroup,
  getConnectionBetween,
  getPendingRequests,
  resetDemoData,
  respondToDemoGroupInvite,
  sendRequest,
} from "../../src/lib/demo/demo-db";
import { listLocalInboxItems } from "../../src/lib/notifications/local-invite-inbox";
import { enterDemoSession } from "../../src/lib/demo/demo-auth";
import { getDemoIdentity, setDemoIdentity } from "../../src/lib/demo/demo-identity";
import {
  PRESENCE_PREFERENCE_STORAGE_KEY,
  readStoredPresencePreference,
  writeStoredPresencePreference,
} from "../../src/lib/presence/presence-preference";
import { ROLES_STORAGE_KEY, getActiveMode, setActiveMode } from "../../src/lib/roles/roles-storage";
import { UserRole } from "../../src/lib/roles/roles-types";
import {
  clearTrip,
  completeTrip,
  confirmDriverPayment,
  createTrip,
  getHistorySnapshot,
  markDriverFound,
  patchTrip,
  transition,
} from "../../src/lib/mobility/trip/trip-store";
import type { TripDriver } from "../../src/lib/mobility/trip/trip-types";

const origin = { lat: -23.55, lng: -46.64, label: "Origem 1D-5" };
const destination = { lat: -23.58, lng: -46.67, label: "Destino 1D-5" };
const driver: TripDriver = {
  id: "driver-1d-5",
  name: "Motorista 1D-5",
  rating: 4.9,
  totalRides: 12,
  photo: "",
  vehicle: { name: "Onix", color: "Preto", plate: "ABC1D23", seats: 4 },
  boardingCode: "4321",
  verified: true,
};

const nativeFetch = window.fetch.bind(window);
let networkCalls = 0;
window.fetch = (...args) => {
  networkCalls += 1;
  return nativeFetch(...args);
};

function snapshot() {
  const identity = getDemoIdentity();
  return {
    identity,
    inbox: listLocalInboxItems(identity.id),
    pending: getPendingRequests(identity.id),
    history: getHistorySnapshot(),
    presence: readStoredPresencePreference(),
    presenceKey: window.localStorage.getItem(PRESENCE_PREFERENCE_STORAGE_KEY),
    mode: getActiveMode(),
    rolesRaw: window.localStorage.getItem(ROLES_STORAGE_KEY),
    parallelInviteSource: window.localStorage.getItem("connexy.mock.conversation-invites"),
    parallelNotificationStore: window.localStorage.getItem("connexy.notifications"),
    storageKeys: Object.keys(window.localStorage).sort(),
    networkCalls,
  };
}

const harness = {
  reset() {
    window.localStorage.clear();
    resetDemoData();
    clearTrip();
    setDemoIdentity("lucas");
    enterDemoSession();
    networkCalls = 0;
    return snapshot();
  },
  asIdentity(id: string) {
    setDemoIdentity(id);
    return getDemoIdentity();
  },
  invite(toUserId: string, message: string) {
    return sendRequest(getDemoIdentity().id, toUserId, message);
  },
  async accept(fromUserId: string) {
    return acceptRequest(fromUserId, getDemoIdentity().id);
  },
  async createGroup(peerId: string, name: string) {
    const identity = getDemoIdentity();
    const connection = getConnectionBetween(identity.id, peerId);
    if (!connection) throw new Error("conexão ausente");
    return createDemoGroup(connection.conversationId, identity.id, [peerId], name);
  },
  respondGroup(groupId: string, accepted: boolean) {
    return respondToDemoGroupInvite(groupId, getDemoIdentity().id, accepted);
  },
  completeRide() {
    const trip = createTrip({
      origin,
      destination,
      stops: [
        {
          id: "stop-1d-5",
          location: { lat: -23.56, lng: -46.65, label: "Parada 1D-5" },
          label: "Parada 1D-5",
          order: 1,
        },
      ],
      userId: getDemoIdentity().id,
    });
    transition("embarque");
    transition("categoria");
    patchTrip({ paymentMethod: "pix", estimatedFare: 27.5 });
    transition("buscando");
    markDriverFound(driver);
    transition("chegando");
    transition("chegou");
    transition("emviagem");
    transition("parada");
    patchTrip({ currentStopIndex: 1 });
    transition("chegada");
    transition("avaliacao");
    confirmDriverPayment();
    completeTrip({
      stars: 5,
      tags: ["seguro"],
      comment: "1D-5 browser",
      createdAt: new Date().toISOString(),
    });
    return { tripId: trip.id, history: getHistorySnapshot() };
  },
  setPresence(value: "online" | "available" | "dnd" | "invisible") {
    writeStoredPresencePreference(value);
    return readStoredPresencePreference();
  },
  setMode(mode: "user" | "driver") {
    setActiveMode(mode === "driver" ? UserRole.DRIVER : UserRole.USER);
    return getActiveMode();
  },
  snapshot,
};

declare global {
  interface Window {
    __connexyMvp1d5Harness: typeof harness;
  }
}

window.__connexyMvp1d5Harness = harness;
