import { useEffect, useState } from "react";
import {
  saveDemoOwnProfile,
  useDemoOwnProfile,
  type DemoOwnProfile,
} from "@/lib/demo/demo-own-profile";
import { getSchemaAProfile } from "./schema-a-profile";
import { isRemoteProfileEnabled } from "./schema-a-profile-flag";

const EMPTY_OWN_PROFILE: DemoOwnProfile = {
  name: "",
  handle: "",
  photo: "",
  cover: "",
  city: "",
  bio: "",
  interests: [],
  privateAddresses: { home: "", work: "" },
  visibility: {
    confirmedActivity: "Conexões",
    likedPlaces: "Conexões",
    mutualFriends: "Todos",
  },
};

export function useOwnProfileController() {
  const remoteEnabled = isRemoteProfileEnabled();
  const demoProfile = useDemoOwnProfile();
  const [remoteProfile, setRemoteProfile] = useState<DemoOwnProfile | null>(null);
  const [loading, setLoading] = useState(remoteEnabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!remoteEnabled) {
      setLoading(false);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void getSchemaAProfile()
      .loadOwn()
      .then((profile) => {
        if (cancelled) return;
        setRemoteProfile(profile);
        setError(null);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setRemoteProfile(null);
        setError(err instanceof Error ? err.message : "Não foi possível carregar o perfil.");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [remoteEnabled]);

  return {
    source: remoteEnabled ? ("remote" as const) : ("demo" as const),
    profile: remoteEnabled ? (remoteProfile ?? EMPTY_OWN_PROFILE) : demoProfile,
    loading,
    error,
    async save(next: DemoOwnProfile) {
      if (remoteEnabled) {
        const saved = await getSchemaAProfile().saveOwn(next);
        setRemoteProfile(saved);
        return saved;
      }
      saveDemoOwnProfile(next);
      return next;
    },
  };
}
