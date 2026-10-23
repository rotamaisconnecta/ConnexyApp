import { describe, expect, test } from "bun:test";
import { guardMcpProfilePatch } from "../src/lib/mcp/tools/update-my-profile";
import { ProfileUpdateError, ProfileUpdateErrorCode } from "../src/lib/profile/profile-update";

describe("MCP update_my_profile — Fase 3 guard", () => {
  test("blank name is rejected with a controlled error, never sent", () => {
    try {
      guardMcpProfilePatch({ name: "   " });
      throw new Error("expected guard rejection");
    } catch (error) {
      expect(error).toBeInstanceOf(ProfileUpdateError);
      expect((error as ProfileUpdateError).code).toBe(ProfileUpdateErrorCode.NAME_REQUIRED);
    }
  });

  test("blank handle is rejected with a controlled error, never sent", () => {
    try {
      guardMcpProfilePatch({ handle: "" });
      throw new Error("expected guard rejection");
    } catch (error) {
      expect(error).toBeInstanceOf(ProfileUpdateError);
      expect((error as ProfileUpdateError).code).toBe(ProfileUpdateErrorCode.HANDLE_REQUIRED);
    }
  });

  test("name is trimmed and handle is normalized to lowercase", () => {
    const patch = guardMcpProfilePatch({ name: "  Ana Souza  ", handle: "@Ana" });
    expect(patch.name).toBe("Ana Souza");
    expect(patch.handle).toBe("@ana");
  });

  test("undefined fields are omitted so partial updates preserve the rest", () => {
    const patch = guardMcpProfilePatch({
      name: "Ana",
      headline: undefined,
      bio: "nova bio",
    });
    expect(patch).toEqual({ name: "Ana", bio: "nova bio" });
    expect(Object.keys(patch).sort()).toEqual(["bio", "name"]);
  });

  test("non-required fields pass through unchanged", () => {
    const patch = guardMcpProfilePatch({
      headline: "oi",
      mood_emoji: "✨",
      mood_text: "modo",
      interests: ["Música", "Cinema"],
      vibe_tags: ["corujão"],
    });
    expect(patch.headline).toBe("oi");
    expect(patch.mood_emoji).toBe("✨");
    expect(patch.mood_text).toBe("modo");
    expect(patch.interests).toEqual(["Música", "Cinema"]);
    expect(patch.vibe_tags).toEqual(["corujão"]);
  });
});
