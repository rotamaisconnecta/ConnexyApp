import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { ReelComment } from "@/lib/reels/reel-types";
import { ReelCommentItem } from "./reel-comment-item";
import { ReelCommentInput } from "./reel-comment-input";

interface ReelCommentsSheetProps {
  reelId: string | null;
  open: boolean;
  onClose: () => void;
  comments: ReelComment[];
  onAddComment: (text: string) => Promise<boolean> | boolean;
  onReply: (parentId: string, text: string) => Promise<boolean> | boolean;
  onLikeComment: (id: string) => void;
}

export function ReelCommentsSheet({
  reelId,
  open,
  onClose,
  comments,
  onAddComment,
  onReply,
  onLikeComment,
}: ReelCommentsSheetProps) {
  const [text, setText] = useState("");
  const [replyingTo, setReplyingTo] = useState<ReelComment | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setText("");
    setReplyingTo(null);
  }, [reelId, open]);

  async function handleSubmit() {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      const saved = replyingTo
        ? await onReply(replyingTo.id, text.trim())
        : await onAddComment(text.trim());
      if (saved) {
        setText("");
        setReplyingTo(null);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {open && reelId && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[60] bg-black/60"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 260 }}
            className="absolute inset-x-0 bottom-0 z-[70] rounded-t-3xl bg-surface max-h-[75%] flex flex-col shadow-elegant"
          >
            <div className="pt-2 pb-1 flex justify-center">
              <div className="h-1 w-10 rounded-full bg-border" />
            </div>
            <div className="px-4 pb-2 flex items-center">
              <h3 className="font-display font-bold text-base flex-1 text-foreground">
                Comentários
              </h3>
              <button
                onClick={onClose}
                className="h-8 w-8 grid place-items-center rounded-full bg-secondary"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
              {comments.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-10">
                  Seja o primeiro a comentar
                </p>
              ) : (
                comments.map((c) => (
                  <ReelCommentItem
                    key={c.id}
                    comment={c}
                    onLike={onLikeComment}
                    onReply={setReplyingTo}
                  />
                ))
              )}
            </div>
            <div className="p-3 border-t border-border">
              {replyingTo && (
                <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex-1 truncate">Respondendo a {replyingTo.authorName}</span>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="h-6 w-6 grid place-items-center rounded-full bg-secondary"
                    aria-label="Cancelar resposta"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              <ReelCommentInput
                value={text}
                onChange={setText}
                onSubmit={handleSubmit}
                placeholder={replyingTo ? `Responder a ${replyingTo.authorName}…` : undefined}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
