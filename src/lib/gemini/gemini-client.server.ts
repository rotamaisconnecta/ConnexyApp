import { GoogleGenAI } from "@google/genai";
import { GEMINI_TIMEOUT_MS, resolveGeminiModel } from "./gemini-config";
import { GeminiError, GeminiErrorCode, mapGeminiHttpStatus } from "./gemini-errors";
import type { GenerateTextParams, GeminiImageInput } from "./gemini-types";

function readGeminiApiKey(): string {
  let key = typeof process !== "undefined" ? process.env.GEMINI_API_KEY?.trim() ?? "" : "";
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1).trim();
  }
  if (!key) throw new GeminiError(GeminiErrorCode.NOT_CONFIGURED);
  return key;
}

function extractText(response: {
  text?: string;
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
}): string {
  const direct = response.text?.trim() ?? "";
  if (direct) return direct;
  const parts = response.candidates?.[0]?.content?.parts ?? [];
  return parts
    .map((part) => part.text?.trim() ?? "")
    .filter(Boolean)
    .join("\n")
    .trim();
}

function thinkingConfigFor(model: string): { thinkingBudget: number } | undefined {
  const id = model.toLowerCase();
  if (id.includes("lite")) return undefined;
  if (id.includes("3.8") || id.includes("2.5-flash") || id.includes("2.5-pro")) {
    return { thinkingBudget: 0 };
  }
  return undefined;
}

function buildContents(prompt: string, images: GeminiImageInput[] | undefined) {
  if (!images?.length) return prompt;
  return [
    {
      role: "user" as const,
      parts: [
        { text: prompt },
        ...images.map((image) => ({
          inlineData: {
            mimeType: image.mimeType,
            data: image.data,
          },
        })),
      ],
    },
  ];
}

export async function generateGeminiText(params: GenerateTextParams): Promise<string> {
  const apiKey = readGeminiApiKey();
  const model = resolveGeminiModel();
  const timeoutMs = params.timeoutMs ?? GEMINI_TIMEOUT_MS;
  const ai = new GoogleGenAI({ apiKey });

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new GeminiError(GeminiErrorCode.TIMEOUT)), timeoutMs);
  });

  const thinkingConfig = thinkingConfigFor(model);

  try {
    const response = await Promise.race([
      ai.models.generateContent({
        model,
        contents: buildContents(params.prompt, params.images),
        config: {
          systemInstruction: params.systemInstruction,
          maxOutputTokens: params.maxOutputTokens,
          temperature: 0.7,
          responseMimeType: "application/json",
          ...(thinkingConfig ? { thinkingConfig } : {}),
        },
      }),
      timeout,
    ]);
    const text = extractText(response);
    if (!text) throw new GeminiError(GeminiErrorCode.EMPTY);
    return text;
  } catch (error) {
    if (error instanceof GeminiError) throw error;
    const status =
      typeof error === "object" && error && "status" in error
        ? Number((error as { status?: unknown }).status)
        : NaN;
    if (Number.isFinite(status) && status > 0) {
      throw new GeminiError(mapGeminiHttpStatus(status));
    }
    throw new GeminiError(GeminiErrorCode.PROVIDER);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
