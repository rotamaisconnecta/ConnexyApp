import { useEffect, useState } from "react";
import { currentUser, people } from "@/lib/mock-data";
import { demoStorageKey, isDemoMode } from "./demo-config";

const IDENTITY_KEY = demoStorageKey("identity");
const IDENTITY_EVENT = "connexy:demo:identity";

export type DemoIdentity = {
  id: string;
  name: string;
  photo: string;
};

let demoIdentities: DemoIdentity[] | null = null;

function getDemoIdentitiesList(): DemoIdentity[] {
  if (!demoIdentities) {
    demoIdentities = [
      { id: currentUser.id, name: currentUser.name, photo: currentUser.photo },
      ...people.map((person) => ({ id: person.id, name: person.name, photo: person.photo })),
    ];
  }
  return demoIdentities;
}

export function getDemoIdentities(): DemoIdentity[] {
  return getDemoIdentitiesList();
}

export function getDemoIdentity(): DemoIdentity {
  const identities = getDemoIdentitiesList();
  if (typeof window === "undefined" || !isDemoMode()) return identities[0];
  try {
    const id = window.localStorage.getItem(IDENTITY_KEY);
    return identities.find((identity) => identity.id === id) ?? identities[0];
  } catch {
    return identities[0];
  }
}

/** Development-only identity switcher. It is not an auth action or a user account. */
export function setDemoIdentity(id: string): void {
  if (!isDemoMode() || typeof window === "undefined") return;
  const identity = getDemoIdentitiesList().find((item) => item.id === id);
  if (!identity) return;
  try {
    if (identity.id === currentUser.id) window.localStorage.removeItem(IDENTITY_KEY);
    else window.localStorage.setItem(IDENTITY_KEY, identity.id);
    window.dispatchEvent(new CustomEvent(IDENTITY_EVENT));
  } catch {
    /* A missing storage implementation simply keeps the Lucas default. */
  }
}

export function useDemoIdentity(): DemoIdentity {
  const [identity, setIdentity] = useState(getDemoIdentity);
  useEffect(() => {
    if (!isDemoMode()) return;
    const sync = () => setIdentity(getDemoIdentity());
    window.addEventListener(IDENTITY_EVENT, sync);
    return () => window.removeEventListener(IDENTITY_EVENT, sync);
  }, []);
  return identity;
}
