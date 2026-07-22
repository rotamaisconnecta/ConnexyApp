import { MapPin, Star, Clock, Phone, Globe, Share2, Bookmark, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Business } from "@/lib/marketplace/business-types";
import { getCategoryLabel, getCategoryColor } from "@/lib/marketplace/category-utils";
import { formatDistance } from "@/lib/marketplace/distance-utils";
import { formatDistance as formatDistShort } from "@/lib/marketplace/distance-utils";

interface BusinessHeaderProps {
  business: Business;
  onShare?: () => void;
  onFavorite?: () => void;
  onSave?: () => void;
}

export function BusinessHeader({ business, onShare, onFavorite, onSave }: BusinessHeaderProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                getCategoryColor(business.category),
              )}
            >
              {getCategoryLabel(business.category)}
            </span>
            {business.isOpen ? (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-success/15 text-success">
                Aberto agora
              </span>
            ) : (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                Fechado
              </span>
            )}
          </div>
          <h1 className="font-display font-bold text-xl leading-tight">{business.name}</h1>
          <p className="text-xs text-muted-foreground">{business.description}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 fill-amber text-amber" />
          <span className="text-sm font-semibold">{business.rating.average}</span>
          <span className="text-xs text-muted-foreground">
            ({business.rating.totalReviews} avaliações)
          </span>
        </div>

        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          {formatDistance(business.distanceMeters)}
        </div>

        {business.opensAt && !business.isOpen && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            Abre às {business.opensAt}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground">{business.address}</span>
      </div>

      <div className="flex items-center gap-2">
        {business.phone && (
          <button
            aria-label="Ligar"
            className="h-9 w-9 grid place-items-center rounded-full bg-secondary"
          >
            <Phone className="h-4 w-4" />
          </button>
        )}
        {business.website && (
          <button
            aria-label="Website"
            className="h-9 w-9 grid place-items-center rounded-full bg-secondary"
          >
            <Globe className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={onShare}
          aria-label="Compartilhar"
          className="h-9 w-9 grid place-items-center rounded-full bg-secondary"
        >
          <Share2 className="h-4 w-4" />
        </button>
        <button
          onClick={onFavorite}
          aria-label={business.isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          className={cn(
            "h-9 w-9 grid place-items-center rounded-full",
            business.isFavorite ? "bg-pink/15 text-pink" : "bg-secondary text-muted-foreground",
          )}
        >
          <Heart className={cn("h-4 w-4", business.isFavorite && "fill-current")} />
        </button>
        <button
          onClick={onSave}
          aria-label="Salvar"
          className={cn(
            "h-9 w-9 grid place-items-center rounded-full",
            "bg-secondary text-muted-foreground",
          )}
        >
          <Bookmark className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
