import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Ban, Bell, BellOff, User, Video } from "lucide-react";
import { toast } from "sonner";
import { StatusBar } from "@/components/phone-frame";
import { ChatHeader } from "./chat-header";
import { ChatSearch } from "./chat-search";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { TypingIndicator } from "./typing-indicator";
import { findPerson } from "@/lib/mock-data";
import type {
  ChatMessage,
  ConversationParticipant,
  MessageKindValue,
  QuickReaction,
  TypingIndicator as TypingType,
} from "@/lib/chat/chat-types";
import { MessageKind, MessageStatus } from "@/lib/chat/chat-types";
import { createTypingIndicator } from "@/lib/chat/typing-utils";
import { advanceStatus } from "@/lib/chat/message-status";
import { formatChatProximity } from "@/lib/chat/proximity";
import { cn } from "@/lib/utils";

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

const DEFAULT_PARTICIPANT: ConversationParticipant = {
  id: "juliana",
  name: "Juliana Santos",
  photo: "/avatars/juliana-santos.jpg",
  online: true,
};

const DEFAULT_DISTANCE_METERS = 800;

interface ConnexyChatScreenProps {
  conversationId?: string;
}

function buildMockMessages(participantId: string): ChatMessage[] {
  const now = Date.now();

  return [
    {
      id: `${participantId}-1`,
      conversationId: participantId,
      from: "them",
      kind: MessageKind.TEXT,
      text: "Oi! Vi que a gente tem interesses em comum 😊",
      at: new Date(now - 3 * HOUR),
      status: MessageStatus.READ,
    },
    {
      id: `${participantId}-2`,
      conversationId: participantId,
      from: "me",
      kind: MessageKind.TEXT,
      text: "Oi! Sim, adoro café e fotografia!",
      at: new Date(now - 3 * HOUR + 5 * MINUTE),
      status: MessageStatus.READ,
    },
    {
      id: `${participantId}-3`,
      conversationId: participantId,
      from: "them",
      kind: MessageKind.LOCATION,
      label: "Café Central",
      proximity: formatChatProximity(1600),
      cover: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400",
      at: new Date(now - 2 * HOUR),
      status: MessageStatus.READ,
    },
    {
      id: `${participantId}-4`,
      conversationId: participantId,
      from: "me",
      kind: MessageKind.AUDIO,
      durationSec: 12,
      at: new Date(now - 90 * MINUTE),
      status: MessageStatus.READ,
    },
    {
      id: `${participantId}-5`,
      conversationId: participantId,
      from: "them",
      kind: MessageKind.TEXT,
      text: "Que vibe boa esse lugar ☕",
      at: new Date(now - 80 * MINUTE),
      status: MessageStatus.READ,
      reaction: "❤️",
    },
    {
      id: `${participantId}-6`,
      conversationId: participantId,
      from: "them",
      kind: MessageKind.EVENT,
      title: "Sunset no Parque",
      cover: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400",
      dateText: "Sáb · 16:00",
      location: "Parque Ibirapuera",
      at: new Date(now - 1 * HOUR),
      status: MessageStatus.READ,
    },
    {
      id: `${participantId}-7`,
      conversationId: participantId,
      from: "me",
      kind: MessageKind.TEXT,
      text: "Top! Bora marcar um café? 😄",
      at: new Date(now - 45 * MINUTE),
      status: MessageStatus.READ,
    },
    {
      id: `${participantId}-8`,
      conversationId: participantId,
      from: "them",
      kind: MessageKind.TEXT,
      text: "Bora! Quando você pode?",
      at: new Date(now - 30 * MINUTE),
      status: MessageStatus.READ,
    },
  ];
}

