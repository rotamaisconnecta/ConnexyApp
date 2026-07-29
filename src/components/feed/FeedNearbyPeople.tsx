import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Eye, MapPin } from "lucide-react";
import { PresenceDot } from "@/components/presence-dot";
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
            <h3 className="font-display text-base font-bold truncate">Pessoas Proximas</h3>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Conheca pessoas que compartilham seus interesses
          </p>
        </div>
        <Link
          to="/pessoas"
          className="shrink-0 text-xs font-semibold text-primary flex items-center gap-0.5 transition-all duration-200 hover:gap-1"
        >
          Ver todas <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {data.people.map((person) => (
          <motion.div key={person.id} whileTap={{ scale: 0.97 }} className="shrink-0 w-40">
            <div className="rounded-2xl bg-surface border border-border shadow-soft overflow-hidden transition-shadow duration-200 hover:shadow-elegant">
              <div className="relative h-36">
                <img
                  src={person.photo}
                  alt={person.name}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                <div className="absolute top-2 right-2">
                  <PresenceDot online={person.online} size={8} />
                </div>
                <span className="absolute bottom-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface/90 text-foreground shadow-soft flex items-center gap-1">
                  <MapPin className="h-2.5 w-2.5" />
                  {person.distance}
                </span>
              </div>
              <div className="p-2.5">
                <div className="flex items-center gap-1">
                  <span className="font-display font-bold text-xs truncate">{person.name}</span>
                  {person.age && (
                    <span className="text-[10px] text-muted-foreground">{person.age} anos</span>
                  )}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {person.interests.slice(0, 3).map((interest) => (
                    <span
                      key={interest}
                      className="text-[9px] bg-secondary rounded-full px-1.5 py-0.5"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
                <Link
                  to="/perfil/$id"
                  params={{ id: person.id }}
                  className="mt-2 w-full flex items-center justify-center gap-1 rounded-full bg-primary/10 text-primary text-[10px] font-semibold py-1.5"
                >
                  <Eye className="h-3 w-3" />
                  Visualizar
                </Link>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
