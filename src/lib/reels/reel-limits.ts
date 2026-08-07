/* =========================================================
   reel-limits.ts — Limites centralizados de publicação de
   Reels (Fase 3B). Sem números mágicos em componentes.
========================================================= */

export const REEL_MAX_FILE_SIZE = 250 * 1024 * 1024;
export const REEL_MAX_DURATION_SECONDS = 90;
export const REEL_MAX_CAPTION_LENGTH = 240;

export const REEL_ACCEPT = "video/*";
export const REEL_ALLOWED_EXTENSIONS = ["mp4", "mov", "webm"];
export const REEL_ALLOWED_MIME_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
