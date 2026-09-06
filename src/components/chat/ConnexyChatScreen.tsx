import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Ban, Bell, BellOff, ChevronDown, Loader2, User, Video } from "lucide-react";
import { toast } from "sonner";
import { StatusBar } from "@/components/phone-frame";
import { ChatHeader } from "./chat-header";
import { ChatSearch } from "./chat-search";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { useAuth } from "@/hooks/use-auth";
import { useChat } from "@/hooks/api/use-chat";
import { ChatRepository } from "@/repositories/chat.repository";
import { UserRepository } from "@/repositories/user.repository";
import { usePresenceContext } from "@/providers/presence/presence-context";
import { isPublicSupabaseConfigured } from "@/lib/supabase/config";
import { people } from "@/lib/mock-data";
import type { ChatMessage, ConversationParticipant, QuickReaction } from "@/lib/chat/chat-types";
import type { ProfileRow } from "@/types/database/tables";

interface ConnexyChatScreenProps {
  conversationId?: string;
}

export default function ConnexyChatScreen({ conversationId }: ConnexyChatScreenProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { isOnline } = usePresenceContext();

  const [participant, setParticipant] = useState<ConversationParticipant | null>(null);
  const [participantLoading, setParticipantLoading] = useState(true);

  const { messages, isLoading, error, hasMore, sendMessage, loadMore, retry, subscriptionStatus } =
    useChat({
      conversationId: conversationId ?? null,
      currentUserId: user?.id ?? null,
    });

  // Resolve the other participant from conversation_participants
  useEffect(() => {
    if (!isPublicSupabaseConfigured() && conversationId && user?.id) {
      const mock = people.find((p) => p.id === conversationId);
      setParticipant({
        id: conversationId,
        name: mock?.name ?? "Conversa",
        photo: mock?.photo ?? "",
        online: mock?.online ?? false,
      });
      setParticipantLoading(false);
      return;
    }
    if (!conversationId || !user?.id || !isPublicSupabaseConfigured()) {
      setParticipantLoading(false);
      return;
    }
    let active = true;
    (async () => {
      try {
        const participants = await ChatRepository.getParticipants(conversationId);
        const otherId = participants.find((p) => p.user_id !== user.id)?.user_id;
        if (!otherId || !active) {
          setParticipant({ id: "", name: "Conversa", photo: "", online: false });
          return;
        }
        const profile: ProfileRow = await UserRepository.getById(otherId);
        if (!active) return;
        setParticipant({
          id: profile.id,
          name: profile.name ?? "Usuario",
          photo: profile.photo_url ?? "",
          online: isOnline(profile.id),
        });
      } catch {
        if (active) setParticipant({ id: "", name: "Conversa", photo: "", online: false });
      } finally {
        if (active) setParticipantLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [conversationId, user?.id, isOnline]);

  const [showSearch, setShowSearch] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [stickToBottom, setStickToBottom] = useState(true);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const prevMessagesRef = useRef<ChatMessage[]>([]);
  const anchorRef = useRef<number | null>(null);

  useEffect(() => {
    prevMessagesRef.current = [];
    setNewMessagesCount(0);
    setStickToBottom(true);
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [conversationId]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = distance < 96;
    if (nearBottom) setNewMessagesCount(0);
    setStickToBottom(nearBottom);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const prev = prevMessagesRef.current;
    prevMessagesRef.current = messages;

    if (anchorRef.current !== null) {
      const fromBottom = anchorRef.current;
      anchorRef.current = null;
      requestAnimationFrame(() => {
        const target = scrollRef.current;
        if (target) target.scrollTop = target.scrollHeight - fromBottom;
      });
      return;
    }

    const previousLastId = prev.length > 0 ? prev[prev.length - 1].id : undefined;
    const currentLast = messages[messages.length - 1];
    if (currentLast && currentLast.id === previousLastId) return;

    if (messages.length > prev.length) {
      if (currentLast.from === "me") {
        setStickToBottom(true);
        setNewMessagesCount(0);
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
        return;
      }
      if (stickToBottom) {
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
        return;
      }
      setNewMessagesCount((count) => count + 1);
      return;
    }

    if (stickToBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, stickToBottom, conversationId]);

  function handleLoadMore() {
    const el = scrollRef.current;
    anchorRef.current = el ? el.scrollHeight - el.scrollTop : 0;
    void loadMore();
  }

  const handleBack = useCallback(() => {
    router.navigate({ to: "/chat" });
  }, [router]);

  function handleSendText(text: string) {
    void sendMessage(text);
  }

  function handleSearchResultClick(messageId: string) {
    const el = document.getElementById(`msg-${messageId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    setShowSearch(false);
  }

  const toggleMuted = useCallback(() => setMuted((value) => !value), []);

  const isOwnProfile = participant?.id === user?.id;
  const hasValidProfileId = Boolean(participant?.id && participant.id.length > 0);

  if (participantLoading) {
    return (
      <main className="relative flex-1 flex flex-col h-full min-h-0">
        <StatusBar />
        <div className="flex-1 grid place-items-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </main>
    );
  }

  const fallbackParticipant: ConversationParticipant = {
    id: "",
    name: "Conversa",
    photo: "",
    online: false,
  };

  const activeParticipant = participant ?? fallbackParticipant;

  return (
    <main className="relative flex h-full min-h-0 flex-1 flex-col pb-[env(safe-area-inset-bottom,0px)]">
      <StatusBar />

      <ChatHeader
        participant={activeParticipant}
        onBack={handleBack}
        onVideoCall={() => toast.info("Videocall em breve")}
        onSearch={() => setShowSearch((value) => !value)}
        onMenu={() => setMenuOpen(true)}
      />

      {showSearch && (
        <ChatSearch
          messages={messages}
          onResultClick={handleSearchResultClick}
          onClose={() => setShowSearch(false)}
        />
      )}

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto no-scrollbar min-h-0"
      >
        {isLoading && messages.length === 0 ? (
          <div className="flex-1 grid place-items-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : error && messages.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <p className="text-sm text-muted-foreground">{error}</p>
            <button
              type="button"
              onClick={() => void retry()}
              className="mt-3 text-sm text-primary font-semibold"
            >
              Tentar novamente
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhuma mensagem ainda. Digite a primeira!
            </p>
          </div>
        ) : (
          <>
            {hasMore && (
              <div className="text-center py-2">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  className="text-xs text-primary font-medium"
                >
                  Carregar mais
                </button>
              </div>
            )}
            <MessageList messages={messages} participantPhoto={activeParticipant.photo} />
          </>
        )}
      </div>

      {newMessagesCount > 0 && (
        <button
          type="button"
          onClick={() => {
            const el = scrollRef.current;
            if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
            setStickToBottom(true);
            setNewMessagesCount(0);
          }}
          aria-label="Ir para as novas mensagens"
          className="absolute bottom-[calc(env(safe-area-inset-bottom,0px)+4rem)] left-1/2 z-30 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-elevated"
        >
          <ChevronDown className="h-3.5 w-3.5" />
          {newMessagesCount === 1 ? "Nova mensagem" : `${newMessagesCount} novas mensagens`}
        </button>
      )}

      <MessageInput
        placeholder="Digite uma mensagem"
        onSendText={handleSendText}
        disabled={isLoading || !conversationId}
      />

      {menuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50"
        >
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-black/30"
          />
          <motion.div
            initial={{ y: -8, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute right-3 top-[104px] w-60 rounded-2xl border border-border bg-surface p-2 shadow-elegant"
          >
            <MenuItem
              icon={User}
              label={isOwnProfile ? "Meu perfil" : `Ver perfil de ${activeParticipant.name}`}
              disabled={isOwnProfile || !hasValidProfileId}
              onClick={() => {
                setMenuOpen(false);
                if (isOwnProfile) {
                  router.navigate({ to: "/profile" });
                } else if (hasValidProfileId) {
                  router.navigate({
                    to: "/perfil/$id",
                    params: { id: activeParticipant.id },
                  });
                }
              }}
            />
            <MenuItem
              icon={Video}
              label="Videocall"
              onClick={() => {
                setMenuOpen(false);
                toast.info("Videocall em breve");
              }}
            />
            <MenuItem
              icon={muted ? Bell : BellOff}
              label={muted ? "Ativar notificações" : "Silenciar notificações"}
              active={muted}
              onClick={() => {
                toggleMuted();
                setMenuOpen(false);
                toast.success(muted ? "Notificações ativadas" : "Notificações silenciadas");
              }}
            />
            <MenuItem
              icon={Ban}
              label="Bloquear"
              destructive
              onClick={() => {
                setMenuOpen(false);
                toast.info("Bloqueio disponível em breve");
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </main>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  active = false,
  destructive = false,
  disabled = false,
}: {
  icon: typeof User;
  label: string;
  onClick: () => void;
  active?: boolean;
  destructive?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
        disabled
          ? "opacity-40 cursor-not-allowed"
          : destructive
            ? "text-destructive hover:bg-destructive/10"
            : active
              ? "text-primary hover:bg-accent"
              : "text-foreground hover:bg-accent"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );
}
