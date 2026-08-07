import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Calendar, Users, MapPin } from "lucide-react";
import { PremiumCarousel } from "@/components/carousel/PremiumCarousel";
import type { NearbyEventsSectionData } from "@/lib/feed/feed-types";

interface FeedNearbyEventsProps {
  data: NearbyEventsSectionData;
  title?: string;
  section?: string;
}

export function FeedNearbyEvents({ data, title, section }: FeedNearbyEventsProps) {
  const displayTitle = title ?? "Eventos Próximos";
  const isToday = displayTitle.toLowerCase().includes("hoje");
  const emoji = isToday ? "🎉" : "📅";

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
              {emoji}
            </span>
            <h3 className="font-display text-base font-bold truncate">{displayTitle}</h3>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {isToday ? "Eventos acontecendo agora na região" : "Próximos eventos por perto"}
          </p>
        </div>
        <Link
          to="/events"
          search={isToday ? { today: "true" } : undefined}
          className="shrink-0 text-xs font-semibold text-primary flex items-center gap-0.5 transition-all duration-200 hover:gap-1"
        >
          Ver tudo <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <PremiumCarousel
        section={section}
        items={data.events}
        renderCard={(event) => (
          <Link
            to="/event/$eventId"
            params={{ eventId: event.id }}
            className="block rounded-[20px] overflow-hidden h-full transition-all duration-300 hover:shadow-xl active:scale-[0.98]"
          >
            <div className="bg-surface h-full flex flex-col border border-border/50 rounded-[20px] overflow-hidden">
              <div className="relative w-full shrink-0" style={{ height: "50%" }}>
                <img
                  src={event.banner}
                  alt={event.name}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute top-2.5 right-2.5 z-10">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/90 text-gray-800 shadow-soft flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {event.participants}
                  </span>
                </div>
                <span className="absolute bottom-2.5 left-2.5 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/90 text-gray-800 shadow-soft z-10 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {event.distance}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-1 px-4 py-3 min-h-0">
                <span className="font-display font-bold text-sm truncate">{event.name}</span>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{event.location}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3 shrink-0" />
                  <span>
                    {event.date} às {event.time}
                  </span>
                </div>
                <div className="mt-auto h-10 w-full rounded-full bg-primary/10 text-primary text-xs font-semibold grid place-items-center transition-colors hover:bg-primary/20">
                  Ver Evento
                </div>
              </div>
            </div>
          </Link>
        )}
      />
    </motion.div>
  );
}
