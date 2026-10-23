import type { GeminiCatalogSuggestion } from "@/lib/gemini/gemini-types";

export type CatalogAssistFormSlice = {
  title?: string;
  name?: string;
  subtitle?: string;
  description?: string;
  tags?: string[];
};

export function applyCatalogAssistSuggestion<T extends CatalogAssistFormSlice>(
  current: T,
  suggestion: GeminiCatalogSuggestion,
): T {
  const next = { ...current };
  const title = suggestion.title?.trim();
  const subtitle = suggestion.subtitle?.trim();
  const description = suggestion.description?.trim();
  if (title) {
    if ("title" in next) next.title = title;
    if ("name" in next) next.name = title;
  }
  if (subtitle && "subtitle" in next) next.subtitle = subtitle;
  if (description) next.description = description;
  if (suggestion.tags?.length) next.tags = suggestion.tags;
  return next;
}
