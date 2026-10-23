import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Copy, ImagePlus, Loader2, MessageCircle, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getDemoIdentity } from "@/lib/demo/demo-identity";
import { generateConnexyAI } from "@/lib/gemini/generate";
import { GEMINI_USER_FALLBACK } from "@/lib/gemini/gemini-config";
import { composeMediaSuggestion } from "@/lib/gemini/gemini-parse";
import { GeminiFeature } from "@/lib/gemini/gemini-types";
import type {
  GeminiChatTopicInput,
  GeminiChatTopicResult,
  GeminiGenerateResult,
  GeminiIcebreakerInput,
  GeminiIcebreakerResult,
  GeminiMediaResult,
} from "@/lib/gemini/gemini-types";

export type ConnexyAiAssistantMode = "media" | "invite" | "conversations";
type AssistantAction = "media-intent" | "chat-intent" | "chat-continue";

const ASSISTANT_FALLBACK = "Não consegui criar uma sugestão agora. Tente novamente.";

interface ConnexyAiAssistantProps {
  mode: ConnexyAiAssistantMode;
  label?: string;
  className?: string;
  onInsertSuggestion?: (text: string) => void;
  onCreateMedia?: () => void;
  icebreakerContext?: GeminiIcebreakerInput;
  chatContext?: GeminiChatTopicInput;
}

