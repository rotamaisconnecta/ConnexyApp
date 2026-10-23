import { afterEach, describe, expect, test } from "bun:test";
import { createSchemaAClient } from "../src/integrations/supabase/remote/client";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("Schema A publishable API key transport", () => {
  test("sends opaque publishable keys as apikey and preserves a user access token", async () => {
    const publishableKey = "sb_publishable_test-only";
    let requestHeaders: Headers | undefined;

    globalThis.fetch = async (_input, init) => {
      requestHeaders = new Headers(init?.headers);
      return new Response("[]", {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Content-Range": "0-0/*",
        },
      });
    };

    const client = createSchemaAClient("https://example.supabase.co", publishableKey, {
      accessToken: "user-access-token",
    });
    const { error } = await client.from("profiles").select("id").limit(0);

    expect(error).toBeNull();
    expect(requestHeaders?.get("apikey")).toBe(publishableKey);
    expect(requestHeaders?.get("authorization")).toBe("Bearer user-access-token");
  });
});
