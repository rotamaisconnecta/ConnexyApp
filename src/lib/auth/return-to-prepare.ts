import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { RETURN_TO_COOKIE_NAME, sanitizeReturnTo } from "./return-to";

const prepareReturnToSchema = z.object({
  returnTo: z.string().optional(),
});

/**
 * Persists the post-login redirect target in an HttpOnly, short-lived cookie.
 * The OAuth callback reads and removes it server-side, so the redirect target
 * is validated on the server instead of trusting the callback query string.
 */
export const prepareReturnTo = createServerFn({ method: "POST" })
  .validator((input: unknown) => prepareReturnToSchema.parse(input))
  .handler(async ({ data }) => {
    const { setCookie } = await import("@tanstack/react-start/server");
    const target = sanitizeReturnTo(data.returnTo);
    if (target) {
      setCookie(RETURN_TO_COOKIE_NAME, target, {
        path: "/",
        sameSite: "lax",
        httpOnly: true,
        maxAge: 600,
      });
    }
    return { ok: true };
  });
