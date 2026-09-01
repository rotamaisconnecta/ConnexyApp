import { useCallback, useEffect, useMemo, useState, type MouseEventHandler } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { Archive, Bell, BellOff, Loader2, MessagesSquare, Pin, Search, X } from "lucide-react";
import { StatusBar } from "@/components/phone-frame";
import { ConversationRow } from "./conversation-row";
import { ContinueCard } from "./continue-card";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { ChatService } from "@/services/chat.service";
import { UserRepository } from "@/repositories/user.repository";
import { isPublicSupabaseConfigured } from "@/lib/supabase/config";
import { isDemoMode } from "@/lib/demo/demo-config";
import { subscribeDemoDB, isConnected, getConversationLastMessage } from "@/lib/demo/demo-db";
import { people } from "@/lib/mock-data";
import {
  MOCK_CONVERSATIONS,
  NextGesture,
  searchMockConversations,
  sortMockConversations,
  ThreadIcon,
  LastMessageType,
  type MockConversation,
} from "@/lib/chat/mock-conversations";
import type { ConversationRow as ConversationRowDB } from "@/types/database/tables";

const listContainer = {
  hidden: { opacity: 1 },
  visible: { opacity: 1, transition: { staggerChildren: 0.035 } },
};

interface RealConversation {
  id: string;
  participant: { id: string; name: string; photo: string | null };
  lastMessage: string;
  updatedAt: Date;
  isMuted: boolean;
  isPinned: boolean;
}

