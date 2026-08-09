import { createFileRoute } from "@tanstack/react-router";
import { RETURN_TO_COOKIE_NAME, sanitizeReturnTo } from "@/lib/auth/return-to";

function redirectTo(path: string): Response {
  return new Response(null, {
    status: 302,
    headers: {
      location: path,
      "cache-control": "no-store",
    },
  });
}

export const Route = createFileRoute("/auth_/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const flowId = url.searchParams.get("sb_flow_id");

        if (!code) {
          return redirectTo("/auth?error=missing_code");
        }

        const { createServerSupabaseClient } = await import("@/lib/supabase/server.server");
        const supabase = await createServerSupabaseClient();

        const { data, error } = await supabase.auth.exchangeCodeForSession(
          code,
          flowId ? { flowId } : undefined,
        );
        if (error || !data.session) {
          return redirectTo("/auth?error=exchange_failed");
        }

        const claims = await supabase.auth.getClaims();
        if (!claims.data?.claims?.sub) {
          return redirectTo("/auth?error=identity_failed");
        }

        const { deleteCookie, getCookie } = await import("@tanstack/react-start/server");
        const returnTo = sanitizeReturnTo(getCookie(RETURN_TO_COOKIE_NAME));
        deleteCookie(RETURN_TO_COOKIE_NAME, { path: "/" });

        return redirectTo(returnTo ?? "/localizacao");
      },
    },
  },
});
