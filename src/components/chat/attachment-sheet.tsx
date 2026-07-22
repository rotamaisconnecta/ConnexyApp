import { motion } from "framer-motion";
import { ATTACHMENT_OPTIONS, type MessageKindValue } from "@/lib/chat/chat-types";

interface AttachmentSheetProps {
  onSelect: (kind: MessageKindValue) => void;
  onClose: () => void;
}

export function AttachmentSheet({ onSelect, onClose }: AttachmentSheetProps) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/30 z-40"
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 260 }}
        className="absolute bottom-full left-0 right-0 mb-2 mx-3 rounded-2xl border border-border bg-surface shadow-elegant overflow-hidden z-50"
      >
        <div className="flex justify-center py-2">
          <span className="h-1.5 w-10 rounded-full bg-border" />
        </div>
        <p className="px-4 pb-2 text-xs font-semibold text-muted-foreground">Anexar</p>
        <div className="grid grid-cols-3 gap-2 px-4 pb-4">
          {ATTACHMENT_OPTIONS.map((opt) => (
            <button
              key={opt.kind}
              type="button"
              onClick={() => onSelect(opt.kind)}
              className="flex flex-col items-center gap-1.5 rounded-2xl border border-border p-3 hover:bg-accent transition-colors"
            >
              <span className="text-2xl">{opt.icon}</span>
              <span className="text-[11px] font-medium">{opt.label}</span>
            </button>
          ))}
        </div>
      </motion.div>
    </>
  );
}
