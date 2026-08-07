/* =========================================================
   reel-feed.ts — Feed unificado de Reels (Fase 3B).
   Combina os reels publicados localmente (IndexedDB +
   metadata) com os mocks do ecossistema, sem ids duplicados
   e com os publicados recém-primeiro. Futuramente poderá
   também incluir reels vindos do Supabase.
========================================================= */

import type { Reel } from "./reel-types";
import { extractHashtags } from "./reel-utils";
import { MOCK_REELS, findReelById } from "./reel-mocks";
import {
  getStoredPublishedReels,
  isReelLiked,
  type StoredPublishedReel,
} from "./reel-local-storage";
import { getReelVideoUrl, getReelPosterUrl } from "./reel-local-media-db";

function hydrateContext(stored: StoredPublishedReel) {
  const context = stored.context;
  if (!context) return { location: null, business: null, event: null };
  for (const mock of MOCK_REELS) {
    if (context.tipo === "local" && mock.location?.id === context.id) {
      return { location: mock.location, business: null, event: null };
    }
    if (
      (context.tipo === "negocio" || context.tipo === "oferta") &&
      mock.business?.id === context.id
    ) {
      return { location: mock.location, business: mock.business, event: null };
    }
    if (context.tipo === "evento" && mock.event?.id === context.id) {
      return { location: mock.location, business: null, event: mock.event };
    }
  }
  return { location: null, business: null, event: null };
}

export function buildPublishedReel(
  stored: StoredPublishedReel,
  videoUrl: string,
  posterUrl: string | null,
): Reel {
  const entities = hydrateContext(stored);
  return {
    id: stored.id,
    videoUrl,
    posterUrl,
    caption: stored.caption,
    category: stored.category,
    author: stored.author,
    music: null,
    location: entities.location,
    business: entities.business,
    event: entities.event,
    driver: null,
    stats: {
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
      views: 0,
      duration: stored.durationS,
    },
    hashtags: extractHashtags(stored.caption),
    taggedUserIds: [],
    createdAt: stored.createdAt,
    likedByMe: false,
    savedByMe: false,
  };
}

export async function getPublishedReels(): Promise<Reel[]> {
  const stored = getStoredPublishedReels();
  const reels: Reel[] = [];
  for (const item of stored) {
    try {
      const videoUrl = await getReelVideoUrl(item.id);
      if (!videoUrl) continue;
      const posterUrl = await getReelPosterUrl(item.id);
      reels.push(buildPublishedReel(item, videoUrl, posterUrl));
    } catch {
      // mídia indisponível (ex.: IndexedDB bloqueado) — pula esse reel
    }
  }
  return reels;
}

export async function getReelFeed(): Promise<Reel[]> {
  const published = await getPublishedReels();
  const seen = new Set<string>();
  const combined: Reel[] = [];
  for (const reel of [...published, ...MOCK_REELS]) {
    if (seen.has(reel.id)) continue;
    seen.add(reel.id);
    combined.push(reel);
  }
  return combined;
}

export async function getReelById(reelId: string): Promise<Reel | null> {
  const mock = findReelById(reelId);
  if (mock) return { ...mock, likedByMe: isReelLiked(reelId) };
  const published = await getPublishedReels();
  const reel = published.find((r) => r.id === reelId);
  return reel ? { ...reel, likedByMe: isReelLiked(reelId) } : null;
}
