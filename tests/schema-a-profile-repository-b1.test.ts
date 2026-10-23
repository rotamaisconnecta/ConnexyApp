import { describe, expect, test } from "bun:test";
import { RemoteErrorCode, RemoteRepositoryError } from "../src/integrations/supabase/remote/errors";
import type { SchemaAClient } from "../src/integrations/supabase/remote/client";
import { RemoteProfileRepository } from "../src/integrations/supabase/remote/profile.repository";
import type { ProfilePrivateRow, ProfileRow } from "../src/integrations/supabase/remote/types";

type Op = "select" | "update";
type Filter = [string, unknown];
type Call = { table: string; op: Op; payload?: Record<string, unknown>; filters: Filter[] };
type Result = { data: unknown; error: { message?: string; code?: string } | null };

const NOW = "2026-10-13T00:00:00.000Z";

function makeRow(overrides: Partial<ProfileRow> = {}): ProfileRow {
  return {
    age: 30,
    bio: "Bio",
    city: null,
    cover_url: null,
    created_at: NOW,
    handle: "ana",
    headline: null,
    id: "u-1",
    interests: [],
    locale: null,
    looks_for: [],
    mood_emoji: null,
    mood_text: null,
    name: "Ana",
    now_playing_kind: null,
    now_playing_subtitle: null,
    now_playing_title: null,
    photo_url: null,
    updated_at: NOW,
    vibe_tags: [],
    visibility: {},
    ...overrides,
  };
}

function makePrivate(overrides: Partial<ProfilePrivateRow> = {}): ProfilePrivateRow {
  return {
    birth_date: null,
    home_address: null,
    updated_at: NOW,
    user_id: "u-1",
    work_address: null,
    ...overrides,
  };
}

function fakeClient(
  opts: {
    userId?: string | null;
    getUserError?: { message: string } | null;
    reply?: (call: Call) => Result;
    defaultResult?: Result;
  } = {},
) {
  const calls: Call[] = [];
  const reply = opts.reply ?? (() => opts.defaultResult ?? { data: null, error: null });
  const client = {
    auth: {
      getUser: async () => {
        if (opts.getUserError) return { data: { user: null }, error: opts.getUserError };
        return {
          data: { user: opts.userId == null ? null : { id: opts.userId } },
          error: null,
        };
      },
    },
    from(table: string) {
      const call: Call = { table, op: "select", filters: [] };
      calls.push(call);
      const builder = {
        select: () => builder,
        update: (payload: Record<string, unknown>) => {
          call.op = "update";
          call.payload = payload;
          return builder;
        },
        eq: (col: string, val: unknown) => {
          call.filters.push([col, val]);
          return builder;
        },
        maybeSingle: async () => reply(call),
        single: async () => reply(call),
      };
      return builder;
    },
  } as unknown as SchemaAClient;
  return { client, calls };
}

async function capture(run: () => Promise<unknown>): Promise<unknown> {
  try {
    await run();
  } catch (error) {
    return error;
  }
  return undefined;
}

