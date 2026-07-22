import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Search, Send, Plus, Clapperboard, Users } from "lucide-react";
import { motion } from "framer-motion";
import { ReelsFeed } from "@/components/reels/reels-feed";
import { ReelCommentsSheet } from "@/components/reels/reel-comments-sheet";
import { ReelShareSheet } from "@/components/reels/reel-share-sheet";
import { ReelLoading } from "@/components/reels/reel-loading";
import { MOCK_REELS } from "@/lib/reels/reel-mocks";
import type { Reel, ReelComment } from "@/lib/reels/reel-types";
import { sortSmart } from "@/lib/reels/reel-ranking";
import { filterReels, type ReelFilterState } from "@/lib/reels/reel-filter";
import { REEL_CATEGORY_META } from "@/lib/reels/reel-types";

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

function ReelsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("reels");
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const [muted, setMuted] = useState(true);
  const [commentsFor, setCommentsFor] = useState<string | null>(null);
  const [shareFor, setShareFor] = useState<string | null>(null);
  const [filters, setFilters] = useState<ReelFilterState>({
    category: "ALL",
    searchQuery: "",
    sortBy: "smart",
  });
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const [mockComments, setMockComments] = useState<ReelComment[]>([
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
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setReels(sortSmart(MOCK_REELS));
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
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

  const filteredReels = filterReels(reels, filters);

  function handleToggleLike(reelId: string) {
    setReels((prev) =>
      prev.map((r) =>
        r.id === reelId
          ? {
              ...r,
              likedByMe: !r.likedByMe,
              stats: { ...r.stats, likes: r.stats.likes + (r.likedByMe ? -1 : 1) },
            }
          : r,
      ),
    );
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
    if (!commentsFor || !text.trim()) return;
    const newComment: ReelComment = {
      id: `c-${Date.now()}`,
      text: text.trim(),
      authorId: "current-user",
      authorName: "Você",
      authorPhoto: "https://i.pravatar.cc/150?img=12",
      createdAt: new Date().toISOString(),
      likes: 0,
      likedByMe: false,
      replies: [],
    };
    setMockComments((prev) => [...prev, newComment]);
    setReels((prev) =>
      prev.map((r) =>
        r.id === commentsFor ? { ...r, stats: { ...r.stats, comments: r.stats.comments + 1 } } : r,
      ),
    );
  }

  function handleLikeComment(commentId: string) {
    setMockComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, likedByMe: !c.likedByMe, likes: c.likes + (c.likedByMe ? -1 : 1) }
          : c,
      ),
    );
  }

  return (
    <div className="absolute inset-0 bg-[#0a0a0a] flex flex-col overflow-hidden">
      <div className="absolute inset-x-0 top-0 z-30 pt-4 px-4 pb-2 flex items-center gap-3">
        <div className="flex-1 flex items-center justify-center gap-1.5">
          <span className="font-display text-lg font-bold text-white">connexy</span>
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
                Nenhum reel encontrado
              </h2>
              <p className="mt-2 text-sm text-white/70">
                Seja o primeiro a compartilhar um momento real.
              </p>
              <Link
                to="/create"
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
            onToggleMute={() => setMuted((m) => !m)}
            onToggleLike={handleToggleLike}
            onOpenComments={(id) => setCommentsFor(id)}
            onShare={(id) => setShareFor(id)}
            onSave={handleToggleSave}
            onFollow={handleToggleFollow}
            onConnect={() => {}}
            onOpenProfile={(id) => navigate({ to: "/perfil/$id", params: { id } })}
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
                animate={{ width: i < activeIdx ? "100%" : i === activeIdx ? "100%" : "0%" }}
                transition={{ duration: 0.3 }}
              />
            </div>
          ))}
        </div>
      )}

      <Link
        to="/create"
        className="absolute right-4 bottom-8 z-30 h-14 w-14 grid place-items-center rounded-full bg-gradient-brand text-white shadow-lg active:scale-95 transition"
        aria-label="Criar reel"
      >
        <Plus className="h-6 w-6" />
      </Link>

      <ReelCommentsSheet
        reelId={commentsFor}
        open={!!commentsFor}
        onClose={() => setCommentsFor(null)}
        comments={mockComments}
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
