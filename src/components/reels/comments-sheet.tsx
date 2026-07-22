import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Send, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Comment = {
  id: string;
  text: string;
  created_at: string;
  author_id: string;
  author?: { name: string | null; photo_url: string | null } | null;
};

export function CommentsSheet({
  reelId,
  open,
  onClose,
  currentUserId,
  onCountChange,
}: {
  reelId: string | null;
  open: boolean;
  onClose: () => void;
  currentUserId: string | null;
  onCountChange?: (delta: number) => void;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open || !reelId) return;
    setLoading(true);
    supabase
      .from("reel_comments")
      .select("id, text, created_at, author_id, profiles:author_id(name, photo_url)")
      .eq("reel_id", reelId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        const rows = (data ?? []).map(
          (r: {
            id: string;
            text: string;
            created_at: string;
            author_id: string;
            profiles: { name: string | null; photo_url: string | null } | null;
          }) => ({
            id: r.id,
            text: r.text,
            created_at: r.created_at,
            author_id: r.author_id,
            author: r.profiles,
          }),
        );
        setComments(rows);
        setLoading(false);
      });
  }, [reelId, open]);

  async function send() {
    if (!text.trim() || !reelId || !currentUserId) return;
    setSending(true);
    const { data, error } = await supabase
      .from("reel_comments")
      .insert({ reel_id: reelId, author_id: currentUserId, text: text.trim() })
      .select("id, text, created_at, author_id, profiles:author_id(name, photo_url)")
      .single();
    setSending(false);
    if (error || !data) {
      toast.error(error?.message ?? "Falha ao comentar");
      return;
    }
    setComments((prev) => [
      ...prev,
      {
        id: data.id,
        text: data.text,
        created_at: data.created_at,
        author_id: data.author_id,
        author: data.profiles,
      },
    ]);
    setText("");
    onCountChange?.(1);
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-black/60"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 260 }}
            className="absolute inset-x-0 bottom-0 z-50 rounded-t-3xl bg-surface max-h-[75%] flex flex-col shadow-elegant"
          >
            <div className="pt-2 pb-1 flex justify-center">
              <div className="h-1 w-10 rounded-full bg-border" />
            </div>
            <div className="px-4 pb-2 flex items-center">
              <h3 className="font-display font-bold text-base flex-1">Comentários</h3>
              <button
                onClick={onClose}
                className="h-8 w-8 grid place-items-center rounded-full bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-2">
              {loading ? (
                <div className="grid place-items-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : comments.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-10">
                  Seja o primeiro a comentar 💬
                </p>
              ) : (
                <ul className="space-y-3">
                  {comments.map((c) => (
                    <li key={c.id} className="flex items-start gap-2.5">
                      <img
                        src={
                          c.author?.photo_url ??
                          `https://api.dicebear.com/9.x/initials/svg?seed=${c.author?.name ?? "?"}`
                        }
                        alt=""
                        className="h-8 w-8 rounded-full object-cover"
                      />
                      <div className="flex-1 rounded-2xl bg-secondary px-3 py-2">
                        <div className="text-[11px] font-semibold text-primary">
                          {c.author?.name ?? "Anônimo"}
                        </div>
                        <div className="text-sm">{c.text}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="p-3 border-t border-border flex items-center gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={currentUserId ? "Comentar…" : "Entre para comentar"}
                disabled={!currentUserId || sending}
                onKeyDown={(e) => {
                  if (e.key === "Enter") send();
                }}
                className="flex-1 h-11 rounded-full bg-secondary px-4 text-sm outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
              />
              <button
                onClick={send}
                disabled={!currentUserId || sending || !text.trim()}
                className="h-11 w-11 grid place-items-center rounded-full bg-gradient-brand text-white disabled:opacity-40"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
