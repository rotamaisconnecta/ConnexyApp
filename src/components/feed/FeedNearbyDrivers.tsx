import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Car, Star } from "lucide-react";
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
            <h3 className="font-display text-base font-bold truncate">Motoristas Disponiveis</h3>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {data.count} motoristas proximos
          </p>
        </div>
        <Link
          to="/discover"
          className="shrink-0 text-xs font-semibold text-primary flex items-center gap-0.5 transition-all duration-200 hover:gap-1"
        >
          Ver mapa <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="space-y-2">
        {data.drivers.map((driver) => (
          <div
            key={driver.id}
            className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3 shadow-soft transition-all duration-200 hover:shadow-elegant"
          >
            <img
              src={driver.photo}
              alt={driver.name}
              loading="lazy"
              className="h-10 w-10 rounded-full shrink-0 object-cover"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-display font-bold text-sm truncate">{driver.name}</span>
                <span className="flex items-center gap-0.5 text-[10px] text-primary">
                  <Star className="h-3 w-3 fill-current" /> {driver.rating}
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                {driver.car} · {driver.distance}
              </div>
            </div>
            <Link
              to="/ride"
              className="shrink-0 rounded-full bg-gradient-brand text-white text-[11px] font-semibold px-3 py-1.5 shadow-soft transition-all duration-200 hover:brightness-110 active:scale-[0.97]"
            >
              Solicitar
            </Link>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
