import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Ban, Bell, BellOff, ChevronDown, Loader2, User, Users, Video } from "lucide-react";
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
import {
  createDemoGroup,
  getDemoGroup,
  leaveDemoGroup,
  respondToDemoGroupInvite,
  type DemoGroup,
} from "@/lib/demo/demo-db";
import { GroupInviteSheet } from "./group-invite-sheet";
import type {
  AttachmentAction,
  ChatMessage,
  ConversationParticipant,
  QuickReaction,
} from "@/lib/chat/chat-types";
import type { ProfileRow } from "@/types/database/tables";

interface ConnexyChatScreenProps {
  conversationId?: string;
}

export default function ConnexyChatScreen({ conversationId }: ConnexyChatScreenProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { isOnline } = usePresenceContext();

  const [participant, setParticipant] = useState<ConversationParticipant | null>(null);
  const [group, setGroup] = useState<DemoGroup | null>(null);
  const [participantLoading, setParticipantLoading] = useState(true);

  const {
    messages,
    isLoading,
    error,
    hasMore,
    sendMessage,
    sendSharedContent,
    sendMedia,
    loadMore,
    retry,
    subscriptionStatus,
  } = useChat({
    conversationId: conversationId ?? null,
    currentUserId: user?.id ?? null,
  });

  useEffect(() => {
    if (isPublicSupabaseConfigured() || !conversationId) {
      setGroup(null);
      return;
    }
    setGroup(getDemoGroup(conversationId));
  }, [conversationId]);

  // Resolve the other participant from conversation_participants
  useEffect(() => {
    if (!isPublicSupabaseConfigured() && conversationId && user?.id) {
      const demoGroup = getDemoGroup(conversationId);
      if (demoGroup) {
        setParticipant({ id: demoGroup.id, name: demoGroup.name, photo: "", online: true });
        setParticipantLoading(false);
        return;
      }
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
  const [groupInviteOpen, setGroupInviteOpen] = useState(false);
  const [mediaDraft, setMediaDraft] = useState<{
    kind: "image" | "video";
    dataUrl: string;
    mimeType: string;
    fileName: string;
  } | null>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const [muted, setMuted] = useState(false);
  const [shareDraft, setShareDraft] = useState<{
    id: string;
    kind: "event" | "place";
    title: string;
    cover?: string;
    location?: string;
    dateText?: string;
    proximity?: string;
    route: string;
  } | null>(null);
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

  function handleOpenAttachment(kind: AttachmentAction) {
    if (kind === "image" || kind === "video" || kind === "camera") {
      if (kind === "camera" && !navigator.mediaDevices?.getUserMedia) {
        toast.error("A câmera não é suportada neste navegador. Use a galeria.");
        return;
      }
      if (kind === "camera") {
        void navigator.mediaDevices
          .getUserMedia({ video: true })
          .then((stream) => {
            stream.getTracks().forEach((track) => track.stop());
            mediaInputRef.current?.setAttribute("capture", "environment");
            mediaInputRef.current?.click();
          })
          .catch(() =>
            toast.error(
              "Permissão de câmera negada. Você pode tentar novamente ou usar a galeria.",
            ),
          );
        return;
      }
      mediaInputRef.current?.removeAttribute("capture");
      mediaInputRef.current?.setAttribute("accept", kind === "image" ? "image/*" : "video/*");
      mediaInputRef.current?.click();
      return;
    }
    if (kind === "audio") {
      toast.info("Gravação de áudio ainda não está disponível neste modo demo.");
      return;
    }
    if (kind !== "share-content") return;
    const options = [
      {
        id: "evt-1",
        kind: "event" as const,
        title: "Noite de Jazz",
        cover: "https://picsum.photos/seed/jazz-night/800/500",
        location: "Salão principal",
        dateText: "Sáb • 20:00",
        proximity: "Evento popular",
        route: "/event/evt-1",
      },
      {
        id: "cafe-central",
        kind: "place" as const,
        title: "Café Central",
        cover: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1200",
        location: "Av. Paulista, 1500",
        proximity: "420m de você",
        route: "/local/cafe-central",
      },
      {
        id: "vinil-store",
        kind: "place" as const,
        title: "Vinil Store",
        cover: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=1200",
        location: "Rua Augusta, 1544",
        proximity: "1,2 km de você",
        route: "/local/vinil-store",
      },
    ];
    const draft = options[0];
    setShareDraft(draft);
  }

  function handleMediaFile(file: File | undefined) {
    if (!file) return;
    const kind = file.type.startsWith("video/")
      ? "video"
      : file.type.startsWith("image/")
        ? "image"
        : null;
    if (!kind) {
      toast.error("Escolha uma imagem ou vídeo válido.");
      return;
    }
    // Base64 costs extra bytes; keep a conservative limit so demo storage remains reliable.
    if (file.size > 1_500_000) {
      toast.error("Este arquivo é grande para o modo demo. Escolha um arquivo de até 1,5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => toast.error("Não foi possível ler este arquivo.");
    reader.onload = () =>
      setMediaDraft({
        kind,
        dataUrl: String(reader.result),
        mimeType: file.type,
        fileName: file.name,
      });
    reader.readAsDataURL(file);
  }

  function handleCreateGroup(ids: string[], name: string) {
    if (!conversationId || !user?.id) return;
    const created = createDemoGroup(conversationId, user.id, ids, name);
    setGroupInviteOpen(false);
    toast.success("Grupo criado. Os convites foram enviados.");
    router.navigate({ to: "/chat/$conversationId", params: { conversationId: created.id } });
  }

  function handleShareDraftSend() {
    if (!shareDraft) return;
    sendSharedContent({
      id: shareDraft.id,
      title: shareDraft.title,
      type: shareDraft.kind,
      cover: shareDraft.cover,
      location: shareDraft.location,
      dateText: shareDraft.dateText,
      proximity: shareDraft.proximity,
      route: shareDraft.route,
    });
    setShareDraft(null);
  }

  function handleOpenSharedContent(contentId: string, kind: "event" | "place") {
    if (kind === "event") {
      router.navigate({ to: "/event/$eventId", params: { eventId: contentId } });
      return;
    }
    router.navigate({ to: "/local/$id", params: { id: contentId } });
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
  const pendingGroupInvite = group?.participants.find(
    (item) => item.userId === user?.id && item.status === "pending",
  );

  return (
    <main className="relative flex h-full min-h-0 flex-1 flex-col pb-[env(safe-area-inset-bottom,0px)]">
      <StatusBar />

      <ChatHeader
        participant={activeParticipant}
        subtitle={
          group
            ? `${group.participants.filter((item) => item.status === "accepted").length} participante${group.participants.filter((item) => item.status === "accepted").length === 1 ? "" : "s"}`
            : undefined
        }
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

      {group && pendingGroupInvite && user?.id && (
        <section className="border-b border-primary/15 bg-primary/5 px-4 py-3">
          <p className="text-sm font-semibold">Convite para {group.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {people.find((person) => person.id === group.creatorId)?.name ?? "Uma conexão"} convidou
            você. O grupo começa agora; nenhuma mensagem da conversa privada é compartilhada.
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => {
                respondToDemoGroupInvite(group.id, user.id, false);
                toast.info("Convite recusado.");
                router.navigate({ to: "/chat" });
              }}
              className="h-8 flex-1 rounded-full border border-border bg-surface text-xs font-semibold"
            >
              Recusar
            </button>
            <button
              type="button"
              onClick={() => {
                respondToDemoGroupInvite(group.id, user.id, true);
                toast.success("Convite aceito.");
                setGroup(getDemoGroup(group.id));
              }}
              className="h-8 flex-1 rounded-full bg-primary text-xs font-semibold text-primary-foreground"
            >
              Aceitar
            </button>
          </div>
        </section>
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
            <MessageList
              messages={messages}
              participantPhoto={activeParticipant.photo}
              isGroup={Boolean(group)}
              onOpenSharedContent={handleOpenSharedContent}
            />
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
        onOpenAttachment={handleOpenAttachment}
        disabled={isLoading || !conversationId}
      />
      <input
        ref={mediaInputRef}
        type="file"
        className="hidden"
        onChange={(event) => {
          handleMediaFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      {mediaDraft && (
        <div className="fixed inset-0 z-[70] flex items-end bg-black/35 p-3 backdrop-blur-[1px] sm:items-center sm:justify-center">
          <div className="w-full max-w-md rounded-[28px] bg-surface p-4 shadow-elegant">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold">Prévia do anexo</h2>
              <button
                type="button"
                onClick={() => setMediaDraft(null)}
                className="rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold"
              >
                Cancelar
              </button>
            </div>
            {mediaDraft.kind === "image" ? (
              <img
                src={mediaDraft.dataUrl}
                alt="Prévia"
                className="mt-3 max-h-72 w-full rounded-2xl object-cover"
              />
            ) : (
              <video
                src={mediaDraft.dataUrl}
                controls
                className="mt-3 max-h-72 w-full rounded-2xl"
              />
            )}
            <button
              type="button"
              onClick={() => {
                sendMedia(
                  mediaDraft.kind,
                  mediaDraft.dataUrl,
                  mediaDraft.mimeType,
                  mediaDraft.fileName,
                );
                setMediaDraft(null);
              }}
              className="mt-4 h-11 w-full rounded-full bg-gradient-brand text-sm font-bold text-white"
            >
              Enviar
            </button>
          </div>
        </div>
      )}

      {groupInviteOpen && conversationId && user?.id && !group && (
        <GroupInviteSheet
          sourceConversationId={conversationId}
          currentUserId={user.id}
          sourceName={activeParticipant.name}
          onClose={() => setGroupInviteOpen(false)}
          onCreate={handleCreateGroup}
        />
      )}

      {shareDraft && (
        <div className="fixed inset-0 z-[70] flex items-end bg-black/30 p-3 backdrop-blur-[1px] sm:items-center sm:justify-center">
          <div className="w-full max-w-md overflow-hidden rounded-[28px] bg-surface shadow-elegant">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-semibold">Enviar conteúdo</p>
              <button
                type="button"
                onClick={() => setShareDraft(null)}
                className="rounded-full bg-secondary px-2.5 py-1.5 text-xs font-medium"
              >
                Cancelar
              </button>
            </div>

            <div className="p-4">
              <div className="overflow-hidden rounded-2xl border border-border bg-secondary/30">
                {shareDraft.cover && (
                  <img
                    src={shareDraft.cover}
                    alt={shareDraft.title}
                    className="h-36 w-full object-cover"
                  />
                )}
                <div className="space-y-2 p-3">
                  <p className="text-sm font-semibold">{shareDraft.title}</p>
                  {shareDraft.dateText && (
                    <p className="text-[11px] text-muted-foreground">{shareDraft.dateText}</p>
                  )}
                  {shareDraft.location && (
                    <p className="text-[11px] text-muted-foreground">{shareDraft.location}</p>
                  )}
                  {shareDraft.proximity && (
                    <p className="text-[11px] text-primary">{shareDraft.proximity}</p>
                  )}
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShareDraft(null)}
                  className="flex-1 rounded-full border border-border bg-surface px-3 py-2.5 text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleShareDraftSend}
                  className="flex-1 rounded-full bg-gradient-brand px-3 py-2.5 text-sm font-semibold text-white"
                >
                  Enviar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
            {!group && !isPublicSupabaseConfigured() && (
              <MenuItem
                icon={Users}
                label="Convidar"
                onClick={() => {
                  setMenuOpen(false);
                  setGroupInviteOpen(true);
                }}
              />
            )}
            {group && (
              <MenuItem
                icon={Users}
                label={`Participantes (${group.participants.filter((item) => item.status === "accepted").length})`}
                onClick={() => {
                  setMenuOpen(false);
                  toast.info(
                    group.participants
                      .map(
                        (item) =>
                          `${people.find((person) => person.id === item.userId)?.name ?? "Você"}: ${item.status}`,
                      )
                      .join(" · "),
                  );
                }}
              />
            )}
            {group && user?.id && (
              <MenuItem
                icon={Ban}
                label="Sair do grupo"
                destructive
                onClick={() => {
                  leaveDemoGroup(group.id, user.id);
                  setMenuOpen(false);
                  toast.success("Você saiu do grupo.");
                  router.navigate({ to: "/chat" });
                }}
              />
            )}
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
