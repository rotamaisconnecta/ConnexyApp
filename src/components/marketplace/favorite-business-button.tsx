import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface FavoriteBusinessButtonProps {
  isFavorite: boolean;
  onToggle: () => void;
  size?: "sm" | "md" | "lg";
}

export function FavoriteBusinessButton({
  isFavorite,
  onToggle,
  size = "md",
}: FavoriteBusinessButtonProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      className={cn(
        "grid place-items-center rounded-full transition-all active:scale-90",
        sizeClasses[size],
        isFavorite ? "bg-pink/15 text-pink" : "bg-secondary text-muted-foreground hover:text-pink",
      )}
    >
      <Heart className={cn(iconSizes[size], isFavorite && "fill-current")} />
    </button>
  );
}
