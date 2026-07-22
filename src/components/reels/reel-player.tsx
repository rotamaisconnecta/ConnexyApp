import { useEffect, useRef, useState } from "react";
import { Heart, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Reel } from "@/lib/reels/reel-types";
import { ReelActions } from "./reel-actions";
import { ReelOverlay } from "./reel-overlay";

interface ReelPlayerProps {
  reel: Reel;
  active: boolean;
  muted: boolean;
  onToggleMute: () => void;
  onToggleLike: () => void;
  onOpenComments: () => void;
  onShare: () => void;
  onSave: () => void;
  onFollow: () => void;
  onConnect: () => void;
  onOpenProfile: () => void;
}

export function ReelPlayer({
  reel,
  active,
  muted,
  onToggleMute,
  onToggleLike,
  onOpenComments,
  onShare,
  onSave,
  onFollow,
  onConnect,
  onOpenProfile,
}: ReelPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [paused, setPaused] = useState(false);
  const [heartBurst, setHeartBurst] = useState(0);
  const [muteHint, setMuteHint] = useState(false);
  const lastTap = useRef(0);

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

  function tapMute() {
    onToggleMute();
    setMuteHint(true);
    setTimeout(() => setMuteHint(false), 1200);
  }

  return (
    <section className="relative h-full w-full snap-start shrink-0 bg-[#0a0a0a] overflow-hidden">
      <video
        ref={videoRef}
        src={reel.videoUrl}
        poster={reel.posterUrl ?? undefined}
        loop
        muted={muted}
        playsInline
        preload={active ? "auto" : "metadata"}
        className="absolute inset-0 h-full w-full object-cover"
        onClick={handleTap}
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/60 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-60 bg-gradient-to-t from-black/80 to-transparent" />

      <ReelActions
        reel={reel}
        onLike={onToggleLike}
        onComment={onOpenComments}
        onShare={onShare}
        onSave={onSave}
        onFollow={onFollow}
        onConnect={onConnect}
        onMute={tapMute}
        muted={muted}
      />

      <ReelOverlay reel={reel} onOpenProfile={onOpenProfile} />

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
