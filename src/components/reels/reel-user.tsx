import { BadgeCheck } from "lucide-react";
import type { ReelAuthor } from "@/lib/reels/reel-types";

interface ReelUserProps {
  author: ReelAuthor;
  onOpenProfile: () => void;
}

export function ReelUser({ author, onOpenProfile }: ReelUserProps) {
  return (
    <button onClick={onOpenProfile} className="flex items-center gap-2">
      <img
        src={author.photoUrl ?? `https://api.dicebear.com/9.x/initials/svg?seed=${author.name}`}
        alt=""
        className="h-8 w-8 rounded-full ring-2 ring-primary/60 object-cover"
      />
      <span className="text-white text-sm font-bold">{author.name}</span>
      {author.verified && <BadgeCheck className="h-4 w-4 text-primary fill-primary/20" />}
      {author.profession && <span className="text-[11px] text-white/60">{author.profession}</span>}
    </button>
  );
}
