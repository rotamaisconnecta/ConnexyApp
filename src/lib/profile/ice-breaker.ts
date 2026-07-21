/* =========================================================
   ice-breaker.ts — Automatic conversation starter generator
   Pure TypeScript. No React. No side effects.
========================================================= */

/* ─── Source type ────────────────────────────────────────── */

export type IceBreakerSource = "interest" | "place" | "moment" | "vibe" | "event" | "proximity";

/* ─── Priority map (lower = higher priority) ─────────────── */

const SOURCE_PRIORITY: Record<IceBreakerSource, number> = {
  moment: 1,
  interest: 2,
  place: 3,
  vibe: 4,
  event: 5,
  proximity: 6,
};

/* ─── Suggestion ─────────────────────────────────────────── */

export interface IceBreakerSuggestion {
  id: string;
  text: string;
  emoji: string;
  source: IceBreakerSource;
  priority: number;
}

/* ─── Input contracts ────────────────────────────────────── */

export interface IceBreakerViewer {
  name: string;
  interests: string[];
  vibeTags?: string[];
  favoritePlaceIds?: string[];
}

export interface IceBreakerProfile {
  name: string;
  interests: string[];
  vibeTags?: string[];
  favoritePlaceIds?: string[];
  distanceMeters: number;
  moment?: {
    text: string;
    place?: { name: string };
  };
}

/* ─── Emoji map ──────────────────────────────────────────── */

const INTEREST_EMOJI: Record<string, string> = {
  Café: "☕",
  Música: "🎵",
  Arte: "🎨",
  Viagens: "✈️",
  Esportes: "🏃",
  Cinema: "🎬",
  Networking: "🤝",
  Tecnologia: "💻",
  Gastronomia: "🍽️",
  Games: "🎮",
  Moda: "👗",
  Negócios: "💼",
  Literatura: "📚",
  Yoga: "🧘",
  Pets: "🐾",
  Socializar: "👥",
  Eventos: "🎫",
};

const DEFAULT_INTEREST_EMOJI = "💡";

function interestEmoji(interest: string): string {
  return INTEREST_EMOJI[interest] ?? DEFAULT_INTEREST_EMOJI;
}

/* ─── Reason builders ────────────────────────────────────── */

function buildInterestSuggestions(
  viewerInterests: string[],
  profileInterests: string[],
): IceBreakerSuggestion[] {
  const shared = profileInterests.filter((i) => viewerInterests.includes(i));
  if (shared.length === 0) return [];

  return shared.slice(0, 2).map((interest, idx) => ({
    id: `interest-${idx}`,
    text: `Vocês dois gostam de ${interest}`,
    emoji: interestEmoji(interest),
    source: "interest" as const,
    priority: SOURCE_PRIORITY.interest,
  }));
}

function buildPlaceSuggestions(
  viewerPlaces: string[],
  profilePlaces: string[],
): IceBreakerSuggestion[] {
  const shared = profilePlaces.filter((p) => viewerPlaces.includes(p));
  if (shared.length === 0) return [];

  return shared.slice(0, 1).map((_, idx) => ({
    id: `place-${idx}`,
    text: "Ambos frequentam o mesmo lugar favorito",
    emoji: "📍",
    source: "place" as const,
    priority: SOURCE_PRIORITY.place,
  }));
}

function buildMomentSuggestion(moment: IceBreakerProfile["moment"]): IceBreakerSuggestion | null {
  if (!moment) return null;

  if (moment.place?.name) {
    return {
      id: "moment-place",
      text: `Está agora em ${moment.place.name}`,
      emoji: "📍",
      source: "moment",
      priority: SOURCE_PRIORITY.moment,
    };
  }

  const text = moment.text.length > 50 ? `${moment.text.slice(0, 50)}...` : moment.text;
  return {
    id: "moment-text",
    text: `Postou recentemente: "${text}"`,
    emoji: "💬",
    source: "moment",
    priority: SOURCE_PRIORITY.moment,
  };
}

function buildVibeSuggestions(
  viewerVibes: string[],
  profileVibes: string[],
): IceBreakerSuggestion[] {
  const shared = profileVibes.filter((v) => viewerVibes.includes(v));
  if (shared.length === 0) return [];

  return [
    {
      id: "vibe-0",
      text: "Vocês possuem uma vibe parecida",
      emoji: "✨",
      source: "vibe",
      priority: SOURCE_PRIORITY.vibe,
    },
  ];
}

function buildProximitySuggestion(distanceMeters: number): IceBreakerSuggestion | null {
  if (distanceMeters > 200) return null;

  return {
    id: "proximity-0",
    text: "Está muito perto de você",
    emoji: "🔥",
    source: "proximity",
    priority: SOURCE_PRIORITY.proximity,
  };
}

/* ─── Utility functions ──────────────────────────────────── */

export function sortByPriority(suggestions: IceBreakerSuggestion[]): IceBreakerSuggestion[] {
  return [...suggestions].sort((a, b) => a.priority - b.priority);
}

export function deduplicateSuggestions(
  suggestions: IceBreakerSuggestion[],
): IceBreakerSuggestion[] {
  const seen = new Set<string>();
  return suggestions.filter((s) => {
    const key = `${s.source}:${s.text}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/* ─── Public API ─────────────────────────────────────────── */

const MAX_SUGGESTIONS = 3;

export function generateIceBreakers(
  viewer: IceBreakerViewer,
  profile: IceBreakerProfile,
): IceBreakerSuggestion[] {
  const momentSuggestion = buildMomentSuggestion(profile.moment);

  const allSuggestions: IceBreakerSuggestion[] = [
    ...(momentSuggestion ? [momentSuggestion] : []),
    ...buildInterestSuggestions(viewer.interests, profile.interests),
    ...buildPlaceSuggestions(viewer.favoritePlaceIds ?? [], profile.favoritePlaceIds ?? []),
    ...buildVibeSuggestions(viewer.vibeTags ?? [], profile.vibeTags ?? []),
    ...(buildProximitySuggestion(profile.distanceMeters)
      ? [buildProximitySuggestion(profile.distanceMeters)!]
      : []),
  ];

  const deduplicated = deduplicateSuggestions(allSuggestions);
  const sorted = sortByPriority(deduplicated);

  return sorted.slice(0, MAX_SUGGESTIONS);
}
