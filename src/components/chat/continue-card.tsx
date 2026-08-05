import { motion } from "framer-motion";
import { ThreadAvatar } from "./thread-avatar";
import { GESTURE_LABELS } from "./thread-elements";
import { formatConversationTime } from "@/lib/chat/chat-format";
import type { MockConversation } from "@/lib/chat/mock-conversations";

interface ContinueCardProps {
  conversation: MockConversation;
  onOpen: (id: string) => void;
  onGesture: (conversation: MockConversation) => void;
}

const item = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut" as const } },
};

export function ContinueCard({ conversation, onOpen, onGesture }: ContinueCardProps) {
  const { participant, currentThread, updatedAt } = conversation;
  const gestureLabel = conversation.nextGesture
    ? GESTURE_LABELS[conversation.nextGesture]
    : "Retomar";
  const time = formatConversationTime(updatedAt);

  return (
    <motion.div
      variants={item}
      className="w-[236px] shrink-0 rounded-2xl border border-border bg-surface p-3 shadow-soft"
    >
      <div className="flex items-center gap-2.5">
        <ThreadAvatar conversation={conversation} className="h-10 w-10" />
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold tracking-tight">{participant.name}</p>
          <p className="truncate text-[11px] text-muted-foreground">{time}</p>
        </div>
      </div>

      <p className="mt-2.5 truncate text-[12px] font-medium text-primary/80">{currentThread}</p>

      <button
        type="button"
        onClick={() => onGesture(conversation)}
        aria-label={`${gestureLabel} com ${participant.name}`}
        className="mt-2.5 w-full rounded-full bg-primary/10 py-1.5 text-center text-[12px] font-semibold text-primary transition-colors hover:bg-primary/15 active:bg-primary/20"
      >
        {gestureLabel}
      </button>

      <button
        type="button"
        onClick={() => onOpen(conversation.id)}
        aria-label={`Abrir conversa com ${participant.name}`}
        className="mt-1.5 w-full rounded-full py-1 text-center text-[11px] text-muted-foreground transition-colors hover:text-foreground"
      >
        Ver conversa
      </button>
    </motion.div>
  );
}
