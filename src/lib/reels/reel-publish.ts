/* =========================================================
   reel-publish.ts — Adapter de publicação de Reels (Fase 3B).
   Desacoplado da UI. Fluxo:
     1) Persiste mídia localmente (IndexedDB) + metadata
        (localStorage) — garante exibição no feed unificado.
     2) Se o Supabase estiver configurado, tenta publicar de
        verdade (storage "reels-media" + insert em "reels").
        Se qualquer passo remoto falhar, cai para o modo
        local — nunca finge um upload que não aconteceu.
   Retorno: { reel, persistence: "supabase" | "local" }.
========================================================= */

import type { Reel, ReelAuthor, ReelCategoryValue } from "./reel-types";
import { ReelCategory } from "./reel-types";
import { currentUser } from "@/lib/mock-data";
import { supabase } from "@/lib/supabase/client";
import { saveReelMedia, getReelVideoUrl, getReelPosterUrl } from "./reel-local-media-db";
import {
  saveStoredPublishedReel,
  type ReelContextRef,
  type ReelPersistence,
} from "./reel-local-storage";
import { buildPublishedReel } from "./reel-feed";
import {
  REEL_ALLOWED_EXTENSIONS,
  REEL_ALLOWED_MIME_TYPES,
  REEL_MAX_DURATION_SECONDS,
  REEL_MAX_FILE_SIZE,
} from "./reel-limits";

export type { ReelPersistence } from "./reel-local-storage";

export interface ReelPublishInput {
  file: File;
  caption: string;
  context: ReelContextRef | null;
  posterBlob: Blob | null;
  durationS: number;
}

export interface ReelPublishResult {
  reel: Reel;
  persistence: ReelPersistence;
}

export type ReelValidationError = "empty" | "type" | "size" | "duration";

export function validateReelVideo(
  file: File | null,
  durationS: number,
): ReelValidationError | null {
  if (!file) return "empty";
  if (!REEL_ALLOWED_MIME_TYPES.includes(file.type)) {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!REEL_ALLOWED_EXTENSIONS.includes(ext)) return "type";
  }
  if (file.size > REEL_MAX_FILE_SIZE) return "size";
  if (!durationS || durationS > REEL_MAX_DURATION_SECONDS) return "duration";
  return null;
}

function categoryForContext(context: ReelContextRef | null): ReelCategoryValue {
  switch (context?.tipo) {
    case "local":
      return ReelCategory.PLACE;
    case "negocio":
      return ReelCategory.BUSINESS;
    case "oferta":
      return ReelCategory.OFFER;
    case "evento":
      return ReelCategory.EVENT;
    default:
      return ReelCategory.MOMENT;
  }
}

export function buildReelAuthorFromCurrentUser(): ReelAuthor {
  return {
    id: currentUser.id,
    name: currentUser.name,
    handle: currentUser.handle,
    photoUrl: currentUser.photo,
    verified: false,
    profession: null,
    isFollowing: false,
  };
}

function generateReelId(): string {
  return `reel-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  return Boolean(url && key);
}

async function publishToSupabase(input: ReelPublishInput, reelId: string): Promise<void> {
  const { data: sessionData } = await supabase.auth.getUser();
  const user = sessionData.user;
  if (!user) throw new Error("Usuário não autenticado");

  const ext = input.file.name.split(".").pop() ?? "mp4";
  const vidPath = `${user.id}/${reelId}.${ext}`;
  const vRes = await supabase.storage.from("reels-media").upload(vidPath, input.file, {
    contentType: input.file.type || "video/mp4",
  });
  if (vRes.error) throw vRes.error;

  let posterPath: string | null = null;
  if (input.posterBlob) {
    const pPath = `${user.id}/${reelId}-poster.jpg`;
    const pRes = await supabase.storage
      .from("reels-media")
      .upload(pPath, input.posterBlob, { contentType: "image/jpeg" });
    if (!pRes.error) posterPath = pPath;
  }

  const { error: iErr } = await supabase.from("reels").insert({
    author_id: user.id,
    video_url: vidPath,
    poster_url: posterPath,
    caption: input.caption.trim() || null,
    place_id: null,
    audio_label: null,
    tagged_user_ids: [],
    duration_s: input.durationS || null,
  });
  if (iErr) throw iErr;
}

export async function publishReel(input: ReelPublishInput): Promise<ReelPublishResult> {
  const reelId = generateReelId();
  const caption = input.caption.trim();
  const createdAt = new Date().toISOString();
  const author = buildReelAuthorFromCurrentUser();

  const persistence: ReelPersistence =
    isSupabaseConfigured() &&
    (await publishToSupabase(input, reelId).then(
      () => true,
      () => false,
    ))
      ? "supabase"
      : "local";

  await saveReelMedia({
    id: reelId,
    videoBlob: input.file,
    videoType: input.file.type || "video/mp4",
    posterBlob: input.posterBlob,
    posterType: input.posterBlob ? "image/jpeg" : null,
    storedAt: createdAt,
  });

  saveStoredPublishedReel({
    id: reelId,
    caption,
    category: categoryForContext(input.context),
    author,
    context: input.context,
    durationS: input.durationS,
    createdAt,
    persistence,
  });

  const videoUrl = await getReelVideoUrl(reelId);
  const posterUrl = await getReelPosterUrl(reelId);

  const reel = buildPublishedReel(
    {
      id: reelId,
      caption,
      category: categoryForContext(input.context),
      author,
      context: input.context,
      durationS: input.durationS,
      createdAt,
      persistence,
    },
    videoUrl ?? "",
    posterUrl,
  );

  return { reel, persistence };
}
