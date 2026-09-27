import {
  applyDemoOnboardingInterests,
  applyDemoOnboardingProfile,
  demoOwnProfileStorageKey,
  getCanonicalDemoProfile,
  getDemoOwnProfile,
  saveDemoOwnProfile,
} from "../../src/lib/demo/demo-own-profile";
import {
  clearDemoSignup,
  enterDemoSession,
  isDemoAuthenticated,
  isDemoSignupPending,
  startDemoSignup,
} from "../../src/lib/demo/demo-auth";
import { DEMO_STORAGE_PREFIX } from "../../src/lib/demo/demo-config";
import { getDemoIdentity } from "../../src/lib/demo/demo-identity";

const onboardingInput = {
  name: "Ana Costa",
  handle: "@Ana Costa",
  bio: "Design e cafés de bairro",
  birthDate: "1994-03-20",
  photo: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2w==",
};

function snapshot() {
  const canonical = getCanonicalDemoProfile();
  return {
    authenticated: isDemoAuthenticated(),
    signupPending: isDemoSignupPending(),
    identity: getDemoIdentity(),
    canonical,
    profileKeys: Object.keys(window.localStorage).filter(
      (key) => key === demoOwnProfileStorageKey(),
    ),
    demoKeys: Object.keys(window.localStorage)
      .filter((key) => key.startsWith(DEMO_STORAGE_PREFIX))
      .sort(),
  };
}

const harness = {
  reset() {
    for (const key of Object.keys(window.localStorage)) {
      if (key.startsWith(DEMO_STORAGE_PREFIX)) window.localStorage.removeItem(key);
    }
  },
  start() {
    enterDemoSession();
    startDemoSignup();
    return snapshot();
  },
  saveProfile() {
    applyDemoOnboardingProfile(onboardingInput);
    return snapshot();
  },
  saveInterests() {
    applyDemoOnboardingInterests(["Café", "Arte", "Cinema", "Café", " arte "]);
    clearDemoSignup();
    return snapshot();
  },
  editProfile() {
    saveDemoOwnProfile({
      ...getDemoOwnProfile(),
      name: "Ana Costa Silva",
      bio: "Bio editada após onboarding",
    });
    return snapshot();
  },
  snapshot,
};

declare global {
  interface Window {
    __connexyProfileHarness: typeof harness;
  }
}

window.__connexyProfileHarness = harness;
