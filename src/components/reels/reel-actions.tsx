import { Heart, MessageCircle, Send, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Reel } from "@/lib/reels/reel-types";
import { formatReelCount } from "@/lib/reels/reel-utils";
import { ReelSaveButton } from "./reel-save-button";
import { ReelFollowButton } from "./reel-follow-button";
import { ReelConnectButton } from "./reel-connect-button";

interface ReelActionsProps {
  reel: Reel;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onSave: () => void;
  onFollow: () => void;
  onConnect: () => void;
  onMute: () => void;
  muted: boolean;
}

export function ReelActions({
  reel,
  onLike,
  onComment,
  onShare,
  onSave,
  onFollow,
  onConnect,
  onMute,
  muted,
}: ReelActionsProps) {
  return (
    <div className="absolute right-2 bottom-32 z-10 flex flex-col items-center gap-4">
      <div className="relative">
        <button onClick={() => {}} className="block">
          <img
            src={
              reel.author.photoUrl ??
              `https://api.dicebear.com/9.x/initials/svg?seed=${reel.author.name}`
            }
            alt=""
            className="h-11 w-11 rounded-full object-cover ring-2 ring-white/90"
          />
        </button>
        <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-5 w-5 grid place-items-center rounded-full bg-gradient-brand text-white text-xs font-bold border border-black/20">
          +
        </span>
      </div>

      <button onClick={onLike} className="flex flex-col items-center gap-0.5">
        <span className="h-11 w-11 grid place-items-center rounded-full active:scale-90 transition-transform">
          <Heart
            className={cn(
              "h-6 w-6 transition-colors",
              reel.likedByMe ? "fill-pink-500 text-pink-500" : "text-white",
            )}
          />
        </span>
        <span className="text-white text-[11px] font-semibold drop-shadow">
          {formatReelCount(reel.stats.likes)}
        </span>
      </button>

      <button onClick={onComment} className="flex flex-col items-center gap-0.5">
        <span className="h-11 w-11 grid place-items-center rounded-full active:scale-90 transition-transform">
          <MessageCircle className="h-6 w-6 text-white" />
        </span>
        <span className="text-white text-[11px] font-semibold drop-shadow">
          {formatReelCount(reel.stats.comments)}
        </span>
      </button>

      <button onClick={onShare} className="flex flex-col items-center gap-0.5">
        <span className="h-11 w-11 grid place-items-center rounded-full active:scale-90 transition-transform">
          <Send className="h-6 w-6 text-white" />
        </span>
      </button>

      <ReelSaveButton saved={reel.savedByMe} onToggle={onSave} />

      <ReelConnectButton onConnect={onConnect} />

      <ReelFollowButton following={reel.author.isFollowing} onToggle={onFollow} />

      <button
        onClick={onMute}
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
  );
}
