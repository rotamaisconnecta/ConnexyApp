import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Car, Star } from "lucide-react";
import { PremiumCarousel } from "@/components/carousel/PremiumCarousel";
import type { NearbyDriversSectionData } from "@/lib/feed/feed-types";

interface FeedNearbyDriversProps {
  data: NearbyDriversSectionData;
}

export function FeedNearbyDrivers({ data }: FeedNearbyDriversProps) {
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
              🚗
            </span>
            <h3 className="font-display text-base font-bold truncate">Motoristas Disponíveis</h3>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {data.count} motoristas próximos
          </p>
        </div>
        <Link
          to="/discover"
          className="shrink-0 text-xs font-semibold text-primary flex items-center gap-0.5 transition-all duration-200 hover:gap-1"
        >
          Ver mapa <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <PremiumCarousel
        items={data.drivers}
        renderCard={(driver) => (
          <div className="rounded-2xl overflow-hidden h-full transition-all duration-200 hover:shadow-elegant active:scale-[0.98]">
            <div className="bg-surface h-full flex flex-col border border-border/50 rounded-2xl overflow-hidden">
              <div className="p-3 flex flex-col items-center text-center gap-2 flex-1">
                <div className="relative">
                  <img
                    src={driver.photo}
                    alt={driver.name}
                    loading="lazy"
                    className="h-14 w-14 rounded-full object-cover"
                  />
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-surface ${driver.available ? "bg-green-500" : "bg-gray-300"}`}
                  />
                </div>
                <div className="min-w-0">
                  <span className="font-display font-bold text-xs block truncate">
                    {driver.name}
                  </span>
                  <div className="flex items-center justify-center gap-1 mt-0.5">
                    <Car className="h-2.5 w-2.5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">{driver.car}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px]">
                  <Star className="h-3 w-3 text-yellow-500 fill-current" />
                  <span className="font-semibold">{driver.rating}</span>
                </div>
                <span className="text-[9px] font-medium text-muted-foreground">
                  {driver.distance}
                </span>
                <Link
                  to="/ride"
                  className="mt-auto w-full rounded-full bg-gradient-brand text-white text-[10px] font-semibold py-1.5 text-center transition-all hover:brightness-110 active:scale-[0.97]"
                >
                  Solicitar
                </Link>
              </div>
            </div>
          </div>
        )}
      />
    </motion.div>
  );
}
