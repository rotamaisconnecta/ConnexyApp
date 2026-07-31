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
      className="w-full"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 mb-4 px-6">
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
          <div className="rounded-[24px] overflow-hidden h-full transition-all duration-300 hover:shadow-xl active:scale-[0.98]">
            <div className="bg-surface h-full flex flex-col border border-border/50 rounded-[24px] overflow-hidden">
              <div
                className="relative w-full shrink-0 bg-gradient-to-br from-primary/10 to-secondary/40 grid place-items-center"
                style={{ height: "57%" }}
              >
                <div className="relative">
                  <img
                    src={driver.photo}
                    alt={driver.name}
                    loading="lazy"
                    className="h-28 w-28 rounded-full object-cover ring-4 ring-white shadow-soft"
                  />
                  <span
                    className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-4 border-white ${driver.available ? "bg-green-500" : "bg-gray-300"}`}
                  />
                </div>
              </div>
              <div className="flex flex-1 flex-col items-center gap-1 px-6 py-4 text-center min-h-0">
                <span className="font-display font-bold text-[15px] truncate w-full">
                  {driver.name}
                </span>
                <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                  <Car className="h-3.5 w-3.5" />
                  <span className="truncate">{driver.car}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[13px]">
                  <Star className="h-3.5 w-3.5 text-yellow-500 fill-current" />
                  <span className="font-semibold">{driver.rating}</span>
                  <span className="text-muted-foreground">· {driver.distance}</span>
                </div>
                <Link
                  to="/ride"
                  className="mt-auto h-12 w-full rounded-full bg-gradient-brand text-white text-[13px] font-semibold grid place-items-center transition-all hover:brightness-110"
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
