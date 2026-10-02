import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Ban,
  Bell,
  BellOff,
  CheckSquare,
  ChevronDown,
  Loader2,
  Pin,
  PinOff,
  User,
  Users,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { StatusBar } from "@/components/phone-frame";
import { ChatHeader } from "./chat-header";
import { ChatSearch } from "./chat-search";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { FileMessage } from "./file-message";
import { ConnexyAiAssistant } from "@/components/ai/connexy-ai-assistant";
import { useAuth } from "@/hooks/use-auth";
import { useChat } from "@/hooks/api/use-chat";
import { ChatRepository } from "@/repositories/chat.repository";
import { UserRepository } from "@/repositories/user.repository";
import { usePresenceContext } from "@/providers/presence/presence-context";
import { usePresence } from "@/providers/presence/presence-provider";
import { listShareableCheckins } from "@/lib/chat/shareable-checkins";
import { isPublicSupabaseConfigured } from "@/lib/supabase/config";
import { isRemoteConversationsEnabled } from "@/lib/chat/schema-a-conversations-flag";
import { getSchemaAConversations } from "@/lib/chat/schema-a-conversations";
import { currentUser, people } from "@/lib/mock-data";
import {
  createDemoGroup,
  getConnectionByConversationId,
  getConnectionPeerId,
  getDemoGroup,
  leaveDemoGroup,
  respondToDemoGroupInvite,
  subscribeDemoDB,
  type DemoGroup,
} from "@/lib/demo/demo-db";
import { getDemoIdentity, useDemoIdentity } from "@/lib/demo/demo-identity";
import {
  ensureLocalConversation,
  getLocalConversation,
  setLocalConversationPinned,
} from "@/lib/chat/local-chat-persistence";
import { isPinnedForUser } from "@/lib/chat/conversation-list-state";
import {
  connectDemoCall,
  finishDemoCall,
  getDemoCallSession,
  startDemoCall,
  subscribeDemoCall,
  triggerDemoCallFeedback,
  type DemoCallMedia,
} from "@/lib/chat/demo-call";
import { GroupInviteSheet } from "./group-invite-sheet";
import { LocationShareSheet } from "./location-share-sheet";
import { CheckinShareSheet } from "./checkin-share-sheet";
import { DemoCallOverlay } from "./demo-call-overlay";
import { ChatConfirmDialog } from "./chat-confirm-dialog";
import { CameraCapture } from "@/components/media/camera-capture";
import { LocalMediaFrame } from "@/components/media/local-media-frame";
import { MediaViewer } from "@/components/system/media-viewer";
import { ReelRecorder, type RecordedClip } from "@/components/media/reel-recorder";
import { visibleMediaCaption } from "@/lib/chat/visible-media-caption";
import { CHAT_VIDEO_MAX_DURATION_SECONDS } from "@/lib/chat/chat-limits";
import { isDurationWithinLimit, readVideoDurationSeconds } from "@/lib/media/media-duration";
import type { VoiceClip } from "./voice-recorder";
import type {
  AttachmentAction,
  ChatMessage,
  ConversationParticipant,
} from "@/lib/chat/chat-types";
import { MessageKind } from "@/lib/chat/chat-types";
import {
  batchDeleteDescription,
  batchDeleteTitle,
  isChatMessageSelectable,
  singleDeleteCopy,
  partialDeleteMessage,
} from "@/lib/chat/chat-selection";
import {
  beginOwnMessageSelection,
  toggleOwnMessageSelection,
} from "@/lib/chat/message-long-press";
import {
  copyableTextForMessages,
  downloadChatMessage,
  isDownloadableChatMedia,
  isOpenableChatMedia,
  openChatDocument,
} from "@/lib/chat/chat-message-actions";
import type { ProfileRow } from "@/types/database/tables";

interface ConnexyChatScreenProps {
  conversationId?: string;
}

