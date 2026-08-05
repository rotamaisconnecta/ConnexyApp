import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ThreadAvatar } from "./thread-avatar";
import { GESTURE_LABELS } from "./thread-elements";
import { formatConversationTime } from "@/lib/chat/chat-format";
import type { MockConversation } from "@/lib/chat/mock-conversations";

interface ContinueCardProps {
  conversation: MockConversation;
  onGesture: (conversation: MockConversation) => void;
}

const item = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut" as const } },
};

export function ContinueCard({ conversation, onGesture }: ContinueCardProps) {
  const { participant, currentThread, updatedAt } = conversation;
  const gestureLabel = conversation.nextGesture
    ? GESTURE_LABELS[conversation.nextGesture]
    : "Retomar";
  const time = formatConversationTime(updatedAt);

  return (
    <motion.article
      variants={item}
      className="w-[236px] shrink-0 rounded-2xl border border-border bg-surface p-3 shadow-soft"
    >
      <Link
        to="/chat/$conversationId"
        params={{ conversationId: conversation.id }}
        aria-label={`Abrir conversa com ${participant.name}`}
        className="block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <div className="flex items-center gap-2.5">
          <ThreadAvatar conversation={conversation} className="h-10 w-10" />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold tracking-tight">{participant.name}</p>
            <p className="truncate text-[11px] text-muted-foreground">{time}</p>
          </div>
        </div>

        <p className="mt-2.5 truncate text-[12px] font-medium text-primary/80">{currentThread}</p>
      </Link>

      <button
        type="button"
        onClick={() => onGesture(conversation)}
        aria-label={`${gestureLabel} com ${participant.name}`}
        className="mt-2.5 w-full rounded-full bg-primary/10 py-1.5 text-center text-[12px] font-semibold text-primary transition-colors hover:bg-primary/15 active:bg-primary/20"
      >
        {gestureLabel}
      </button>

      <Link
        to="/chat/$conversationId"
        params={{ conversationId: conversation.id }}
        className="mt-1.5 block w-full rounded-full py-1 text-center text-[11px] text-muted-foreground transition-colors hover:text-foreground"
      >
        Ver conversa
      </Link>
    </motion.article>
  );
}
