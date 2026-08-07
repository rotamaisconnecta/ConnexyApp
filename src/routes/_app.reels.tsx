import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Send, Plus, X, Clapperboard, Users } from "lucide-react";
import { motion } from "framer-motion";
import { ReelsFeed } from "@/components/reels/reels-feed";
import { ReelCommentsSheet } from "@/components/reels/reel-comments-sheet";
import { ReelShareSheet } from "@/components/reels/reel-share-sheet";
import { ReelLoading } from "@/components/reels/reel-loading";
import { getReelFeed } from "@/lib/reels/reel-feed";
import type { Reel, ReelComment } from "@/lib/reels/reel-types";
import { sortSmart } from "@/lib/reels/reel-ranking";
import { filterReels, type ReelFilterState } from "@/lib/reels/reel-filter";
import { REEL_CATEGORY_META } from "@/lib/reels/reel-types";
import {
  getReelLikes,
  toggleReelLike,
  getReelComments,
  addReelComment,
  toggleCommentLike,
  getStoredSoundPref,
  setStoredSoundPref,
} from "@/lib/reels/reel-local-storage";
import type { ReelContextTarget } from "@/lib/reels/reel-context";

export const Route = createFileRoute("/_app/reels")({
  head: () => ({
    meta: [
      { title: "Reels — Connexy" },
      {
        name: "description",
        content:
          "Momentos reais de quem está por perto. Reels ancorados em lugares e eventos do Connexy.",
      },
    ],
  }),
  component: ReelsPage,
});

type Tab = "reels" | "amigos";

const SEED_COMMENTS: ReelComment[] = [
  {
    id: "c1",
    text: "Que momento incrível! 🔥",
    authorId: "u1",
    authorName: "Ana Silva",
    authorPhoto: "https://i.pravatar.cc/150?img=1",
    createdAt: "2026-07-21T10:00:00Z",
    likes: 12,
    likedByMe: false,
    replies: [],
  },
  {
    id: "c2",
    text: "Adorei! Vou lá amanhã",
    authorId: "u2",
    authorName: "Carlos Souza",
    authorPhoto: "https://i.pravatar.cc/150?img=3",
    createdAt: "2026-07-21T09:30:00Z",
    likes: 5,
    likedByMe: true,
    replies: [],
  },
  {
    id: "c3",
    text: "Esse lugar é demais 🙌",
    authorId: "u3",
    authorName: "Maria Costa",
    authorPhoto: "https://i.pravatar.cc/150?img=5",
    createdAt: "2026-07-20T18:00:00Z",
    likes: 8,
    likedByMe: false,
    replies: [],
  },
];

function ReelsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("reels");
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const [muted, setMuted] = useState<boolean>(() => getStoredSoundPref());
  const [likeMap, setLikeMap] = useState<Record<string, boolean>>(() => getReelLikes());
  const [commentMap, setCommentMap] = useState<Record<string, ReelComment[]>>(() =>
    getReelComments(),
  );
  const [commentsFor, setCommentsFor] = useState<string | null>(null);
  const [shareFor, setShareFor] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [filters, setFilters] = useState<ReelFilterState>({
    category: "ALL",
    searchQuery: "",
    sortBy: "smart",
  });
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const storedLikes = getReelLikes();
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const feed = await getReelFeed();
        if (cancelled) return;
        setReels(
          sortSmart(feed).map((r) => ({
            ...r,
            likedByMe: storedLikes[r.id] ?? r.likedByMe,
          })),
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 600);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

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

  const viewReels = useMemo(
    () =>
      reels.map((r) => {
        const liked = likeMap[r.id] ?? r.likedByMe;
        const baseLikes = r.stats.likes - (r.likedByMe ? 1 : 0);
        return {
          ...r,
          likedByMe: liked,
          stats: { ...r.stats, likes: baseLikes + (liked ? 1 : 0) },
        };
      }),
    [reels, likeMap],
  );

  const filteredReels = filterReels(viewReels, filters);

  const openComments = commentsFor
    ? [...(commentsFor === "reel-001" ? SEED_COMMENTS : []), ...(commentMap[commentsFor] ?? [])]
    : [];

  function handleToggleLike(reelId: string) {
    const next = toggleReelLike(reelId);
    setLikeMap((prev) => ({ ...prev, [reelId]: next }));
  }

  function handleToggleSave(reelId: string) {
    setReels((prev) =>
      prev.map((r) =>
        r.id === reelId
          ? {
              ...r,
              savedByMe: !r.savedByMe,
              stats: { ...r.stats, saves: r.stats.saves + (r.savedByMe ? -1 : 1) },
            }
          : r,
      ),
    );
  }

  function handleToggleFollow(reelId: string) {
    setReels((prev) =>
      prev.map((r) =>
        r.id === reelId ? { ...r, author: { ...r.author, isFollowing: !r.author.isFollowing } } : r,
      ),
    );
  }

  function handleAddComment(text: string) {
    if (!commentsFor) return;
    const created = addReelComment(commentsFor, text);
    if (!created) return;
    setCommentMap((prev) => ({
      ...prev,
      [commentsFor]: [...(prev[commentsFor] ?? []), created],
    }));
    setReels((prev) =>
      prev.map((r) =>
        r.id === commentsFor ? { ...r, stats: { ...r.stats, comments: r.stats.comments + 1 } } : r,
      ),
    );
  }

  function handleLikeComment(commentId: string) {
    if (!commentsFor) return;
    const target = openComments.find((c) => c.id === commentId);
    if (!target) return;
    const next = !target.likedByMe;
    toggleCommentLike(commentsFor, commentId);
    const updated: ReelComment = {
      ...target,
      likedByMe: next,
      likes: target.likes + (next ? 1 : -1),
    };
    setCommentMap((prev) => {
      const stored = prev[commentsFor] ?? [];
      const exists = stored.some((c) => c.id === commentId);
      const nextList = exists
        ? stored.map((c) => (c.id === commentId ? updated : c))
        : [...stored, updated];
      return { ...prev, [commentsFor]: nextList };
    });
  }

  function handleOpenContext(target: ReelContextTarget) {
    switch (target.type) {
      case "perfil":
        navigate({ to: "/perfil/$id", params: { id: target.id } });
        break;
      case "local":
        navigate({ to: "/local/$id", params: { id: target.id } });
        break;
      case "negocio":
      case "oferta":
        navigate({ to: "/business/$businessId", params: { businessId: target.id } });
        break;
      case "evento":
        navigate({ to: "/event/$eventId", params: { eventId: target.id } });
        break;
      case "corrida":
        navigate({ to: "/ride" });
        break;
    }
  }

  return (
    <div className="absolute inset-0 bg-black flex flex-col overflow-hidden">
      <div className="absolute inset-x-0 top-0 z-30 pt-4 px-4 pb-2 flex items-center gap-3">
        <div className="flex-1 flex items-center justify-center gap-1.5">
          <span className="font-display text-lg font-bold text-white">connexy</span>
        </div>
        <button
          onClick={() => setSearchOpen((o) => !o)}
          className={`absolute right-14 top-4 h-9 w-9 grid place-items-center rounded-full border ${
            searchOpen ? "bg-primary border-primary text-white" : "bg-white/10 border-white/15"
          }`}
          aria-label={searchOpen ? "Fechar busca" : "Buscar"}
          aria-pressed={searchOpen}
        >
          {searchOpen ? (
            <X className="h-4 w-4 text-white" />
          ) : (
            <Search className="h-4 w-4 text-white" />
          )}
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
        <div className="absolute left-4 top-24 flex gap-2 overflow-x-auto no-scrollbar max-w-[80%]">
          <FilterPill
            active={filters.category === "ALL"}
            onClick={() => setFilters((f) => ({ ...f, category: "ALL" }))}
            label="Todos"
          />
          {REEL_CATEGORY_META.map((cat) => (
            <FilterPill
              key={cat.value}
              active={filters.category === cat.value}
              onClick={() => setFilters((f) => ({ ...f, category: cat.value }))}
              label={`${cat.emoji} ${cat.label}`}
            />
          ))}
        </div>
        {searchOpen && (
          <div className="absolute left-4 right-4 top-36 z-30">
            <input
              autoFocus
              value={filters.searchQuery}
              onChange={(e) => setFilters((f) => ({ ...f, searchQuery: e.target.value }))}
              placeholder="Buscar por nome, hashtag, local, negócio ou evento…"
              className="w-full h-10 rounded-xl bg-white/10 border border-white/20 px-4 text-sm text-white placeholder:text-white/50 outline-none focus:border-primary"
              aria-label="Buscar reels"
            />
          </div>
        )}
      </div>

      <div className="flex-1">
        {loading ? (
          <ReelLoading />
        ) : filteredReels.length === 0 ? (
          <div className="h-full grid place-items-center px-6 text-center">
            <div>
              <div className="mx-auto h-16 w-16 grid place-items-center rounded-2xl bg-gradient-brand text-white shadow-lg">
                <Clapperboard className="h-8 w-8" />
              </div>
              <h2 className="mt-4 font-display text-xl text-white font-bold">
                {filters.searchQuery || filters.category !== "ALL"
                  ? "Nenhum resultado"
                  : "Nenhum reel encontrado"}
              </h2>
              <p className="mt-2 text-sm text-white/70">
                {filters.searchQuery || filters.category !== "ALL"
                  ? "Tente outro termo ou categoria."
                  : "Seja o primeiro a compartilhar um momento real."}
              </p>
              <Link
                to="/create"
                search={{}}
                className="mt-5 inline-flex items-center gap-2 h-11 rounded-full bg-gradient-brand text-white font-semibold px-5 shadow-lg"
              >
                <Plus className="h-4 w-4" /> Criar reel
              </Link>
            </div>
          </div>
        ) : (
          <ReelsFeed
            reels={filteredReels}
            activeIdx={activeIdx}
            muted={muted}
            scrollRef={scrollerRef}
            onScroll={() => {}}
            onToggleMute={() =>
              setMuted((m) => {
                const next = !m;
                setStoredSoundPref(next);
                return next;
              })
            }
            onToggleLike={handleToggleLike}
            onOpenComments={(id) => setCommentsFor(id)}
            onShare={(id) => setShareFor(id)}
            onSave={handleToggleSave}
            onFollow={handleToggleFollow}
            onConnect={() => {}}
            onOpenContext={handleOpenContext}
          />
        )}
      </div>

      {filteredReels.length > 1 && (
        <div className="absolute left-4 right-4 bottom-3 z-20 flex gap-1 pointer-events-none">
          {filteredReels.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 rounded-full bg-white/20 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-brand"
                initial={false}
                animate={{ width: i <= activeIdx ? "100%" : "0%" }}
                transition={{ duration: 0.3 }}
              />
            </div>
          ))}
        </div>
      )}

      <Link
        to="/create"
        search={{}}
        className="absolute right-4 bottom-8 z-30 h-14 w-14 grid place-items-center rounded-full bg-gradient-brand text-white shadow-lg active:scale-95 transition"
        aria-label="Criar reel"
      >
        <Plus className="h-6 w-6" />
      </Link>

      <ReelCommentsSheet
        reelId={commentsFor}
        open={!!commentsFor}
        onClose={() => setCommentsFor(null)}
        comments={openComments}
        onAddComment={handleAddComment}
        onLikeComment={handleLikeComment}
      />

      <ReelShareSheet reelId={shareFor ?? ""} open={!!shareFor} onClose={() => setShareFor(null)} />
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 h-8 px-3 rounded-full text-xs font-semibold transition-colors ${
        active ? "bg-white text-black" : "bg-white/10 text-white/70 hover:bg-white/20"
      }`}
    >
      {label}
    </button>
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
