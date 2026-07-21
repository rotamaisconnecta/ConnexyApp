/* =========================================================
   compatibility.ts — Pure compatibility library
   No React. No hooks. No side effects.
========================================================= */

/* ─── Input contracts ────────────────────────────────────── */

export interface CompatibilityViewer {
  interests: string[];
  vibeTags?: string[];
  favoritePlaceIds?: string[];
}

export interface CompatibilityProfile {
  interests: string[];
  vibeTags?: string[];
  favoritePlaceIds?: string[];
  distanceMeters: number;
  moments?: readonly { text: string }[];
}

/* ─── Exported types ─────────────────────────────────────── */

export type CompatibilityTier = "excelente" | "alta" | "compativel" | null;

export interface CompatibilityReason {
  category: "interest" | "place" | "vibe" | "proximity" | "moment";
  label: string;
  emoji: string;
  shared: boolean;
}

export interface CompatibilityResult {
  score: number;
  tier: CompatibilityTier;
  tierLabel: string;
  reasons: CompatibilityReason[];
}

export interface CompatibilityInfo {
  tier: CompatibilityTier;
  label: string;
  className: string;
  color: string;
}

/* ─── Constants ──────────────────────────────────────────── */

const WEIGHTS = {
  interest: 25,
  vibe: 15,
  place: 15,
  proximity: 10,
  moment: 5,
} as const;

const TIER_LABELS: Record<string, string> = {
  excelente: "Excelente Match",
  alta: "Alta Compatibilidade",
  compativel: "Compatível",
};

const TIER_STYLES: Record<string, { className: string; color: string }> = {
  excelente: {
    className: "bg-gradient-brand text-white",
    color: "#6C3BFF",
  },
  alta: {
    className: "bg-primary/15 text-primary",
    color: "oklch(0.55 0.24 295)",
  },
  compativel: {
    className: "bg-accent text-primary",
    color: "oklch(0.55 0.24 295)",
  },
};

const PROXIMITY_BOOSTS = [
  { maxMeters: 100, boost: 10 },
  { maxMeters: 500, boost: 6 },
  { maxMeters: 2000, boost: 3 },
] as const;

/* ─── Tier resolution ────────────────────────────────────── */

function resolveTier(score: number): CompatibilityTier {
  if (score >= 90) return "excelente";
  if (score >= 75) return "alta";
  if (score >= 60) return "compativel";
  return null;
}

function resolveTierLabel(tier: CompatibilityTier): string {
  if (tier === null) return "";
  return TIER_LABELS[tier] ?? "";
}

/* ─── Reason builders ────────────────────────────────────── */

function buildInterestReason(shared: string[]): CompatibilityReason | null {
  if (shared.length === 0) return null;
  const label =
    shared.length === 1
      ? `Vocês curtam ${shared[0]}`
      : `Vocês curtam ${shared.slice(0, 3).join(", ")}${
          shared.length > 3 ? ` e mais ${shared.length - 3}` : ""
        }`;
  return { category: "interest", label, emoji: "🎯", shared: true };
}

function buildVibeReason(shared: string[]): CompatibilityReason | null {
  if (shared.length === 0) return null;
  const label =
    shared.length === 1 ? `Vibe parecida: ${shared[0]}` : `${shared.length} vibes em comum`;
  return { category: "vibe", label, emoji: "✨", shared: true };
}

function buildPlaceReason(shared: string[]): CompatibilityReason | null {
  if (shared.length === 0) return null;
  const label = shared.length === 1 ? "Curtem o mesmo lugar" : `${shared.length} lugares em comum`;
  return { category: "place", label, emoji: "📍", shared: true };
}

function buildProximityReason(meters: number): CompatibilityReason | null {
  if (meters <= 100)
    return {
      category: "proximity",
      label: "Estão muito perto agora",
      emoji: "🔥",
      shared: false,
    };
  if (meters <= 500)
    return {
      category: "proximity",
      label: "Pertinho de você",
      emoji: "📍",
      shared: false,
    };
  if (meters <= 2000)
    return {
      category: "proximity",
      label: "Na sua região",
      emoji: "🚶",
      shared: false,
    };
  return null;
}

function buildMomentReason(
  moments: readonly { text: string }[] | undefined,
): CompatibilityReason | null {
  if (!moments || moments.length === 0) return null;
  const latest = moments[0];
  if (!latest) return null;
  const text = latest.text.length > 50 ? `${latest.text.slice(0, 50)}...` : latest.text;
  return {
    category: "moment",
    label: `Postou: "${text}"`,
    emoji: "💬",
    shared: false,
  };
}

/* ─── Proximity boost ────────────────────────────────────── */

function proximityBoost(meters: number): number {
  for (const tier of PROXIMITY_BOOSTS) {
    if (meters <= tier.maxMeters) return tier.boost;
  }
  return 0;
}

/* ─── Public API ─────────────────────────────────────────── */

export function calculateCompatibility(
  viewer: CompatibilityViewer,
  profile: CompatibilityProfile,
): CompatibilityResult {
  const sharedInterests = profile.interests.filter((i) => viewer.interests.includes(i));
  const sharedVibe = (profile.vibeTags ?? []).filter((v) => (viewer.vibeTags ?? []).includes(v));
  const sharedPlaces = (profile.favoritePlaceIds ?? []).filter((p) =>
    (viewer.favoritePlaceIds ?? []).includes(p),
  );

  const interestScore = Math.min(sharedInterests.length * 8, WEIGHTS.interest);
  const vibeScore = Math.min(sharedVibe.length * 8, WEIGHTS.vibe);
  const placeScore = Math.min(sharedPlaces.length * 8, WEIGHTS.place);
  const proxScore = proximityBoost(profile.distanceMeters);
  const momentScore = profile.moments && profile.moments.length > 0 ? WEIGHTS.moment : 0;

  const base = 30;
  const raw = base + interestScore + vibeScore + placeScore + proxScore + momentScore;
  const score = Math.min(99, Math.round(raw));

  const reasons: CompatibilityReason[] = [
    buildInterestReason(sharedInterests),
    buildVibeReason(sharedVibe),
    buildPlaceReason(sharedPlaces),
    buildProximityReason(profile.distanceMeters),
    buildMomentReason(profile.moments),
  ].filter((r): r is CompatibilityReason => r !== null);

  const tier = resolveTier(score);
  const tierLabel = resolveTierLabel(tier);

  return { score, tier, tierLabel, reasons };
}

export function compatibilityInfo(score: number): CompatibilityInfo {
  if (score >= 90)
    return {
      tier: "excelente",
      label: "Excelente Match",
      ...TIER_STYLES.excelente,
    };
  if (score >= 75)
    return {
      tier: "alta",
      label: "Alta Compatibilidade",
      ...TIER_STYLES.alta,
    };
  if (score >= 60)
    return {
      tier: "compativel",
      label: "Compatível",
      ...TIER_STYLES.compativel,
    };
  return { tier: null, label: "", className: "", color: "" };
}
