import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import {
  Check,
  Loader2,
  MessagesSquare,
  Pin,
  PinOff,
  Search,
  SlidersHorizontal,
  Users,
  X,
} from "lucide-react";
import { StatusBar } from "@/components/phone-frame";
import { ConversationRow } from "./conversation-row";
import { ContinueCard } from "./continue-card";
import { useAuth } from "@/hooks/use-auth";
import { ChatService } from "@/services/chat.service";
import { isPublicSupabaseConfigured } from "@/lib/supabase/config";
import { isDemoMode } from "@/lib/demo/demo-config";
import { isRemoteConversationsEnabled } from "@/lib/chat/schema-a-conversations-flag";
import { getSchemaAConversations } from "@/lib/chat/schema-a-conversations";
import {
  getDemoIdentities,
  getDemoIdentity,
  setDemoIdentity,
  useDemoIdentity,
} from "@/lib/demo/demo-identity";
import { subscribeDemoDB, respondToDemoGroupInvite } from "@/lib/demo/demo-db";
import { useDemoGroupInvites, useDemoPendingRequests } from "@/lib/demo/use-demo-db";
import { people } from "@/lib/mock-data";
import {
  listFunctionalDemoConversations,
  resolveDemoCatalogPerson,
} from "@/lib/chat/functional-conversation-list";
import { isListGesture } from "@/lib/chat/conversation-list-state";
import {
  markLocalListGestureHandled,
  setLocalConversationPinned,
} from "@/lib/chat/local-chat-persistence";
import {
  LastMessageType,
  NextGesture,
  searchMockConversations,
  sortMockConversations,
  ThreadIcon,
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
  const demoIdentity = useDemoIdentity();
  const configured = isPublicSupabaseConfigured();

  const [realConversations, setRealConversations] = useState<RealConversation[]>([]);
  const [realLoading, setRealLoading] = useState(false);
  const [realError, setRealError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"active" | "requests">("active");
  const [filterOpen, setFilterOpen] = useState(false);
  const [onlyOnline, setOnlyOnline] = useState(false);
  const [onlyNearby, setOnlyNearby] = useState(false);
  const [listTick, setListTick] = useState(0);
  const [menuConversationId, setMenuConversationId] = useState<string | null>(null);
  const pendingRequests = useDemoPendingRequests(user?.id);
  const groupInvites = useDemoGroupInvites(user?.id ?? "");

  const demo = isDemoMode();
  const remote = isRemoteConversationsEnabled();
  const [remoteItems, setRemoteItems] = useState<MockConversation[]>([]);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [remoteError, setRemoteError] = useState<string | null>(null);

  useEffect(() => {
    if (!demo || !user?.id) return;
    return subscribeDemoDB(() => setListTick((tick) => tick + 1));
  }, [demo, user?.id]);

  useEffect(() => {
    if (!remote) return;
    let active = true;
    void (async () => {
      setRemoteLoading(true);
      setRemoteError(null);
      try {
        const threads = await getSchemaAConversations().listThreads();
        if (!active) return;
        setRemoteItems(
          threads.map((thread) => {
            const name = thread.conversation.name?.trim() || "Conversa";
            return {
              id: thread.conversation.id,
              participant: {
                id: thread.peerId ?? thread.conversation.id,
                name,
              },
              initials: name.slice(0, 2).toUpperCase(),
              isOnline: false,
              currentThread: "Conversa",
              threadIcon: ThreadIcon.COFFEE,
              lastMessage: thread.conversation.lastMessageText ?? "",
              lastMessageType: LastMessageType.TEXT,
              updatedAt: new Date(thread.conversation.updatedAt),
              unreadCount: thread.unread ? 1 : 0,
              isMuted: false,
              isPinned: thread.pinned,
            } satisfies MockConversation;
          }),
        );
      } catch (err) {
        if (active) {
          setRemoteError(err instanceof Error ? err.message : "Erro ao carregar conversas");
          setRemoteItems([]);
        }
      } finally {
        if (active) setRemoteLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [remote, user?.id, listTick]);

  // Load real conversations when Supabase is configured (legacy path, not Schema A)
  useEffect(() => {
    if (remote || !configured || !user?.id) return;
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
  }, [configured, remote, user?.id]);

  const demoConversationItems = useMemo<MockConversation[]>(() => {
    if (!demo || !user?.id) return [];
    void listTick;
    return listFunctionalDemoConversations(user.id);
  }, [demo, user?.id, listTick]);
  const mockRows = remote ? remoteItems : demoConversationItems;
  const useLegacyConfigured = configured && !remote && !demo;
  const sorted = useMemo(() => {
    if (useLegacyConfigured) return realConversations;
    return sortMockConversations(mockRows);
  }, [useLegacyConfigured, realConversations, mockRows]);

  const filtered = useMemo(() => {
    if (useLegacyConfigured) {
      const items = sorted.filter((conversation) => {
        const person = people.find((item) => item.id === conversation.participant.id);
        if (onlyOnline && person && !person.online) return false;
        if (onlyNearby && person && person.distanceMeters > 2000) return false;
        return true;
      });
      if (!query.trim()) return items;
      const q = query.toLowerCase();
      return items.filter((c) => c.participant.name.toLowerCase().includes(q));
    }
    return searchMockConversations(sorted as MockConversation[], query).filter((conversation) => {
      const person = people.find((item) => item.id === conversation.participant.id);
      if (onlyOnline && person && !person.online) return false;
      return !(onlyNearby && person && person.distanceMeters > 2000);
    });
  }, [useLegacyConfigured, sorted, query, onlyOnline, onlyNearby]);

  const continueItems = useMemo(
    () =>
      query.trim()
        ? []
        : useLegacyConfigured
          ? []
          : (sorted as MockConversation[])
              .filter((conversation) => isListGesture(conversation.nextGesture))
              .slice(0, 2),
    [sorted, query, useLegacyConfigured],
  );

  const hasQuery = query.trim().length > 0;
  const filtersActive = onlyOnline || onlyNearby;
  const filteredRequests = useMemo(
    () =>
      pendingRequests.filter((request) => {
        const person = resolveDemoCatalogPerson(request.fromUserId);
        if (!person) return false;
        if (onlyOnline && !person.online) return false;
        if (onlyNearby && person.distanceMeters > 2000) return false;
        const searchable = `${person.name} ${request.message}`.toLowerCase();
        return !query.trim() || searchable.includes(query.trim().toLowerCase());
      }),
    [pendingRequests, query, onlyOnline, onlyNearby],
  );

  function openConversation(id: string) {
    navigate({ to: "/chat/$conversationId", params: { conversationId: id } });
  }

  function handleGesture(conversation: MockConversation) {
    if (isListGesture(conversation.nextGesture)) {
      void markLocalListGestureHandled(conversation.id);
      if (conversation.nextGesture === NextGesture.LISTEN) {
        toast.success("Áudio reproduzido");
        return;
      }
      if (conversation.nextGesture === NextGesture.CONFIRM) {
        toast.success("Horário confirmado");
        return;
      }
      toast.success("Conversa retomada");
      return;
    }
    openConversation(conversation.id);
  }

  const listLoading = remote ? remoteLoading : useLegacyConfigured && realLoading;
  const listError = remote ? remoteError : useLegacyConfigured ? realError : null;
  const conversations = useLegacyConfigured ? realConversations : mockRows;

  function handleTogglePin(conversation: MockConversation) {
    const nextPinned = !conversation.isPinned;
    if (remote) {
      void getSchemaAConversations()
        .setPinned(conversation.id, nextPinned)
        .then(() => setListTick((tick) => tick + 1))
        .catch((error: unknown) => {
          toast.error(error instanceof Error ? error.message : "Não foi possível fixar.");
        });
      setMenuConversationId(null);
      toast.success(nextPinned ? "Conversa fixada" : "Conversa desafixada");
      return;
    }
    const identityId = getDemoIdentity().id;
    if (!identityId) return;
    void setLocalConversationPinned(conversation.id, identityId, nextPinned);
    setMenuConversationId(null);
    toast.success(nextPinned ? "Conversa fixada" : "Conversa desafixada");
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <StatusBar />

      <motion.header
        initial={reducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="shrink-0 px-5 pt-1"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-[28px] font-bold leading-tight tracking-tight">
              Conversas
            </h1>
            <p className="mt-0.5 text-[12px] text-muted-foreground">Conexões que continuam</p>
          </div>
          <button
            type="button"
            onClick={() => setFilterOpen((open) => !open)}
            aria-label="Filtrar pessoas"
            className={`grid h-10 w-10 place-items-center rounded-full border transition active:scale-95 ${
              filtersActive
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-surface text-muted-foreground"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>

        {isDemoMode() && (
          <label className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-dashed border-primary/30 bg-primary/5 px-3 py-2 text-[11px] text-muted-foreground">
            <span className="font-semibold text-primary">Simulação demo</span>
            <select
              value={demoIdentity.id}
              onChange={(event) => setDemoIdentity(event.target.value)}
              className="max-w-[65%] rounded-lg border border-border bg-surface px-2 py-1 text-xs font-medium text-foreground outline-none"
              aria-label="Alternar identidade demo"
            >
              {getDemoIdentities().map((identity) => (
                <option key={identity.id} value={identity.id}>
                  {identity.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="mt-4 grid grid-cols-2 border-b border-border">
          <button
            type="button"
            onClick={() => setActiveTab("active")}
            className={`relative pb-3 text-[13px] font-semibold transition ${activeTab === "active" ? "text-primary" : "text-muted-foreground"}`}
          >
            Ativas
            {activeTab === "active" && (
              <span className="absolute inset-x-5 -bottom-px h-0.5 rounded-full bg-primary" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("requests")}
            className={`relative flex items-center justify-center gap-1.5 pb-3 text-[13px] font-semibold transition ${activeTab === "requests" ? "text-primary" : "text-muted-foreground"}`}
          >
            Solicitações
            {pendingRequests.length + groupInvites.length > 0 && (
              <span className="grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] text-primary-foreground">
                {pendingRequests.length + groupInvites.length}
              </span>
            )}
            {activeTab === "requests" && (
              <span className="absolute inset-x-5 -bottom-px h-0.5 rounded-full bg-primary" />
            )}
          </button>
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

        {filterOpen && (
          <div className="mt-3 rounded-2xl border border-border bg-surface p-3 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">Filtrar pessoas</span>
              <button
                type="button"
                onClick={() => {
                  setOnlyOnline(false);
                  setOnlyNearby(false);
                }}
                className="text-[11px] font-semibold text-primary"
              >
                Limpar
              </button>
            </div>
            <label className="mt-3 flex items-center justify-between text-sm">
              <span>Disponíveis agora</span>
              <input
                type="checkbox"
                checked={onlyOnline}
                onChange={(event) => setOnlyOnline(event.target.checked)}
                className="h-4 w-4 accent-primary"
              />
            </label>
            <label className="mt-3 flex items-center justify-between text-sm">
              <span>Perto de você</span>
              <input
                type="checkbox"
                checked={onlyNearby}
                onChange={(event) => setOnlyNearby(event.target.checked)}
                className="h-4 w-4 accent-primary"
              />
            </label>
          </div>
        )}
      </motion.header>

      <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar">
        {/* Loading state (real only) */}
        {listLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}

        {/* Error state (real only) */}
        {Boolean(listError) && !listLoading && (
          <div className="px-8 py-16 text-center">
            <p className="text-sm text-muted-foreground">{listError}</p>
            <button
              type="button"
              onClick={() => {
                if (remote) {
                  setRemoteError(null);
                  setListTick((tick) => tick + 1);
                  return;
                }
                setRealError(null);
                setRealLoading(true);
                setRealConversations([]);
              }}
              className="mt-3 text-sm text-primary font-semibold"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Empty state */}
        {!listLoading && !listError && activeTab === "active" && conversations.length === 0 && (
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
        {!listLoading &&
          !listError &&
          activeTab === "active" &&
          (hasQuery || filtersActive) &&
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
        {!listLoading && !listError && activeTab === "active" && filtered.length > 0 && (
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
                {useLegacyConfigured
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
                        onMenu={(item) => setMenuConversationId(item.id)}
                      />
                    ))}
              </motion.div>
            </section>
          </>
        )}

        {!listLoading && !listError && activeTab === "requests" && (
          <section className="mt-5 px-5">
            {filteredRequests.length > 0 || groupInvites.length > 0 ? (
              <div className="space-y-2.5">
                {groupInvites.map((group) => {
                  const inviter = people.find((person) => person.id === group.creatorId);
                  const participantNames = group.participants
                    .filter((participant) => participant.userId !== user?.id)
                    .map(
                      (participant) =>
                        people.find((person) => person.id === participant.userId)?.name,
                    )
                    .filter(Boolean)
                    .join(", ");
                  return (
                    <article
                      key={group.id}
                      className="rounded-2xl border border-primary/20 bg-primary/5 p-3 shadow-soft"
                    >
                      <div className="flex gap-3">
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary text-white">
                          <Users className="h-5 w-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold">Convite para {group.name}</p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {inviter?.name ?? "Uma conexão"} convidou você. Participantes:{" "}
                            {participantNames || "você"}.
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            respondToDemoGroupInvite(group.id, user?.id ?? "", false);
                            toast.info("Convite recusado.");
                          }}
                          className="h-9 rounded-full border border-border bg-surface text-xs font-semibold"
                        >
                          Recusar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const result = respondToDemoGroupInvite(group.id, user?.id ?? "", true);
                            if (!result) return;
                            toast.success("Convite aceito.");
                            openConversation(group.id);
                          }}
                          className="h-9 rounded-full bg-primary text-xs font-semibold text-primary-foreground"
                        >
                          <Check className="mr-1 inline h-3.5 w-3.5" />
                          Aceitar
                        </button>
                      </div>
                    </article>
                  );
                })}
                {filteredRequests.map((request) => {
                  const person = resolveDemoCatalogPerson(request.fromUserId);
                  if (!person) return null;
                  return (
                    <button
                      key={request.id}
                      type="button"
                      onClick={() =>
                        navigate({
                          to: "/solicitacao/$id",
                          params: { id: person.id },
                          search: { mode: "receive" },
                        })
                      }
                      className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface p-3 text-left shadow-soft transition active:scale-[0.99]"
                    >
                      <span className="relative shrink-0">
                        <img
                          src={person.photo}
                          alt=""
                          className="h-12 w-12 rounded-full object-cover"
                        />
                        <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-surface bg-primary" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold">{person.name}</span>
                        <span className="mt-0.5 line-clamp-2 block text-[11px] text-muted-foreground">
                          {request.message || "Quer iniciar uma conversa com você."}
                        </span>
                      </span>
                      <span className="rounded-full bg-primary/10 px-3 py-1.5 text-[10px] font-bold text-primary">
                        Ver
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-border px-6 py-12 text-center">
                <MessagesSquare className="mx-auto h-6 w-6 text-primary" />
                <h2 className="mt-3 font-display text-base font-bold">Nenhuma solicitação agora</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Novos convites para conversar aparecerão aqui.
                </p>
              </div>
            )}
          </section>
        )}
      </div>

      {menuConversationId && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Fechar opções da conversa"
            className="absolute inset-0 bg-black/20"
            onClick={() => setMenuConversationId(null)}
          />
          <div
            role="menu"
            aria-label="Opções da conversa"
            className="absolute right-4 top-[7.5rem] w-52 overflow-hidden rounded-2xl border border-border bg-surface p-1 shadow-elevated"
          >
            {(filtered as MockConversation[])
              .filter((conversation) => conversation.id === menuConversationId)
              .map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  role="menuitem"
                  onClick={() => handleTogglePin(conversation)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold hover:bg-accent/50"
                >
                  {conversation.isPinned ? (
                    <PinOff className="h-4 w-4 text-primary" />
                  ) : (
                    <Pin className="h-4 w-4 text-primary" />
                  )}
                  {conversation.isPinned ? "Desafixar conversa" : "Fixar conversa"}
                </button>
              ))}
          </div>
        </div>
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
