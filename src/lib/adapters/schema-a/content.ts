import type { DemoPost, DemoPostMedia } from "@/lib/demo/demo-posts";
import { PostPrivacy, type PostPrivacyValue } from "@/lib/types/post";
import type {
  StoredReel,
  StoredReelComment,
  StoredReelContextRef,
  StoredReelLike,
} from "@/lib/persistence/domain/reels-entities";
import { reelLikeId } from "@/lib/persistence/domain/reels-entities";
import type { Json } from "../../../../supabase/schema-a.generated.ts";
import type {
  PostPrivacy as RemotePostPrivacy,
  PostRow,
  ReelCommentRow,
  ReelLikeRow,
  ReelRow,
} from "@/integrations/supabase/remote/types";
import type { Database } from "../../../../supabase/schema-a.generated.ts";
import { AdapterMappingCode, AdapterMappingError } from "./errors";
import { epochMsToIso, isoToEpochMs, optionalSchemaAUuid, requireSchemaAUuid } from "./ids";

type PostInsert = Database["public"]["Tables"]["posts"]["Insert"];
type ReelInsert = Database["public"]["Tables"]["reels"]["Insert"];
type ReelLikeInsert = Database["public"]["Tables"]["reel_likes"]["Insert"];
type ReelCommentInsert = Database["public"]["Tables"]["reel_comments"]["Insert"];

export type AdaptedPostAuthor = {
  authorName: string;
  authorPhoto: string;
  authorHandle: string;
};

export type AdaptedPost = DemoPost;

export function toRemotePostPrivacy(privacy: string): {
  privacy: RemotePostPrivacy;
  collapsedFromFriends: boolean;
} {
  if (
    privacy === PostPrivacy.PUBLIC ||
    privacy === PostPrivacy.CONNECTIONS ||
    privacy === PostPrivacy.PRIVATE
  ) {
    return { privacy, collapsedFromFriends: false };
  }
  if (privacy === PostPrivacy.FRIENDS) {
    return { privacy: "CONNECTIONS", collapsedFromFriends: true };
  }
  throw new AdapterMappingError(
    `Post privacy ${privacy} is not in Schema A`,
    AdapterMappingCode.UNMAPPED_PRIVACY,
    "privacy",
  );
}

function mediaToJson(media: DemoPostMedia[]): Json {
  return media.map((item) => ({ preview: item.preview, type: item.type }));
}

function mediaFromJson(value: Json): DemoPostMedia[] {
  if (!Array.isArray(value)) return [];
  const media: DemoPostMedia[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const record = item as Record<string, unknown>;
    if (typeof record.preview !== "string") continue;
    if (record.type !== "image" && record.type !== "video") continue;
    media.push({ preview: record.preview, type: record.type });
  }
  return media;
}

export function toRemotePostInsert(post: DemoPost, authorId: string): PostInsert {
  const { privacy } = toRemotePostPrivacy(post.privacy);
  return {
    author_id: requireSchemaAUuid(authorId, "posts.author_id"),
    text: post.text || null,
    category: post.category,
    privacy,
    location_label: post.locationLabel,
    hashtags: post.hashtags,
    media: mediaToJson(post.media),
    created_at: epochMsToIso(post.createdAt),
  };
}

export function toDomainPost(row: PostRow, author: AdaptedPostAuthor): AdaptedPost {
  return {
    id: row.id,
    authorId: row.author_id,
    authorName: author.authorName,
    authorPhoto: author.authorPhoto,
    authorHandle: author.authorHandle,
    text: row.text ?? "",
    media: mediaFromJson(row.media),
    category: row.category,
    privacy: row.privacy as PostPrivacyValue,
    locationLabel: row.location_label,
    hashtags: row.hashtags,
    createdAt: isoToEpochMs(row.created_at),
  };
}

export function toRemoteReelInsert(
  reel: StoredReel,
  media: { videoUrl: string; posterUrl?: string | null },
  authorId: string,
): ReelInsert {
  if (!media.videoUrl.trim()) {
    throw new AdapterMappingError(
      "Reel media is stored outside Schema A metadata; videoUrl is required to insert",
      AdapterMappingCode.MISSING_MEDIA,
      "video_url",
    );
  }
  const context = reel.context;
  return {
    author_id: requireSchemaAUuid(authorId, "reels.author_id"),
    caption: reel.caption,
    category: reel.category,
    duration_s: reel.durationS,
    video_url: media.videoUrl,
    poster_url: media.posterUrl ?? null,
    created_at: reel.createdAt,
    context_type: context?.tipo ?? null,
    context_id: context?.id && optionalSchemaAUuid(context.id) ? context.id : null,
    context_title: context?.titulo ?? null,
    place_id: context?.tipo === "local" ? optionalSchemaAUuid(context.id) : null,
  };
}

export function toDomainReel(row: ReelRow, author: StoredReel["author"]): StoredReel {
  const context: StoredReelContextRef | null =
    row.context_type && row.context_id && row.context_title
      ? {
          tipo: row.context_type as StoredReelContextRef["tipo"],
          id: row.context_id,
          titulo: row.context_title,
        }
      : null;
  return {
    id: row.id,
    caption: row.caption,
    category: row.category as StoredReel["category"],
    author,
    context,
    durationS: row.duration_s,
    createdAt: row.created_at,
    persistence: "supabase",
  };
}

export function toRemoteReelLikeInsert(like: StoredReelLike): ReelLikeInsert {
  return {
    reel_id: requireSchemaAUuid(like.reelId, "reel_likes.reel_id"),
    user_id: requireSchemaAUuid(like.userId, "reel_likes.user_id"),
    created_at: like.createdAt,
  };
}

export function toDomainReelLike(row: ReelLikeRow): StoredReelLike {
  return {
    id: reelLikeId(row.reel_id, row.user_id),
    reelId: row.reel_id,
    userId: row.user_id,
    createdAt: row.created_at,
  };
}

export function toRemoteReelCommentInsert(comment: StoredReelComment): ReelCommentInsert {
  return {
    reel_id: requireSchemaAUuid(comment.reelId, "reel_comments.reel_id"),
    author_id: requireSchemaAUuid(comment.authorId, "reel_comments.author_id"),
    text: comment.text,
    parent_id: comment.parentId
      ? requireSchemaAUuid(comment.parentId, "reel_comments.parent_id")
      : null,
    sibling_order: comment.siblingOrder ?? null,
    created_at: comment.createdAt,
  };
}

export function toDomainReelComment(
  row: ReelCommentRow,
  author: Pick<StoredReelComment, "authorName" | "authorPhoto">,
): StoredReelComment {
  return {
    id: row.id,
    reelId: row.reel_id,
    parentId: row.parent_id,
    siblingOrder: row.sibling_order,
    text: row.text,
    authorId: row.author_id,
    authorName: author.authorName,
    authorPhoto: author.authorPhoto,
    createdAt: row.created_at,
    likes: 0,
    likedByMe: false,
  };
}
