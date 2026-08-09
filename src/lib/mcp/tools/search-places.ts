import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "search_places",
  title: "Search places",
  description: "Search Connexy places by name or category (bars, cafés, venues and businesses).",
  inputSchema: {
    query: z.string().trim().optional().describe("Text matched against the place name."),
    category: z.string().trim().optional().describe("Exact category filter."),
    limit: z.number().int().optional().describe("How many places to return (default 20, max 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, category, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const take = Math.min(Math.max(limit ?? 20, 1), 50);
    const supabase = supabaseForUser(ctx);
    let builder = supabase
      .from("places")
      .select("id, name, category, description, lat, lng, slug, cover_url")
      .limit(take);
    if (query) builder = builder.ilike("name", `%${query}%`);
    if (category) builder = builder.eq("category", category);
    const { data, error } = await builder;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { places: data ?? [] },
    };
  },
});
