import { describe, expect, test } from "bun:test";
import { RemoteContentRepository } from "../src/integrations/supabase/remote/content.repository";
import { RemoteErrorCode, RemoteRepositoryError } from "../src/integrations/supabase/remote/errors";

const UID = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const POST_ID = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";

type FakeResult = {
  data: unknown;
  error: { message?: string; code?: string; details?: unknown; status?: number } | null;
  status?: number;
};

type QueryContext = {
  op: string | null;
  lastUpdate: unknown;
  calls: string[];
};

function fakeSupabase(onQuery: (ctx: QueryContext) => Promise<FakeResult>) {
  const state: QueryContext = { op: null, lastUpdate: undefined, calls: [] };
  const builder = {
    insert(data: unknown) {
      state.op = "insert";
      state.lastUpdate = data;
      state.calls.push("insert");
      return builder;
    },
    update(data: unknown) {
      state.op = "update";
      state.lastUpdate = data;
      state.calls.push("update");
      return builder;
    },
    delete() {
      state.op = "delete";
      state.calls.push("delete");
      return builder;
    },
    select(_cols?: unknown) {
      state.calls.push("select");
      if (state.op === "delete") {
        const op = state.op;
        state.op = null;
        return onQuery({ ...state, op });
      }
      return builder;
    },
    eq(col: string, _value: unknown) {
      state.calls.push(`eq:${col}`);
      return builder;
    },
    order() {
      return builder;
    },
    limit() {
      return builder;
    },
    async single() {
      return onQuery({ ...state });
    },
    async maybeSingle() {
      return onQuery({ ...state });
    },
  };
  return builder;
}

function client(onQuery: (ctx: QueryContext) => Promise<FakeResult>): {
  supabase: {
    auth: { getUser: () => Promise<{ data: { user: { id: string } }; error: null }> };
    from: () => ReturnType<typeof fakeSupabase>;
  };
  captured: QueryContext;
} {
  const captured: QueryContext = { op: null, lastUpdate: undefined, calls: [] };
  const supabase = {
    auth: {
      getUser: async () => ({ data: { user: { id: UID } }, error: null }),
    },
    from() {
      return fakeSupabase(async (ctx) => {
        Object.assign(captured, ctx);
        return onQuery(ctx);
      });
    },
  };
  return { supabase, captured };
}

const ORIGINAL = {
  id: POST_ID,
  author_id: UID,
  text: "olá",
  category: "MOMENT",
  privacy: "PUBLIC",
  location_label: null,
  hashtags: [],
  media: [],
  created_at: "2026-09-25T00:00:00.000Z",
};

