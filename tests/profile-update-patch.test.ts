import { describe, expect, test } from "bun:test";
import {
  buildProfileUpdatePatch,
  ProfileUpdateError,
  ProfileUpdateErrorCode,
  runProfileUpdate,
  type ProfileUpdateExecution,
  type ProfileUpdatePatch,
} from "../src/lib/profile/profile-update";
import { SupabaseError } from "../src/lib/supabase/errors";
import type { ProfileRow } from "../src/types/database/tables";

const NOW = "2026-10-09T00:00:00.000Z";

function seedProfile(overrides: Partial<ProfileRow> = {}): ProfileRow {
  return {
    id: "user-1",
    name: "Ana",
    handle: "ana",
    photo_url: null,
    cover_url: null,
    city: null,
    bio: "Bio antiga",
    interests: ["Cafes"],
    age: 30,
    locale: null,
    visibility: {},
    headline: null,
    looks_for: [],
    mood_emoji: null,
    mood_text: null,
    now_playing_kind: null,
    now_playing_subtitle: null,
    now_playing_title: null,
    vibe_tags: [],
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

function capturingExecutor(row: ProfileRow = seedProfile()) {
  const payloads: (ProfileUpdatePatch & { updated_at: string })[] = [];
  const executor = async (payload: ProfileUpdatePatch & { updated_at: string }) => {
    payloads.push(payload);
    return { data: { ...row, ...payload }, error: null } satisfies ProfileUpdateExecution;
  };
  return { executor, payloads };
}

describe("profile update payload contract", () => {
  test("bio-only update never sends name/handle and preserves them", async () => {
    const { executor, payloads } = capturingExecutor();

    const updated = await runProfileUpdate({ bio: "Bio nova" }, executor);

    expect(payloads).toHaveLength(1);
    expect(payloads[0].bio).toBe("Bio nova");
    expect("name" in payloads[0]).toBe(false);
    expect("handle" in payloads[0]).toBe(false);
    expect(typeof payloads[0].updated_at).toBe("string");
    expect(updated.bio).toBe("Bio nova");
    expect(updated.name).toBe("Ana");
    expect(updated.handle).toBe("ana");
  });

  test("undefined required fields are omitted instead of overwritten", () => {
    expect(buildProfileUpdatePatch({ name: undefined, handle: undefined, bio: "x" })).toEqual({
      bio: "x",
    });
    expect(buildProfileUpdatePatch({})).toEqual({});
  });

  test("nullable fields still accept explicit null", () => {
    expect(
      buildProfileUpdatePatch({ headline: null, bio: null, age: null, photo_url: null }),
    ).toEqual({ headline: null, bio: null, age: null, photo_url: null });
  });

  test("name is trimmed and handle is trimmed + lowercased", () => {
    expect(buildProfileUpdatePatch({ name: "  Ana Clara  ", handle: "  AnaClara " })).toEqual({
      name: "Ana Clara",
      handle: "anaclara",
    });
  });

  test("blank name triggers a controlled error before persistence", async () => {
    const { executor, payloads } = capturingExecutor();
    let caught: unknown;

    try {
      await runProfileUpdate({ name: "   " }, executor);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(ProfileUpdateError);
    expect((caught as ProfileUpdateError).code).toBe(ProfileUpdateErrorCode.NAME_REQUIRED);
    expect(payloads).toHaveLength(0);
  });
});

describe("required field recovery", () => {
  test("null name is rejected with NAME_REQUIRED and no query runs", async () => {
    const { executor, payloads } = capturingExecutor();
    let caught: unknown;

    try {
      await runProfileUpdate({ name: null }, executor);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(ProfileUpdateError);
    expect((caught as ProfileUpdateError).code).toBe(ProfileUpdateErrorCode.NAME_REQUIRED);
    expect(payloads).toHaveLength(0);
  });

  test("blank handle is rejected with HANDLE_REQUIRED", async () => {
    let caught: unknown;
    try {
      await runProfileUpdate({ handle: "   " }, async () => {
        throw new Error("executor must not run");
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(ProfileUpdateError);
    expect((caught as ProfileUpdateError).code).toBe(ProfileUpdateErrorCode.HANDLE_REQUIRED);
  });
});

describe("persistence error handling and return shape", () => {
  test("repository error is propagated as a SupabaseError", async () => {
    let caught: unknown;
    try {
      await runProfileUpdate({ bio: "x" }, async () => ({
        data: null,
        error: { message: "duplicate key value violates unique constraint", code: "23505" },
      }));
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(SupabaseError);
    expect((caught as SupabaseError).message).toContain("duplicate key");
    expect((caught as SupabaseError).code).toBe("23505");
  });

  test("missing updated row raises a controlled error", async () => {
    let caught: unknown;
    try {
      await runProfileUpdate({ bio: "x" }, async () => ({ data: null, error: null }));
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(SupabaseError);
  });

  test("resolved row is returned unchanged for current consumers", async () => {
    const row = seedProfile({ name: "Bia", handle: "bia" });
    const updated = await runProfileUpdate({ bio: "z" }, async () => ({ data: row, error: null }));

    expect(updated).toBe(row);
    expect(updated.name).toBe("Bia");
    expect(updated.handle).toBe("bia");
  });
});
