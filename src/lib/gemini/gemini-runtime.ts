import { GEMINI_MAX_OUTPUT_TOKENS, GEMINI_TIMEOUT_MS } from "./gemini-config";
import { GeminiError, GeminiErrorCode, geminiErrorCode, geminiUserMessage } from "./gemini-errors";
import { fingerprintGeminiImage, sanitizeGeminiImages } from "./gemini-images";
import { parseGeminiFeature } from "./gemini-parse";
import {
  buildGeminiPrompt,
  sanitizeAdInput,
  sanitizeCatalogAssistInput,
  sanitizeChatTopicInput,
  sanitizeIcebreakerInput,
  sanitizeMediaInput,
} from "./gemini-prompts";
import {
  assertGeminiRateLimit,
  cacheKey,
  readGeminiCache,
  usageKey,
  writeGeminiCache,
} from "./gemini-usage";
import type {
  GeminiAdInput,
  GeminiCatalogAssistInput,
  GeminiChatTopicInput,
  GeminiGenerateRequest,
  GeminiGenerateResult,
  GeminiIcebreakerInput,
  GeminiMediaInput,
  GenerateTextFn,
} from "./gemini-types";
import { GeminiFeature } from "./gemini-types";

export type GeminiRuntimeDeps = {
  generateText: GenerateTextFn;
  now?: () => number;
};

function sanitizeRequest(request: GeminiGenerateRequest): GeminiGenerateRequest {
  const images =
    request.feature === GeminiFeature.CATALOG_ASSIST
      ? sanitizeGeminiImages(request.images)
      : [];
  if (request.feature === GeminiFeature.B2B_AD) {
    return { ...request, input: sanitizeAdInput(request.input), images };
  }
  if (request.feature === GeminiFeature.FIRST_CONTACT) {
    return { ...request, input: sanitizeIcebreakerInput(request.input), images };
  }
  if (request.feature === GeminiFeature.ASSISTANT_MEDIA) {
    return { ...request, input: sanitizeMediaInput(request.input), images };
  }
  if (request.feature === GeminiFeature.CATALOG_ASSIST) {
    return { ...request, input: sanitizeCatalogAssistInput(request.input), images };
  }
  return { ...request, input: sanitizeChatTopicInput(request.input), images };
}

function promptFor(request: GeminiGenerateRequest, imageCount: number) {
  if (request.feature === GeminiFeature.B2B_AD) {
    return buildGeminiPrompt(GeminiFeature.B2B_AD, request.input as GeminiAdInput);
  }
  if (request.feature === GeminiFeature.FIRST_CONTACT) {
    return buildGeminiPrompt(GeminiFeature.FIRST_CONTACT, request.input as GeminiIcebreakerInput);
  }
  if (request.feature === GeminiFeature.ASSISTANT_MEDIA) {
    return buildGeminiPrompt(GeminiFeature.ASSISTANT_MEDIA, request.input as GeminiMediaInput);
  }
  if (request.feature === GeminiFeature.CATALOG_ASSIST) {
    return buildGeminiPrompt(
      GeminiFeature.CATALOG_ASSIST,
      request.input as GeminiCatalogAssistInput,
      imageCount,
    );
  }
  return buildGeminiPrompt(GeminiFeature.CHAT_TOPIC, request.input as GeminiChatTopicInput);
}

export async function runGeminiFeature(
  request: GeminiGenerateRequest,
  deps: GeminiRuntimeDeps,
): Promise<GeminiGenerateResult> {
  try {
    const sanitized = sanitizeRequest(request);
    const images = sanitized.images ?? [];
    const key = cacheKey(sanitized.feature, {
      input: sanitized.input,
      images: images.map(fingerprintGeminiImage),
    });
    const cached = readGeminiCache(key, deps.now);
    if (cached) {
      return { ok: true, data: parseGeminiFeature(sanitized.feature, cached) };
    }
    const actor = sanitized.actorId?.trim() || "anonymous";
    assertGeminiRateLimit(usageKey(sanitized.feature, actor), deps.now);

    const built = promptFor(sanitized, images.length);
    if (!built.prompt.trim()) {
      throw new GeminiError(GeminiErrorCode.EMPTY);
    }

    const raw = await deps.generateText({
      prompt: built.prompt,
      systemInstruction: built.systemInstruction,
      maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
      timeoutMs: GEMINI_TIMEOUT_MS,
      images: images.length > 0 ? images : undefined,
    });
    const data = parseGeminiFeature(sanitized.feature, raw);
    writeGeminiCache(key, raw, deps.now);
    return { ok: true, data };
  } catch (error) {
    console.warn("[connexy:gemini]", geminiErrorCode(error));
    return {
      ok: false,
      error: geminiUserMessage(error),
      code: geminiErrorCode(error),
    };
  }
}
