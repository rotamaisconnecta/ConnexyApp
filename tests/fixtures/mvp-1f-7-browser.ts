import {
  acceptRequest,
  getPendingRequests,
  isConnected,
  isFollowing,
  listFollowees,
  sendRequest,
  toggleFollow,
} from "../../src/lib/demo/demo-db";
import {
  isDetailSaved,
  listSavedDetailIds,
  SAVED_DETAILS_STORAGE_KEY,
  toggleSavedDetail,
} from "../../src/lib/marketplace/saved-details";
import { applyReelSocialState, getReelConnectStatus } from "../../src/lib/reels/reel-social-state";
import { MOCK_REELS } from "../../src/lib/reels/reel-mocks";
import { listLocalInboxItems } from "../../src/lib/notifications/local-invite-inbox";
import { enterDemoSession } from "../../src/lib/demo/demo-auth";
import { getDemoIdentity, setDemoIdentity } from "../../src/lib/demo/demo-identity";

const nativeFetch = window.fetch.bind(window);
let networkCalls = 0;
window.fetch = (...args) => {
  networkCalls += 1;
  return nativeFetch(...args);
};

function reelOf(authorId: string) {
  const reel = MOCK_REELS.find((item) => item.author.id === authorId);
  if (!reel) throw new Error(`reel de ${authorId} ausente`);
  return reel;
}

function snapshot() {
  const identity = getDemoIdentity();
  const reel = reelOf("beatriz");
  const social = applyReelSocialState(reel, identity.id);
  return {
    identity,
    reelId: reel.id,
    authorId: reel.author.id,
    following: isFollowing(reel.author.id, identity.id),
    followees: listFollowees(identity.id),
    saved: isDetailSaved(reel.id),
    savedIds: listSavedDetailIds(),
    savedKey: SAVED_DETAILS_STORAGE_KEY,
    connectStatus: getReelConnectStatus(reel.author.id, identity.id),
    connected: isConnected(reel.author.id, identity.id),
    inbox: listLocalInboxItems(identity.id),
    incoming: getPendingRequests(identity.id),
    applied: {
      savedByMe: social.savedByMe,
      isFollowing: social.author.isFollowing,
    },
    parallelKeys: {
      follows: window.localStorage.getItem("connexy:demo:follows"),
      savedReels: window.localStorage.getItem("connexy:demo:saved-reels"),
    },
    catalogNotificationIds: ["n1", "n2", "n3", "n4"].filter((id) =>
      listLocalInboxItems(identity.id).some((item) => item.id === id),
    ),
    networkCalls,
  };
}

const harness = {
  reset() {
    window.localStorage.clear();
    setDemoIdentity("lucas");
    enterDemoSession();
    networkCalls = 0;
    return snapshot();
  },
  asIdentity(id: string) {
    setDemoIdentity(id);
    return getDemoIdentity();
  },
  follow(authorId = "beatriz") {
    return toggleFollow(authorId, getDemoIdentity().id);
  },
  save(reelId?: string) {
    return toggleSavedDetail(reelId ?? reelOf("beatriz").id);
  },
  favoritePlace() {
    return toggleSavedDetail("cafe-central");
  },
  inviteAuthor() {
    return sendRequest(getDemoIdentity().id, "beatriz", "Vi seu reel");
  },
  async acceptAuthor() {
    return acceptRequest("lucas", getDemoIdentity().id);
  },
  snapshot,
};

declare global {
  interface Window {
    __connexyMvp1f7Harness: typeof harness;
  }
}

window.__connexyMvp1f7Harness = harness;
