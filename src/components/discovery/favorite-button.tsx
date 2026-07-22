import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { heartToggle } from "@/components/profile/animations";

interface FavoriteButtonProps {
  onClick: () => void;
  favorited?: boolean;
}

export function FavoriteButton({ onClick, favorited = false }: FavoriteButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      variants={heartToggle}
      animate={favorited ? "liked" : "idle"}
      className={cn(
        "h-9 w-9 rounded-xl grid place-items-center transition-colors",
        favorited ? "bg-pink/15 text-pink" : "bg-secondary text-muted-foreground hover:bg-accent",
      )}
      aria-label={favorited ? "Remover dos favoritos" : "Favoritar"}
    >
      <Heart className={cn("h-4 w-4", favorited && "fill-current")} />
    </motion.button>
  );
}
