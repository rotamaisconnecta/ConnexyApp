export type ProximityTier =
  | "here"
  | "veryClose"
  | "close"
  | "around"
  | "neighborhood"
  | "far"
  | "veryFar";

export function proximityTier(meters: number): ProximityTier {
  if (meters <= 20) return "here";
  if (meters <= 100) return "veryClose";
  if (meters <= 500) return "close";
  if (meters <= 2000) return "around";
  if (meters <= 5000) return "neighborhood";
  if (meters <= 20000) return "far";
  return "veryFar";
}

const LABELS: Record<ProximityTier, string> = {
  here: "Bem pertinho",
  veryClose: "Muito perto",
  close: "Perto",
  around: "Nas redondezas",
  neighborhood: "No bairro",
  far: "Distante",
  veryFar: "Muito distante",
};

const RADIUS: Record<ProximityTier, string> = {
  here: "até 20 m",
  veryClose: "até 100 m",
  close: "até 500 m",
  around: "até 2 km",
  neighborhood: "até 5 km",
  far: "até 20 km",
  veryFar: "+ de 20 km",
};

// Tailwind classes: bg + text tone per tier
const TONE: Record<ProximityTier, string> = {
  here: "bg-success/15 text-success",
  veryClose: "bg-success/10 text-success",
  close: "bg-accent text-primary",
  around: "bg-accent text-primary",
  neighborhood: "bg-secondary text-foreground",
  far: "bg-secondary text-muted-foreground",
  veryFar: "bg-secondary text-muted-foreground",
};

export function proximityLabel(meters: number): string {
  return LABELS[proximityTier(meters)];
}

export function proximityRadius(meters: number): string {
  return RADIUS[proximityTier(meters)];
}

export function proximityTone(meters: number): string {
  return TONE[proximityTier(meters)];
}

export function isNearby(meters: number): boolean {
  const t = proximityTier(meters);
  return t === "here" || t === "veryClose" || t === "close";
}

/* ─── formatPersonDistance ───────────────────────────────
   Used by all person cards. Hides exact distance up to 2 km,
   replacing with smart proximity categories.
   Ready for Supabase: just pass meters from DB, no UI changes needed.
───────────────────────────────────────────────────────── */

const PERSON_DISTANCE_CATEGORIES = [
  { max: 300, label: "Muito perto" },
  { max: 800, label: "Por aqui" },
  { max: 1999, label: "Nas proximidades" },
] as const;

export function formatPersonDistance(meters: number): string {
  for (const cat of PERSON_DISTANCE_CATEGORIES) {
    if (meters <= cat.max) {
      return `📍 ${cat.label}`;
    }
  }
  return `📍 ${formatDistance(meters)}`;
}

/* ─── formatDistance (localised) ──────────────────────────── */

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1).replace(".", ",")}km`;
}

/* ─── formatProtectedProximity (shared) ────────────────────
   Official Connexy privacy rule: exact distance is hidden up to
   2 km, replaced with proximity categories. Above 2 km the
   distance is shown with one decimal (pt-BR).
   Used by chat, sponsored content and any privacy-safe surface.
────────────────────────────────────────────────────────── */

export function formatProtectedProximity(meters: number): string {
  if (meters <= 500) return "Muito perto";
  if (meters <= 1000) return "Na mesma região";
  if (meters <= 2000) return "Perto de você";
  return `${(meters / 1000).toFixed(1).replace(".", ",")} km de distância`;
}

// Legacy helpers kept for backward compatibility.
export function personProximityLabel(meters: number): string {
  if (meters <= 2000) return "Próximo de você";
  return proximityLabel(meters);
}

export function personProximityRadius(meters: number): string | null {
  if (meters <= 2000) return null;
  return proximityRadius(meters);
}

// Home feed proximity: privacy-respecting labels with emojis.
export function homeProximityLabel(meters: number): string {
  if (meters <= 100) return "📍 Muito perto";
  if (meters <= 300) return "📍 Bem próximo";
  if (meters <= 700) return "📍 Na sua região";
  if (meters <= 2000) return "📍 Perto de você";
  const km = (meters / 1000).toFixed(1).replace(".", ",");
  return `${km} km`;
}
