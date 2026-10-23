export const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash-lite";

export const GEMINI_TIMEOUT_MS = 12_000;
export const GEMINI_MAX_OUTPUT_TOKENS = 1024;
export const GEMINI_RATE_LIMIT_PER_MINUTE = 8;
export const GEMINI_RATE_WINDOW_MS = 60_000;
export const GEMINI_CACHE_TTL_MS = 5 * 60_000;
export const GEMINI_CACHE_MAX_ENTRIES = 50;

export const GEMINI_CHAT_MESSAGE_WINDOW = 8;
export const GEMINI_CHAT_MESSAGE_CHARS = 180;
export const GEMINI_TEXT_LIMITS = {
  name: 80,
  category: 40,
  product: 120,
  description: 400,
  offer: 160,
  audience: 80,
  tone: 40,
  extra: 200,
  intent: 200,
  avoid: 220,
  headline: 120,
  interest: 40,
  interests: 6,
  message: 240,
  suggestion: 220,
  caption: 220,
  direction: 220,
  subtitle: 120,
  highlight: 80,
  highlights: 6,
  tag: 40,
  tags: 8,
  visual: 220,
  imagePrompt: 400,
  divergence: 240,
} as const;

export const GEMINI_USER_FALLBACK =
  "Não foi possível gerar uma sugestão agora. Tente novamente.";

export function resolveGeminiModel(): string {
  if (typeof process === "undefined" || typeof process.env === "undefined") {
    return DEFAULT_GEMINI_MODEL;
  }
  const configured = process.env.GEMINI_MODEL?.trim();
  return configured || DEFAULT_GEMINI_MODEL;
}
