import type { CookieOptions } from "@supabase/ssr";

export const AUTH_COOKIE_NAME = "sb-auth-token";

export const BASE_COOKIE_OPTIONS: CookieOptions = {
  path: "/",
  sameSite: "lax",
  httpOnly: false,
};
