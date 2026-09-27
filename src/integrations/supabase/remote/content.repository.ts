import { requireAuthUserId, type SchemaAClient } from "./client";
import { RemoteErrorCode, RemoteRepositoryError, throwIfPostgrestError } from "./errors";
import { runRemote, unwrapList, unwrapMaybe, unwrapRow } from "./result";
import type { PostPrivacy, PostRow, ReelCommentRow, ReelLikeRow, ReelRow } from "./types";
import type { SchemaAJson as Json } from "../schema-a-database";

const POST_PRIVACY: readonly PostPrivacy[] = ["PUBLIC", "CONNECTIONS", "PRIVATE"];

export class RemoteContentRepository {
  constructor(private readonly client: SchemaAClient) {}

  async createPost(input: {
    text?: string | null;
    privacy: PostPrivacy;
    category?: string | null;
    location_label?: string | null;
    hashtags?: string[];
    media?: Json;
  }): Promise<PostRow> {
    return runRemote(async () => {
      const uid = await requireAuthUserId(this.client);
      if (!POST_PRIVACY.includes(input.privacy)) {
        throw new RemoteRepositoryError("Invalid post privacy", RemoteErrorCode.VALIDATION);
      }
      return unwrapRow(
        await this.client
          .from("posts")
          .insert({
            author_id: uid,
            text: input.text ?? null,
            privacy: input.privacy,
            category: input.category ?? null,
            location_label: input.location_label ?? null,
            hashtags: input.hashtags ?? [],
            media: input.media ?? [],
          })
          .select("*")
          .single(),
        "Post was not created",
      );
    });
  }

  async getPost(id: string): Promise<PostRow | null> {
    return runRemote(async () => {
      await requireAuthUserId(this.client);
      return unwrapMaybe(await this.client.from("posts").select("*").eq("id", id).maybeSingle());
    });
  }

  async listOwnPosts(): Promise<PostRow[]> {
    return runRemote(async () => {
      const uid = await requireAuthUserId(this.client);
      return unwrapList(
        await this.client
          .from("posts")
          .select("*")
          .eq("author_id", uid)
          .order("created_at", { ascending: false }),
      );
    });
  }

  async createReel(input: {
    video_url: string;
    caption?: string;
    category?: string;
    duration_s?: number;
    poster_url?: string | null;
    place_id?: string | null;
  }): Promise<ReelRow> {
    return runRemote(async () => {
      const uid = await requireAuthUserId(this.client);
      if (!input.video_url.trim()) {
        throw new RemoteRepositoryError("Reel video_url is required", RemoteErrorCode.VALIDATION);
      }
      return unwrapRow(
        await this.client
          .from("reels")
          .insert({
            author_id: uid,
            video_url: input.video_url,
            caption: input.caption ?? "",
            category: input.category ?? "geral",
            duration_s: input.duration_s ?? 0,
            poster_url: input.poster_url ?? null,
            place_id: input.place_id ?? null,
          })
          .select("*")
          .single(),
        "Reel was not created",
      );
    });
  }

  async getReel(id: string): Promise<ReelRow | null> {
    return runRemote(async () => {
      await requireAuthUserId(this.client);
      return unwrapMaybe(await this.client.from("reels").select("*").eq("id", id).maybeSingle());
    });
  }

  async likeReel(reelId: string): Promise<ReelLikeRow> {
    return runRemote(async () => {
      const uid = await requireAuthUserId(this.client);
      const existing = unwrapMaybe(
        await this.client
          .from("reel_likes")
          .select("*")
          .eq("reel_id", reelId)
          .eq("user_id", uid)
          .maybeSingle(),
      );
      if (existing) return existing;
      return unwrapRow(
        await this.client
          .from("reel_likes")
          .insert({ reel_id: reelId, user_id: uid })
          .select("*")
          .single(),
        "Like was not created",
      );
    });
  }

  async unlikeReel(reelId: string): Promise<void> {
    return runRemote(async () => {
      const uid = await requireAuthUserId(this.client);
      const result = await this.client
        .from("reel_likes")
        .delete()
        .eq("reel_id", reelId)
        .eq("user_id", uid);
      throwIfPostgrestError(result.error);
    });
  }

  async commentReel(input: {
    reelId: string;
    text: string;
    parentId?: string | null;
  }): Promise<ReelCommentRow> {
    return runRemote(async () => {
      const uid = await requireAuthUserId(this.client);
      if (!input.text.trim()) {
        throw new RemoteRepositoryError("Comment text is required", RemoteErrorCode.VALIDATION);
      }
      return unwrapRow(
        await this.client
          .from("reel_comments")
          .insert({
            reel_id: input.reelId,
            author_id: uid,
            text: input.text,
            parent_id: input.parentId ?? null,
          })
          .select("*")
          .single(),
        "Comment was not created",
      );
    });
  }

  async listComments(reelId: string): Promise<ReelCommentRow[]> {
    return runRemote(async () => {
      await requireAuthUserId(this.client);
      return unwrapList(
        await this.client
          .from("reel_comments")
          .select("*")
          .eq("reel_id", reelId)
          .order("created_at", { ascending: true }),
      );
    });
  }
}
