import { createMiddleware } from "@tanstack/react-start";
import { supabase } from "./client";

/**
 * Project-owned bearer attacher for serverFn RPCs.
 *
 * Reads the session from the external-Supabase browser client and forwards the
 * access token as a Bearer header so server functions run RLS as the signed-in
 * user. Must be registered as the global `functionMiddleware` in `src/start.ts`.
 *
 * This replaces the auto-generated `attachSupabaseAuth` (which targeted the
 * Lovable-managed backend) so that all calls route to the user's external
 * Supabase project.
 */
export const attachAppSupabaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return next({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
);
