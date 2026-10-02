import { demoStorageKey } from "./demo-config";
import { getDemoIdentity } from "./demo-identity";

export type DemoPostComment = {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  text: string;
  createdAt: number;
};

const COMMENTS_KEY = demoStorageKey("post-comments");
const COMMENTS_EVENT = "connexy:demo:post-comments";

function read(): DemoPostComment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(COMMENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DemoPostComment[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(comments: DemoPostComment[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));
  window.dispatchEvent(new CustomEvent(COMMENTS_EVENT));
}

export function listDemoPostComments(postId: string): DemoPostComment[] {
  return read()
    .filter((comment) => comment.postId === postId)
    .sort((a, b) => a.createdAt - b.createdAt);
}

export function addDemoPostComment(
  postId: string,
  text: string,
  author?: { id: string; name: string; photo: string },
): DemoPostComment | null {
  const trimmed = text.trim();
  if (!trimmed || typeof window === "undefined") return null;
  const identity = author ?? getDemoIdentity();
  const comment: DemoPostComment = {
    id: `demo-comment-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    postId,
    authorId: identity.id,
    authorName: identity.name,
    authorPhoto: identity.photo,
    text: trimmed,
    createdAt: Date.now(),
  };
  write([...read(), comment]);
  return comment;
}

export function resetDemoPostComments(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(COMMENTS_KEY);
  window.dispatchEvent(new CustomEvent(COMMENTS_EVENT));
}

export function subscribeDemoPostComments(listener: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(COMMENTS_EVENT, listener);
  return () => window.removeEventListener(COMMENTS_EVENT, listener);
}
