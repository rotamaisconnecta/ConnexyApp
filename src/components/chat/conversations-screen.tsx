import { useMemo, useState, type MouseEventHandler } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { Archive, Bell, BellOff, MessagesSquare, Pin, Search, X } from "lucide-react";
import { StatusBar } from "@/components/phone-frame";
import { ConversationRow } from "./conversation-row";
import { ContinueCard } from "./continue-card";
import { cn } from "@/lib/utils";
import {
  MOCK_CONVERSATIONS,
  NextGesture,
  searchMockConversations,
  sortMockConversations,
} from "@/lib/chat/mock-conversations";
import type { MockConversation } from "@/lib/chat/mock-conversations";

const listContainer = {
  hidden: { opacity: 1 },
  visible: { opacity: 1, transition: { staggerChildren: 0.035 } },
};

export function ConversationsScreen() {
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const initial = reducedMotion ? false : "hidden";

  const [conversations, setConversations] = useState<MockConversation[]>(() =>
    MOCK_CONVERSATIONS.map((c) => ({ ...c, updatedAt: new Date(c.updatedAt.getTime()) })),
  );
  const [query, setQuery] = useState("");
  const [menuTarget, setMenuTarget] = useState<MockConversation | null>(null);

  const sorted = useMemo(() => sortMockConversations(conversations), [conversations]);
  const filtered = useMemo(() => searchMockConversations(sorted, query), [sorted, query]);
  const continueItems = useMemo(
    () => (query.trim() ? [] : sorted.filter((c) => c.nextGesture).slice(0, 2)),
    [sorted, query],
  );

  const hasQuery = query.trim().length > 0;

  function openConversation(id: string) {
    navigate({ to: "/chat/$conversationId", params: { conversationId: id } });
  }

  function handleGesture(conversation: MockConversation) {
    if (conversation.nextGesture === NextGesture.CONFIRM) {
      setConversations((prev) =>
        prev.map((c) => (c.id === conversation.id ? { ...c, nextGesture: undefined } : c)),
      );
      toast.success("Horário confirmado");
      return;
    }
    openConversation(conversation.id);
  }

  function toggleMuted(conversation: MockConversation) {
    setConversations((prev) =>
      prev.map((c) => (c.id === conversation.id ? { ...c, isMuted: !c.isMuted } : c)),
    );
    toast.success(conversation.isMuted ? "Notificações ativadas" : "Conversa silenciada");
  }

  function togglePinned(conversation: MockConversation) {
    setConversations((prev) =>
      prev.map((c) => (c.id === conversation.id ? { ...c, isPinned: !c.isPinned } : c)),
    );
    toast.success(conversation.isPinned ? "Conversa desafixada" : "Conversa fixada");
  }

  function archive(conversation: MockConversation) {
    setMenuTarget(null);
    setConversations((prev) => prev.filter((c) => c.id !== conversation.id));
    toast.success("Conversa arquivada", {
      action: {
        label: "Desfazer",
        onClick: () =>
          setConversations((prev) => [
            ...prev,
            { ...conversation, updatedAt: new Date(conversation.updatedAt.getTime()) },
          ]),
      },
    });
  }

  return (
    <div className="flex-1 pb-[calc(env(safe-area-inset-bottom,0px)+5.5rem)]">
      <StatusBar />

      <motion.header
        initial={reducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="px-5 pt-1"
      >
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-[32px] font-bold leading-tight tracking-tight">
              Conversas
            </h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">Conexões que continuam</p>
          </div>
        </div>

        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar pessoa ou assunto"
            aria-label="Buscar pessoa ou assunto"
            className="h-11 w-full rounded-2xl border border-border bg-surface pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground shadow-soft outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-ring/30"
          />
          {hasQuery && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Limpar busca"
              className="absolute right-2.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </motion.header>

      {conversations.length === 0 ? (
        <div className="px-8 pt-24 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-gradient-brand shadow-elegant">
            <MessagesSquare className="h-7 w-7 text-white" strokeWidth={2.1} />
          </div>
          <h3 className="mt-5 font-display text-lg font-bold">
            Toda conexão começa com um primeiro oi.
          </h3>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Quando você iniciar uma conversa, ela aparecerá aqui.
          </p>
          <button
            type="button"
            onClick={() => navigate({ to: "/connecta" })}
            className="mt-6 h-11 rounded-2xl bg-gradient-brand px-6 font-semibold text-white shadow-elegant transition-transform active:scale-95"
          >
            Encontrar pessoas
          </button>
        </div>
      ) : hasQuery && filtered.length === 0 ? (
        <div className="px-8 pt-24 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-3xl bg-secondary">
            <Search className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-5 font-display text-lg font-bold">Nenhuma conversa encontrada</h3>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Tente buscar por uma pessoa, interesse ou assunto.
          </p>
        </div>
      ) : (
        <>
          {continueItems.length > 0 && (
            <motion.section
              initial={reducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.05, duration: 0.25 }}
              className="mt-5"
            >
              <h2 className="px-5 text-[13px] font-semibold text-muted-foreground">
                Continuar de onde parou
              </h2>
              <motion.div
                variants={listContainer}
                initial={initial}
                animate="visible"
                className="-mx-5 mt-2.5 flex gap-3 overflow-x-auto px-5 pb-1 no-scrollbar"
              >
                {continueItems.map((conversation) => (
                  <ContinueCard
                    key={conversation.id}
                    conversation={conversation}
                    onGesture={handleGesture}
                  />
                ))}
              </motion.div>
            </motion.section>
          )}

          <section className="mt-6">
            <h2 className="px-5 text-[13px] font-semibold text-muted-foreground">
              Todas as conversas
            </h2>
            <motion.div
              variants={listContainer}
              initial={initial}
              animate="visible"
              className="mt-1"
            >
              {filtered.map((conversation) => (
                <ConversationRow
                  key={conversation.id}
                  conversation={conversation}
                  onGesture={handleGesture}
                  onMenu={setMenuTarget}
                />
              ))}
            </motion.div>
          </section>
        </>
      )}

      <AnimatePresence>
        {menuTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
          >
            <button
              type="button"
              aria-label="Fechar opções"
              onClick={() => setMenuTarget(null)}
              className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
            />
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute inset-x-0 bottom-0 mx-auto max-w-[420px] rounded-t-3xl border-t border-border bg-surface p-3 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] shadow-elegant"
            >
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" />
              <p className="px-2 pb-2 text-sm font-semibold text-muted-foreground">
                {menuTarget.participant.name}
              </p>
              <SheetAction
                icon={menuTarget.isMuted ? Bell : BellOff}
                label={menuTarget.isMuted ? "Ativar notificações" : "Silenciar"}
                onClick={(event) => {
                  event.stopPropagation();
                  toggleMuted(menuTarget);
                  setMenuTarget(null);
                }}
              />
              <SheetAction
                icon={Pin}
                label={menuTarget.isPinned ? "Desafixar" : "Fixar"}
                onClick={(event) => {
                  event.stopPropagation();
                  togglePinned(menuTarget);
                  setMenuTarget(null);
                }}
              />
              <SheetAction
                icon={Archive}
                label="Arquivar"
                onClick={(event) => {
                  event.stopPropagation();
                  archive(menuTarget);
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SheetAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Pin;
  label: string;
  onClick: MouseEventHandler<HTMLButtonElement>;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-[15px] transition-colors",
        "hover:bg-accent active:bg-accent",
      )}
    >
      <Icon className="h-[18px] w-[18px] text-foreground/80" strokeWidth={2.1} />
      {label}
    </button>
  );
}
