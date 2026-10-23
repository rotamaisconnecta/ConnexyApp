import type { SchemaAClient } from "@/integrations/supabase/remote";
import { classifyAvatarRef, AVATAR_BUCKET } from "./avatar-media";
import { validateMediaPath } from "./media-path";

export const AVATAR_MEDIA_URL_TTL_SECONDS = 180;

export type AvatarProfile = { id: string; photo_url: string | null };
export type AvatarMediaResult =
  | { status: "ready"; url: string; expiresAt: number }
  | { status: "missing" | "forbidden" | "unavailable" };

export type AvatarMediaServiceDeps = {
  viewerId: string | null;
  loadProfile: (profileId: string) => Promise<AvatarProfile | null>;
  sign: (path: string, ttlSeconds: number) => Promise<string | null>;
  trustedOrigin?: string | null;
  now?: () => number;
};

/**
 * Avatar access is available to every authenticated viewer. The requested
 * profile ID is only a lookup key: the object path always comes from the row
 * read under the viewer's RLS session and is validated against that profile's
 * ID before the server-only signer can access the avatars bucket.
 */
export function createAvatarMediaUrlService(deps: AvatarMediaServiceDeps) {
  const now = deps.now ?? Date.now;

  return {
    async getAvatarUrl(profileId: string): Promise<AvatarMediaResult> {
      if (!deps.viewerId) return { status: "forbidden" };

      let profile: AvatarProfile | null;
      try {
        profile = await deps.loadProfile(profileId);
      } catch {
        return { status: "unavailable" };
      }
      if (!profile || profile.id !== profileId) return { status: "missing" };

      const ref = classifyAvatarRef(profile.photo_url, {
        trustedOrigin: deps.trustedOrigin,
        expectedOwnerId: profile.id,
      });
      if (ref.kind === "missing") return { status: "missing" };
      if (ref.kind === "rejected") return { status: "unavailable" };

      // Local/demo and external references stay display-only. No request URL
      // is accepted from the caller; these values were read from the profile.
      if (ref.kind === "local" || ref.kind === "external") {
        return { status: "ready", url: ref.url, expiresAt: Number.MAX_SAFE_INTEGER };
      }

      const path = ref.path;
      const validation = validateMediaPath(path);
      if (!validation.ok || validation.ownerId !== profile.id || ref.bucket !== AVATAR_BUCKET) {
        return { status: "unavailable" };
      }

      try {
        const url = await deps.sign(path, AVATAR_MEDIA_URL_TTL_SECONDS);
        if (!url) return { status: "unavailable" };
        return {
          status: "ready",
          url,
          expiresAt: now() + AVATAR_MEDIA_URL_TTL_SECONDS * 1000,
        };
      } catch {
        return { status: "unavailable" };
      }
    },
  };
}

export function createSchemaAAvatarProfileReader(supabase: SchemaAClient) {
  return async (profileId: string): Promise<AvatarProfile | null> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, photo_url")
      .eq("id", profileId)
      .maybeSingle();
    if (error) throw error;
    return data ?? null;
  };
}

export async function signAvatarWithServiceRole(
  path: string,
  ttlSeconds: number,
): Promise<string | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.storage
    .from(AVATAR_BUCKET)
    .createSignedUrl(path, ttlSeconds);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

export function createServerAvatarMediaUrlService(input: {
  supabase: SchemaAClient;
  viewerId: string | null;
  trustedOrigin?: string | null;
}) {
  return createAvatarMediaUrlService({
    viewerId: input.viewerId,
    trustedOrigin: input.trustedOrigin,
    loadProfile: createSchemaAAvatarProfileReader(input.supabase),
    sign: signAvatarWithServiceRole,
  });
}