describe("Marco B — RemoteProfileRepository public own-profile scoping", () => {
  test("getOwn reads profiles filtered by the authenticated user id", async () => {
    const row = makeRow();
    const { client, calls } = fakeClient({
      userId: "u-1",
      defaultResult: { data: row, error: null },
    });
    const repo = new RemoteProfileRepository(client);

    const result = await repo.getOwn();

    expect(result).toBe(row);
    expect(calls).toHaveLength(1);
    expect(calls[0].table).toBe("profiles");
    expect(calls[0].op).toBe("select");
    expect(calls[0].filters).toEqual([["id", "u-1"]]);
  });

  test("updateOwn scopes the write to the auth user, ignoring a forged id", async () => {
    const { client, calls } = fakeClient({
      userId: "u-1",
      defaultResult: { data: makeRow({ bio: "x" }), error: null },
    });
    const repo = new RemoteProfileRepository(client);

    await repo.updateOwn({ bio: "x", id: "u-2" } as never);

    expect(calls).toHaveLength(1);
    expect(calls[0].table).toBe("profiles");
    expect(calls[0].op).toBe("update");
    expect(calls[0].filters).toEqual([["id", "u-1"]]);
    expect(calls[0].payload).toEqual({ bio: "x" });
    expect("id" in (calls[0].payload ?? {})).toBe(false);
  });

  test("updateOwn forwards only allowed fields and drops unknown keys", async () => {
    const { client, calls } = fakeClient({
      userId: "u-1",
      defaultResult: { data: makeRow(), error: null },
    });
    const repo = new RemoteProfileRepository(client);

    await repo.updateOwn({
      headline: "Hi",
      now_playing_title: "Song",
      user_id: "u-2",
      created_at: "tampered",
    } as never);

    expect(calls[0].payload).toEqual({ headline: "Hi", now_playing_title: "Song" });
  });

  test("updateOwn rejects an empty patch before issuing any query", async () => {
    const { client, calls } = fakeClient({ userId: "u-1" });
    const repo = new RemoteProfileRepository(client);

    const caught = await capture(() => repo.updateOwn({}));

    expect(caught).toBeInstanceOf(RemoteRepositoryError);
    expect((caught as RemoteRepositoryError).code).toBe(RemoteErrorCode.VALIDATION);
    expect(calls).toHaveLength(0);
  });

  test("missing session fails closed with AUTH and issues no query", async () => {
    const { client, calls } = fakeClient({ userId: null });
    const repo = new RemoteProfileRepository(client);

    const caught = await capture(() => repo.getOwn());

    expect(caught).toBeInstanceOf(RemoteRepositoryError);
    expect((caught as RemoteRepositoryError).code).toBe(RemoteErrorCode.AUTH);
    expect(calls).toHaveLength(0);
  });

  test("getUser error surfaces as AUTH", async () => {
    const { client, calls } = fakeClient({ getUserError: { message: "invalid jwt" } });
    const repo = new RemoteProfileRepository(client);

    const caught = await capture(() => repo.updateOwn({ bio: "x" }));

    expect(caught).toBeInstanceOf(RemoteRepositoryError);
    expect((caught as RemoteRepositoryError).code).toBe(RemoteErrorCode.AUTH);
    expect(calls).toHaveLength(0);
  });

  test("missing own profile row maps to NOT_FOUND", async () => {
    const { client } = fakeClient({
      userId: "u-1",
      defaultResult: { data: null, error: null },
    });
    const repo = new RemoteProfileRepository(client);

    const caught = await capture(() => repo.getOwn());

    expect(caught).toBeInstanceOf(RemoteRepositoryError);
    expect((caught as RemoteRepositoryError).code).toBe(RemoteErrorCode.NOT_FOUND);
  });

  test("RLS denial maps to RLS without hiding the failure", async () => {
    const { client } = fakeClient({
      userId: "u-1",
      defaultResult: {
        data: null,
        error: { message: "new row violates row-level security policy", code: "42501" },
      },
    });
    const repo = new RemoteProfileRepository(client);

    const caught = await capture(() => repo.updateOwn({ bio: "x" }));

    expect(caught).toBeInstanceOf(RemoteRepositoryError);
    expect((caught as RemoteRepositoryError).code).toBe(RemoteErrorCode.RLS);
  });

  test("unique violation maps to UNIQUE", async () => {
    const { client } = fakeClient({
      userId: "u-1",
      defaultResult: {
        data: null,
        error: { message: "duplicate key value violates unique constraint", code: "23505" },
      },
    });
    const repo = new RemoteProfileRepository(client);

    const caught = await capture(() => repo.updateOwn({ handle: "ana" }));

    expect(caught).toBeInstanceOf(RemoteRepositoryError);
    expect((caught as RemoteRepositoryError).code).toBe(RemoteErrorCode.UNIQUE);
  });
});

describe("Marco B — RemoteProfileRepository private-profile scoping", () => {
  test("getOwnPrivate filters profile_private by user_id = auth uid", async () => {
    const row = makePrivate();
    const { client, calls } = fakeClient({
      userId: "u-1",
      defaultResult: { data: row, error: null },
    });
    const repo = new RemoteProfileRepository(client);

    const result = await repo.getOwnPrivate();

    expect(result).toBe(row);
    expect(calls[0].table).toBe("profile_private");
    expect(calls[0].op).toBe("select");
    expect(calls[0].filters).toEqual([["user_id", "u-1"]]);
  });

  test("updateOwnPrivate scopes to uid and cannot set user_id", async () => {
    const { client, calls } = fakeClient({
      userId: "u-1",
      defaultResult: { data: makePrivate(), error: null },
    });
    const repo = new RemoteProfileRepository(client);

    await repo.updateOwnPrivate({ home_address: "Rua 1", user_id: "u-2" } as never);

    expect(calls[0].table).toBe("profile_private");
    expect(calls[0].op).toBe("update");
    expect(calls[0].filters).toEqual([["user_id", "u-1"]]);
    expect(calls[0].payload?.user_id).toBeUndefined();
    expect(calls[0].payload?.home_address).toBe("Rua 1");
  });

  test("private read for a different user still requires an authenticated session", async () => {
    const { client, calls } = fakeClient({ userId: null });
    const repo = new RemoteProfileRepository(client);

    const caught = await capture(() => repo.getPrivateByUserId("u-9"));

    expect(caught).toBeInstanceOf(RemoteRepositoryError);
    expect((caught as RemoteRepositoryError).code).toBe(RemoteErrorCode.AUTH);
    expect(calls).toHaveLength(0);
  });
});
