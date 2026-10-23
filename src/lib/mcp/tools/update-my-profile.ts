import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { notAuthenticated, supabaseForUser } from "../supabase";
import { buildProfileUpdatePatch, type ProfileUpdatePatch } from "@/lib/profile/profile-update";

/**
 * Fase 3 guard reused by the MCP surface.
 *
 * Protects the mandatory profile fields: `name` and `handle` can never be
 * written as `null`, empty or whitespace-only, and `handle` is lowercased. It
 * introduces no UI modules and no circular dependencies.
 *
 * Contract note (Fase 7): `handle` is intentionally NOT part of this tool's
 * public `inputSchema`, and the MCP SDK strips unknown keys before the handler
 * runs. The `handle` branch is therefore unreachable through
 * `update_my_profile` today; it stays because the shared guard is generic and
 * protects other callers. If `handle` is ever exposed here, its normalization
 * MUST be aligned with the app's canonical rule
 * (`applyDemoOnboardingProfile`: drop a leading `@` and whitespace, then
 * lowercase) and covered by tests. Do not add it to the schema without that.
 */
export function guardMcpProfilePatch(patch: Record<string, unknown>): ProfileUpdatePatch {
  return buildProfileUpdatePatch(patch as unknown as ProfileUpdatePatch);
}

export default defineTool({
  name: "update_my_profile",
  title: "Update my profile",
  description:
    "Update fields on the signed-in Connexy user's profile. Only the provided fields change.",
  inputSchema: {
    name: z.string().trim().optional().describe("Display name."),
    headline: z.string().trim().optional().describe("Short headline shown on the Vibe Card."),
    bio: z.string().trim().optional().describe("Personal description."),
    mood_emoji: z.string().trim().optional().describe("Mood of the day emoji."),
    mood_text: z.string().trim().optional().describe("Mood of the day text."),
    interests: z.array(z.string()).optional().describe("List of interests."),
    vibe_tags: z.array(z.string()).optional().describe("List of vibe tags."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const patch = Object.fromEntries(
      Object.entries(input).filter(([, value]) => value !== undefined),
    );
    if (Object.keys(patch).length === 0) {
      return { content: [{ type: "text", text: "No fields to update." }], isError: true };
    }
    let guarded: ProfileUpdatePatch;
    try {
      guarded = guardMcpProfilePatch(patch);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Valores de perfil inválidos.";
      return { content: [{ type: "text", text: message }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("profiles")
      .update(guarded)
      .eq("id", ctx.getUserId()!)
      .select()
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { profile: data },
    };
  },
});
