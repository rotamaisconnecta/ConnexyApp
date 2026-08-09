import { createServerFn } from "@tanstack/react-start";

/**
 * Signs out the current request using the per-request SSR client, clearing the
 * auth cookies server-side. Protected against CSRF by the global middleware.
 */
export const signOut = createServerFn({ method: "POST" }).handler(async () => {
  const { createServerSupabaseClient } = await import("@/lib/supabase/server.server");
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  return { ok: true };
});
