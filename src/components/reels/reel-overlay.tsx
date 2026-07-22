import type { Reel } from "@/lib/reels/reel-types";
import { ReelUser } from "./reel-user";
import { ReelDescription } from "./reel-description";
import { ReelTags } from "./reel-tags";
import { ReelLocation } from "./reel-location";
import { ReelMusic } from "./reel-music";

interface ReelOverlayProps {
  reel: Reel;
  onOpenProfile: () => void;
}

export function ReelOverlay({ reel, onOpenProfile }: ReelOverlayProps) {
  return (
    <div className="absolute inset-x-0 bottom-4 z-10 px-4">
      <ReelUser author={reel.author} onOpenProfile={onOpenProfile} />

      <div className="mt-2">
        <ReelDescription text={reel.caption} />
      </div>

      <div className="mt-2">
        <ReelTags category={reel.category} hashtags={reel.hashtags} />
      </div>

      {reel.location && (
        <div className="mt-2 max-w-[62%]">
          <ReelLocation location={reel.location} />
        </div>
      )}

      {reel.music && (
        <div className="mt-2">
          <ReelMusic music={reel.music} />
        </div>
      )}
    </div>
  );
}
