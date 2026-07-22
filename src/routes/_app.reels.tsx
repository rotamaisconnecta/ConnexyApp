import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, Send, Plus, Clapperboard, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { ReelCard, type ReelItem } from "@/components/reels/reel-card";
import { CommentsSheet } from "@/components/reels/comments-sheet";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_app/reels")({
  head: () => ({
    meta: [
      { title: "Reels — Connecta" },
      {
        name: "description",
        content:
          "Momentos reais de quem está por perto. Reels ancorados em lugares e eventos do Connecta.",
      },
    ],
  }),
  component: ReelsPage,
});

type Tab = "reels" | "amigos";

function ReelsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("reels");
  const [reels, setReels] = useState<ReelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const [muted, setMuted] = useState(true);
  const [commentsFor, setCommentsFor] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("reels")
      .select(
        `
        id, video_url, poster_url, caption, audio_label, created_at, tagged_user_ids,
        author:profiles!reels_author_id_fkey ( id, name, handle, photo_url ),
        place:places ( id, name, category )
      `,
      )
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    const rows = data ?? [];
    const ids = rows.map((r) => r.id);
    const [{ data: likeRows }, { data: commentRows }, myLikesRes] = await Promise.all([
      supabase
        .from("reel_likes")
        .select("reel_id")
        .in("reel_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
      supabase
        .from("reel_comments")
        .select("reel_id")
        .in("reel_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
      user
        ? supabase
            .from("reel_likes")
            .select("reel_id")
            .eq("user_id", user.id)
            .in("reel_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"])
        : Promise.resolve({ data: [] as { reel_id: string }[] }),
    ]);
    const likesMap = new Map<string, number>();
    (likeRows ?? []).forEach((r) => likesMap.set(r.reel_id, (likesMap.get(r.reel_id) ?? 0) + 1));
    const commentsMap = new Map<string, number>();
    (commentRows ?? []).forEach((r) =>
      commentsMap.set(r.reel_id, (commentsMap.get(r.reel_id) ?? 0) + 1),
    );
    const mineSet = new Set(
      ((myLikesRes.data as { reel_id: string }[] | null) ?? []).map((r) => r.reel_id),
    );

    const items: ReelItem[] = rows.map((r) => ({
      id: r.id,
      video_url: r.video_url,
      poster_url: r.poster_url,
      caption: r.caption,
      audio_label: r.audio_label,
      created_at: r.created_at,
      tagged_user_ids: r.tagged_user_ids ?? [],
      author: Array.isArray(r.author) ? r.author[0] : r.author,
      place: Array.isArray(r.place) ? r.place[0] : r.place,
      likes: likesMap.get(r.id) ?? 0,
      comments: commentsMap.get(r.id) ?? 0,
      likedByMe: mineSet.has(r.id),
    }));

    // Resolve signed URLs for paths stored in the private bucket
    const needsSign = items
      .filter((it) => it.video_url && !it.video_url.startsWith("http"))
      .map((it) => it.video_url);
    const posterNeeds = items
      .filter((it) => it.poster_url && !it.poster_url.startsWith("http"))
      .map((it) => it.poster_url!);
    const allPaths = Array.from(new Set([...needsSign, ...posterNeeds]));
    if (allPaths.length) {
      const { data: signed } = await supabase.storage
        .from("reels-media")
        .createSignedUrls(allPaths, 60 * 60 * 6);
      const map = new Map<string, string>();
      (signed ?? []).forEach((s) => {
        if (s.path && s.signedUrl) map.set(s.path, s.signedUrl);
      });
      items.forEach((it) => {
        if (it.video_url && !it.video_url.startsWith("http"))
          it.video_url = map.get(it.video_url) ?? it.video_url;
        if (it.poster_url && !it.poster_url.startsWith("http"))
          it.poster_url = map.get(it.poster_url) ?? it.poster_url;
      });
    }
    setReels(items);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  // Track active reel via scroll position
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => {
      const idx = Math.round(el.scrollTop / el.clientHeight);
      setActiveIdx(idx);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [reels.length]);

  async function toggleLike(reelId: string) {
    if (!user) {
      toast.error("Entre para curtir");
      return;
    }
    const idx = reels.findIndex((r) => r.id === reelId);
    if (idx < 0) return;
    const wasLiked = reels[idx].likedByMe;
    setReels((prev) =>
      prev.map((r, i) =>
        i === idx ? { ...r, likedByMe: !wasLiked, likes: r.likes + (wasLiked ? -1 : 1) } : r,
      ),
    );
    if (wasLiked) {
      await supabase.from("reel_likes").delete().eq("reel_id", reelId).eq("user_id", user.id);
    } else {
      const { error } = await supabase
        .from("reel_likes")
        .insert({ reel_id: reelId, user_id: user.id });
      if (error && !error.message.includes("duplicate")) toast.error(error.message);
    }
  }

  const emptyState = useMemo(
    () => (
      <div className="absolute inset-0 grid place-items-center px-6 text-center">
        <div>
          <div className="mx-auto h-16 w-16 grid place-items-center rounded-2xl bg-gradient-brand text-white shadow-elegant">
            <Clapperboard className="h-8 w-8" />
          </div>
          <h2 className="mt-4 font-display text-xl text-white font-bold">
            Nenhum reel por aqui ainda
          </h2>
          <p className="mt-2 text-sm text-white/70">
            Seja o primeiro a compartilhar um momento real de um lugar do Connecta.
          </p>
          <Link
            to="/gerenciar/novo-reel"
            className="mt-5 inline-flex items-center gap-2 h-11 rounded-full bg-gradient-brand text-white font-semibold px-5 shadow-elegant"
          >
            <Plus className="h-4 w-4" /> Criar meu primeiro reel
          </Link>
        </div>
      </div>
    ),
    [],
  );

  return (
    <div className="absolute inset-0 bg-[#0a0a0a] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="absolute inset-x-0 top-0 z-30 pt-4 px-4 pb-2 flex items-center gap-3">
        <div className="flex-1 flex items-center justify-center gap-1.5">
          <span className="font-display text-lg font-bold text-white">connec</span>
          <span className="font-display text-lg font-bold bg-gradient-brand bg-clip-text text-transparent">
            ta
          </span>
        </div>
        <button
          className="absolute right-14 top-4 h-9 w-9 grid place-items-center rounded-full bg-white/10 border border-white/15"
          aria-label="Buscar"
        >
          <Search className="h-4 w-4 text-white" />
        </button>
        <Link
          to="/connecta"
          className="absolute right-3 top-4 h-9 w-9 grid place-items-center rounded-full bg-white/10 border border-white/15 relative"
        >
          <Send className="h-4 w-4 text-white" />
          <span className="absolute -top-1 -right-1 h-4 w-4 grid place-items-center rounded-full bg-pink-500 text-[10px] font-bold text-white">
            3
          </span>
        </Link>
        {/* Tabs */}
        <div className="absolute left-4 top-14 flex items-center gap-4">
          <TabBtn
            active={tab === "reels"}
            onClick={() => setTab("reels")}
            label="Reels"
            icon={<Clapperboard className="h-4 w-4" />}
          />
          <TabBtn
            active={tab === "amigos"}
            onClick={() => setTab("amigos")}
            label="Amigos"
            icon={<Users className="h-4 w-4" />}
          />
        </div>
      </div>

      {/* Feed */}
      <div ref={scrollerRef} className="flex-1 overflow-y-auto snap-y snap-mandatory no-scrollbar">
        {loading ? (
          <div className="h-full grid place-items-center text-white/70 text-sm">Carregando…</div>
        ) : reels.length === 0 ? (
          <div className="h-full relative">{emptyState}</div>
        ) : (
          reels.map((reel, i) => (
            <ReelCard
              key={reel.id}
              reel={reel}
              active={i === activeIdx && tab === "reels"}
              muted={muted}
              onToggleMute={() => setMuted((m) => !m)}
              onToggleLike={() => toggleLike(reel.id)}
              onOpenComments={() => setCommentsFor(reel.id)}
              onShare={() => toast.info("Em breve: compartilhar reel no chat")}
            />
          ))
        )}
      </div>

      {/* Progress bar segments */}
      {reels.length > 1 && (
        <div className="absolute left-4 right-4 bottom-3 z-20 flex gap-1 pointer-events-none">
          {reels.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 rounded-full bg-white/20 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-brand"
                initial={false}
                animate={{ width: i < activeIdx ? "100%" : i === activeIdx ? "100%" : "0%" }}
                transition={{ duration: 0.3 }}
              />
            </div>
          ))}
        </div>
      )}

      {/* FAB Create */}
      <Link
        to="/gerenciar/novo-reel"
        className="absolute right-4 bottom-8 z-30 h-14 w-14 grid place-items-center rounded-full bg-gradient-brand text-white shadow-elegant active:scale-95 transition"
        aria-label="Criar reel"
      >
        <Plus className="h-6 w-6" />
      </Link>

      <CommentsSheet
        reelId={commentsFor}
        open={!!commentsFor}
        onClose={() => setCommentsFor(null)}
        currentUserId={user?.id ?? null}
        onCountChange={(delta) => {
          if (!commentsFor) return;
          setReels((prev) =>
            prev.map((r) => (r.id === commentsFor ? { ...r, comments: r.comments + delta } : r)),
          );
        }}
      />
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1">
      <span
        className={`inline-flex items-center gap-1.5 text-sm font-semibold ${active ? "text-white" : "text-white/60"}`}
      >
        {icon}
        {label}
      </span>
      {active && <span className="h-0.5 w-8 rounded-full bg-gradient-brand" />}
    </button>
  );
}
