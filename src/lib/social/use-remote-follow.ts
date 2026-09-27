import { useEffect, useState } from "react";
import { isSchemaAUuid } from "@/lib/adapters/schema-a/ids";
import { getSchemaASocial } from "./schema-a-social";
import { isRemoteSocialEnabled } from "./schema-a-social-flag";

export function useRemoteFollowState(followeeId: string) {
  const enabled = isRemoteSocialEnabled();
  const eligible = enabled && isSchemaAUuid(followeeId);
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!eligible) {
      setFollowing(false);
      return;
    }
    let cancelled = false;
    void getSchemaASocial()
      .isFollowing(followeeId)
      .then((value) => {
        if (!cancelled) setFollowing(value);
      })
      .catch(() => {
        if (!cancelled) setFollowing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [eligible, followeeId]);

  return {
    eligible,
    following,
    busy,
    async toggle() {
      if (!eligible || busy) return following;
      setBusy(true);
      try {
        const social = getSchemaASocial();
        if (following) await social.unfollow(followeeId);
        else await social.follow(followeeId);
        const next = await social.isFollowing(followeeId);
        setFollowing(next);
        return next;
      } finally {
        setBusy(false);
      }
    },
  };
}
