import {
  ACTIVITY_META,
  type ActivityLevelValue,
  type RecommendationReasonValue,
} from "./engine-types";

export function formatScore(score: number): string {
  return `${Math.round(score)}`;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  const km = meters / 1000;
  return `${km.toFixed(1).replace(".", ",")}km`;
}

export function formatActivityLevel(level: ActivityLevelValue): string {
  return ACTIVITY_META.find((m) => m.level === level)?.label ?? level;
}

export function getActivityEmoji(level: ActivityLevelValue): string {
  return ACTIVITY_META.find((m) => m.level === level)?.emoji ?? "❓";
}

export function getActivityColor(level: ActivityLevelValue): string {
  return ACTIVITY_META.find((m) => m.level === level)?.color ?? "";
}

const REASON_LABELS: Record<RecommendationReasonValue, string> = {
  DISTANCIA: "Próximo de você",
  INTERESSE: "Com base nos seus interesses",
  COMPATIBILIDADE: "Alta compatibilidade",
  POPULARIDADE: "Popular no momento",
  EVENTO: "Evento acontecendo",
  LOCAL: "Lugar em alta",
  HORARIO: "No horário certo",
  TENDENCIA: "Tendência agora",
};

const REASON_EMOJIS: Record<RecommendationReasonValue, string> = {
  DISTANCIA: "📍",
  INTERESSE: "💡",
  COMPATIBILIDADE: "🤝",
  POPULARIDADE: "🔥",
  EVENTO: "🎉",
  LOCAL: "📌",
  HORARIO: "⏰",
  TENDENCIA: "📈",
};

export function getReasonLabel(reason: RecommendationReasonValue): string {
  return REASON_LABELS[reason] ?? reason;
}

export function getReasonEmoji(reason: RecommendationReasonValue): string {
  return REASON_EMOJIS[reason] ?? "❓";
}

export function formatCompatibility(percent: number): string {
  return `${Math.round(percent)}% compatível`;
}

export function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1).trimEnd() + "…";
}

export function isHighScore(score: number): boolean {
  return score >= 75;
}

export function isMediumScore(score: number): boolean {
  return score >= 40 && score < 75;
}

export function getScoreLabel(score: number): string {
  if (score >= 85) return "Excelente";
  if (score >= 65) return "Bom";
  if (score >= 40) return "Regular";
  return "Baixo";
}
