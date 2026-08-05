import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { BellOff, MoreHorizontal, Pin } from "lucide-react";
import { ThreadAvatar } from "./thread-avatar";
import { GESTURE_LABELS, THREAD_ICONS } from "./thread-elements";
import { cn } from "@/lib/utils";
import { formatChatProximity } from "@/lib/chat/proximity";
import { formatConversationTime } from "@/lib/chat/chat-format";
import type { MockConversation } from "@/lib/chat/mock-conversations";

interface ConversationRowProps {
  conversation: MockConversation;
  onGesture: (conversation: MockConversation) => void;
  onMenu: (conversation: MockConversation) => void;
}

const item = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" as const } },
};

export function ConversationRow({ conversation, onGesture, onMenu }: ConversationRowProps) {
  const {
    participant,
    unreadCount,
    isMuted,
    isPinned,
    currentThread,
    threadIcon,
    lastMessage,
    updatedAt,
    nextGesture,
    proximityMeters,
  } = conversation;

  const ThreadIcon = THREAD_ICONS[threadIcon];
  const gestureLabel = nextGesture ? GESTURE_LABELS[nextGesture] : null;
  const time = formatConversationTime(updatedAt);
  const proximity = proximityMeters !== undefined ? formatChatProximity(proximityMeters) : null;

  return (
    <motion.article
      variants={item}
      className="group relative flex items-center gap-3 rounded-2xl px-5 py-3 transition-colors hover:bg-accent/40 active:bg-accent"
    >
      <Link
        to="/chat/$conversationId"
        params={{ conversationId: conversation.id }}
        aria-label={`Abrir conversa com ${participant.name}`}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <ThreadAvatar conversation={conversation} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3
              className={cn(
                "truncate text-[15px] tracking-tight",
                unreadCount > 0
                  ? "font-semibold text-foreground"
                  : "font-medium text-foreground/90",
              )}
            >
              {participant.name}
            </h3>
            <div className="flex shrink-0 items-center gap-1.5">
              {isPinned && <Pin className="h-3 w-3 text-primary/70" strokeWidth={2.2} />}
              {isMuted && (
                <BellOff className="h-3 w-3 text-muted-foreground/70" strokeWidth={2.2} />
              )}
              <span
                className={cn(
                  "text-[11px] tabular-nums",
                  unreadCount > 0 ? "font-semibold text-primary" : "text-muted-foreground",
                )}
              >
                {time}
              </span>
            </div>
          </div>

          <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
            <ThreadIcon className="h-3.5 w-3.5 shrink-0 text-primary/60" strokeWidth={2.2} />
            <p className="truncate text-[12px] font-medium text-primary/80">{currentThread}</p>
          </div>

          <div className="mt-0.5 flex min-w-0 items-center gap-2">
            <p className="flex-1 truncate text-[12px] text-muted-foreground">{lastMessage}</p>
            {proximity && (
              <span className="shrink-0 text-[10px] text-muted-foreground/70">{proximity}</span>
            )}
            {unreadCount > 0 && (
              <span className="grid h-[18px] min-w-[18px] shrink-0 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="flex shrink-0 flex-col items-center gap-1.5">
        {gestureLabel && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onGesture(conversation);
            }}
            className={cn(
              "whitespace-nowrap rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary transition-all duration-200",
              "hover:bg-primary/15 active:bg-primary/20",
              "sm:opacity-0 sm:group-hover:opacity-100",
            )}
          >
            {gestureLabel}
          </button>
        )}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onMenu(conversation);
          }}
          aria-label={`Mais opções para ${participant.name}`}
          className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary active:bg-accent"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
    </motion.article>
  );
}
