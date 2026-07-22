import {
  type Recommendation,
  type EngineUser,
  type RecommendationTypeValue,
  RecommendationType,
} from "./engine-types";

export interface ProfileStats {
  totalRecs: number;
  avgScore: number;
  topCategory: RecommendationTypeValue;
  trendingCount: number;
}

export function getProfileRecommendations(
  userId: string,
  recs: Recommendation[],
): Recommendation[] {
  return recs
    .filter((r) => {
      if (r.reasons.length === 0) return false;
      if (r.score.total < 40) return false;
      return true;
    })
    .sort((a, b) => b.score.total - a.score.total);
}

export function getProfileStats(recs: Recommendation[]): ProfileStats {
  if (recs.length === 0) {
    return {
      totalRecs: 0,
      avgScore: 0,
      topCategory: RecommendationType.PERSON,
      trendingCount: 0,
    };
  }

  const totalRecs = recs.length;
  const avgScore =
    recs.reduce((sum, r) => sum + r.score.total, 0) / totalRecs;

  const typeCounts = {} as Record<RecommendationTypeValue, number>;
  for (const key of Object.values(RecommendationType)) {
    typeCounts[key] = 0;
  }
  for (const r of recs) {
    typeCounts[r.type]++;
  }

  let topCategory: RecommendationTypeValue = RecommendationType.PERSON;
  let maxCount = 0;
  for (const [type, count] of Object.entries(typeCounts)) {
    if (count > maxCount) {
      maxCount = count;
      topCategory = type as RecommendationTypeValue;
    }
  }

  const trendingCount = recs.filter((r) => r.trending).length;

  return {
    totalRecs,
    avgScore: Math.round(avgScore * 10) / 10,
    topCategory,
    trendingCount,
  };
}

export function getInterestSuggestions(userInterests: string[]): string[] {
  const relatedMap: Record<string, string[]> = {
    música: ["shows", "festivais", "DJ", "vinil", "podcast"],
    tecnologia: ["startup", "gadgets", "IA", "coding", "apps"],
    gastronomia: ["restaurantes", "foodtruck", "cozinha", "wine bar", "brunch"],
    esportes: ["futebol", "corrida", "academia", "ciclismo", "natação"],
    arte: ["galeria", "exposição", "pintura", "escultura", "fotografia"],
    natureza: ["trilhas", "parques", "camping", "praia", "cachoeira"],
    "vida noturna": ["bares", "balada", "pub", "cocktail", "after"],
    cinema: ["series", "filmes", "documentários", "estival", "cinema ao ar livre"],
    moda: ["streetwear", "sustentável", "vintage", "design", "acessórios"],
    fitness: ["pilates", "yoga", "crossfit", "dança", "funcional"],
  };

  const suggestions = new Set<string>();

  for (const interest of userInterests) {
    const lower = interest.toLowerCase();
    if (relatedMap[lower]) {
      for (const s of relatedMap[lower]) {
        if (!userInterests.some((i) => i.toLowerCase() === s)) {
          suggestions.add(s);
        }
      }
    }
  }

  if (suggestions.size === 0) {
    return ["shows", "restaurantes", "parques", "festivais", "bares"];
  }

  return Array.from(suggestions).slice(0, 5);
}

export function getProfileCompletionTips(user: EngineUser): string[] {
  const tips: string[] = [];

  if (!user.photoUrl) {
    tips.push("Adicione uma foto de perfil para ficar mais visível");
  }

  if (user.interests.length < 3) {
    tips.push(
      `Você tem apenas ${user.interests.length} interesse(s). Adicione mais para recomendações melhores`,
    );
  }

  if (user.vibeTags.length === 0) {
    tips.push("Adicione seus vibe tags para personalizar seu perfil");
  }

  if (user.favoritePlaceIds.length === 0) {
    tips.push("Favorite alguns lugares para recomendações personalizadas");
  }

  if (!user.location.label) {
    tips.push("Adicione sua localização para encontrar coisas por perto");
  }

  if (tips.length === 0) {
    tips.push("Seu perfil está completo! Continue explorando o Connexy");
  }

  return tips;
}
