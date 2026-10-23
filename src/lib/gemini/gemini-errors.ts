import { GEMINI_USER_FALLBACK } from "./gemini-config";

export const GeminiErrorCode = {
  NOT_CONFIGURED: "not_configured",
  TIMEOUT: "timeout",
  EMPTY: "empty",
  INVALID: "invalid",
  INVALID_IMAGE: "invalid_image",
  RATE_LIMIT: "rate_limit",
  NOT_FOUND: "not_found",
  UNAVAILABLE: "unavailable",
  PROVIDER: "provider",
} as const;

export type GeminiErrorCodeValue = (typeof GeminiErrorCode)[keyof typeof GeminiErrorCode];

const USER_MESSAGES: Record<GeminiErrorCodeValue, string> = {
  not_configured: "A IA ainda não está configurada neste ambiente.",
  timeout: GEMINI_USER_FALLBACK,
  empty: GEMINI_USER_FALLBACK,
  invalid: GEMINI_USER_FALLBACK,
  invalid_image: "Essa imagem não pôde ser analisada. Use JPEG, PNG, WebP ou GIF de até 4 MB.",
  rate_limit: "Muitas sugestões em pouco tempo. Aguarde um instante e tente de novo.",
  not_found: GEMINI_USER_FALLBACK,
  unavailable: GEMINI_USER_FALLBACK,
  provider: GEMINI_USER_FALLBACK,
};

export function mapGeminiHttpStatus(status: number): GeminiErrorCodeValue {
  if (status === 429) return GeminiErrorCode.RATE_LIMIT;
  if (status === 404) return GeminiErrorCode.NOT_FOUND;
  if (status === 503) return GeminiErrorCode.UNAVAILABLE;
  return GeminiErrorCode.PROVIDER;
}

export class GeminiError extends Error {
  readonly code: GeminiErrorCodeValue;

  constructor(code: GeminiErrorCodeValue, message = USER_MESSAGES[code]) {
    super(message);
    this.name = "GeminiError";
    this.code = code;
  }

  toUserMessage(): string {
    return USER_MESSAGES[this.code] ?? GEMINI_USER_FALLBACK;
  }
}

export function geminiUserMessage(error: unknown): string {
  if (error instanceof GeminiError) return error.toUserMessage();
  return GEMINI_USER_FALLBACK;
}

export function geminiErrorCode(error: unknown): string {
  if (error instanceof GeminiError) return error.code;
  return GeminiErrorCode.PROVIDER;
}
