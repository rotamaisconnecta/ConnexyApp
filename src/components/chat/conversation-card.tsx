import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { PresenceDot } from "@/components/presence-dot";
import type { Conversation } from "@/lib/chat/chat-types";
import { formatConversationPreview, formatConversationTime } from "@/lib/chat/chat-format";
import { truncateText } from "@/lib/chat/chat-format";

interface ConversationCardProps {
  conversation: Conversation;
  onClick: (id: string) => void;
}

const item = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.25, ease: "easeOut" as const } },
};

export function ConversationCard({ conversation, onClick }: ConversationCardProps) {
  const { participant, lastMessage, unreadCount, pinned, muted } = conversation;
  const preview = formatConversationPreview(lastMessage);
  const time = formatConversationTime(lastMessage?.at ?? null);

  return (
    <motion.button
      type="button"
      variants={item}
      onClick={() => onClick(conversation.id)}
      className="w-full flex items-center gap-3 rounded-2xl p-3 text-left transition-colors hover:bg-accent/50 active:bg-accent"
      aria-label={`Conversa com ${participant.name}`}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <img
          src={participant.photo}
          alt={`Foto de ${participant.name}`}
          className="h-12 w-12 rounded-2xl object-cover"
        />
        <span className="absolute -bottom-0.5 -right-0.5">
          <PresenceDot online={participant.online} size={10} />
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center justify-between gap-2">
          <h3
            className={`text-sm font-semibold truncate ${unreadCount > 0 ? "text-foreground" : "text-foreground/80"}`}
          >
            {participant.name}
          </h3>
          <span className="text-[10px] text-muted-foreground shrink-0">{time}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p
            className={`text-xs truncate ${unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}
          >
            {truncateText(preview, 45)}
          </p>
          <div className="flex items-center gap-1.5 shrink-0">
            {pinned && <span className="text-[10px]">📌</span>}
            {muted && <span className="text-[10px]">🔇</span>}
            {unreadCount > 0 && (
              <span className="min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold grid place-items-center px-1">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.button>
  );
}
