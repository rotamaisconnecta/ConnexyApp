import { motion } from "framer-motion";
import { DateDivider } from "./date-divider";
import { MessageBubble } from "./message-bubble";
import type { ChatMessage, QuickReaction } from "@/lib/chat/chat-types";
import { groupMessagesByDate } from "@/lib/chat/message-grouping";
import { shouldGroupWithPrevious } from "@/lib/chat/message-grouping";

interface MessageListProps {
  messages: ChatMessage[];
  participantPhoto: string;
  onReaction?: (messageId: string, reaction: QuickReaction) => void;
  onRetry?: (messageId: string) => void;
}

const bubbleContainer = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.03 },
  },
};

const bubbleEntry = {
  hidden: { opacity: 0, y: 6, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.2, ease: "easeOut" as const },
  },
};

export function MessageList({ messages, participantPhoto, onReaction, onRetry }: MessageListProps) {
  const dateGroups = groupMessagesByDate(messages);

  return (
    <motion.div
      variants={bubbleContainer}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-1 px-3 py-2"
    >
      {dateGroups.map((group) => (
        <div key={group.date.toISOString()}>
          <DateDivider label={group.label} />
          {group.messages.map((msg, idx) => {
            const prev = idx > 0 ? group.messages[idx - 1] : null;
            const grouped = shouldGroupWithPrevious(msg, prev);

            return (
              <motion.div key={msg.id} variants={bubbleEntry}>
                <MessageBubble
                  message={msg}
                  participantPhoto={participantPhoto}
                  grouped={grouped}
                  onReaction={onReaction}
                  onRetry={onRetry}
                />
              </motion.div>
            );
          })}
        </div>
      ))}
    </motion.div>
  );
}
