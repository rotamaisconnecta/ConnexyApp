import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ArrowRight, MapPin, Star, Tag } from "lucide-react";
import { PremiumCarousel } from "@/components/carousel/PremiumCarousel";
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
      className="w-full"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 mb-4 px-6">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm" aria-hidden>
              🏢
            </span>
            <h3 className="font-display text-base font-bold truncate">Negócios Próximos</h3>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Empresas e serviços perto de você
          </p>
        </div>
        <Link
          to="/marketplace"
          className="shrink-0 text-xs font-semibold text-primary flex items-center gap-0.5 transition-all duration-200 hover:gap-1"
        >
          Ver tudo <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <PremiumCarousel
        items={data.businesses}
        renderCard={(biz) => (
          <Link
            to="/business/$businessId"
            params={{ businessId: biz.id }}
            className="block rounded-[24px] overflow-hidden h-full transition-all duration-300 hover:shadow-xl active:scale-[0.98]"
          >
            <div className="bg-surface h-full flex flex-col border border-border/50 rounded-[24px] overflow-hidden">
              <div className="relative w-full shrink-0" style={{ height: "57%" }}>
                <img
                  src={biz.cover}
                  alt={biz.name}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute top-3 right-3 z-10">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/90 text-gray-800 shadow-soft flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-yellow-500" />
                    {biz.rating}
                  </span>
                </div>
                <span className="absolute bottom-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full bg-white/90 text-gray-800 shadow-soft z-10">
                  <MapPin className="h-3.5 w-3.5 inline mr-1" />
                  {biz.distance}
                </span>
                {biz.offer && (
                  <div className="absolute top-3 left-3 z-10">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-soft flex items-center gap-1">
                      <Tag className="h-3.5 w-3.5" />
                      {biz.offer}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1 px-6 py-4 min-h-0">
                <span className="font-display font-bold text-[15px] truncate">{biz.name}</span>
                <span className="text-[13px] text-muted-foreground truncate">{biz.category}</span>
                <div className="mt-auto h-12 w-full rounded-full bg-primary/10 text-primary text-[13px] font-semibold grid place-items-center transition-colors hover:bg-primary/20">
                  Ver Negócio
                </div>
              </div>
            </div>
          </Link>
        )}
      />
    </motion.div>
  );
}
