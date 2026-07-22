import { UserPlus, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface FollowBusinessButtonProps {
  isFollowing: boolean;
  onToggle: () => void;
}

export function FollowBusinessButton({ isFollowing, onToggle }: FollowBusinessButtonProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      aria-label={isFollowing ? "Deixar de seguir" : "Seguir empresa"}
      className={cn(
        "h-9 px-4 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all",
        isFollowing ? "bg-secondary text-muted-foreground" : "bg-primary text-primary-foreground",
      )}
    >
      {isFollowing ? (
        <>
          <UserCheck className="h-3.5 w-3.5" />
          Seguindo
        </>
      ) : (
        <>
          <UserPlus className="h-3.5 w-3.5" />
          Seguir
        </>
      )}
    </button>
  );
}
