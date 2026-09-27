/* =========================================================
   persisted-reels-reader.ts — Facade local dos Reels.

   Lê e grava exclusivamente nos repositories canônicos já
   existentes. Não executa migração, não consulta localStorage,
   MOCK_REELS, Supabase ou o banco de mídia.
   ========================================================= */

import { reelsPersistenceSchema } from "@/lib/persistence/domain/reels-schema";
import type {
  StoredReel,
  StoredReelAuthor,
  StoredReelComment,
} from "@/lib/persistence/domain/reels-entities";
import { IndexedDbAdapter } from "@/lib/persistence/local/indexed-db";
import type { ReelComment } from "./reel-types";
import { MAX_REEL_COMMENT_LENGTH, normalizeCommentText } from "./reel-local-storage";
import { ReelRepository } from "@/repositories/reel.repository";
import { ReelLikeRepository } from "@/repositories/reel-like.repository";
import { ReelCommentRepository } from "@/repositories/reel-comment.repository";

interface ReelsRepositories {
  reels: ReelRepository;
  likes: ReelLikeRepository;
  comments: ReelCommentRepository;
}

async function withRepositories<T>(operation: (repositories: ReelsRepositories) => Promise<T>) {
  const adapter = new IndexedDbAdapter(reelsPersistenceSchema);
  try {
    return await operation({
      reels: new ReelRepository(adapter),
      likes: new ReelLikeRepository(adapter),
      comments: new ReelCommentRepository(adapter),
    });
  } finally {
    await adapter.close();
  }
}

/** Lê somente Reels canônicos persistidos, em ordem de criação. */
export async function getPersistedReels(): Promise<StoredReel[]> {
  return withRepositories(({ reels }) => reels.listOrderedByRecent());
}

export async function getPersistedReel(reelId: string): Promise<StoredReel | null> {
  return withRepositories(({ reels }) => reels.get(reelId));
}

export async function savePersistedReel(reel: StoredReel): Promise<StoredReel> {
  return withRepositories(({ reels }) => reels.put(reel));
}

export interface PersistedReelInteractionState {
  likedByMe: boolean;
  likeCount: number;
  commentCount: number;
}

export async function getPersistedReelInteractionState(
  reelId: string,
  userId: string,
): Promise<PersistedReelInteractionState> {
  return withRepositories(async ({ likes, comments }) => {
    const [likedByMe, likeCount, commentCount] = await Promise.all([
      likes.isLiked(reelId, userId),
      likes.countByReel(reelId),
      comments.countByReel(reelId),
    ]);
    return { likedByMe, likeCount, commentCount };
  });
}

export async function togglePersistedReelLike(
  reelId: string,
  userId: string,
): Promise<{ likedByMe: boolean; likeCount: number }> {
  return withRepositories(async ({ likes }) => {
    const likedByMe = await likes.isLiked(reelId, userId);
    if (likedByMe) await likes.removeLike(reelId, userId);
    else await likes.addLike(reelId, userId);
    return {
      likedByMe: !likedByMe,
      likeCount: await likes.countByReel(reelId),
    };
  });
}

function toReelComment(comment: StoredReelComment, replies: ReelComment[]): ReelComment {
  return {
    id: comment.id,
    text: comment.text,
    authorId: comment.authorId,
    authorName: comment.authorName,
    authorPhoto: comment.authorPhoto,
    createdAt: comment.createdAt,
    likes: comment.likes,
    likedByMe: comment.likedByMe,
    replies,
  };
}

async function buildCommentBranch(
  repository: ReelCommentRepository,
  reelId: string,
  parentId: string | null,
): Promise<ReelComment[]> {
  const children = await repository.listByParent(reelId, parentId);
  return Promise.all(
    children.map(async (comment) =>
      toReelComment(comment, await buildCommentBranch(repository, reelId, comment.id)),
    ),
  );
}

export async function getPersistedReelComments(reelId: string): Promise<ReelComment[]> {
  return withRepositories(({ comments }) => buildCommentBranch(comments, reelId, null));
}

export interface AddPersistedReelCommentInput {
  reelId: string;
  parentId?: string | null;
  text: string;
  author: Pick<StoredReelAuthor, "id" | "name" | "photoUrl">;
  id?: string;
  createdAt?: string;
}

export async function addPersistedReelComment(
  input: AddPersistedReelCommentInput,
): Promise<StoredReelComment | null> {
  const text = normalizeCommentText(input.text);
  if (!text || text.length > MAX_REEL_COMMENT_LENGTH) return null;

  return withRepositories(async ({ comments }) => {
    if (input.id) {
      const existing = await comments.get(input.id);
      if (existing) return existing;
    }
    const parentId = input.parentId ?? null;
    const siblings = await comments.listByParent(input.reelId, parentId);
    const siblingOrder =
      siblings.reduce(
        (highest, comment) =>
          typeof comment.siblingOrder === "number"
            ? Math.max(highest, comment.siblingOrder)
            : highest,
        -1,
      ) + 1;
    return comments.put({
      id: input.id ?? `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      reelId: input.reelId,
      parentId,
      siblingOrder,
      text,
      authorId: input.author.id,
      authorName: input.author.name,
      authorPhoto: input.author.photoUrl,
      createdAt: input.createdAt ?? new Date().toISOString(),
      likes: 0,
      likedByMe: false,
    });
  });
}

export async function togglePersistedCommentLike(
  reelId: string,
  commentId: string,
): Promise<StoredReelComment> {
  return withRepositories(async ({ comments }) => {
    const comment = await comments.get(commentId);
    if (!comment || comment.reelId !== reelId) {
      throw new Error(`Comentário "${commentId}" não pertence ao Reel "${reelId}".`);
    }
    return comments.update(commentId, {
      likedByMe: !comment.likedByMe,
      likes: Math.max(0, comment.likes + (comment.likedByMe ? -1 : 1)),
    });
  });
}
