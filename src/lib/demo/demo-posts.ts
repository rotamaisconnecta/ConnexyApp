import { useEffect, useState } from "react";
import { demoStorageKey } from "./demo-config";

/*
 * Local demo store for posts published through the "Nova publicação" flow.
 *
 * Persisted to localStorage under `connexy:demo:posts`, in the same namespace
 * used by the other demo stores (own profile, db). Media is stored as data
 * URLs so the content survives reloads with the capabilities of the local
 * storage available; when the storage cannot hold the media, saveDemoPost
 * throws so the caller can show an error and keep the form on screen.
 */

export interface DemoPostMedia {
  preview: string;
  type: "image" | "video";
}

export interface DemoPost {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  authorHandle: string;
  text: string;
  media: DemoPostMedia[];
  category: string | null;
  privacy: string;
  locationLabel: string | null;
  hashtags: string[];
  createdAt: number;
}

const POSTS_KEY = demoStorageKey("posts");
const POSTS_EVENT = "connexy:demo:posts";

function read(): DemoPost[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(POSTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DemoPost[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getDemoPosts(): DemoPost[] {
  return read().sort((a, b) => b.createdAt - a.createdAt);
}

/** Persists a demo post. Throws when localStorage cannot store the media. */
export function saveDemoPost(post: DemoPost): void {
  if (typeof window === "undefined") return;
  const next = [post, ...read()];
  window.localStorage.setItem(POSTS_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(POSTS_EVENT));
}

export function useDemoPosts(): DemoPost[] {
  const [posts, setPosts] = useState<DemoPost[]>(getDemoPosts);
  useEffect(() => {
    const refresh = () => setPosts(getDemoPosts());
    window.addEventListener(POSTS_EVENT, refresh);
    refresh();
    return () => window.removeEventListener(POSTS_EVENT, refresh);
  }, []);
  return posts;
}
