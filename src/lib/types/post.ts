/* =========================================================
   post.ts — Post creation types
   Pure TypeScript. No React. No side effects.
========================================================= */

/* ─── Enums ──────────────────────────────────────────────── */

export const PostCategory = {
  PHOTO: "PHOTO",
  VIDEO: "VIDEO",
  TEXT: "TEXT",
  PLACE: "PLACE",
  EVENT: "EVENT",
  OFFER: "OFFER",
  MOMENT: "MOMENT",
  NETWORKING: "NETWORKING",
  ROUTE: "ROUTE",
} as const;

export type PostCategoryValue = (typeof PostCategory)[keyof typeof PostCategory];

export const POST_CATEGORY_META: Record<PostCategoryValue, { label: string; emoji: string }> = {
  [PostCategory.PHOTO]: { label: "Foto", emoji: "📷" },
  [PostCategory.VIDEO]: { label: "Vídeo", emoji: "🎬" },
  [PostCategory.TEXT]: { label: "Texto", emoji: "💬" },
  [PostCategory.PLACE]: { label: "Lugar", emoji: "📍" },
  [PostCategory.EVENT]: { label: "Evento", emoji: "🎉" },
  [PostCategory.OFFER]: { label: "Oferta", emoji: "🏷️" },
  [PostCategory.MOMENT]: { label: "Momento", emoji: "⚡" },
  [PostCategory.NETWORKING]: { label: "Networking", emoji: "🤝" },
  [PostCategory.ROUTE]: { label: "Compartilhar rota", emoji: "🗺️" },
};

export const PostPrivacy = {
  PUBLIC: "PUBLIC",
  CONNECTIONS: "CONNECTIONS",
  FRIENDS: "FRIENDS",
  PRIVATE: "PRIVATE",
} as const;

export type PostPrivacyValue = (typeof PostPrivacy)[keyof typeof PostPrivacy];

export const POST_PRIVACY_META: Record<PostPrivacyValue, { label: string; description: string }> = {
  [PostPrivacy.PUBLIC]: {
    label: "Público",
    description: "Visível para todos",
  },
  [PostPrivacy.CONNECTIONS]: {
    label: "Conexões",
    description: "Visível para suas conexões",
  },
  [PostPrivacy.FRIENDS]: {
    label: "Somente amigos",
    description: "Visível apenas para amigos",
  },
  [PostPrivacy.PRIVATE]: {
    label: "Privado",
    description: "Visível apenas para você",
  },
};

/* ─── Interfaces ─────────────────────────────────────────── */

export interface PostMedia {
  id: string;
  file: File;
  preview: string;
  type: "image" | "video";
}

export interface PostLocation {
  name: string;
  lat?: number;
  lng?: number;
}

export interface PostAuthor {
  id: string;
  name: string;
  photo: string;
  handle: string;
}

export interface PostInterest {
  id: string;
  label: string;
}

export interface PostMention {
  id: string;
  name: string;
  photo: string;
}

export interface PostDraft {
  text: string;
  media: PostMedia[];
  category: PostCategoryValue | null;
  location: PostLocation | null;
  interests: PostInterest[];
  hashtags: string[];
  mentions: PostMention[];
  privacy: PostPrivacyValue;
}

/* ─── Defaults ───────────────────────────────────────────── */

export const INITIAL_DRAFT: PostDraft = {
  text: "",
  media: [],
  category: null,
  location: null,
  interests: [],
  hashtags: [],
  mentions: [],
  privacy: PostPrivacy.PUBLIC,
};

/* ─── Validators ─────────────────────────────────────────── */

export function isPostValid(draft: PostDraft): boolean {
  const hasText = draft.text.trim().length > 0;
  const hasMedia = draft.media.length > 0;
  const hasCategory = draft.category !== null;
  return (hasText || hasMedia) && hasCategory;
}

export const TEXT_MAX_LENGTH = 5000;
export const MAX_MEDIA_FILES = 10;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime"];
export const ALLOWED_MEDIA_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];
