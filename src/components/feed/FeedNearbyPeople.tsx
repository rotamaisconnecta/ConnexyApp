import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Eye, Heart } from "lucide-react";
import { PremiumCarousel } from "@/components/carousel/PremiumCarousel";
import { formatPersonDistance } from "@/lib/proximity";
import type { NearbyPeopleSectionData } from "@/lib/feed/feed-types";

interface FeedNearbyPeopleProps {
  data: NearbyPeopleSectionData;
}

export function FeedNearbyPeople({ data }: FeedNearbyPeopleProps) {
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
              👥
            </span>
            <h3 className="font-display text-base font-bold truncate">Pessoas Próximas</h3>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Conheça pessoas que compartilham seus interesses
          </p>
        </div>
        <Link
          to="/people"
          className="shrink-0 text-xs font-semibold text-primary flex items-center gap-0.5 transition-all duration-200 hover:gap-1"
        >
          Ver tudo <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <PremiumCarousel
        items={data.people}
        renderCard={(person) => (
          <Link
            to="/perfil/$id"
            params={{ id: person.id }}
            className="block rounded-2xl overflow-hidden h-full transition-all duration-300 hover:shadow-elevated active:scale-[0.98]"
            style={
              person.online
                ? {
                    border: "2px solid",
                    borderImage: "linear-gradient(135deg, #a855f7, #ec4899) 1",
                  }
                : undefined
            }
          >
            <div className="bg-surface h-full flex flex-col border border-border/50 rounded-2xl overflow-hidden">
              <div className="relative" style={{ paddingBottom: "112%" }}>
                <img
                  src={person.photo}
                  alt={person.name}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-2 left-2 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/90 text-gray-800 shadow-soft z-10">
                  {formatPersonDistance(person.distanceMeters)}
                </div>
              </div>
              <div className="p-3.5 flex flex-col gap-1.5 flex-1">
                <div className="flex items-center gap-1">
                  <span className="font-display font-bold text-sm truncate">{person.name}</span>
                  {person.age != null && (
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {person.age} anos
                    </span>
                  )}
                </div>
                {person.compatibility != null && (
                  <div className="flex items-center gap-1">
                    <Heart className="h-3 w-3 text-pink-500" />
                    <span className="text-[11px] font-medium text-pink-600">
                      Compatibilidade {person.compatibility}%
                    </span>
                  </div>
                )}
                <div className="flex flex-wrap gap-1">
                  {person.interests.slice(0, 3).map((interest) => (
                    <span
                      key={interest}
                      className="text-[11px] bg-secondary rounded-full px-2 py-0.5 truncate max-w-full"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-1 mt-auto">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${person.online ? "bg-green-500" : "bg-gray-300"}`}
                  />
                  <span
                    className={`text-[11px] font-medium ${person.online ? "text-green-600" : "text-gray-400"}`}
                  >
                    {person.online ? "Online" : "Offline"}
                  </span>
                </div>
                <div className="mt-1 w-full text-center rounded-full bg-primary/10 text-primary text-xs font-semibold py-2 transition-colors hover:bg-primary/20 active:scale-[0.97]">
                  <Eye className="h-3 w-3 inline mr-1" />
                  Visualizar Perfil
                </div>
              </div>
            </div>
          </Link>
        )}
      />
    </motion.div>
  );
}
