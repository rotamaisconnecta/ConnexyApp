/* =========================================================
   reel-local-storage.ts — Persistência local dos Reels (Fase 3A).
   Curtidas, comentários e preferência de som em localStorage.
   Chaves:
     - connexy:reels:likes:v1
     - connexy:reels:comments:v1
     - connexy:reels:sound:v1
   Nunca armazena vídeo/base64. Sempre faz parse seguro e
   tolera localStorage indisponível/cheio.
========================================================= */

import type { ReelComment } from "./reel-types";
import { currentUser } from "@/lib/mock-data";

const LIKES_KEY = "connexy:reels:likes:v1";
const COMMENTS_KEY = "connexy:reels:comments:v1";
const SOUND_KEY = "connexy:reels:sound:v1";

const MAX_COMMENT_LENGTH = 280;

function safeGet(key: string): string | null {
  try {
    return typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): boolean {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(key, value);
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

function parseRecord(value: string | null): Record<string, unknown> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

/* ─── Curtidas ──────────────────────────────────────────── */

type LikesMap = Record<string, boolean>;

export function getReelLikes(): LikesMap {
  const raw = safeGet(LIKES_KEY);
  const record = parseRecord(raw);
  const likes: LikesMap = {};
  for (const [key, value] of Object.entries(record)) {
    if (typeof value === "boolean") likes[key] = value;
  }
  return likes;
}

export function isReelLiked(reelId: string): boolean {
  return getReelLikes()[reelId] ?? false;
}

export function toggleReelLike(reelId: string): boolean {
  const likes = getReelLikes();
  const next = !(likes[reelId] ?? false);
  likes[reelId] = next;
  safeSet(LIKES_KEY, JSON.stringify(likes));
  return next;
}

/* ─── Comentários ───────────────────────────────────────── */

type CommentsMap = Record<string, ReelComment[]>;

export function getReelComments(): CommentsMap {
  const raw = safeGet(COMMENTS_KEY);
  const record = parseRecord(raw);
  const comments: CommentsMap = {};
  for (const [reelId, value] of Object.entries(record)) {
    if (Array.isArray(value)) {
      comments[reelId] = value.filter(
        (c): c is ReelComment =>
          !!c && typeof c === "object" && typeof c.id === "string" && typeof c.text === "string",
      );
    }
  }
  return comments;
}

export function getCommentsForReel(reelId: string): ReelComment[] {
  return getReelComments()[reelId] ?? [];
}

export function normalizeCommentText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function addReelComment(reelId: string, text: string): ReelComment | null {
  const clean = normalizeCommentText(text);
  if (!clean) return null;
  if (clean.length > MAX_COMMENT_LENGTH) return null;

  const comment: ReelComment = {
    id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    text: clean,
    authorId: currentUser.id,
    authorName: currentUser.name,
    authorPhoto: currentUser.photo,
    createdAt: new Date().toISOString(),
    likes: 0,
    likedByMe: false,
    replies: [],
  };

  const comments = getReelComments();
  const list = comments[reelId] ?? [];
  comments[reelId] = [...list, comment];
  safeSet(COMMENTS_KEY, JSON.stringify(comments));
  return comment;
}

export function toggleCommentLike(reelId: string, commentId: string): boolean {
  const comments = getReelComments();
  const list = comments[reelId] ?? [];
  const target = list.find((c) => c.id === commentId);
  if (!target) return false;

  const next = !target.likedByMe;
  comments[reelId] = list.map((c) =>
    c.id === commentId ? { ...c, likedByMe: next, likes: c.likes + (next ? 1 : -1) } : c,
  );
  safeSet(COMMENTS_KEY, JSON.stringify(comments));
  return next;
}

/* ─── Preferência de som ────────────────────────────────── */

export function getStoredSoundPref(): boolean {
  const raw = safeGet(SOUND_KEY);
  if (raw === "on") return false;
  if (raw === "off") return true;
  return true;
}

export function setStoredSoundPref(muted: boolean): void {
  safeSet(SOUND_KEY, muted ? "off" : "on");
}
