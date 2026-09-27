import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Send, Plus, X, Clapperboard, Users } from "lucide-react";
import { motion } from "framer-motion";
import { ReelsFeed } from "@/components/reels/reels-feed";
import { ReelCommentsSheet } from "@/components/reels/reel-comments-sheet";
import { ReelShareSheet } from "@/components/reels/reel-share-sheet";
import { ReelLoading } from "@/components/reels/reel-loading";
import { getReelFeed } from "@/lib/reels/reel-feed";
import type { Reel, ReelComment } from "@/lib/reels/reel-types";
import { filterReels, type ReelFilterState } from "@/lib/reels/reel-filter";
import { REEL_CATEGORY_META } from "@/lib/reels/reel-types";
import { getStoredSoundPref, setStoredSoundPref } from "@/lib/reels/reel-local-storage";
import {
  addPersistedReelComment,
  getPersistedReelComments,
  getPersistedReelInteractionState,
  togglePersistedCommentLike,
  togglePersistedReelLike,
  type PersistedReelInteractionState,
} from "@/lib/reels/persisted-reels-reader";
import type { ReelContextTarget } from "@/lib/reels/reel-context";
import { useDemoIdentity } from "@/lib/demo/demo-identity";
import { toast } from "sonner";
import { toggleFollow, subscribeDemoDB } from "@/lib/demo/demo-db";
import { toggleSavedDetail, subscribeSavedDetails } from "@/lib/marketplace/saved-details";
import {
  applyReelSocialState,
  getReelConnectStatus,
  getReelDirectConversationId,
} from "@/lib/reels/reel-social-state";

export const Route = createFileRoute("/_app/reels")({
  head: () => ({
    meta: [
      { title: "Agora — Connexy" },
      {
        name: "description",
        content:
          "Momentos reais de quem está por perto. Agora ancora lugares e eventos do Connexy.",
      },
    ],
  }),
  component: ReelsRoute,
});

type Tab = "reels" | "amigos";

function ReelsRoute() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  return pathname.replace(/\/$/, "") === "/reels" ? <ReelsPage /> : <Outlet />;
}