describe("1H-20 RemoteContentRepository — updatePost/deletePost", () => {
  test("authorized update returns the merged row and only sends provided fields", async () => {
    const { supabase, captured } = client(async (ctx) => {
      if (ctx.op === "update") {
        return { data: { ...ORIGINAL, ...(ctx.lastUpdate as object) }, error: null };
      }
      return { data: null, error: null };
    });
    const repo = new RemoteContentRepository(supabase);
    const updated = await repo.updatePost(POST_ID, { text: "novo", privacy: "CONNECTIONS" });

    expect(updated.text).toBe("novo");
    expect(updated.privacy).toBe("CONNECTIONS");
    expect(updated.hashtags).toEqual([]);
    expect(updated.category).toBe("MOMENT");
    expect(captured.lastUpdate).toEqual({ text: "novo", privacy: "CONNECTIONS" });
  });

  test("update patch preserves fields not included (no media, hashtags or label sent)", async () => {
    const { supabase, captured } = client(async (ctx) => {
      if (ctx.op === "update") {
        return { data: { ...ORIGINAL, ...(ctx.lastUpdate as object) }, error: null };
      }
      return { data: null, error: null };
    });
    const repo = new RemoteContentRepository(supabase);
    await repo.updatePost(POST_ID, { media: [] });

    const patch = captured.lastUpdate as Record<string, unknown>;
    expect(Object.keys(patch)).toEqual(["media"]);
    expect(patch).not.toHaveProperty("text");
    expect(patch).not.toHaveProperty("privacy");
  });

  test("empty patch is rejected before any remote call", async () => {
    let queried = false;
    const { supabase } = client(async (ctx) => {
      queried = true;
      return { data: null, error: null };
    });
    const repo = new RemoteContentRepository(supabase);
    try {
      await repo.updatePost(POST_ID, {});
      throw new Error("expected validation");
    } catch (error) {
      expect(error).toBeInstanceOf(RemoteRepositoryError);
      expect((error as RemoteRepositoryError).code).toBe(RemoteErrorCode.VALIDATION);
    }
    expect(queried).toBe(false);
  });

  test("invalid privacy is rejected without a write", async () => {
    let queried = false;
    const { supabase } = client(async (ctx) => {
      queried = true;
      return { data: null, error: null };
    });
    const repo = new RemoteContentRepository(supabase);
    try {
      await repo.updatePost(POST_ID, { privacy: "NOT_A_VALUE" as never });
      throw new Error("expected validation");
    } catch (error) {
      expect((error as RemoteRepositoryError).code).toBe(RemoteErrorCode.VALIDATION);
    }
    expect(queried).toBe(false);
  });

  test("update does not bypass author RLS by sending author_id", async () => {
    const { supabase, captured } = client(async (ctx) => {
      if (ctx.op === "update") {
        return { data: { ...ORIGINAL, ...(ctx.lastUpdate as object) }, error: null };
      }
      return { data: null, error: null };
    });
    const repo = new RemoteContentRepository(supabase);
    await repo.updatePost(POST_ID, { text: "x" });
    expect(captured.calls).toContain("eq:id");
    expect(captured.calls).not.toContain("eq:author_id");
  });

  test("missing or unauthorized post update surfaces NOT_FOUND, not success", async () => {
    const { supabase } = client(async () => ({
      data: null,
      error: {
        message: "JSON object requested, multiple (or no) rows",
        code: "PGRST116",
      },
    }));
    const repo = new RemoteContentRepository(supabase);
    try {
      await repo.updatePost(POST_ID, { text: "x" });
      throw new Error("expected not found");
    } catch (error) {
      expect(error).toBeInstanceOf(RemoteRepositoryError);
      expect((error as RemoteRepositoryError).code).toBe(RemoteErrorCode.NOT_FOUND);
    }
  });

  test("RLS errors on update are mapped, never masked", async () => {
    const { supabase } = client(async () => ({
      data: null,
      error: { message: "new row violates row-level security policy", code: "42501" },
      status: 403,
    }));
    const repo = new RemoteContentRepository(supabase);
    try {
      await repo.updatePost(POST_ID, { text: "x" });
      throw new Error("expected RLS error");
    } catch (error) {
      expect((error as RemoteRepositoryError).code).toBe(RemoteErrorCode.RLS);
    }
  });

  test("authorized delete resolves and does not send author_id", async () => {
    const { supabase, captured } = client(async (ctx) => {
      if (ctx.op === "delete") return { data: [{ id: POST_ID }], error: null };
      return { data: null, error: null };
    });
    const repo = new RemoteContentRepository(supabase);
    await expect(repo.deletePost(POST_ID)).resolves.toBeUndefined();
    expect(captured.calls).toContain("eq:id");
    expect(captured.calls).not.toContain("eq:author_id");
  });

  test("delete with no deleted row reports NOT_FOUND instead of success", async () => {
    const { supabase } = client(async (ctx) => {
      if (ctx.op === "delete") return { data: [], error: null };
      return { data: null, error: null };
    });
    const repo = new RemoteContentRepository(supabase);
    try {
      await repo.deletePost(POST_ID);
      throw new Error("expected not found");
    } catch (error) {
      expect(error).toBeInstanceOf(RemoteRepositoryError);
      expect((error as RemoteRepositoryError).code).toBe(RemoteErrorCode.NOT_FOUND);
    }
  });

  test("RLS errors on delete are mapped, never masked", async () => {
    const { supabase } = client(async (ctx) => {
      if (ctx.op === "delete") {
        return {
          data: null,
          error: { message: "permission denied for table posts", code: "42501" },
          status: 403,
        };
      }
      return { data: null, error: null };
    });
    const repo = new RemoteContentRepository(supabase);
    try {
      await repo.deletePost(POST_ID);
      throw new Error("expected RLS error");
    } catch (error) {
      expect((error as RemoteRepositoryError).code).toBe(RemoteErrorCode.RLS);
    }
  });

  test("unauthenticated delete is rejected before reaching the table", async () => {
    const supabase = {
      auth: { getUser: async () => ({ data: { user: null }, error: { message: "not authed" } }) },
      from() {
        throw new Error("from must not be reached");
      },
    };
    const repo = new RemoteContentRepository(supabase);
    try {
      await repo.deletePost(POST_ID);
      throw new Error("expected auth error");
    } catch (error) {
      expect(error).toBeInstanceOf(RemoteRepositoryError);
      expect((error as RemoteRepositoryError).code).toBe(RemoteErrorCode.AUTH);
    }
  });
});
