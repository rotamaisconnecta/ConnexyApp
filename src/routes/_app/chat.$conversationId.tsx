import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { ChatHeader } from "@/components/chat/chat-header";
import { MessageList } from "@/components/chat/message-list";
import { MessageInput } from "@/components/chat/message-input";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import { ChatSearch } from "@/components/chat/chat-search";
import { LoadingChat } from "@/components/chat/loading-chat";
import { people, findPerson } from "@/lib/mock-data";
import type {
  ChatMessage,
  TypingIndicator as TypingType,
  QuickReaction,
} from "@/lib/chat/chat-types";
import { MessageKind, MessageStatus } from "@/lib/chat/chat-types";
import { createTypingIndicator } from "@/lib/chat/typing-utils";
import { advanceStatus } from "@/lib/chat/message-status";

export const Route = createFileRoute("/_app/chat/$conversationId")({
  head: () => ({ meta: [{ title: "Chat — Connexy" }] }),
  loader: ({ params }) => {
    const person = findPerson(params.conversationId);
    if (!person) throw new Error("Conversa não encontrada");
    return { person };
  },
  notFoundComponent: () => (
    <div className="flex-1 flex items-center justify-center p-6 text-sm text-muted-foreground">
      Conversa não encontrada.
    </div>
  ),
  component: ConversationPage,
});

const NOW = Date.now();
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

function generateMockMessages(personId: string): ChatMessage[] {
  return [
    {
      id: `${personId}-1`,
      conversationId: personId,
      from: "them",
      kind: MessageKind.TEXT,
      text: "Oi! Vi que a gente tem interesses em comum 😊",
      at: new Date(NOW - 3 * HOUR),
      status: MessageStatus.READ,
    },
    {
      id: `${personId}-2`,
      conversationId: personId,
      from: "me",
      kind: MessageKind.TEXT,
      text: "Oi! Sim, adoro café e fotografia!",
      at: new Date(NOW - 3 * HOUR + 5 * MINUTE),
      status: MessageStatus.READ,
    },
    {
      id: `${personId}-3`,
      conversationId: personId,
      from: "them",
      kind: MessageKind.TEXT,
      text: "Que legal! Você conhece o Café Central? Fica aqui pertinho",
      at: new Date(NOW - 2 * HOUR),
      status: MessageStatus.READ,
    },
    {
      id: `${personId}-4`,
      conversationId: personId,
      from: "me",
      kind: MessageKind.TEXT,
      text: "Conheço sim! Lugar incrível, já fui várias vezes ☕",
      at: new Date(NOW - 2 * HOUR + 3 * MINUTE),
      status: MessageStatus.READ,
    },
    {
      id: `${personId}-5`,
      conversationId: personId,
      from: "them",
      kind: MessageKind.LOCATION,
      label: "Café Central",
      proximity: "A 800m de você",
      at: new Date(NOW - 1 * HOUR),
      status: MessageStatus.READ,
    },
    {
      id: `${personId}-6`,
      conversationId: personId,
      from: "me",
      kind: MessageKind.TEXT,
      text: "Top! Bora marcar um café? 😄",
      at: new Date(NOW - 45 * MINUTE),
      status: MessageStatus.READ,
    },
    {
      id: `${personId}-7`,
      conversationId: personId,
      from: "them",
      kind: MessageKind.TEXT,
      text: "Bora! Quando você pode?",
      at: new Date(NOW - 30 * MINUTE),
      status: MessageStatus.READ,
    },
    {
      id: `${personId}-8`,
      conversationId: personId,
      from: "them",
      kind: MessageKind.IMAGE,
      url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400",
      caption: "Essa é a vibe do lugar ☕✨",
      at: new Date(NOW - 15 * MINUTE),
      status: MessageStatus.DELIVERED,
    },
  ];
}

function ConversationPage() {
  const { person } = Route.useLoaderData();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>(() => generateMockMessages(person.id));
  const [typing, setTyping] = useState<TypingType | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing]);

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

      const otherTyping = createTypingIndicator(person.id, person.id);
      setTimeout(() => setTyping(otherTyping), 1500);

      setTimeout(() => {
        setTyping(null);
        const reply: ChatMessage = {
          id: `${person.id}-reply-${Date.now()}`,
          conversationId: person.id,
          from: "them",
          kind: MessageKind.TEXT,
          text: "Show! Combinado então 🎉",
          at: new Date(),
          status: MessageStatus.READ,
        };
        setMessages((prev) => [...prev, reply]);
      }, 3000);
    },
    [person.id],
  );

  function handleSendText(text: string) {
    const draft: ChatMessage = {
      id: `${person.id}-msg-${Date.now()}`,
      conversationId: person.id,
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
      id: `${person.id}-audio-${Date.now()}`,
      conversationId: person.id,
      from: "me",
      kind: MessageKind.AUDIO,
      durationSec,
      at: new Date(),
      status: MessageStatus.SENDING,
    };
    push(draft);
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

  return (
    <div className="flex-1 flex flex-col h-full">
      <StatusBar />

      <ChatHeader
        participant={{
          id: person.id,
          name: person.name,
          photo: person.photo,
          online: person.online,
          lastSeen: person.lastSeen,
        }}
        onBack={() => navigate({ to: "/chat" })}
        onCall={() => {}}
        onVideoCall={() => {}}
        onMenu={() => {}}
      />

      {showSearch && (
        <ChatSearch
          messages={messages}
          onResultClick={handleSearchResultClick}
          onClose={() => setShowSearch(false)}
        />
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">Envie uma mensagem para {person.name}</p>
          </div>
        ) : (
          <MessageList
            messages={messages}
            participantPhoto={person.photo}
            onReaction={handleReaction}
            onRetry={handleRetry}
          />
        )}

        {typing && <TypingIndicator name={person.name} photo={person.photo} />}
      </div>

      <MessageInput
        onSendText={handleSendText}
        onSendVoice={handleSendVoice}
        onOpenAttachment={() => {}}
      />
    </div>
  );
}
