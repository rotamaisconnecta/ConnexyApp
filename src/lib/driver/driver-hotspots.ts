import { ActivityLevel, CityHotspot } from "./driver-types";

export function getActivityLabel(level: ActivityLevel): string {
  const labels: Record<ActivityLevel, string> = {
    CALMO: "Calmo",
    MODERADO: "Moderado",
    EM_ALTA: "Em Alta",
    BOMBANDO: "Bombando",
    MUITO_CHEIO: "Muito Cheio",
  };
  return labels[level];
}

export function getActivityEmoji(level: ActivityLevel): string {
  const emojis: Record<ActivityLevel, string> = {
    CALMO: "😴",
    MODERADO: "😊",
    EM_ALTA: "🔥",
    BOMBANDO: "🚀",
    MUITO_CHEIO: "⚠️",
  };
  return emojis[level];
}

export function getActivityColor(level: ActivityLevel): string {
  const colors: Record<ActivityLevel, string> = {
    CALMO: "text-blue-400",
    MODERADO: "text-yellow-400",
    EM_ALTA: "text-orange-400",
    BOMBANDO: "text-red-500",
    MUITO_CHEIO: "text-red-700",
  };
  return colors[level];
}

export function getActivityDescription(level: ActivityLevel): string {
  const descriptions: Record<ActivityLevel, string> = {
    CALMO: "Pouca demanda, ideal para descansar",
    MODERADO: "Demanda normal, boas oportunidades",
    EM_ALTA: "Alta demanda, muitas corridas disponíveis",
    BOMBANDO: "Demanda muito alta, aproveite os bônus",
    MUITO_CHEIO: "Área saturada, considere outra região",
  };
  return descriptions[level];
}

export function sortHotspotsByLevel(hotspots: CityHotspot[]): CityHotspot[] {
  const levelPriority: Record<ActivityLevel, number> = {
    MUITO_CHEIO: 5,
    BOMBANDO: 4,
    EM_ALTA: 3,
    MODERADO: 2,
    CALMO: 1,
  };
  return [...hotspots].sort((a, b) => levelPriority[b.level] - levelPriority[a.level]);
}

export function getHotspotsByCategory(hotspots: CityHotspot[], category: string): CityHotspot[] {
  return hotspots.filter((hotspot) => hotspot.category.toLowerCase() === category.toLowerCase());
}
