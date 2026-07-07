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

// Privacy-aware helpers for people: hide exact distance/radius within 2 km.
export function personProximityLabel(meters: number): string {
  if (meters <= 2000) return "Próximo de você";
  return proximityLabel(meters);
}

export function personProximityRadius(meters: number): string | null {
  if (meters <= 2000) return null;
  return proximityRadius(meters);
}