export function ConnexyAiAssistant({
  mode: flowMode,
  label = "Assistente Connexy",
  className,
  onInsertSuggestion,
  onCreateMedia,
  icebreakerContext,
  chatContext,
}: ConnexyAiAssistantProps) {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<AssistantAction | null>(null);
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);

  const conversationFlow = flowMode === "conversations";
  const mediaFlow = flowMode === "media";
  const inviteFlow = flowMode === "invite";

  const openAssistant = () => {
    setAction(null);
    setInput("");
    setResult("");
    setError("");
    setOpen(true);
  };

  const generateInvite = async () => {
    setGenerating(true);
    setError("");
    try {
      const response = (await generateConnexyAI({
        data: {
          feature: GeminiFeature.FIRST_CONTACT,
          actorId: getDemoIdentity().id,
          input: { ...icebreakerContext, notes: input.trim() || undefined },
        },
      })) as GeminiGenerateResult;
      if (!response.ok) {
        toast.error(response.error || GEMINI_USER_FALLBACK);
        return;
      }
      setResult((response.data as GeminiIcebreakerResult).message);
    } catch {
      toast.error(GEMINI_USER_FALLBACK);
    } finally {
      setGenerating(false);
    }
  };

  const generateMedia = async (refresh = false) => {
    if (!input.trim()) {
      setError("Diga o que você quer fazer com essa mídia.");
      setAction("media-intent");
      return;
    }
    setAction("media-intent");
    setGenerating(true);
    setError("");
    try {
      const response = (await generateConnexyAI({
        data: {
          feature: GeminiFeature.ASSISTANT_MEDIA,
          actorId: getDemoIdentity().id,
          input: {
            intent: input.trim(),
            avoid: refresh ? result.trim() || undefined : undefined,
          },
        },
      })) as GeminiGenerateResult;
      if (!response.ok) {
        setError(response.error || ASSISTANT_FALLBACK);
        return;
      }
      setResult(composeMediaSuggestion(response.data as GeminiMediaResult));
    } catch {
      setError(ASSISTANT_FALLBACK);
    } finally {
      setGenerating(false);
    }
  };

  const generateConversation = async (nextAction: "chat-intent" | "chat-continue", refresh = false) => {
    if (nextAction === "chat-intent" && !input.trim()) {
      setError("Diga o que você quer fazer nesta conversa.");
      setAction("chat-intent");
      return;
    }
    setAction(nextAction);
    setGenerating(true);
    setError("");
    try {
      const response = (await generateConnexyAI({
        data: {
          feature: GeminiFeature.CHAT_TOPIC,
          actorId: getDemoIdentity().id,
          input: {
            ...chatContext,
            intent: nextAction === "chat-intent" ? input.trim() : undefined,
            avoid: refresh ? result.trim() || undefined : undefined,
          },
        },
      })) as GeminiGenerateResult;
      if (!response.ok) {
        setError(response.error || ASSISTANT_FALLBACK);
        return;
      }
      setResult((response.data as GeminiChatTopicResult).suggestion);
    } catch {
      setError(ASSISTANT_FALLBACK);
    } finally {
      setGenerating(false);
    }
  };

  const copyResult = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      toast.success("Sugestão copiada. Você pode personalizá-la antes de enviar.");
    } catch {
      toast.error("Não foi possível copiar a sugestão agora.");
    }
  };

  const useResult = () => {
    const text = result.trim();
    if (!text) return;
    if (onInsertSuggestion) {
      onInsertSuggestion(text);
      setOpen(false);
      return;
    }
    void copyResult();
  };

  const createMedia = () => {
    const caption = result.trim() || input.trim();
    if (caption && onInsertSuggestion) onInsertSuggestion(caption);
    onCreateMedia?.();
    setOpen(false);
  };

  const retry = () => {
    if (action === "media-intent") return generateMedia(Boolean(result));
    if (action === "chat-intent" || action === "chat-continue") {
      return generateConversation(action, Boolean(result));
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openAssistant}
        aria-label={label}
        className={cn(
          "inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-2 text-[12px] font-semibold text-primary shadow-[0_8px_20px_rgba(108,59,255,0.08)] transition-transform hover:bg-primary/15 active:scale-[0.98]",
          className,
        )}
      >
        <Sparkles className="h-3.5 w-3.5" />
        {label}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Assistente Connexy IA"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-end bg-black/35 p-3 backdrop-blur-sm sm:items-center sm:justify-center"
            onClick={() => setOpen(false)}
          >
            <motion.section
              initial={{ opacity: 0, y: 28, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              onClick={(event) => event.stopPropagation()}
              className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-[28px] bg-background p-5 shadow-elevated"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/12 text-primary">
                    <Bot className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-bold">Assistente Connexy</p>
                    <p className="text-[11px] text-muted-foreground">
                      Ideias úteis, sempre editáveis por você.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="grid h-9 w-9 place-items-center rounded-full bg-secondary"
                  aria-label="Fechar assistente"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {mediaFlow ? (
                <div className="mt-5 space-y-2">
                  <p className="px-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    Criar mídia
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setAction("media-intent");
                      setError("");
                    }}
                    disabled={generating}
                    className={`w-full rounded-2xl px-4 py-3 text-left transition ${action === "media-intent" ? "bg-primary text-white shadow-soft" : "bg-secondary text-foreground"}`}
                  >
                    <span className="flex items-center gap-2 text-sm font-bold">
                      <Sparkles className="h-4 w-4" />
                      O que você deseja?
                    </span>
                    <span className={`mt-1 block text-[11px] leading-relaxed ${action === "media-intent" ? "text-white/80" : "text-muted-foreground"}`}>
                      Diga o que você quer criar ou melhorar nesta mídia.
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={createMedia}
                    disabled={generating}
                    className="w-full rounded-2xl bg-secondary px-4 py-3 text-left text-foreground"
                  >
                    <span className="flex items-center gap-2 text-sm font-bold">
                      <ImagePlus className="h-4 w-4" />
                      Criar mídia
                    </span>
                    <span className="mt-1 block text-[11px] leading-relaxed text-muted-foreground">
                      Usa a câmera, o anexo e o fluxo de mídia que você já conhece.
                    </span>
                  </button>
                </div>
              ) : null}

              {conversationFlow ? (
                <div className="mt-5 space-y-2">
                  <p className="px-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    Sugestão de conversa
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setAction("chat-intent");
                      setError("");
                    }}
                    disabled={generating}
                    className={`w-full rounded-2xl px-4 py-3 text-left transition ${action === "chat-intent" ? "bg-primary text-white shadow-soft" : "bg-secondary text-foreground"}`}
                  >
                    <span className="flex items-center gap-2 text-sm font-bold">
                      <Sparkles className="h-4 w-4" />
                      O que você deseja?
                    </span>
                    <span className={`mt-1 block text-[11px] leading-relaxed ${action === "chat-intent" ? "text-white/80" : "text-muted-foreground"}`}>
                      Diga o que você quer fazer nesta conversa e eu preparo uma sugestão.
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void generateConversation("chat-continue", Boolean(result))}
                    disabled={generating}
                    className={`w-full rounded-2xl px-4 py-3 text-left transition ${action === "chat-continue" ? "bg-primary text-white shadow-soft" : "bg-secondary text-foreground"}`}
                  >
                    <span className="flex items-center gap-2 text-sm font-bold">
                      <MessageCircle className="h-4 w-4" />
                      Sugestão de conversa
                    </span>
                    <span className={`mt-1 block text-[11px] leading-relaxed ${action === "chat-continue" ? "text-white/80" : "text-muted-foreground"}`}>
                      Veja uma sugestão baseada no contexto desta conversa.
                    </span>
                  </button>
                </div>
              ) : null}

              {inviteFlow ? (
                <>
                  <h2 className="mt-5 font-display text-lg font-bold">Convite mais natural</h2>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Revise a sugestão. Nada é enviado sem você decidir.
                  </p>
                </>
              ) : null}

              {action === "media-intent" || action === "chat-intent" || inviteFlow ? (
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  rows={3}
                  placeholder={
                    action === "media-intent"
                      ? "Ex.: quero deixar essa foto mais profissional"
                      : action === "chat-intent"
                        ? "Ex.: quero chamar para um café"
                        : undefined
                  }
                  className="mt-4 w-full resize-none rounded-2xl bg-secondary px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              ) : null}

              {inviteFlow || action === "media-intent" || action === "chat-intent" ? (
                <button
                  type="button"
                  onClick={() =>
                    void (inviteFlow
                      ? generateInvite()
                      : action === "media-intent"
                        ? generateMedia()
                        : generateConversation("chat-intent"))
                  }
                  disabled={generating}
                  className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-gradient-brand px-4 text-sm font-bold text-white shadow-elegant disabled:opacity-70"
                >
                  {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {generating ? "Pensando em uma boa sugestão..." : "Criar sugestão"}
                </button>
              ) : generating ? (
                <p className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Pensando em uma boa sugestão...
                </p>
              ) : null}

              {error ? (
                <div className="mt-4 rounded-2xl bg-secondary px-4 py-3">
                  <p className="text-xs leading-relaxed text-muted-foreground">{error}</p>
                  {action ? (
                    <button
                      type="button"
                      onClick={() => void retry()}
                      disabled={generating}
                      className="mt-2 text-xs font-bold text-primary"
                    >
                      Tentar novamente
                    </button>
                  ) : null}
                </div>
              ) : null}

              {result ? (
                <div className="mt-4 rounded-2xl border border-primary/15 bg-primary/5 p-4">
                  <label className="text-[11px] font-semibold text-muted-foreground">
                    Editar sugestão
                    <textarea
                      value={result}
                      onChange={(event) => setResult(event.target.value)}
                      rows={3}
                      className="mt-2 w-full resize-none rounded-xl bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </label>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={useResult}
                      className="inline-flex flex-1 items-center justify-center rounded-full bg-primary px-3 py-2 text-xs font-bold text-white"
                    >
                      {conversationFlow || mediaFlow ? "Usar sugestão" : "Usar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setResult("");
                        setError("");
                      }}
                      className="inline-flex flex-1 items-center justify-center rounded-full bg-secondary px-3 py-2 text-xs font-bold text-foreground"
                    >
                      Descartar
                    </button>
                  </div>
                  {action ? (
                    <button
                      type="button"
                      onClick={() =>
                        void (action === "media-intent"
                          ? generateMedia(true)
                          : generateConversation(action === "chat-continue" ? "chat-continue" : "chat-intent", true))
                      }
                      disabled={generating}
                      className="mt-2 text-xs font-bold text-primary disabled:opacity-70"
                    >
                      Nova sugestão
                    </button>
                  ) : null}
                  {!onInsertSuggestion ? (
                    <button
                      type="button"
                      onClick={() => void copyResult()}
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-primary"
                    >
                      <Copy className="h-3.5 w-3.5" /> Copiar
                    </button>
                  ) : null}
                </div>
              ) : null}
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