export default function ConnexyChatScreen({ conversationId }: ConnexyChatScreenProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { isOnline } = usePresenceContext();
  const { checkins } = usePresence();
  const demoIdentity = useDemoIdentity();

  const remoteChat = isRemoteConversationsEnabled();
  const [remotePinned, setRemotePinned] = useState(false);
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
    sendLocation,
    deleteMessages,
    loadMore,
    retry,
    subscriptionStatus,
  } = useChat({
    conversationId: conversationId ?? null,
    currentUserId: user?.id ?? null,
  });

  useEffect(() => {
    if (remoteChat || isPublicSupabaseConfigured() || !conversationId) {
      if (!remoteChat) setGroup(null);
      return;
    }
    setGroup(getDemoGroup(conversationId));
  }, [conversationId, remoteChat]);

  // Resolve the other participant from conversation_participants
  useEffect(() => {
    if (remoteChat && conversationId) {
      let active = true;
      void (async () => {
        try {
          const thread = await getSchemaAConversations().getThread(conversationId);
          if (!active) return;
          setRemotePinned(thread?.pinned ?? false);
          const name = thread?.conversation.name?.trim() || "Conversa";
          setParticipant({
            id: thread?.peerId ?? "",
            name,
            photo: "",
            online: false,
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
    }
    if (!isPublicSupabaseConfigured() && conversationId && user?.id) {
      void ensureLocalConversation(conversationId);
      const demoGroup = getDemoGroup(conversationId);
      if (demoGroup) {
        setParticipant({ id: demoGroup.id, name: demoGroup.name, photo: "", online: true });
        setParticipantLoading(false);
        return;
      }
      const connection = getConnectionByConversationId(conversationId, user.id);
      const peerId = connection ? getConnectionPeerId(connection, user.id) : conversationId;
      const mock =
        people.find((person) => person.id === peerId) ??
        (peerId === currentUser.id ? currentUser : null);
      setParticipant({
        id: peerId ?? conversationId,
        name: mock?.name ?? "Conversa",
        photo: mock?.photo ?? "",
        online: mock && "online" in mock ? mock.online : Boolean(mock),
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
  }, [conversationId, user?.id, isOnline, remoteChat]);

  const demoCall = useSyncExternalStore(subscribeDemoCall, getDemoCallSession, getDemoCallSession);

  const [showSearch, setShowSearch] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [groupInviteOpen, setGroupInviteOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [videoRecorderOpen, setVideoRecorderOpen] = useState(false);
  const [voiceNonce, setVoiceNonce] = useState(0);
  const [mediaDraft, setMediaDraft] = useState<{
    kind: "image" | "video" | "file";
    blob: Blob;
    previewUrl: string;
    mimeType: string;
    fileName: string;
    durationSec?: number;
  } | null>(null);
  const [locationShareOpen, setLocationShareOpen] = useState(false);
  const [checkinShareOpen, setCheckinShareOpen] = useState(false);
  const [fileSending, setFileSending] = useState(false);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [muted, setMuted] = useState(false);
  const [pinTick, setPinTick] = useState(0);
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [composerInsert, setComposerInsert] = useState<{ token: number; text: string } | null>(
    null,
  );
  const [pendingDelete, setPendingDelete] = useState<{
    ids: string[];
    title: string;
    description: string;
  } | null>(null);
  const [viewingMessage, setViewingMessage] = useState<ChatMessage | null>(null);

  useEffect(() => {
    if (isPublicSupabaseConfigured() || !conversationId) return;
    return subscribeDemoDB(() => setPinTick((tick) => tick + 1));
  }, [conversationId]);

  const isPinned = useMemo(() => {
    void pinTick;
    if (!conversationId) return false;
    if (remoteChat) return remotePinned;
    return isPinnedForUser(
      getLocalConversation(conversationId)?.pinnedByUserIds,
      getDemoIdentity().id,
    );
  }, [conversationId, pinTick, remoteChat, remotePinned]);

  const selectedMessages = useMemo(
    () => messages.filter((item) => selectedIds.includes(item.id)),
    [messages, selectedIds],
  );
  const canDeleteSelected = selectedMessages.length > 0 && selectedMessages.every((item) => isChatMessageSelectable(item.from));
  const canDownloadSelected =
    selectedMessages.length > 0 && selectedMessages.every((item) => isDownloadableChatMedia(item));
  const canCopySelected = copyableTextForMessages(selectedMessages).length > 0;
  const shareableCheckins = useMemo(
    () => listShareableCheckins(checkins, demoIdentity.id),
    [checkins, demoIdentity.id],
  );
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
    setSelecting(false);
    setSelectedIds([]);
    setPendingDelete(null);
    setViewingMessage(null);
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
    if (selecting) {
      setSelecting(false);
      setSelectedIds([]);
      return;
    }
    router.navigate({ to: "/chat" });
  }, [router, selecting]);

  function handleSendText(text: string) {
    void sendMessage(text);
  }

  function exitSelection() {
    setSelecting(false);
    setSelectedIds([]);
  }

  function enterSelection(messageId?: string) {
    setViewingMessage(null);
    setSelecting(true);
    if (!messageId) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds((current) => beginOwnMessageSelection(current, messageId));
  }

  function handleOpenMedia(message: ChatMessage) {
    if (selecting) return;
    if (!isOpenableChatMedia(message)) return;
    setViewingMessage(message);
  }

  async function handleOpenDocument(message: ChatMessage) {
    if (selecting) return;
    try {
      await openChatDocument(message);
    } catch {
      toast.error("Não foi possível abrir este documento.");
    }
  }

  function toggleSelected(messageId: string) {
    const target = messages.find((item) => item.id === messageId);
    if (!target || !isChatMessageSelectable(target.from)) return;
    setViewingMessage(null);
    setSelecting(true);
    setSelectedIds((current) => toggleOwnMessageSelection(current, messageId));
  }

  function requestDeleteMessages(items: ChatMessage[]) {
    const own = items.filter((item) => isChatMessageSelectable(item.from));
    if (own.length === 0) return;
    if (own.length === 1) {
      const kind =
        own[0].kind === MessageKind.IMAGE
          ? "image"
          : own[0].kind === MessageKind.VIDEO
            ? "video"
            : own[0].kind === MessageKind.FILE
              ? "file"
              : "text";
      const copy = singleDeleteCopy(kind);
      setPendingDelete({ ids: own.map((item) => item.id), ...copy });
      return;
    }
    setPendingDelete({
      ids: own.map((item) => item.id),
      title: batchDeleteTitle(own.length),
      description: batchDeleteDescription(own.length),
    });
  }

  async function confirmPendingDelete() {
    if (!pendingDelete) return;
    const ids = pendingDelete.ids;
    setPendingDelete(null);
    const result = await deleteMessages(ids);
    if (result.deletedIds.length === 0 && result.failed.length > 0) {
      toast.error("A exclusão não foi concluída.");
      return;
    }
    if (result.failed.length > 0) {
      toast.error(partialDeleteMessage(result.deletedIds.length, result.failed.length));
      setSelectedIds((current) => current.filter((id) => !result.deletedIds.includes(id)));
      return;
    }
    toast.success(
      result.deletedIds.length === 1 ? "Item excluído." : `${result.deletedIds.length} itens excluídos.`,
    );
    exitSelection();
  }

  async function handleDownloadMessage(message: ChatMessage) {
    try {
      await downloadChatMessage(message);
      toast.success(message.kind === MessageKind.TEXT ? "Texto exportado." : "Mídia baixada.");
    } catch {
      toast.error("Não foi possível baixar agora.");
    }
  }

  async function handleDownloadSelected() {
    const selected = messages.filter(
      (item) => selectedIds.includes(item.id) && isDownloadableChatMedia(item),
    );
    if (selected.length === 0) return;
    for (const item of selected) {
      await handleDownloadMessage(item);
    }
  }

  async function handleCopySelected() {
    const text = copyableTextForMessages(selectedMessages);
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copiado");
    } catch {
      toast.error("Não foi possível copiar.");
    }
  }

  function handleOpenAttachment(kind: AttachmentAction) {
    if (kind === "camera") {
      setCameraOpen(true);
      return;
    }
    if (kind === "video") {
      setVideoRecorderOpen(true);
      return;
    }
    if (kind === "image") {
      mediaInputRef.current?.removeAttribute("capture");
      mediaInputRef.current?.setAttribute("accept", "image/*");
      mediaInputRef.current?.click();
      return;
    }
    if (kind === "file") {
      fileInputRef.current?.removeAttribute("capture");
      fileInputRef.current?.removeAttribute("accept");
      fileInputRef.current?.click();
      return;
    }
    if (kind === "location") {
      setLocationShareOpen(true);
      return;
    }
    if (kind === "audio") {
      setVoiceNonce((value) => value + 1);
      return;
    }
    if (kind !== "share-content") return;
    setCheckinShareOpen(true);
  }

  async function handleMediaFile(file: File | undefined) {
    if (!file) return;
    const kind = file.type.startsWith("video/")
      ? "video"
      : file.type.startsWith("image/")
        ? "image"
        : "file";
    let durationSec: number | undefined;
    if (kind === "video") {
      const metadataSec = await readVideoDurationSeconds(file);
      if (metadataSec == null || !isDurationWithinLimit(metadataSec, CHAT_VIDEO_MAX_DURATION_SECONDS)) {
        toast.error(`Vídeo deve ter até ${CHAT_VIDEO_MAX_DURATION_SECONDS}s`);
        return;
      }
      durationSec = Math.round(metadataSec);
    }
    const previewUrl = URL.createObjectURL(file);
    setMediaDraft({
      kind,
      blob: file,
      previewUrl,
      mimeType: file.type || (kind === "image" ? "image/jpeg" : kind === "video" ? "video/webm" : "application/octet-stream"),
      fileName: file.name,
      durationSec,
    });
  }

  async function sendDraftMedia() {
    if (!mediaDraft) return;
    setFileSending(true);
    try {
      await sendMedia({
        kind: mediaDraft.kind,
        blob: mediaDraft.blob,
        mimeType: mediaDraft.mimeType,
        fileName: mediaDraft.fileName,
        durationSec: mediaDraft.durationSec,
      });
      URL.revokeObjectURL(mediaDraft.previewUrl);
      setMediaDraft(null);
    } catch {
      toast.error(
        mediaDraft.kind === "file"
          ? "Não foi possível enviar o arquivo."
          : "Não foi possível salvar a mídia neste dispositivo.",
      );
    } finally {
      setFileSending(false);
    }
  }

  async function handleSendVoice(clip: VoiceClip) {
    setVoiceNonce(0);
    try {
      await sendMedia({
        kind: "audio",
        blob: clip.blob,
        mimeType: clip.mimeType,
        fileName: `audio-${Date.now()}.${clip.mimeType.includes("mp4") ? "m4a" : "webm"}`,
        durationSec: clip.durationSec,
      });
    } catch (error) {
      toast.error("Não foi possível salvar o áudio neste dispositivo.");
      throw error;
    }
  }

  async function handleRecordedVideo(clip: RecordedClip) {
    setVideoRecorderOpen(false);
    if (!isDurationWithinLimit(clip.durationSec, CHAT_VIDEO_MAX_DURATION_SECONDS)) {
      toast.error(`Vídeo deve ter até ${CHAT_VIDEO_MAX_DURATION_SECONDS}s`);
      return;
    }
    try {
      await sendMedia({
        kind: "video",
        blob: clip.blob,
        mimeType: clip.mimeType,
        fileName: clip.fileName,
        durationSec: clip.durationSec,
      });
    } catch {
      toast.error("Não foi possível salvar o vídeo neste dispositivo.");
    }
  }

  async function handleCameraCapture(blob: Blob, fileName: string) {
    setCameraOpen(false);
    try {
      await sendMedia({
        kind: "image",
        blob,
        mimeType: blob.type || "image/jpeg",
        fileName,
      });
    } catch {
      toast.error("Não foi possível salvar a foto neste dispositivo.");
    }
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
      <main className="relative flex h-full min-h-0 flex-1 flex-col overflow-x-hidden bg-[#F6F3FF]">
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
  const activeCall =
    demoCall && conversationId && demoCall.conversationId === conversationId ? demoCall : null;

  function callSender(): { id: string; name: string } {
    const id = user?.id ?? "";
    const name = typeof user?.user_metadata?.name === "string" ? user.user_metadata.name : id;
    return { id, name };
  }

  function beginDemoCall(media: DemoCallMedia) {
    if (
      group ||
      isPublicSupabaseConfigured() ||
      !conversationId ||
      !user?.id ||
      !activeParticipant.id ||
      activeParticipant.id === user.id
    ) {
      triggerDemoCallFeedback((message) => toast.info(message));
      return;
    }
    if (demoCall && demoCall.conversationId !== conversationId) {
      triggerDemoCallFeedback((message) => toast.info(message));
      return;
    }
    const started = startDemoCall({
      conversationId,
      callerId: user.id,
      calleeId: activeParticipant.id,
      media,
    });
    if (!started) triggerDemoCallFeedback((message) => toast.info(message));
  }

  return (
    <main className="relative flex h-full min-h-0 flex-1 flex-col overflow-x-hidden bg-[#F6F3FF]">
      <StatusBar />

      <ChatHeader
        participant={activeParticipant}
        subtitle={
          group
            ? `${group.participants.filter((item) => item.status === "accepted").length} participante${group.participants.filter((item) => item.status === "accepted").length === 1 ? "" : "s"}`
            : undefined
        }
        onBack={handleBack}
        onCall={() => beginDemoCall("voice")}
        onVideoCall={() => beginDemoCall("video")}
        onSearch={() => setShowSearch((value) => !value)}
        onMenu={() => setMenuOpen(true)}
        selecting={selecting}
        selectedCount={selectedIds.length}
        onCancelSelection={exitSelection}
        onCopySelected={() => void handleCopySelected()}
        onDeleteSelected={() => requestDeleteMessages(selectedMessages)}
        onDownloadSelected={() => void handleDownloadSelected()}
        canCopySelected={canCopySelected}
        canDeleteSelected={canDeleteSelected}
        canDownloadSelected={canDownloadSelected}
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
        data-chat-thread
        onScroll={handleScroll}
        className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto scroll-smooth no-scrollbar"
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
              selecting={selecting}
              selectedIds={new Set(selectedIds)}
              onToggleSelect={toggleSelected}
              onEnterSelection={(messageId) => enterSelection(messageId)}
              onRequestDelete={(message) => requestDeleteMessages([message])}
              onDownload={(message) => void handleDownloadMessage(message)}
              onOpenMedia={handleOpenMedia}
              onOpenDocument={(message) => void handleOpenDocument(message)}
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
          className="absolute bottom-[7.25rem] left-1/2 z-30 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-elevated"
        >
          <ChevronDown className="h-3.5 w-3.5" />
          {newMessagesCount === 1 ? "Nova mensagem" : `${newMessagesCount} novas mensagens`}
        </button>
      )}

      <div className="flex justify-start px-4 pb-1.5 pl-[42px] pt-0.5">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
        >
          <ConnexyAiAssistant
            mode="conversations"
            label="Sugerir próximo passo"
            className="w-fit bg-primary/[0.09] px-3.5 py-1.5 text-[11px] font-semibold"
            onInsertSuggestion={(text) => {
              setComposerInsert({ token: Date.now(), text });
            }}
          />
        </motion.div>
      </div>

      {viewingMessage && isOpenableChatMedia(viewingMessage) ? (
        <ChatThreadMediaViewer
          message={viewingMessage}
          isOpen={!selecting}
          onClose={() => setViewingMessage(null)}
          onDownload={() => void handleDownloadMessage(viewingMessage)}
          onDelete={
            viewingMessage.from === "me"
              ? () => {
                  const target = viewingMessage;
                  setViewingMessage(null);
                  requestDeleteMessages([target]);
                }
              : undefined
          }
        />
      ) : null}

      <MessageInput
        placeholder="Digite uma mensagem..."
        onSendText={handleSendText}
        onSendVoice={handleSendVoice}
        onOpenAttachment={handleOpenAttachment}
        onCapturePhoto={() => setCameraOpen(true)}
        onRecordVideo={() => setVideoRecorderOpen(true)}
        disabled={isLoading || !conversationId || selecting}
        forceRecording={voiceNonce}
        insertRequest={composerInsert}
        onInsertRequestHandled={() => setComposerInsert(null)}
      />
      <LocationShareSheet
        open={locationShareOpen}
        onClose={() => setLocationShareOpen(false)}
        onConfirm={(input) => {
          try {
            sendLocation(input);
            setLocationShareOpen(false);
          } catch {
            toast.error("Não foi possível enviar a localização.");
          }
        }}
      />
      <CheckinShareSheet
        open={checkinShareOpen}
        items={shareableCheckins}
        onClose={() => setCheckinShareOpen(false)}
        onShare={(item) => {
          setCheckinShareOpen(false);
          setShareDraft({
            id: item.id,
            kind: item.kind,
            title: item.title,
            cover: item.cover,
            location: item.location,
            dateText: item.dateText,
            proximity: item.proximity,
            route: item.route,
          });
        }}
      />
      <input
        ref={mediaInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          handleMediaFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <input
        ref={fileInputRef}
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
                onClick={() => {
                  if (mediaDraft) URL.revokeObjectURL(mediaDraft.previewUrl);
                  setMediaDraft(null);
                }}
                className="rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold"
              >
                Cancelar
              </button>
            </div>
            {mediaDraft.kind === "image" ? (
              <img
                src={mediaDraft.previewUrl}
                alt="Prévia"
                className="mt-3 max-h-72 w-full rounded-2xl object-cover"
              />
            ) : mediaDraft.kind === "video" ? (
              <video
                src={mediaDraft.previewUrl}
                controls
                className="mt-3 max-h-72 w-full rounded-2xl"
              />
            ) : (
              <div className="mt-3 rounded-2xl bg-secondary/40 p-3">
                <FileMessage
                  fileName={mediaDraft.fileName}
                  fileSize={mediaDraft.blob.size}
                  mimeType={mediaDraft.mimeType}
                  sending={fileSending}
                />
              </div>
            )}
            <button
              type="button"
              onClick={() => void sendDraftMedia()}
              disabled={fileSending}
              className="mt-4 h-11 w-full rounded-full bg-gradient-brand text-sm font-bold text-white disabled:opacity-60"
            >
              {fileSending ? "Enviando…" : "Enviar"}
            </button>
          </div>
        </div>
      )}

      {cameraOpen ? (
        <CameraCapture
          title="Tirar foto"
          confirmLabel="Enviar"
          onCancel={() => setCameraOpen(false)}
          onCapture={(blob, fileName) => void handleCameraCapture(blob, fileName)}
        />
      ) : null}

      {videoRecorderOpen ? (
        <ReelRecorder
          title="Vídeo"
          confirmLabel="Enviar"
          maxDurationSec={CHAT_VIDEO_MAX_DURATION_SECONDS}
          onCancel={() => setVideoRecorderOpen(false)}
          onUse={(clip) => void handleRecordedVideo(clip)}
        />
      ) : null}

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
              icon={isPinned ? PinOff : Pin}
              label={isPinned ? "Desafixar conversa" : "Fixar conversa"}
              active={isPinned}
              onClick={() => {
                if (!conversationId) return;
                if (remoteChat) {
                  const next = !isPinned;
                  void getSchemaAConversations()
                    .setPinned(conversationId, next)
                    .then(() => setRemotePinned(next))
                    .catch((error: unknown) => {
                      toast.error(
                        error instanceof Error ? error.message : "Não foi possível fixar.",
                      );
                    });
                  setMenuOpen(false);
                  toast.success(isPinned ? "Conversa desafixada" : "Conversa fixada");
                  return;
                }
                void setLocalConversationPinned(conversationId, getDemoIdentity().id, !isPinned);
                setMenuOpen(false);
                toast.success(isPinned ? "Conversa desafixada" : "Conversa fixada");
              }}
            />
            <MenuItem
              icon={CheckSquare}
              label="Selecionar mensagens"
              onClick={() => {
                setMenuOpen(false);
                enterSelection();
              }}
            />
            <MenuItem
              icon={Video}
              label="Videocall"
              onClick={() => {
                setMenuOpen(false);
                beginDemoCall("video");
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

      {activeCall && (
        <DemoCallOverlay
          call={activeCall}
          peerName={activeParticipant.name}
          onAccept={() => connectDemoCall(activeCall.id)}
          onDecline={() => finishDemoCall("declined", callSender())}
          onHangup={() => finishDemoCall("ended", callSender())}
        />
      )}

      <ChatConfirmDialog
        open={Boolean(pendingDelete)}
        title={pendingDelete?.title ?? ""}
        description={pendingDelete?.description ?? ""}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void confirmPendingDelete()}
      />
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

function ChatThreadMediaViewer({
  message,
  isOpen,
  onClose,
  onDownload,
  onDelete,
}: {
  message: Extract<ChatMessage, { kind: typeof MessageKind.IMAGE | typeof MessageKind.VIDEO }>;
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void | Promise<void>;
  onDelete?: () => void;
}) {
  const caption =
    message.kind === MessageKind.IMAGE ? visibleMediaCaption(message.caption) : undefined;

  return (
    <LocalMediaFrame mediaId={message.mediaId} fallbackUrl={message.url}>
      {(url) => (
        <MediaViewer
          isOpen={isOpen}
          onClose={onClose}
          src={url ?? ""}
          type={message.kind === MessageKind.VIDEO ? "video" : "image"}
          alt={caption ?? (message.kind === MessageKind.VIDEO ? "Vídeo" : "Foto")}
          title={message.kind === MessageKind.VIDEO ? "Vídeo" : "Foto"}
          variant="chat"
          onDownload={onDownload}
          onDelete={onDelete}
        />
      )}
    </LocalMediaFrame>
  );
}
