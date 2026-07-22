import { Star, Clock, MapPin } from "lucide-react";
import type { FavoriteDestination } from "@/lib/mobility/ride-types";
import { cn } from "@/lib/utils";

interface FavoriteDestinationProps {
  favorites: FavoriteDestination[];
  onSelect?: (destination: FavoriteDestination) => void;
}

export function FavoriteDestinationList({ favorites, onSelect }: FavoriteDestinationProps) {
  if (favorites.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Favoritos
      </p>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {favorites.map((fav) => (
          <button
            key={fav.id}
            onClick={() => onSelect?.(fav)}
            className="flex items-center gap-2 rounded-full bg-secondary px-3 py-2 text-xs font-medium shrink-0 hover:bg-accent transition-colors"
          >
            <span className="text-base">{fav.icon}</span>
            <span>{fav.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
