import { useCallback, useState } from "react";
import { generateConnexyAI } from "./generate";
import { GEMINI_USER_FALLBACK } from "./gemini-config";
import type { GeminiGenerateRequest, GeminiGenerateResult } from "./gemini-types";

export function useGeminiGenerate() {
  const [loading, setLoading] = useState(false);

  const generate = useCallback(async (request: GeminiGenerateRequest): Promise<GeminiGenerateResult> => {
    setLoading(true);
    try {
      return await generateConnexyAI({ data: request });
    } catch {
      return { ok: false, error: GEMINI_USER_FALLBACK, code: "provider" };
    } finally {
      setLoading(false);
    }
  }, []);

  return { generate, loading };
}
