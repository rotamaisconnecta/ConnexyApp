import { BadgeCheck } from "lucide-react";
import type { ReelAuthor } from "@/lib/reels/reel-types";
import { AuthenticatedAvatarImage } from "@/components/media/authenticated-avatar-image";

interface ReelUserProps {
  author: ReelAuthor;
  onOpenProfile: () => void;
}

export function ReelUser({ author, onOpenProfile }: ReelUserProps) {
  return (
    <button onClick={onOpenProfile} className="flex items-center gap-2">
      <AuthenticatedAvatarImage
        profileId={author.id}
        legacyUrl={author.photoUrl}
        alt=""
        className="h-8 w-8 rounded-full ring-2 ring-primary/60 object-cover"
        fallback={
          <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-brand text-xs font-bold text-white ring-2 ring-primary/60">
            {author.name.charAt(0).toUpperCase()}
          </div>
        }
      />
      <span className="text-white text-sm font-bold">{author.name}</span>
      {author.verified && <BadgeCheck className="h-4 w-4 text-primary fill-primary/20" />}
      {author.profession && <span className="text-[11px] text-white/60">{author.profession}</span>}
    </button>
  );
}