function ReelsPage() {
  const navigate = useNavigate();
  const identity = useDemoIdentity();
  const [tab, setTab] = useState<Tab>("reels");
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const [muted, setMuted] = useState<boolean>(() => getStoredSoundPref());
  const [interactionMap, setInteractionMap] = useState<
    Record<string, PersistedReelInteractionState>
  >({});
  const [commentMap, setCommentMap] = useState<Record<string, ReelComment[]>>({});
  const [commentsFor, setCommentsFor] = useState<string | null>(null);
  const [shareFor, setShareFor] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [socialVersion, setSocialVersion] = useState(0);
  const [filters, setFilters] = useState<ReelFilterState>({
    category: "ALL",
    searchQuery: "",
    sortBy: "recent",
  });
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const feed = await getReelFeed();
        if (cancelled) return;
        const interactions = await Promise.all(
          feed.map(
            async (reel) =>
              [reel.id, await getPersistedReelInteractionState(reel.id, identity.id)] as const,
          ),
        );
        if (cancelled) return;
        setReels(feed);
        setInteractionMap(Object.fromEntries(interactions));
      } catch (error) {
        console.warn("[reels] falha ao carregar Feed local.", error);
        toast.error("Não foi possível carregar o Agora local.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 600);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [identity.id]);

  useEffect(() => {
    const unsubSaved = subscribeSavedDetails(() => setSocialVersion((current) => current + 1));
    const unsubDemo = subscribeDemoDB(() => setSocialVersion((current) => current + 1));
    return () => {
      unsubSaved();
      unsubDemo();
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

  const viewReels = useMemo(() => {
    void socialVersion;
    return reels.map((r) => {
      const interaction = interactionMap[r.id];
      return applyReelSocialState(
        {
          ...r,
          likedByMe: interaction?.likedByMe ?? false,
          stats: {
            ...r.stats,
            likes: r.stats.likes + (interaction?.likeCount ?? 0),
            comments: r.stats.comments + (interaction?.commentCount ?? 0),
          },
        },
        identity.id,
      );
    });
  }, [reels, interactionMap, identity.id, socialVersion]);

  const filteredReels = filterReels(viewReels, filters);

  const openComments = commentsFor ? (commentMap[commentsFor] ?? []) : [];

  async function handleToggleLike(reelId: string) {
    try {
      const next = await togglePersistedReelLike(reelId, identity.id);
      setInteractionMap((prev) => ({
        ...prev,
        [reelId]: {
          ...(prev[reelId] ?? { commentCount: 0 }),
          ...next,
        },
      }));
    } catch (error) {
      console.warn(`[reels] falha ao alternar Like de "${reelId}".`, error);
      toast.error("Não foi possível atualizar a curtida.");
    }
  }

  function handleToggleSave(reelId: string) {
    toggleSavedDetail(reelId);
  }

  function handleToggleFollow(reelId: string) {
    const reel = reels.find((item) => item.id === reelId);
    if (!reel || reel.author.id === identity.id) return;
    toggleFollow(reel.author.id, identity.id);
  }

  function handleConnect(reelId: string) {
    const reel =
      reels.find((item) => item.id === reelId) ?? viewReels.find((item) => item.id === reelId);
    if (!reel) return;
    const status = getReelConnectStatus(reel.author.id, identity.id);
    if (status === "unavailable" || status === "pending") return;
    if (status === "connected") {
      const conversationId = getReelDirectConversationId(reel.author.id, identity.id);
      if (conversationId) {
        navigate({ to: "/chat/$conversationId", params: { conversationId } });
      }
      return;
    }
    navigate({
      to: "/solicitacao/$id",
      params: { id: reel.author.id },
      search: { mode: "send" },
    });
  }

  async function loadComments(reelId: string) {
    const comments = await getPersistedReelComments(reelId);
    setCommentMap((prev) => ({ ...prev, [reelId]: comments }));
  }

  async function handleAddComment(text: string): Promise<boolean> {
    if (!commentsFor) return false;
    try {
      const created = await addPersistedReelComment({
        reelId: commentsFor,
        text,
        author: { id: identity.id, name: identity.name, photoUrl: identity.photo },
      });
      if (!created) return false;
      await loadComments(commentsFor);
      setInteractionMap((prev) => ({
        ...prev,
        [commentsFor]: {
          ...(prev[commentsFor] ?? { likedByMe: false, likeCount: 0 }),
          commentCount: (prev[commentsFor]?.commentCount ?? 0) + 1,
        },
      }));
      return true;
    } catch (error) {
      console.warn(`[reels] falha ao comentar em "${commentsFor}".`, error);
      toast.error("Não foi possível salvar o comentário.");
      return false;
    }
  }

  async function handleReply(parentId: string, text: string): Promise<boolean> {
    if (!commentsFor) return false;
    try {
      const created = await addPersistedReelComment({
        reelId: commentsFor,
        parentId,
        text,
        author: { id: identity.id, name: identity.name, photoUrl: identity.photo },
      });
      if (!created) return false;
      await loadComments(commentsFor);
      setInteractionMap((prev) => ({
        ...prev,
        [commentsFor]: {
          ...(prev[commentsFor] ?? { likedByMe: false, likeCount: 0 }),
          commentCount: (prev[commentsFor]?.commentCount ?? 0) + 1,
        },
      }));
      return true;
    } catch (error) {
      console.warn(`[reels] falha ao responder em "${commentsFor}".`, error);
      toast.error("Não foi possível salvar a resposta.");
      return false;
    }
  }

  async function handleLikeComment(commentId: string) {
    if (!commentsFor) return;
    try {
      await togglePersistedCommentLike(commentsFor, commentId);
      await loadComments(commentsFor);
    } catch (error) {
      console.warn(`[reels] falha ao curtir comentário "${commentId}".`, error);
      toast.error("Não foi possível atualizar o comentário.");
    }
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
            label="Agora"
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
              aria-label="Buscar no Agora"
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
                  : "Nada no Agora"}
              </h2>
              <p className="mt-2 text-sm text-white/70">
                {filters.searchQuery || filters.category !== "ALL"
                  ? "Tente outro termo ou categoria."
                  : "Seja o primeiro a compartilhar um momento real."}
              </p>
              <Link
                to="/gerenciar/novo-reel"
                className="mt-5 inline-flex items-center gap-2 h-11 rounded-full bg-gradient-brand text-white font-semibold px-5 shadow-lg"
              >
                <Plus className="h-4 w-4" /> Criar no Agora
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
            onOpenComments={(id) => {
              setCommentsFor(id);
              void loadComments(id).catch((error) => {
                console.warn(`[reels] falha ao carregar comentários de "${id}".`, error);
                toast.error("Não foi possível carregar os comentários.");
              });
            }}
            onShare={(id) => setShareFor(id)}
            onSave={handleToggleSave}
            onFollow={handleToggleFollow}
            onConnect={handleConnect}
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
        to="/gerenciar/novo-reel"
        className="absolute right-4 bottom-8 z-30 h-14 w-14 grid place-items-center rounded-full bg-gradient-brand text-white shadow-lg active:scale-95 transition"
        aria-label="Criar no Agora"
      >
        <Plus className="h-6 w-6" />
      </Link>

      <ReelCommentsSheet
        reelId={commentsFor}
        open={!!commentsFor}
        onClose={() => setCommentsFor(null)}
        comments={openComments}
        onAddComment={handleAddComment}
        onReply={handleReply}
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
