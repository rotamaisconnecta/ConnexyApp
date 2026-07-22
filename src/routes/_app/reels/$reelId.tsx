import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  Volume2,
  VolumeX,
  Play,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MOCK_REELS } from "@/lib/reels/reel-mocks";
import type { Reel } from "@/lib/reels/reel-types";
import { formatReelCount, formatRelativeTime, getCategoryEmoji } from "@/lib/reels/reel-utils";
import { ReelUser } from "@/components/reels/reel-user";
import { ReelLocation } from "@/components/reels/reel-location";
import { ReelMusic } from "@/components/reels/reel-music";
import { ReelCommentsSheet } from "@/components/reels/reel-comments-sheet";
import { ReelShareSheet } from "@/components/reels/reel-share-sheet";

export const Route = createFileRoute("/_app/reels/$reelId")({
  head: () => ({ meta: [{ title: "Reel — Connexy" }] }),
  component: ReelDetailPage,
});

function ReelDetailPage() {
  const { reelId } = Route.useParams();
  const [reel, setReel] = useState<Reel | null>(null);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [heartBurst, setHeartBurst] = useState(0);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastTap = useRef(0);

  useEffect(() => {
    const found = MOCK_REELS.find((r) => r.id === reelId);
    setReel(found ?? null);
  }, [reelId]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    v.play().catch(() => setPaused(true));
    setPaused(false);
  }, [reel]);

  function handleTap() {
    const now = Date.now();
    if (now - lastTap.current < 280) {
      handleToggleLike();
      setHeartBurst((n) => n + 1);
      lastTap.current = 0;
      return;
    }
    lastTap.current = now;
    setTimeout(() => {
      if (Date.now() - lastTap.current >= 280 && lastTap.current !== 0) {
        const v = videoRef.current;
        if (!v) return;
        if (v.paused) {
          v.play();
          setPaused(false);
        } else {
          v.pause();
          setPaused(true);
        }
        lastTap.current = 0;
      }
    }, 290);
  }

  function handleToggleLike() {
    if (!reel) return;
    setReel((prev) =>
      prev
        ? {
            ...prev,
            likedByMe: !prev.likedByMe,
            stats: { ...prev.stats, likes: prev.stats.likes + (prev.likedByMe ? -1 : 1) },
          }
        : prev,
    );
  }

  function handleToggleSave() {
    if (!reel) return;
    setReel((prev) =>
      prev
        ? {
            ...prev,
            savedByMe: !prev.savedByMe,
            stats: { ...prev.stats, saves: prev.stats.saves + (prev.savedByMe ? -1 : 1) },
          }
        : prev,
    );
  }

  if (!reel) {
    return (
      <div className="absolute inset-0 bg-[#0a0a0a] grid place-items-center text-white">
        Reel não encontrado
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-[#0a0a0a] overflow-hidden">
      <video
        ref={videoRef}
        src={reel.videoUrl}
        poster={reel.posterUrl ?? undefined}
        loop
        muted={muted}
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
        onClick={handleTap}
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/60 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-60 bg-gradient-to-t from-black/80 to-transparent" />

      <Link
        to="/reels"
        className="absolute top-4 left-4 z-30 h-10 w-10 grid place-items-center rounded-full bg-black/40 backdrop-blur border border-white/15"
      >
        <ArrowLeft className="h-5 w-5 text-white" />
      </Link>

      <div className="absolute right-3 bottom-32 z-10 flex flex-col items-center gap-4">
        <ActionButton
          icon={
            <Heart
              className={`h-6 w-6 ${reel.likedByMe ? "fill-pink-500 text-pink-500" : "text-white"}`}
            />
          }
          count={reel.stats.likes}
          onClick={handleToggleLike}
        />
        <ActionButton
          icon={<MessageCircle className="h-6 w-6 text-white" />}
          count={reel.stats.comments}
          onClick={() => setCommentsOpen(true)}
        />
        <ActionButton
          icon={<Send className="h-6 w-6 text-white" />}
          count={reel.stats.shares}
          onClick={() => setShareOpen(true)}
        />
        <ActionButton
          icon={
            <Bookmark
              className={`h-6 w-6 ${reel.savedByMe ? "fill-amber-400 text-amber-400" : "text-white"}`}
            />
          }
          count={reel.stats.saves}
          onClick={handleToggleSave}
        />
        <button
          onClick={() => setMuted((m) => !m)}
          className="mt-1 h-9 w-9 grid place-items-center rounded-full bg-white/10 backdrop-blur border border-white/20"
          aria-label={muted ? "Ativar som" : "Silenciar"}
        >
          {muted ? (
            <VolumeX className="h-4 w-4 text-white" />
          ) : (
            <Volume2 className="h-4 w-4 text-white" />
          )}
        </button>
      </div>

      <div className="absolute inset-x-0 bottom-4 z-10 px-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/80">
            {getCategoryEmoji(reel.category)}
          </span>
          <span className="text-xs text-white/60">{formatRelativeTime(reel.createdAt)}</span>
        </div>
        <ReelUser author={reel.author} onOpenProfile={() => {}} />
        {reel.caption && (
          <p className="mt-2 text-white text-[13px] leading-snug max-w-[86%] line-clamp-3 drop-shadow">
            {reel.caption}
          </p>
        )}
        {reel.hashtags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {reel.hashtags.map((tag) => (
              <span key={tag} className="text-[11px] text-primary font-semibold">
                #{tag}
              </span>
            ))}
          </div>
        )}
        {reel.location && <ReelLocation location={reel.location} />}
        {reel.music && <ReelMusic music={reel.music} />}
        {reel.business && (
          <div className="mt-3 flex items-center gap-3 rounded-2xl bg-black/55 backdrop-blur-md px-3 py-2 border border-white/10">
            <img src={reel.business.logo} alt="" className="h-8 w-8 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-white truncate">
                {reel.business.name}
              </div>
              <div className="text-[10px] text-white/70">
                {reel.business.category} · {reel.business.rating.toFixed(1)}★
              </div>
            </div>
          </div>
        )}
        {reel.event && (
          <div className="mt-3 flex items-center gap-3 rounded-2xl bg-black/55 backdrop-blur-md px-3 py-2 border border-white/10">
            <div className="h-8 w-8 rounded-lg bg-pink-500/20 grid place-items-center text-sm">
              🎉
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-white truncate">{reel.event.name}</div>
              <div className="text-[10px] text-white/70">
                {reel.event.date} · {reel.event.attendingCount} vão
              </div>
            </div>
          </div>
        )}
        {reel.driver && (
          <div className="mt-3 flex items-center gap-3 rounded-2xl bg-black/55 backdrop-blur-md px-3 py-2 border border-white/10">
            <img src={reel.driver.photo} alt="" className="h-8 w-8 rounded-full object-cover" />
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-white truncate">
                {reel.driver.name}
              </div>
              <div className="text-[10px] text-white/70">
                {reel.driver.vehicle} · {reel.driver.rating.toFixed(1)}★ · ETA{" "}
                {reel.driver.etaMinutes}min
              </div>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {paused && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 grid place-items-center pointer-events-none z-20"
          >
            <span className="h-16 w-16 grid place-items-center rounded-full bg-black/50 backdrop-blur">
              <Play className="h-8 w-8 text-white fill-white" />
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {heartBurst > 0 && (
          <motion.div
            key={heartBurst}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1.1 }}
            exit={{ opacity: 0, scale: 1.4 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 grid place-items-center pointer-events-none z-20"
          >
            <Heart className="h-28 w-28 text-pink-500 fill-pink-500 drop-shadow-2xl" />
          </motion.div>
        )}
      </AnimatePresence>

      <ReelCommentsSheet
        reelId={reel.id}
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        comments={[]}
        onAddComment={() => {}}
        onLikeComment={() => {}}
      />

      <ReelShareSheet reelId={reel.id} open={shareOpen} onClose={() => setShareOpen(false)} />
    </div>
  );
}

function ActionButton({
  icon,
  count,
  onClick,
}: {
  icon: React.ReactNode;
  count?: number;
  onClick?: () => void;
}) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-0.5">
      <span className="h-11 w-11 grid place-items-center rounded-full active:scale-90 transition-transform">
        {icon}
      </span>
      {typeof count === "number" && (
        <span className="text-white text-[11px] font-semibold drop-shadow">
          {formatReelCount(count)}
        </span>
      )}
    </button>
  );
}
