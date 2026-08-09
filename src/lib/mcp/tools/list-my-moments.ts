import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_my_moments",
  title: "List my moments",
  description: "List the signed-in Connexy user's published moments (bio posts), newest first.",
  inputSchema: {
    limit: z.number().int().optional().describe("How many moments to return (default 20, max 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const take = Math.min(Math.max(limit ?? 20, 1), 50);
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("bio_posts")
      .select("id, text, media_kind, media_url, place_id, created_at")
      .eq("author_id", ctx.getUserId()!)
      .order("created_at", { ascending: false })
      .limit(take);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { moments: data ?? [] },
    };
  },
});
