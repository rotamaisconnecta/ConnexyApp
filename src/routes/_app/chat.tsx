import { useState, useMemo } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { StatusBar } from "@/components/phone-frame";
import { ConversationList } from "@/components/chat/conversation-list";
import { EmptyChat } from "@/components/chat/empty-chat";
import { LoadingChat } from "@/components/chat/loading-chat";
import { cn } from "@/lib/utils";
import { people, currentUser } from "@/lib/mock-data";
import type { Conversation, ChatMessage } from "@/lib/chat/chat-types";
import { MessageKind, MessageStatus, ConversationSort } from "@/lib/chat/chat-types";
import type { ConversationFilters, ConversationSortValue } from "@/lib/chat/chat-types";
import { filterConversations, sortConversations, getTotalUnread } from "@/lib/chat/chat-utils";
import { INITIAL_CONVERSATION_FILTERS } from "@/lib/chat/chat-types";

export const Route = createFileRoute("/_app/chat")({
  head: () => ({ meta: [{ title: "Chat — Connexy" }] }),
  component: ChatListPage,
});

const MOCK_CONVERSATIONS: Conversation[] = people.map((p, i) => ({
  id: p.id,
  participant: {
    id: p.id,
    name: p.name,
    photo: p.photo,
    online: p.online,
    lastSeen: p.lastSeen,
  },
  lastMessage:
    i < 3
      ? {
          id: `msg-${p.id}`,
          conversationId: p.id,
          from: (i % 2 === 0 ? "me" : "them") as "me" | "them",
          kind: MessageKind.TEXT,
          text:
            i === 0
              ? "Vamos nos encontrar no Café Central?"
              : i === 1
                ? "Adorei o post!"
                : "Bora lá! 🎉",
          at: new Date(Date.now() - (i + 1) * 15 * 60 * 1000),
          status: MessageStatus.READ,
        }
      : null,
  unreadCount: i === 0 ? 2 : i === 1 ? 1 : 0,
  pinned: i === 0,
  muted: false,
  createdAt: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000),
}));

function ChatListPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<ConversationFilters>(INITIAL_CONVERSATION_FILTERS);
  const [sort] = useState<ConversationSortValue>(ConversationSort.LAST_MESSAGE);
  const [loading] = useState(false);

  const result = useMemo(() => {
    const filtered = filterConversations(MOCK_CONVERSATIONS, filters);
    return sortConversations(filtered, sort);
  }, [filters, sort]);

  const totalUnread = useMemo(() => getTotalUnread(MOCK_CONVERSATIONS), []);

  function handleSelect(id: string) {
    navigate({ to: "/chat/$conversationId", params: { conversationId: id } });
  }

  return (
    <div className="flex-1 pb-20">
      <StatusBar />

      <header className="px-5 pt-1 pb-3 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="font-display font-bold text-lg">Chat</h1>
          {totalUnread > 0 && (
            <span className="h-5 min-w-[20px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold grid place-items-center px-1.5">
              {totalUnread}
            </span>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={filters.query}
            onChange={(e) => setFilters({ ...filters, query: e.target.value })}
            placeholder="Pesquisar conversas"
            className="w-full rounded-xl border border-border bg-surface pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Pesquisar conversas"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilters({ ...filters, unreadOnly: !filters.unreadOnly })}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
              filters.unreadOnly
                ? "bg-primary/15 text-primary"
                : "bg-secondary text-muted-foreground",
            )}
          >
            Não lidas
          </button>
          <button
            type="button"
            onClick={() => setFilters({ ...filters, onlineOnly: !filters.onlineOnly })}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
              filters.onlineOnly
                ? "bg-primary/15 text-primary"
                : "bg-secondary text-muted-foreground",
            )}
          >
            Online
          </button>
        </div>
      </header>

      <div className="px-4">
        {loading ? (
          <LoadingChat />
        ) : result.length === 0 ? (
          <EmptyChat />
        ) : (
          <ConversationList conversations={result} onSelect={handleSelect} />
        )}
      </div>
    </div>
  );
}
