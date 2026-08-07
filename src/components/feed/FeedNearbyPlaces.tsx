import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Star, MapPin, Clock } from "lucide-react";
import { PremiumCarousel } from "@/components/carousel/PremiumCarousel";
import type { NearbyPlacesSectionData } from "@/lib/feed/feed-types";

const PLACE_CARD_WIDTH = { mobile: 216, tablet: 224, desktop: 232 } as const;
const PLACE_CARD_HEIGHT = 240;

interface FeedNearbyPlacesProps {
  data: NearbyPlacesSectionData;
}

export function FeedNearbyPlaces({ data }: FeedNearbyPlacesProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 mb-4 px-6">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm" aria-hidden>
              📍
            </span>
            <h3 className="font-display text-base font-bold truncate">Locais Próximos</h3>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Lugares para conhecer perto de você
          </p>
        </div>
        <Link
          to="/discover"
          search={{ filter: "places" }}
          className="shrink-0 text-xs font-semibold text-primary flex items-center gap-0.5 transition-all duration-200 hover:gap-1"
        >
          Ver tudo <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <PremiumCarousel
        section="places"
        items={data.places}
        cardWidths={PLACE_CARD_WIDTH}
        cardHeight={PLACE_CARD_HEIGHT}
        renderCard={(place) => (
          <Link
            to="/local/$id"
            params={{ id: place.id }}
            className="block rounded-[20px] overflow-hidden h-full transition-all duration-300 hover:shadow-xl active:scale-[0.98]"
          >
            <div className="bg-surface h-full flex flex-col border border-border/50 rounded-[20px] overflow-hidden">
              <div className="relative w-full shrink-0" style={{ height: 112 }}>
                <img
                  src={place.photo}
                  alt={place.name}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute top-2 right-2 z-10">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/90 text-gray-800 shadow-soft flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500" />
                    {place.rating}
                  </span>
                </div>
                <span className="absolute bottom-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/90 text-gray-800 shadow-soft z-10 flex items-center gap-0.5">
                  <MapPin className="h-3 w-3" />
                  {place.distance}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-0.5 px-4 py-2.5 min-h-0">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="font-display font-bold text-[13px] truncate">{place.name}</span>
                  <span
                    className={`text-[10px] font-medium shrink-0 ${place.open ? "text-green-600" : "text-red-500"}`}
                  >
                    {place.open ? "Aberto" : "Fechado"}
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground truncate">{place.category}</span>
                {place.hours && (
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {place.hours}
                  </span>
                )}
                <div className="mt-auto h-9 w-full rounded-full bg-primary/10 text-primary text-[12px] font-semibold grid place-items-center transition-colors hover:bg-primary/20">
                  Ver Local
                </div>
              </div>
            </div>
          </Link>
        )}
      />
    </motion.div>
  );
}
