export const CatalogVisibility = {
  PUBLIC: "PUBLIC",
  CONNECTIONS: "CONNECTIONS",
  PRIVATE: "PRIVATE",
} as const;

export type CatalogVisibilityValue = (typeof CatalogVisibility)[keyof typeof CatalogVisibility];

export const CATALOG_VISIBILITY_OPTIONS: { value: CatalogVisibilityValue; label: string }[] = [
  { value: CatalogVisibility.PUBLIC, label: "Público" },
  { value: CatalogVisibility.CONNECTIONS, label: "Conexões" },
  { value: CatalogVisibility.PRIVATE, label: "Somente eu" },
];

export const EVENT_CATEGORIES = [
  "Música",
  "Gastronomia",
  "Arte",
  "Bem-estar",
  "Cultura",
  "Tecnologia",
  "Esporte",
  "Literatura",
] as const;

export const PLACE_CATEGORIES = [
  "Praça",
  "Parque",
  "Praia",
  "Ponto turístico",
  "Museu",
  "Espaço",
  "Natureza",
  "Cultura",
  "Lazer",
  "Esporte",
] as const;

export const BUSINESS_FEATURE_TAGS = [
  "wi-fi",
  "petiscos",
  "happy hour",
  "música ao vivo",
  "ao ar livre",
  "romântico",
  "café",
  "premium",
  "spa",
  "eventos",
] as const;

export const PLACE_FEATURE_TAGS = [
  "ao ar livre",
  "eventos",
  "cultura",
  "natureza",
  "lazer",
  "vista",
] as const;

export const EVENT_FEATURE_TAGS = ["música", "ao ar livre", "gastronomia", "família"] as const;

export type EventCategoryValue = (typeof EVENT_CATEGORIES)[number];
export type PlaceCategoryValue = (typeof PLACE_CATEGORIES)[number];
