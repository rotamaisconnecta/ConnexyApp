/* =========================================================
   share-connexy.ts — Compartilhamento institucional do Connexy.
   Pure TypeScript (com helpers SSR-safe). Sem Supabase.
   URL base: VITE_APP_URL ou window.location.origin.
========================================================= */

export const CONNEXY_SHARE_MESSAGE =
  "Vem fazer parte do Connexy comigo — o ecossistema que conecta pessoas, lugares e momentos ao redor de você.";

export function getConnexyAppUrl(): string {
  const configured = import.meta.env.VITE_APP_URL;
  if (configured) return String(configured).replace(/\/+$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "https://connexy.app";
}

export function buildConnexyShareText(): string {
  return `${CONNEXY_SHARE_MESSAGE}\n\n${getConnexyAppUrl()}`;
}

export function getWhatsAppShareUrl(): string {
  return `https://wa.me/?text=${encodeURIComponent(buildConnexyShareText())}`;
}

export function supportsNativeShare(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

export async function copyConnexyLink(): Promise<boolean> {
  const text = buildConnexyShareText();
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "0";
    textarea.style.left = "0";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export type ConnexyShareTarget = "whatsapp" | "native" | "copy";

export interface ConnexyShareResult {
  ok: boolean;
  canceled?: boolean;
}

export async function shareConnexy(target: ConnexyShareTarget): Promise<ConnexyShareResult> {
  if (target === "copy") {
    return { ok: await copyConnexyLink() };
  }
  if (target === "whatsapp") {
    window.open(getWhatsAppShareUrl(), "_blank", "noopener,noreferrer");
    return { ok: true };
  }
  if (!supportsNativeShare()) return { ok: false };
  try {
    await navigator.share({
      title: "Connexy",
      text: CONNEXY_SHARE_MESSAGE,
      url: getConnexyAppUrl(),
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { ok: false, canceled: true };
    }
    return { ok: false };
  }
}