export function ConversationsScreen() {
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const initial = reducedMotion ? false : "hidden";
  const { user } = useAuth();
  const configured = isPublicSupabaseConfigured();

  const [realConversations, setRealConversations] = useState<RealConversation[]>([]);
  const [realLoading, setRealLoading] = useState(false);
  const [realError, setRealError] = useState<string | null>(null);

  const [mockConversations, setMockConversations] = useState<MockConversation[]>(() =>
    MOCK_CONVERSATIONS.map((c) => ({ ...c, updatedAt: new Date(c.updatedAt.getTime()) })),
  );
  const [query, setQuery] = useState("");
  const [menuTarget, setMenuTarget] = useState<MockConversation | RealConversation | null>(null);

  // In demo mode, merge locally-created connections into the conversation list.
  const demo = isDemoMode();
  useEffect(() => {
    if (!demo) return;
    const sync = () => {
      const created: MockConversation[] = people
        .filter((p) => isConnected(p.id))
        .map((p) => {
          const last = getConversationLastMessage(p.id);
          return {
            id: p.id,
            participant: { id: p.id, name: p.name, photo: p.photo },
            initials: p.name.slice(0, 2).toUpperCase(),
            isOnline: p.online,
            proximityMeters: p.distanceMeters,
            currentThread: "Conexão local",
            threadIcon: ThreadIcon.COFFEE,
            lastMessage: last?.text ?? "Vocês estão conectados",
            lastMessageType: LastMessageType.TEXT,
            updatedAt: new Date(last?.at ?? Date.now()),
            unreadCount: last && last.from === "them" ? 1 : 0,
            isMuted: false,
            isPinned: false,
            sharedInterest: p.interests[0],
          };
        });
      const existingIds = new Set(mockConversations.map((c) => c.id));
      const addNew = created.filter((c) => !existingIds.has(c.id));
      if (addNew.length > 0) {
        setMockConversations((prev) => [...addNew, ...prev]);
      }
    };
    sync();
    return subscribeDemoDB(sync);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demo]);

  // Load real conversations when Supabase is configured
  useEffect(() => {
    if (!configured || !user?.id) return;
    let active = true;
    (async () => {
      setRealLoading(true);
      setRealError(null);
      try {
        const rows: ConversationRowDB[] = await ChatService.getConversations(user.id);
        const mapped: RealConversation[] = [];
        for (const row of rows) {
          const r = row as Record<string, unknown>;
          const participants = r.participants as
            | { user_id: string; profile?: { name?: string; photo_url?: string } }[]
            | undefined;
          const other = participants?.find((p) => p.user_id !== user.id);
          const name = other?.profile?.name ?? "Conversa";
          const photo = other?.profile?.photo_url ?? null;
          mapped.push({
            id: r.id as string,
            participant: { id: other?.user_id ?? "", name, photo },
            lastMessage: "",
            updatedAt: new Date(r.updated_at as string),
            isMuted: false,
            isPinned: false,
          });
        }
        if (active) setRealConversations(mapped);
      } catch (err) {
        if (active) setRealError(err instanceof Error ? err.message : "Erro ao carregar conversas");
      } finally {
        if (active) setRealLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [configured, user?.id]);

  const conversations = configured ? realConversations : mockConversations;
  const sorted = useMemo(() => {
    if (configured) return realConversations;
    return sortMockConversations(mockConversations);
  }, [configured, realConversations, mockConversations]);

  const filtered = useMemo(() => {
    if (configured) {
      if (!query.trim()) return sorted;
      const q = query.toLowerCase();
      return sorted.filter((c) => c.participant.name.toLowerCase().includes(q));
    }
    return searchMockConversations(sorted as MockConversation[], query);
  }, [configured, sorted, query]);

  const continueItems = useMemo(
    () =>
      query.trim()
        ? []
        : configured
          ? []
          : (sorted as MockConversation[]).filter((c) => c.nextGesture).slice(0, 2),
    [sorted, query, configured],
  );

  const hasQuery = query.trim().length > 0;

  function openConversation(id: string) {
    navigate({ to: "/chat/$conversationId", params: { conversationId: id } });
  }

  function handleGesture(conversation: MockConversation) {
    if (conversation.nextGesture === NextGesture.CONFIRM) {
      setMockConversations((prev) =>
        prev.map((c) => (c.id === conversation.id ? { ...c, nextGesture: undefined } : c)),
      );
      toast.success("Horário confirmado");
      return;
    }
    openConversation(conversation.id);
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

      {/* Loading state (real only) */}
      {configured && realLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      )}

      {/* Error state (real only) */}
      {configured && realError && !realLoading && (
        <div className="px-8 py-16 text-center">
          <p className="text-sm text-muted-foreground">{realError}</p>
          <button
            type="button"
            onClick={() => {
              setRealError(null);
              setRealLoading(true);
              // Trigger re-fetch by updating state
              setRealConversations([]);
            }}
            className="mt-3 text-sm text-primary font-semibold"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Empty state */}
      {!realLoading && !realError && conversations.length === 0 && (
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
      )}

      {/* Search empty */}
      {!realLoading &&
        !realError &&
        hasQuery &&
        filtered.length === 0 &&
        conversations.length > 0 && (
          <div className="px-8 pt-24 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-3xl bg-secondary">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-5 font-display text-lg font-bold">Nenhuma conversa encontrada</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Tente buscar por uma pessoa, interesse ou assunto.
            </p>
          </div>
        )}

      {/* Conversation list */}
      {!realLoading && !realError && filtered.length > 0 && (
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
              {configured
                ? (filtered as RealConversation[]).map((conversation) => (
                    <RealConversationRow
                      key={conversation.id}
                      conversation={conversation}
                      onOpen={openConversation}
                    />
                  ))
                : (filtered as MockConversation[]).map((conversation) => (
                    <ConversationRow
                      key={conversation.id}
                      conversation={conversation}
                      onGesture={handleGesture}
                      onMenu={setMenuTarget as (c: MockConversation) => void}
                    />
                  ))}
            </motion.div>
          </section>
        </>
      )}
    </div>
  );
}

function RealConversationRow({
  conversation,
  onOpen,
}: {
  conversation: RealConversation;
  onOpen: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(conversation.id)}
      className="flex w-full items-center gap-3 px-5 py-3 hover:bg-accent/50 transition-colors text-left"
    >
      <div className="relative shrink-0">
        {conversation.participant.photo ? (
          <img
            src={conversation.participant.photo}
            alt=""
            className="h-11 w-11 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
            {conversation.participant.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">
          {conversation.participant.name}
        </p>
        {conversation.lastMessage && (
          <p className="truncate text-xs text-muted-foreground mt-0.5">
            {conversation.lastMessage}
          </p>
        )}
      </div>
    </button>
  );
}
