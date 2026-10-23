import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { getDemoIdentity } from "@/lib/demo/demo-identity";
import { GEMINI_USER_FALLBACK } from "@/lib/gemini/gemini-config";
import {
  GEMINI_IMAGE_MAX_BYTES,
  GEMINI_IMAGE_MAX_COUNT,
  fileToGeminiImage,
  isAllowedGeminiImageMime,
} from "@/lib/gemini/gemini-images";
import { GeminiFeature, type GeminiCatalogAssistKind, type GeminiCatalogSuggestion } from "@/lib/gemini/gemini-types";
import { useGeminiGenerate } from "@/lib/gemini/use-gemini";

type AssistStatus = "idle" | "loading" | "success" | "empty" | "error" | "rate-limited" | "timeout";

export type CatalogAssistContext = {
  title?: string;
  name?: string;
  description?: string;
  category?: string;
  location?: string;
  extra?: string;
};

function statusFromCode(code: string): AssistStatus {
  if (code === "rate_limit") return "rate-limited";
  if (code === "timeout") return "timeout";
  if (code === "empty") return "empty";
  return "error";
}

export function AIContentAssist({
  kind,
  context,
  onApply,
}: {
  kind: GeminiCatalogAssistKind;
  context: CatalogAssistContext;
  onApply: (suggestion: GeminiCatalogSuggestion) => void;
}) {
  const { generate, loading } = useGeminiGenerate();
  const [open, setOpen] = useState(false);
  const [intent, setIntent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [status, setStatus] = useState<AssistStatus>("idle");
  const [message, setMessage] = useState("");
  const [suggestion, setSuggestion] = useState<GeminiCatalogSuggestion | null>(null);
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDescription, setDraftDescription] = useState("");

  const hasContext = Boolean(
    context.title?.trim() || context.name?.trim() || context.description?.trim() || images.length,
  );

  function resetImages(next: File[]) {
    previews.forEach((url) => URL.revokeObjectURL(url));
    setImages(next);
    setPreviews(next.map((file) => URL.createObjectURL(file)));
  }

  function addImages(list: FileList | null) {
    if (!list) return;
    const accepted: File[] = [];
    for (const file of Array.from(list)) {
      if (!isAllowedGeminiImageMime(file.type) || file.size > GEMINI_IMAGE_MAX_BYTES) {
        toast.error("Use JPEG, PNG, WebP ou GIF de até 4 MB.");
        continue;
      }
      accepted.push(file);
    }
    resetImages([...images, ...accepted].slice(0, GEMINI_IMAGE_MAX_COUNT));
  }

  async function requestSuggestion() {
    setStatus("loading");
    setMessage("");
    setSuggestion(null);
    setEditing(false);
    let payload: Awaited<ReturnType<typeof fileToGeminiImage>>[] = [];
    try {
      payload = await Promise.all(images.map((file) => fileToGeminiImage(file)));
    } catch {
      setStatus("error");
      setMessage("Essa imagem não pôde ser analisada. Use JPEG, PNG, WebP ou GIF de até 4 MB.");
      return;
    }
    const response = await generate({
      feature: GeminiFeature.CATALOG_ASSIST,
      actorId: getDemoIdentity().id,
      images: payload.length > 0 ? payload : undefined,
      input: {
        kind,
        intent: intent || undefined,
        title: context.title,
        name: context.name,
        description: context.description,
        category: context.category,
        location: context.location,
        extra: context.extra,
      },
    });
    if (!response.ok) {
      const next = statusFromCode(response.code);
      setStatus(next);
      setMessage(
        next === "rate-limited"
          ? response.error
          : GEMINI_USER_FALLBACK,
      );
      return;
    }
    const data = response.data as { suggestion?: GeminiCatalogSuggestion };
    if (!data.suggestion) {
      setStatus("empty");
      setMessage(GEMINI_USER_FALLBACK);
      return;
    }
    setSuggestion(data.suggestion);
    setDraftTitle(data.suggestion.title ?? context.title ?? context.name ?? "");
    setDraftDescription(data.suggestion.description ?? context.description ?? "");
    setStatus("success");
  }

  function applyCurrent() {
    if (!suggestion) return;
    onApply(
      editing
        ? { ...suggestion, title: draftTitle, description: draftDescription }
        : suggestion,
    );
    toast.success("Sugestão aplicada. Revise antes de salvar.");
  }

  return (
    <section className="space-y-3 rounded-3xl border border-primary/15 bg-primary/5 p-4">
      <div className="flex items-start gap-3">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-sm font-bold">Ajude-me a criar</h2>
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
            A IA sugere. Você decide o que entra no cadastro.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary/10 text-sm font-bold text-primary"
      >
        <Sparkles className="h-4 w-4" />
        {hasContext ? "Melhorar com IA" : "Ajude-me a criar"}
      </button>
      {open ? (
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-muted-foreground">
            O que você deseja melhorar?
            <textarea
              value={intent}
              onChange={(event) => setIntent(event.target.value)}
              rows={3}
              data-catalog-field="ai-intent"
              placeholder="Ex.: deixar a arte mais profissional e destacar a data."
              className="mt-1.5 w-full rounded-2xl border border-border bg-surface px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs font-semibold text-muted-foreground">
            Imagem para a IA analisar
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              data-catalog-field="ai-image"
              onChange={(event) => {
                addImages(event.target.files);
                event.target.value = "";
              }}
              className="mt-1.5 block w-full text-xs"
            />
          </label>
          {previews.length > 0 ? (
            <div className="flex gap-2 overflow-x-auto">
              {previews.map((src) => (
                <img key={src} src={src} alt="" className="h-16 w-16 rounded-xl object-cover" />
              ))}
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => void requestSuggestion()}
            disabled={loading}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-bold text-primary-foreground disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? "Analisando seu conteúdo..." : "Pedir sugestão"}
          </button>
          {status === "loading" ? (
            <p className="text-xs text-muted-foreground">Analisando seu conteúdo...</p>
          ) : null}
          {status === "error" || status === "empty" || status === "timeout" || status === "rate-limited" ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">{message}</p>
              <button
                type="button"
                onClick={() => void requestSuggestion()}
                className="text-xs font-semibold text-primary"
              >
                Tentar novamente
              </button>
            </div>
          ) : null}
          {status === "success" && suggestion ? (
            <div className="space-y-3 rounded-2xl bg-background p-3" data-catalog-field="ai-result">
              {suggestion.divergence ? (
                <p className="text-xs leading-relaxed text-amber-700">{suggestion.divergence}</p>
              ) : null}
              {editing ? (
                <div className="space-y-2">
                  <input
                    value={draftTitle}
                    onChange={(event) => setDraftTitle(event.target.value)}
                    className="h-10 w-full rounded-xl border border-border px-3 text-sm"
                  />
                  <textarea
                    value={draftDescription}
                    onChange={(event) => setDraftDescription(event.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-border px-3 py-2 text-sm"
                  />
                </div>
              ) : (
                <div className="space-y-1 text-sm">
                  {suggestion.title ? <p className="font-semibold">{suggestion.title}</p> : null}
                  {suggestion.subtitle ? <p className="text-xs text-muted-foreground">{suggestion.subtitle}</p> : null}
                  {suggestion.description ? <p className="text-xs leading-relaxed">{suggestion.description}</p> : null}
                  {suggestion.visualDirection?.composition ? (
                    <p className="text-xs text-muted-foreground">{suggestion.visualDirection.composition}</p>
                  ) : null}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={applyCurrent} className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
                  Usar sugestão
                </button>
                <button type="button" onClick={() => setEditing(true)} className="rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold">
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSuggestion(null);
                    setStatus("idle");
                  }}
                  className="rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold"
                >
                  Descartar
                </button>
                <button type="button" onClick={() => void requestSuggestion()} className="rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold">
                  Tentar novamente
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
