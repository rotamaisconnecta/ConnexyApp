import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ArrowRight, MapPin, Star, Tag } from "lucide-react";
import type { NearbyBusinessesSectionData } from "@/lib/feed/feed-types";

interface FeedNearbyBusinessesProps {
  data: NearbyBusinessesSectionData;
}

export function FeedNearbyBusinesses({ data }: FeedNearbyBusinessesProps) {
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
              🏪
            </span>
            <h3 className="font-display text-base font-bold truncate">Lugares Proximos</h3>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Ofertas e negocios perto de voce
          </p>
        </div>
        <Link
          to="/discover"
          className="shrink-0 text-xs font-semibold text-primary flex items-center gap-0.5 transition-all duration-200 hover:gap-1"
        >
          Ver todos <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="space-y-2.5">
        {data.businesses.map((biz) => (
          <Link
            key={biz.id}
            to="/local/$id"
            params={{ id: biz.id }}
            className="block rounded-2xl bg-surface border border-border shadow-soft overflow-hidden transition-all duration-200 hover:shadow-elegant active:scale-[0.99]"
          >
            <div className="grid grid-cols-[minmax(0,1fr)_auto]">
              <div className="p-4 min-w-0">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-primary">
                  <Tag className="h-3.5 w-3.5" /> {biz.category}
                </div>
                <div className="mt-1.5 font-display font-bold text-[15px] leading-tight truncate">
                  {biz.name}
                </div>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {biz.distance}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current text-primary" /> {biz.rating}
                  </span>
                </div>
              </div>
              <div className="relative w-24 shrink-0">
                <img
                  src={biz.cover}
                  alt={biz.name}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}
