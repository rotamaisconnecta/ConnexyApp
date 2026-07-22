import { cn } from "@/lib/utils";

interface ReelFollowButtonProps {
  following: boolean;
  onToggle: () => void;
}

export function ReelFollowButton({ following, onToggle }: ReelFollowButtonProps) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "h-8 rounded-full px-4 text-[11px] font-semibold transition-colors",
        following
          ? "border border-border bg-secondary text-muted-foreground"
          : "bg-gradient-brand text-white",
      )}
    >
      {following ? "Seguindo" : "Seguir"}
    </button>
  );
}
