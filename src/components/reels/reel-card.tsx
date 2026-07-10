import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Music, Volume2, VolumeX, MapPin, Play, Users, BadgeCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { personProximityLabel } from "@/lib/proximity";

export type ReelItem = {
  id: string;
  video_url: string;
  poster_url: string | null;
  caption: string | null;
  audio_label: string | null;
  created_at: string;
  tagged_user_ids: string[];
  author: { id: string; name: string | null; handle: string | null; photo_url: string | null } | null;
  place: { id: string; name: string; category: string | null } | null;
  likes: number;
  comments: number;
  likedByMe: boolean;
  distanceMeters?: number;
};

export function ReelCard({
  reel,
  active,
  muted,
  onToggleMute,
  onToggleLike,
  onOpenComments,
  onShare,
}: {
  reel: ReelItem;
  active: boolean;
  muted: boolean;
  onToggleMute: () => void;
  onToggleLike: () => void;
  onOpenComments: () => void;
  onShare: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [paused, setPaused] = useState(false);
  const [heartBurst, setHeartBurst] = useState(0);
  const lastTap = useRef(0);
  const [muteHint, setMuteHint] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (active) {
      v.currentTime = 0;
      v.play().catch(() => setPaused(true));
      setPaused(false);
    } else {
      v.pause();
    }
  }, [active]);

  function handleTap() {
    const now = Date.now();
    if (now - lastTap.current < 280) {
      onToggleLike();
      setHeartBurst((n) => n + 1);
      lastTap.current = 0;
      return;
    }
    lastTap.current = now;
    setTimeout(() => {
      if (Date.now() - lastTap.current >= 280 && lastTap.current !== 0) {
        const v = videoRef.current;
        if (!v) return;
        if (v.paused) { v.play(); setPaused(false); } else { v.pause(); setPaused(true); }
        lastTap.current = 0;
      }
    }, 290);
  }

  function tapMute() {
    onToggleMute();
    setMuteHint(true);
    setTimeout(() => setMuteHint(false), 1200);
  }

  return (
    <section className="relative h-full w-full snap-start shrink-0 bg-[#0a0a0a] overflow-hidden">
      <video
        ref={videoRef}
        src={reel.video_url}
        poster={reel.poster_url ?? undefined}
        loop
        muted={muted}
        playsInline
        preload={active ? "auto" : "metadata"}
        className="absolute inset-0 h-full w-full object-cover"
        onClick={handleTap}
      />
      {/* gradient overlays */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/60 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-60 bg-gradient-to-t from-black/80 to-transparent" />

      {/* Connecta chips — top-left overlay */}
      <div className="absolute top-16 left-3 space-y-2 z-10 max-w-[62%]">
        {reel.place && (
          <Link
            to="/local/$id"
            params={{ id: reel.place.id }}
            className="flex items-center gap-2 rounded-2xl bg-black/55 backdrop-blur-md px-3 py-2 border border-white/10"
          >
            <span className="h-7 w-7 grid place-items-center rounded-full bg-gradient-brand text-white">
              <MapPin className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-white truncate">{reel.place.name}</div>
              {typeof reel.distanceMeters === "number" && (
                <div className="text-[10px] text-white/70">{personProximityLabel(reel.distanceMeters)}</div>
              )}
            </div>
          </Link>
        )}
      </div>

      {/* Right actions */}
      <div className="absolute right-2 bottom-32 z-10 flex flex-col items-center gap-4">
        {reel.author && (
          <Link to="/perfil/$id" params={{ id: reel.author.id }} search={{ from: "reels" }} className="relative">
            <img
              src={reel.author.photo_url ?? `https://api.dicebear.com/9.x/initials/svg?seed=${reel.author.name ?? "?"}`}
              alt=""
              className="h-11 w-11 rounded-full object-cover ring-2 ring-white/90"
            />
            <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-5 w-5 grid place-items-center rounded-full bg-gradient-brand text-white text-xs font-bold border border-black/20">+</span>
          </Link>
        )}
        <ActionButton
          icon={<Heart className={`h-6 w-6 ${reel.likedByMe ? "fill-pink-500 text-pink-500" : "text-white"}`} />}
          count={reel.likes}
          onClick={onToggleLike}
        />
        <ActionButton icon={<MessageCircle className="h-6 w-6 text-white" />} count={reel.comments} onClick={onOpenComments} />
        <ActionButton icon={<Send className="h-6 w-6 text-white" />} onClick={onShare} />
        <ActionButton icon={<Bookmark className="h-6 w-6 text-white" />} />
        <ActionButton icon={<MoreHorizontal className="h-6 w-6 text-white" />} />
        <button
          onClick={tapMute}
          className="mt-1 h-9 w-9 grid place-items-center rounded-full bg-white/10 backdrop-blur border border-white/20"
          aria-label={muted ? "Ativar som" : "Silenciar"}
        >
          {muted ? <VolumeX className="h-4 w-4 text-white" /> : <Volume2 className="h-4 w-4 text-white" />}
        </button>
      </div>

      {/* Bottom info block */}
      <div className="absolute inset-x-0 bottom-4 z-10 px-4">
        {reel.author && (
          <div className="flex items-center gap-2">
            <Link to="/perfil/$id" params={{ id: reel.author.id }} search={{ from: "reels" }} className="flex items-center gap-2">
              <img src={reel.author.photo_url ?? `https://api.dicebear.com/9.x/initials/svg?seed=${reel.author.name ?? "?"}`} alt="" className="h-8 w-8 rounded-full ring-2 ring-primary/60 object-cover" />
              <span className="text-white text-sm font-bold">{reel.author.name}</span>
              <BadgeCheck className="h-4 w-4 text-primary fill-primary/20" />
            </Link>
            <button className="ml-auto text-[11px] font-semibold px-3 h-7 rounded-full border border-white/40 text-white hover:bg-white/10">Seguir</button>
          </div>
        )}
        {reel.caption && (
          <p className="mt-2 text-white text-[13px] leading-snug max-w-[86%] line-clamp-2 drop-shadow">{reel.caption}</p>
        )}
        {reel.tagged_user_ids.length > 0 && (
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/20 backdrop-blur border border-primary/40 px-3 py-1 text-[11px] text-white font-semibold">
            <Users className="h-3 w-3 text-primary" />
            Com {reel.tagged_user_ids.length} {reel.tagged_user_ids.length === 1 ? "pessoa presente" : "pessoas presentes"}
          </div>
        )}
        {reel.audio_label && (
          <div className="mt-2 flex items-center gap-2 text-white/90 text-xs">
            <Music className="h-3.5 w-3.5" />
            <div className="overflow-hidden whitespace-nowrap max-w-[70%]">
              <span className="inline-block">{reel.audio_label}</span>
            </div>
          </div>
        )}
      </div>

      {/* Paused indicator */}
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

      {/* Double-tap heart burst */}
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

      {/* Mute hint */}
      <AnimatePresence>
        {muteHint && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-24 left-1/2 -translate-x-1/2 z-20 rounded-full bg-black/60 backdrop-blur text-white text-xs px-3 py-1.5"
          >
            {muted ? "Som desligado" : "Som ligado"}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function ActionButton({ icon, count, onClick }: { icon: React.ReactNode; count?: number; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-0.5">
      <span className="h-11 w-11 grid place-items-center rounded-full active:scale-90 transition-transform">
        {icon}
      </span>
      {typeof count === "number" && (
        <span className="text-white text-[11px] font-semibold drop-shadow">
          {count >= 1000 ? `${(count / 1000).toFixed(1).replace(".0", "")}k` : count}
        </span>
      )}
    </button>
  );
}
