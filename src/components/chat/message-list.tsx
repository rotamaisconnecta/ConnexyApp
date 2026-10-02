import { motion } from "framer-motion";
import { DateDivider } from "./date-divider";
import { MessageBubble } from "./message-bubble";
import type { ChatMessage, QuickReaction } from "@/lib/chat/chat-types";
import { groupMessagesByDate, shouldGroupWithPrevious } from "@/lib/chat/message-grouping";
import { timelineMetaFor } from "@/lib/chat/timeline-context";

interface MessageListProps {
  messages: ChatMessage[];
  participantPhoto: string;
  onReaction?: (messageId: string, reaction: QuickReaction) => void;
  onRetry?: (messageId: string) => void;
  onOpenSharedContent?: (contentId: string, kind: "event" | "place") => void;
  isGroup?: boolean;
  selecting?: boolean;
  selectedIds?: ReadonlySet<string>;
  onToggleSelect?: (messageId: string) => void;
  onEnterSelection?: (messageId: string) => void;
  onRequestDelete?: (message: ChatMessage) => void;
  onDownload?: (message: ChatMessage) => void;
  onOpenMedia?: (message: ChatMessage) => void;
  onOpenDocument?: (message: ChatMessage) => void;
}

const bubbleContainer = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

const bubbleEntry = {
  hidden: { opacity: 0, y: 8, scale: 0.985 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.22, ease: "easeOut" as const },
  },
};

export function MessageList({
  messages,
  participantPhoto,
  onReaction,
  onRetry,
  onOpenSharedContent,
  isGroup = false,
  selecting = false,
  selectedIds,
  onToggleSelect,
  onEnterSelection,
  onRequestDelete,
  onDownload,
  onOpenMedia,
  onOpenDocument,
}: MessageListProps) {
  const dateGroups = groupMessagesByDate(messages);
  const meta = timelineMetaFor(messages);

  return (
    <motion.div
      variants={bubbleContainer}
      initial="hidden"
      animate="visible"
      className="relative px-3 py-3"
    >
      <div
        className="pointer-events-none absolute bottom-10 left-[23px] top-6 w-px bg-primary/12"
        aria-hidden
      />

      {dateGroups.map((group) => (
        <div key={group.date.toISOString()} className="relative">
          <DateDivider label={group.label} />
          {group.messages.map((msg, idx) => {
            const prev = idx > 0 ? group.messages[idx - 1] : null;
            const item = meta.get(msg.id);
            const prevItem = prev ? meta.get(prev.id) : null;
            const sameCluster = Boolean(item?.clusterId && item.clusterId === prevItem?.clusterId);
            const grouped = shouldGroupWithPrevious(msg, prev) || sameCluster;
            const showMarker = Boolean(item?.marker) || item?.isClusterStart || !grouped;

            return (
              <motion.div key={msg.id} variants={bubbleEntry} className="relative grid grid-cols-[22px_minmax(0,1fr)] gap-2">
                <div className="relative flex justify-center pt-3.5">
                  {showMarker ? (
                    <span
                      className={`z-[1] block h-2.5 w-2.5 rounded-full ring-[3px] ring-[#F6F3FF] ${
                        item?.marker ? "bg-primary shadow-[0_0_0_4px_rgba(108,59,255,0.12)]" : "bg-primary/35"
                      }`}
                      aria-hidden
                    />
                  ) : (
                    <span className="z-[1] mt-1 block h-1.5 w-1.5 rounded-full bg-primary/20" aria-hidden />
                  )}
                </div>
                <div className="min-w-0 pb-1">
                  {item?.isClusterStart && item.clusterLabel ? (
                    <p className="mb-1.5 px-0.5 text-[10px] font-semibold tracking-wide text-primary/70">
                      {item.clusterLabel}
                    </p>
                  ) : null}
                  <MessageBubble
                    message={msg}
                    participantPhoto={participantPhoto}
                    grouped={grouped}
                    onReaction={onReaction}
                    onRetry={onRetry}
                    onOpenSharedContent={onOpenSharedContent}
                    showSender={isGroup && !grouped}
                    selecting={selecting}
                    selected={selectedIds?.has(msg.id) ?? false}
                    onToggleSelect={onToggleSelect}
                    onEnterSelection={onEnterSelection}
                    onRequestDelete={onRequestDelete}
                    onDownload={onDownload}
                    onOpenMedia={onOpenMedia}
                    onOpenDocument={onOpenDocument}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      ))}
    </motion.div>
  );
}
