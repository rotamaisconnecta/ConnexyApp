import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Check, Copy, MessageCircleHeart, Sparkles, WandSparkles, X } from "lucide-react";
import { toast } from "sonner";

type AssistantMode = "media" | "invite" | "conversations";

const prompts: Record<AssistantMode, { label: string; title: string; helper: string; initial: string }> = {
  media: {
    label: "Criar mídia",
    title: "Ideia para sua mídia",
    helper: "Descreva o momento, o local ou a mensagem que você quer publicar.",
    initial: "Um momento especial que quero compartilhar no Connexy",
  },
  invite: {
    label: "Pedido de conversa",
    title: "Convite mais natural",
    helper: "Escreva o nome ou o contexto e receba uma sugestão editável.",
    initial: "Quero convidar Diego para conversar sobre lugares novos na região",
  },
  conversations: {
    label: "Acompanhar conversas",
    title: "Próximo passo da conversa",
    helper: "O assistente organiza o contexto e sugere uma resposta respeitosa.",
    initial: "Conversa sobre combinar de conhecer o Burger House",
  },
};

function suggestionFor(mode: AssistantMode, value: string): string {
  const context = value.trim() || "este momento";
  if (mode === "media") {
    return `Sugestão de legenda: “${context}. Mais um lugar que vale guardar — quem topa descobrir comigo?”`;
  }
  if (mode === "invite") {
    return `Oi! Vi que temos interesses em comum. Que tal conversar sobre ${context.toLocaleLowerCase("pt-BR")}?`;
  }
  return `Resumo: a conversa está em um tom leve sobre ${context.toLocaleLowerCase("pt-BR")}. Próximo passo sugerido: confirmar um horário e enviar o convite para ir junto.`;
}

export function ConnexyAiAssistant() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AssistantMode>("media");
  const [input, setInput] = useState(prompts.media.initial);
  const [result, setResult] = useState("");

  const selectMode = (next: AssistantMode) => {
    setMode(next);
    setInput(prompts[next].initial);
    setResult("");
  };

  const generate = () => setResult(suggestionFor(mode, input));

  const copyResult = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      toast.success("Sugestão copiada. Você pode personalizá-la antes de enviar.");
    } catch {
      toast.error("Não foi possível copiar a sugestão agora.");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir assistente Connexy IA"
        className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+5.5rem)] right-4 z-40 grid h-12 w-12 place-items-center rounded-full bg-gradient-brand text-white shadow-elevated transition-transform active:scale-95"
      >
        <Sparkles className="h-5 w-5" />
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
              className="w-full max-w-md rounded-[28px] bg-background p-5 shadow-elevated"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/12 text-primary">
                    <Bot className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-bold">Assistente Connexy</p>
                    <p className="text-[11px] text-muted-foreground">Ideias úteis, sempre editáveis por você.</p>
                  </div>
                </div>
                <button type="button" onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-full bg-secondary" aria-label="Fechar assistente">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2">
                {(Object.keys(prompts) as AssistantMode[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => selectMode(item)}
                    className={`min-h-16 rounded-2xl px-2 text-[10px] font-semibold transition ${mode === item ? "bg-primary text-white shadow-soft" : "bg-secondary text-foreground"}`}
                  >
                    {item === "media" ? <WandSparkles className="mx-auto mb-1 h-4 w-4" /> : item === "invite" ? <MessageCircleHeart className="mx-auto mb-1 h-4 w-4" /> : <Check className="mx-auto mb-1 h-4 w-4" />}
                    {prompts[item].label}
                  </button>
                ))}
              </div>

              <h2 className="mt-5 font-display text-lg font-bold">{prompts[mode].title}</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{prompts[mode].helper}</p>
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                rows={3}
                className="mt-4 w-full resize-none rounded-2xl bg-secondary px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button type="button" onClick={generate} className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-gradient-brand text-sm font-bold text-white shadow-elegant">
                <Sparkles className="h-4 w-4" /> Criar sugestão
              </button>

              {result && (
                <div className="mt-4 rounded-2xl border border-primary/15 bg-primary/5 p-4">
                  <p className="text-sm leading-relaxed">{result}</p>
                  <button type="button" onClick={() => void copyResult()} className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-primary">
                    <Copy className="h-3.5 w-3.5" /> Copiar e personalizar
                  </button>
                </div>
              )}
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
