import { motion } from "framer-motion";
import { ConversationCard } from "./conversation-card";
import type { Conversation } from "@/lib/chat/chat-types";

interface ConversationListProps {
  conversations: Conversation[];
  onSelect: (id: string) => void;
}

const container = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

export function ConversationList({ conversations, onSelect }: ConversationListProps) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className="divide-y divide-border"
    >
      {conversations.map((conversation) => (
        <ConversationCard key={conversation.id} conversation={conversation} onClick={onSelect} />
      ))}
    </motion.div>
  );
}