export default function ConnexyChatScreen({ conversationId }: ConnexyChatScreenProps) {
  const router = useRouter();

  const person = useMemo(() => findPerson(conversationId ?? ""), [conversationId]);

  const participant: ConversationParticipant = useMemo(() => {
    if (person) {
      return {
        id: person.id,
        name: person.name,
        photo: person.photo,
        online: person.online,
        lastSeen: person.lastSeen,
      };
    }
    return DEFAULT_PARTICIPANT;
  }, [person]);

  const distanceMeters = person?.distanceMeters ?? DEFAULT_DISTANCE_METERS;
  const proximity = formatChatProximity(distanceMeters);

  const [messages, setMessages] = useState<ChatMessage[]>(() => buildMockMessages(participant.id));
  const [typing, setTyping] = useState<TypingType | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const didMountRef = useRef(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    didMountRef.current = true;
  }, []);

  useEffect(() => {
    if (!didMountRef.current) return;
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const handleBack = useCallback(() => {
    if (window.history.length > 1) {
      router.history.back();
      return;
    }
    router.navigate({ to: "/chat" });
  }, [router]);

  const push = useCallback(
    (draft: ChatMessage) => {
      setMessages((prev) => [...prev, draft]);

      setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) => (m.id === draft.id ? { ...m, status: advanceStatus(draft.status) } : m)),
        );
      }, 600);

      setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== draft.id) return m;
            return { ...m, status: advanceStatus(advanceStatus(draft.status)) };
          }),
        );
      }, 1200);

      const otherTyping = createTypingIndicator(participant.id, participant.id);
      setTimeout(() => setTyping(otherTyping), 1500);

      setTimeout(() => {
        setTyping(null);
        const reply: ChatMessage = {
          id: `${participant.id}-reply-${Date.now()}`,
          conversationId: participant.id,
          from: "them",
          kind: MessageKind.TEXT,
          text: "Show! Combinado então 🎉",
          at: new Date(),
          status: MessageStatus.READ,
        };
        setMessages((prev) => [...prev, reply]);
      }, 3200);
    },
    [participant.id],
  );

  function handleSendText(text: string) {
    const draft: ChatMessage = {
      id: `${participant.id}-msg-${Date.now()}`,
      conversationId: participant.id,
      from: "me",
      kind: MessageKind.TEXT,
      text,
      at: new Date(),
      status: MessageStatus.SENDING,
    };
    push(draft);
  }

  function handleSendVoice(durationSec: number) {
    const draft: ChatMessage = {
      id: `${participant.id}-audio-${Date.now()}`,
      conversationId: participant.id,
      from: "me",
      kind: MessageKind.AUDIO,
      durationSec,
      at: new Date(),
      status: MessageStatus.SENDING,
    };
    push(draft);
  }

  function handleOpenAttachment(kind: MessageKindValue) {
    if (kind === MessageKind.LOCATION) {
      const draft: ChatMessage = {
        id: `${participant.id}-loc-${Date.now()}`,
        conversationId: participant.id,
        from: "me",
        kind: MessageKind.LOCATION,
        label: "Café Central",
        proximity: formatChatProximity(1600),
        cover: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400",
        at: new Date(),
        status: MessageStatus.SENDING,
      };
      push(draft);
      return;
    }
    toast.info("Anexo disponível em breve");
  }

  function handleReaction(messageId: string, reaction: QuickReaction) {
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, reaction } : m)));
  }

  function handleRetry(messageId: string) {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, status: MessageStatus.SENDING } : m)),
    );
  }

  function handleSearchResultClick(messageId: string) {
    const el = document.getElementById(`msg-${messageId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    setShowSearch(false);
  }

  const toggleMuted = useCallback(() => setMuted((value) => !value), []);

  return (
    <main className="relative flex-1 flex flex-col h-full min-h-0 pb-[calc(env(safe-area-inset-bottom,0px)+5rem)]">
      <StatusBar />

      <ChatHeader
        participant={participant}
        proximity={proximity}
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

      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar min-h-0">
        <MessageList
          messages={messages}
          participantPhoto={participant.photo}
          onReaction={handleReaction}
          onRetry={handleRetry}
        />

        {typing && <TypingIndicator name={participant.name} photo={participant.photo} />}
      </div>

      <MessageInput
        placeholder="Digite uma mensagem"
        onSendText={handleSendText}
        onSendVoice={handleSendVoice}
        onOpenAttachment={handleOpenAttachment}
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
              label={`Ver perfil de ${participant.name}`}
              onClick={() => {
                setMenuOpen(false);
                toast.info(`Perfil de ${participant.name} — em breve`);
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
                toast.info("Usuário bloqueado (simulação)");
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
}: {
  icon: typeof User;
  label: string;
  onClick: () => void;
  active?: boolean;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
        destructive
          ? "text-destructive hover:bg-destructive/10"
          : active
            ? "text-primary hover:bg-accent"
            : "text-foreground hover:bg-accent",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );
}
