import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { notAuthenticated, supabaseForUser } from "../supabase";

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
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("profiles")
      .update(patch)
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
