import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createSchemaAClient } from "@/integrations/supabase/remote";
import { requireAppSupabaseAuth } from "@/lib/supabase/auth-middleware";
import { resolveServerSupabasePublicConfig } from "@/lib/supabase/external-env";

const inputSchema = z.object({ profileId: z.string().uuid() });

function bearerTokenFromRequest(headers: Headers): string | null {
  const header = headers.get("authorization");
  if (!header || !header.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token || null;
}

/** Authenticated avatar resolution. The client supplies only a profile ID. */
export const getAvatarMediaUrl = createServerFn({ method: "POST" })
  .middleware([requireAppSupabaseAuth])
  .validator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { getRequest } = await import("@tanstack/react-start/server");
    const request = getRequest();
    const token = request?.headers ? bearerTokenFromRequest(request.headers) : null;
    if (!token) throw new Error("Unauthorized: No token provided");

    const { createServerAvatarMediaUrlService } =
      await import("@/lib/media/avatar-media-authorization.server");
    const { url, key } = resolveServerSupabasePublicConfig();
    const supabase = createSchemaAClient(url, key, { accessToken: token });
    const service = createServerAvatarMediaUrlService({
      supabase,
      viewerId: context.userId,
      trustedOrigin: new URL(url).origin,
    });
    return service.getAvatarUrl(data.profileId);
  });
