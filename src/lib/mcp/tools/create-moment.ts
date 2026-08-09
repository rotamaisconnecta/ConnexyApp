import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_moment",
  title: "Create a moment",
  description:
    "Publish a new moment (bio post) as the signed-in Connexy user, optionally tied to a place.",
  inputSchema: {
    text: z.string().trim().describe("The moment text."),
    place_id: z.string().uuid().optional().describe("Optional place id to attach."),
    media_url: z.string().url().optional().describe("Optional image or video URL."),
    media_kind: z.enum(["image", "video"]).optional().describe("Kind of attached media."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ text, place_id, media_url, media_kind }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    if (!text) return { content: [{ type: "text", text: "Text is required." }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("bio_posts")
      .insert({
        author_id: ctx.getUserId()!,
        text,
        place_id: place_id ?? null,
        media_url: media_url ?? null,
        media_kind: media_kind ?? null,
      })
      .select()
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { moment: data },
    };
  },
});
