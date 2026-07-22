import type { Reel } from "@/lib/reels/reel-types";
import { ReelPlayer } from "./reel-player";
import { ReelProgress } from "./reel-progress";
import { ReelEmpty } from "./reel-empty";

interface ReelsFeedProps {
  reels: Reel[];
  activeIdx: number;
  muted: boolean;
  onToggleMute: () => void;
  onToggleLike: (id: string) => void;
  onOpenComments: (id: string) => void;
  onShare: (id: string) => void;
  onSave: (id: string) => void;
  onFollow: (id: string) => void;
  onConnect: (id: string) => void;
  onOpenProfile: (id: string) => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  onScroll: () => void;
}

export function ReelsFeed({
  reels,
  activeIdx,
  muted,
  onToggleMute,
  onToggleLike,
  onOpenComments,
  onShare,
  onSave,
  onFollow,
  onConnect,
  onOpenProfile,
  scrollRef,
  onScroll,
}: ReelsFeedProps) {
  if (reels.length === 0) {
    return <ReelEmpty />;
  }

  return (
    <div className="relative flex-1 overflow-hidden">
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto snap-y snap-mandatory no-scrollbar h-full"
      >
        {reels.map((reel, idx) => (
          <div key={reel.id} className="relative h-full w-full snap-start shrink-0">
            <ReelPlayer
              reel={reel}
              active={idx === activeIdx}
              muted={muted}
              onToggleMute={onToggleMute}
              onToggleLike={() => onToggleLike(reel.id)}
              onOpenComments={() => onOpenComments(reel.id)}
              onShare={() => onShare(reel.id)}
              onSave={() => onSave(reel.id)}
              onFollow={() => onFollow(reel.id)}
              onConnect={() => onConnect(reel.id)}
              onOpenProfile={() => onOpenProfile(reel.id)}
            />
          </div>
        ))}
      </div>

      <ReelProgress total={reels.length} activeIdx={activeIdx} />
    </div>
  );
}
