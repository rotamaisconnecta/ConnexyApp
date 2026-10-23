import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { resolveServerSupabasePublicConfig } from "./external-env";

/**
 * Project-owned server function auth middleware.
 *
 * This is the durable replacement for the platform-generated
 * `@/integrations/supabase/auth-middleware` (which carries a "do not edit"
 * banner and can be overwritten when the Lovable integration regenerates). The
 * behavior, error messages and the context shape handed to server functions are
 * preserved on purpose.
 *
 * Configuration is resolved through the canonical `external-env.ts` resolver, so
 * precedence (`APP_*` > `VITE_APP_*`) and conflict/absence failures stay in one
 * place. Never reads the service role.
 */

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    // New Supabase API keys are opaque strings, not bearer JWTs.
    if (
      isNewSupabaseApiKey(supabaseKey) &&
      headers.get("Authorization") === `Bearer ${supabaseKey}`
    ) {
      headers.delete("Authorization");
    }

    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

export type SupabaseAuthClientFactory = (url: string, key: string, token: string) => SupabaseClient;

export type SupabaseAuthVerifierDeps = {
  createAuthClient?: SupabaseAuthClientFactory;
};

function defaultCreateAuthClient(url: string, key: string, token: string): SupabaseClient {
  return createClient(url, key, {
    global: {
      fetch: createSupabaseFetch(key),
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Verifies a `Bearer <jwt>` authorization header against the external project
 * and returns the authenticated context.
 *
 * Extracted from the middleware so the authentication behavior can be exercised
 * directly in tests, without the TanStack Start request runtime. The middleware
 * below is a thin wrapper that resolves config, reads the request header and
 * forwards this result via `next({ context })`.
 */
export async function verifySupabaseBearer(
  authorization: string | null | undefined,
  config: { url: string; key: string },
  deps: SupabaseAuthVerifierDeps = {},
) {
  const createAuthClient = deps.createAuthClient ?? defaultCreateAuthClient;

  if (!authorization) {
    throw new Error("Unauthorized: No authorization header provided");
  }

  if (!authorization.startsWith("Bearer ")) {
    throw new Error("Unauthorized: Only Bearer tokens are supported");
  }

  const token = authorization.slice("Bearer ".length);
  if (!token) {
    throw new Error("Unauthorized: No token provided");
  }

  if (token.split(".").length !== 3) {
    throw new Error("Unauthorized: Invalid token");
  }

  const supabase = createAuthClient(config.url, config.key, token);

  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims) {
    throw new Error("Unauthorized: Invalid token");
  }

  if (!data.claims.sub) {
    throw new Error("Unauthorized: No user ID found in token");
  }

  return {
    supabase,
    userId: data.claims.sub,
    claims: data.claims,
  };
}

export type VerifiedSupabaseAuth = Awaited<ReturnType<typeof verifySupabaseBearer>>;

export const requireAppSupabaseAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    let url: string;
    let key: string;
    try {
      ({ url, key } = resolveServerSupabasePublicConfig());
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid Supabase configuration.";
      console.error(`[Supabase] ${message}`);
      throw new Error(message);
    }

    const request = getRequest();

    if (!request?.headers) {
      throw new Error("Unauthorized: No request headers available");
    }

    const authorization = request.headers.get("authorization");
    const verified = await verifySupabaseBearer(authorization, { url, key });

    return next({ context: verified });
  },
);
