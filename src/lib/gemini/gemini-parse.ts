import { GEMINI_TEXT_LIMITS } from "./gemini-config";
import { GeminiError, GeminiErrorCode } from "./gemini-errors";
import { clipText } from "./gemini-prompts";
import type {
  GeminiAdResult,
  GeminiCatalogAssistResult,
  GeminiCatalogSuggestion,
  GeminiChatTopicResult,
  GeminiIcebreakerResult,
  GeminiMediaResult,
  GeminiVisualDirection,
} from "./gemini-types";
import { GeminiFeature } from "./gemini-types";

function extractJsonObject(raw: string): Record<string, unknown> {
  const trimmed = raw.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start < 0 || end <= start) {
    throw new GeminiError(GeminiErrorCode.INVALID);
  }
  try {
    const parsed: unknown = JSON.parse(trimmed.slice(start, end + 1));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new GeminiError(GeminiErrorCode.INVALID);
    }
    return parsed as Record<string, unknown>;
  } catch (error) {
    if (error instanceof GeminiError) throw error;
    throw new GeminiError(GeminiErrorCode.INVALID);
  }
}

function requiredString(value: unknown, max: number): string {
  if (typeof value !== "string") throw new GeminiError(GeminiErrorCode.INVALID);
  const clipped = clipText(value, max);
  if (!clipped) throw new GeminiError(GeminiErrorCode.EMPTY);
  return clipped;
}

export function parseGeminiAd(raw: string): GeminiAdResult {
  const json = extractJsonObject(raw);
  return {
    title: requiredString(json.title, GEMINI_TEXT_LIMITS.name),
    shortDescription: requiredString(json.shortDescription, 160),
    body: requiredString(json.body, GEMINI_TEXT_LIMITS.description),
    callToAction: requiredString(json.callToAction, 80),
  };
}

export function parseGeminiIcebreaker(raw: string): GeminiIcebreakerResult {
  const json = extractJsonObject(raw);
  return { message: requiredString(json.message, GEMINI_TEXT_LIMITS.message) };
}

export function parseGeminiChatTopic(raw: string): GeminiChatTopicResult {
  const json = extractJsonObject(raw);
  return { suggestion: requiredString(json.suggestion, GEMINI_TEXT_LIMITS.suggestion) };
}

export function parseGeminiMedia(raw: string): GeminiMediaResult {
  const json = extractJsonObject(raw);
  return {
    caption: requiredString(json.caption, GEMINI_TEXT_LIMITS.caption),
    direction: requiredString(json.direction, GEMINI_TEXT_LIMITS.direction),
  };
}

function optionalString(value: unknown, max: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const clipped = clipText(value, max);
  return clipped || undefined;
}

function optionalStringList(value: unknown, maxItems: number, maxChars: number): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const next: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    const clipped = clipText(item, maxChars);
    if (!clipped) continue;
    next.push(clipped);
    if (next.length >= maxItems) break;
  }
  return next.length > 0 ? next : undefined;
}

function parseVisualDirection(value: unknown): GeminiVisualDirection | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const json = value as Record<string, unknown>;
  const visual: GeminiVisualDirection = {
    style: optionalString(json.style, GEMINI_TEXT_LIMITS.visual),
    composition: optionalString(json.composition, GEMINI_TEXT_LIMITS.visual),
    typography: optionalString(json.typography, GEMINI_TEXT_LIMITS.visual),
    elementsToHighlight: optionalStringList(json.elementsToHighlight, GEMINI_TEXT_LIMITS.highlights, GEMINI_TEXT_LIMITS.highlight),
    currentAssessment: optionalString(json.currentAssessment, GEMINI_TEXT_LIMITS.visual),
    improvements: optionalStringList(json.improvements, GEMINI_TEXT_LIMITS.highlights, GEMINI_TEXT_LIMITS.highlight),
    hierarchy: optionalString(json.hierarchy, GEMINI_TEXT_LIMITS.visual),
    imagePrompt: optionalString(json.imagePrompt, GEMINI_TEXT_LIMITS.imagePrompt),
  };
  return Object.values(visual).some(Boolean) ? visual : undefined;
}

export function parseGeminiCatalogAssist(raw: string): GeminiCatalogAssistResult {
  const json = extractJsonObject(raw);
  const nested =
    json.suggestion && typeof json.suggestion === "object" && !Array.isArray(json.suggestion)
      ? (json.suggestion as Record<string, unknown>)
      : json;
  const suggestion: GeminiCatalogSuggestion = {
    title: optionalString(nested.title, GEMINI_TEXT_LIMITS.name),
    subtitle: optionalString(nested.subtitle, GEMINI_TEXT_LIMITS.subtitle),
    description: optionalString(nested.description, GEMINI_TEXT_LIMITS.description),
    highlights: optionalStringList(nested.highlights, GEMINI_TEXT_LIMITS.highlights, GEMINI_TEXT_LIMITS.highlight),
    tags: optionalStringList(nested.tags, GEMINI_TEXT_LIMITS.tags, GEMINI_TEXT_LIMITS.tag),
    visualDirection: parseVisualDirection(nested.visualDirection),
    divergence: optionalString(nested.divergence, GEMINI_TEXT_LIMITS.divergence),
  };
  if (!suggestion.title && !suggestion.subtitle && !suggestion.description && !suggestion.visualDirection) {
    throw new GeminiError(GeminiErrorCode.EMPTY);
  }
  return { suggestion };
}

export function parseGeminiFeature(
  feature: (typeof GeminiFeature)[keyof typeof GeminiFeature],
  raw: string,
): GeminiAdResult | GeminiIcebreakerResult | GeminiChatTopicResult | GeminiMediaResult | GeminiCatalogAssistResult {
  if (!raw.trim()) throw new GeminiError(GeminiErrorCode.EMPTY);
  if (feature === GeminiFeature.B2B_AD) return parseGeminiAd(raw);
  if (feature === GeminiFeature.FIRST_CONTACT) return parseGeminiIcebreaker(raw);
  if (feature === GeminiFeature.ASSISTANT_MEDIA) return parseGeminiMedia(raw);
  if (feature === GeminiFeature.CATALOG_ASSIST) return parseGeminiCatalogAssist(raw);
  return parseGeminiChatTopic(raw);
}

export function composeAdDescription(ad: GeminiAdResult): string {
  const parts = [ad.body || ad.shortDescription, ad.callToAction].filter(Boolean);
  return clipText(parts.join("\n\n"), GEMINI_TEXT_LIMITS.description);
}

export function composeMediaSuggestion(media: GeminiMediaResult): string {
  return clipText([media.direction, media.caption].filter(Boolean).join("\n\n"), 400);
}
