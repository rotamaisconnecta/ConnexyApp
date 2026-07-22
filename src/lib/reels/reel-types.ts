/* ─── ReelCategory ───────────────────────────────────────── */

export const ReelCategory = {
  PERSON: "PERSON",
  BUSINESS: "BUSINESS",
  EVENT: "EVENT",
  PLACE: "PLACE",
  OFFER: "OFFER",
  DRIVER: "DRIVER",
  NETWORKING: "NETWORKING",
  TRAVEL: "TRAVEL",
  MOMENT: "MOMENT",
} as const;

export type ReelCategoryValue = (typeof ReelCategory)[keyof typeof ReelCategory];

/* ─── ReelActionType ─────────────────────────────────────── */

export const ReelActionType = {
  LIKE: "LIKE",
  COMMENT: "COMMENT",
  SHARE: "SHARE",
  SAVE: "SAVE",
  FOLLOW: "FOLLOW",
  CONNECT: "CONNECT",
  OPEN_CHAT: "OPEN_CHAT",
  OPEN_PROFILE: "OPEN_PROFILE",
  OPEN_BUSINESS: "OPEN_BUSINESS",
  OPEN_EVENT: "OPEN_EVENT",
  OPEN_PLACE: "OPEN_PLACE",
  REQUEST_RIDE: "REQUEST_RIDE",
  CHECK_IN: "CHECK_IN",
  INTEREST: "INTEREST",
  ATTENDING: "ATTENDING",
  VIEW_OFFERS: "VIEW_OFFERS",
} as const;

export type ReelActionTypeValue = (typeof ReelActionType)[keyof typeof ReelActionType];

/* ─── ReelAuthor ─────────────────────────────────────────── */

export interface ReelAuthor {
  id: string;
  name: string;
  handle: string;
  photoUrl: string;
  verified: boolean;
  profession: string | null;
  isFollowing: boolean;
}

/* ─── ReelMusic ──────────────────────────────────────────── */

export interface ReelMusic {
  id: string;
  title: string;
  artist: string;
  duration: number;
  coverUrl: string | null;
}

/* ─── ReelComment ────────────────────────────────────────── */

export interface ReelComment {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  createdAt: string;
  likes: number;
  likedByMe: boolean;
  replies: ReelComment[];
}

/* ─── ReelStats ──────────────────────────────────────────── */

export interface ReelStats {
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  views: number;
  duration: number;
}

/* ─── ReelLocation ───────────────────────────────────────── */

export interface ReelLocation {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  category: string;
  distanceMeters: number;
}

/* ─── ReelBusiness ───────────────────────────────────────── */

export interface ReelBusiness {
  id: string;
  name: string;
  logo: string;
  category: string;
  rating: number;
  reviewCount: number;
  isFollowing: boolean;
  offers: ReelOffer[];
}

/* ─── ReelOffer ──────────────────────────────────────────── */

export interface ReelOffer {
  id: string;
  title: string;
  description: string;
  discountPercent: number;
  validUntil: string;
}

/* ─── ReelEvent ──────────────────────────────────────────── */

export interface ReelEvent {
  id: string;
  name: string;
  date: string;
  location: string;
  coverUrl: string;
  interestedCount: number;
  attendingCount: number;
  isInterested: boolean;
  isAttending: boolean;
  checkedIn: boolean;
}

/* ─── ReelDriver ─────────────────────────────────────────── */

export interface ReelDriver {
  id: string;
  name: string;
  photo: string;
  rating: number;
  vehicle: string;
  plate: string;
  isAvailable: boolean;
  etaMinutes: number;
}

/* ─── Reel (main interface) ──────────────────────────────── */

export interface Reel {
  id: string;
  videoUrl: string;
  posterUrl: string | null;
  caption: string;
  category: ReelCategoryValue;
  author: ReelAuthor;
  music: ReelMusic | null;
  location: ReelLocation | null;
  business: ReelBusiness | null;
  event: ReelEvent | null;
  driver: ReelDriver | null;
  stats: ReelStats;
  hashtags: string[];
  taggedUserIds: string[];
  createdAt: string;
  likedByMe: boolean;
  savedByMe: boolean;
}

/* ─── ReelCategoryMeta ───────────────────────────────────── */

export interface ReelCategoryMeta {
  value: ReelCategoryValue;
  label: string;
  emoji: string;
  color: string;
}

export const REEL_CATEGORY_META: ReelCategoryMeta[] = [
  {
    value: ReelCategory.PERSON,
    label: "Pessoas",
    emoji: "👤",
    color: "bg-blue-500/15 text-blue-400",
  },
  {
    value: ReelCategory.BUSINESS,
    label: "Empresas",
    emoji: "🏢",
    color: "bg-purple-500/15 text-purple-400",
  },
  {
    value: ReelCategory.EVENT,
    label: "Eventos",
    emoji: "🎉",
    color: "bg-pink-500/15 text-pink-400",
  },
  {
    value: ReelCategory.PLACE,
    label: "Locais",
    emoji: "📍",
    color: "bg-green-500/15 text-green-400",
  },
  {
    value: ReelCategory.OFFER,
    label: "Ofertas",
    emoji: "🏷️",
    color: "bg-amber-500/15 text-amber-400",
  },
  {
    value: ReelCategory.DRIVER,
    label: "Motoristas",
    emoji: "🚗",
    color: "bg-cyan-500/15 text-cyan-400",
  },
  {
    value: ReelCategory.NETWORKING,
    label: "Networking",
    emoji: "🤝",
    color: "bg-indigo-500/15 text-indigo-400",
  },
  {
    value: ReelCategory.TRAVEL,
    label: "Turismo",
    emoji: "✈️",
    color: "bg-teal-500/15 text-teal-400",
  },
  {
    value: ReelCategory.MOMENT,
    label: "Momentos",
    emoji: "📸",
    color: "bg-orange-500/15 text-orange-400",
  },
];

/* ─── Share Target ───────────────────────────────────────── */

export const ShareTarget = {
  CHAT: "CHAT",
  WHATSAPP: "WHATSAPP",
  INSTAGRAM: "INSTAGRAM",
  COPY_LINK: "COPY_LINK",
  OTHER: "OTHER",
} as const;

export type ShareTargetValue = (typeof ShareTarget)[keyof typeof ShareTarget];

export interface ShareOption {
  target: ShareTargetValue;
  label: string;
  icon: string;
}

export const SHARE_OPTIONS: ShareOption[] = [
  { target: ShareTarget.CHAT, label: "Enviar no Chat", icon: "message-circle" },
  { target: ShareTarget.WHATSAPP, label: "WhatsApp", icon: "smartphone" },
  { target: ShareTarget.INSTAGRAM, label: "Instagram", icon: "instagram" },
  { target: ShareTarget.COPY_LINK, label: "Copiar link", icon: "link" },
];

/* ─── Sort Algorithm ─────────────────────────────────────── */

export type SortAlgorithm = "distance" | "interest" | "popularity" | "recent" | "smart";

export const SORT_ALGORITHMS: { value: SortAlgorithm; label: string }[] = [
  { value: "smart", label: "Para você" },
  { value: "recent", label: "Mais recentes" },
  { value: "popularity", label: "Populares" },
  { value: "distance", label: "Mais próximos" },
  { value: "interest", label: "Seus interesses" },
];
