import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Star, MapPin, Clock } from "lucide-react";
import { PremiumCarousel } from "@/components/carousel/PremiumCarousel";
import type { NearbyPlacesSectionData } from "@/lib/feed/feed-types";

interface FeedNearbyPlacesProps {
  data: NearbyPlacesSectionData;
}

function distanceColor(distance: string): string {
  const num = parseFloat(distance.replace(/[km]/g, "").replace(",", "."));
  const unit = distance.includes("km") ? "km" : "m";
  if (unit === "m") {
    if (num <= 100) return "text-green-600";
    if (num <= 500) return "text-yellow-600";
    return "text-orange-500";
  }
  return "text-red-500";
}

function distanceLabel(distance: string): string {
  const num = parseFloat(distance.replace(/[km]/g, "").replace(",", "."));
  const unit = distance.includes("km") ? "km" : "m";
  if (unit === "m") {
    if (num <= 100) return "🟢";
    if (num <= 500) return "🟡";
    return "🟠";
  }
  return "🔴";
}

export function FeedNearbyPlaces({ data }: FeedNearbyPlacesProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="mx-4"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 mb-3">
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
          className="shrink-0 text-xs font-semibold text-primary flex items-center gap-0.5 transition-all duration-200 hover:gap-1"
        >
          Ver todos <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <PremiumCarousel
        items={data.places}
        renderCard={(place) => (
          <Link
            to="/discover"
            className="block rounded-2xl bg-surface border border-border shadow-soft overflow-hidden h-full transition-shadow duration-200 hover:shadow-elegant"
          >
            <div className="relative" style={{ paddingBottom: "75%" }}>
              <img
                src={place.photo}
                alt={place.name}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute top-2 right-2 z-10">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/90 text-gray-800 shadow-soft flex items-center gap-1">
                  <Star className="h-2.5 w-2.5 text-yellow-500" />
                  {place.rating}
                </span>
              </div>
              <span className="absolute bottom-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/90 text-gray-800 shadow-soft flex items-center gap-1 z-10">
                <MapPin className="h-2.5 w-2.5" />
                {place.distance}
              </span>
            </div>
            <div className="p-2.5 flex flex-col gap-1">
              <div className="flex items-center justify-between gap-1">
                <span className="font-display font-bold text-xs truncate">{place.name}</span>
                <span
                  className={`text-[10px] font-medium shrink-0 ${place.open ? "text-green-600" : "text-red-500"}`}
                >
                  {place.open ? "Aberto" : "Fechado"}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground">{place.category}</span>
              {place.hours && (
                <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" />
                  {place.hours}
                </span>
              )}
              <span className={`text-[9px] font-medium ${distanceColor(place.distance)}`}>
                {distanceLabel(place.distance)} {place.distance}
              </span>
              <div className="mt-1 w-full text-center rounded-full bg-primary/10 text-primary text-[10px] font-semibold py-1.5 transition-colors hover:bg-primary/20">
                Ver Local
              </div>
            </div>
          </Link>
        )}
      />
    </motion.div>
  );
}
