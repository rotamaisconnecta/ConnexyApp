import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Star, MapPin, Clock } from "lucide-react";
import { PremiumCarousel } from "@/components/carousel/PremiumCarousel";
import { HomeSectionHeading } from "@/components/home/home-section-heading";
import type { NearbyPlacesSectionData } from "@/lib/feed/feed-types";

const PLACE_CARD_HEIGHT = 348;

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
      <div className="mb-4 px-5">
        <HomeSectionHeading
          as="h3"
          emoji="📍"
          title="Locais próximos"
          subtitle="Lugares para conhecer perto de você"
          action={
            <Link
              to="/discover"
              search={{ filter: "places" }}
              className="shrink-0 text-xs font-semibold text-primary flex items-center gap-0.5 transition-all duration-200 hover:gap-1"
            >
              Ver tudo <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        />
      </div>

      <PremiumCarousel
        section="places"
        items={data.places}
        cardHeight={PLACE_CARD_HEIGHT}
        cardSize="min"
        renderCard={(place) => (
          <Link
            to="/local/$id"
            params={{ id: place.id }}
            className="block min-h-[inherit] rounded-[20px] transition-all duration-300 hover:shadow-xl active:scale-[0.98]"
          >
            <div className="flex min-h-[inherit] flex-col rounded-[20px] border border-border/50 bg-surface">
              <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-t-[20px]">
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
              <div className="flex flex-1 flex-col gap-0.5 px-4 py-2.5">
                <div className="flex items-start justify-between gap-1.5">
                  <span className="font-display text-[13px] font-semibold leading-snug">
                    {place.name}
                  </span>
                  <span
                    className={`text-[10px] font-medium shrink-0 ${place.open ? "text-green-600" : "text-red-500"}`}
                  >
                    {place.open ? "Aberto" : "Fechado"}
                  </span>
                </div>
                <span className="text-[11px] leading-snug text-muted-foreground">{place.category}</span>
                {place.description ? (
                  <span className="text-[11px] leading-snug text-muted-foreground">
                    {place.description}
                  </span>
                ) : null}
                {place.hours && (
                  <span className="flex items-start gap-1 text-[11px] leading-snug text-muted-foreground">
                    <Clock className="mt-0.5 h-3 w-3 shrink-0" />
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
