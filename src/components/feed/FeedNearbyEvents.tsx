import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ArrowRight, MapPin, Ticket, Users } from "lucide-react";
import type { NearbyEventsSectionData } from "@/lib/feed/feed-types";

interface FeedNearbyEventsProps {
  data: NearbyEventsSectionData;
}

export function FeedNearbyEvents({ data }: FeedNearbyEventsProps) {
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
              🎉
            </span>
            <h3 className="font-display text-base font-bold truncate">Eventos Proximos</h3>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Acontecendo agora na sua regiao
          </p>
        </div>
        <Link
          to="/locais"
          className="shrink-0 text-xs font-semibold text-primary flex items-center gap-0.5 transition-all duration-200 hover:gap-1"
        >
          Ver mais <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {data.events.map((event) => (
          <Link
            key={event.id}
            to="/event/$eventId"
            params={{ eventId: event.id }}
            className="shrink-0 w-44 rounded-2xl bg-surface border border-border shadow-soft overflow-hidden transition-all duration-200 hover:shadow-elegant active:scale-[0.98]"
          >
            <div className="relative h-28">
              <img
                src={event.banner}
                alt={event.name}
                loading="lazy"
                className="h-full w-full object-cover"
              />
              <span className="absolute bottom-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface/90 text-primary shadow-soft">
                Quero ir
              </span>
            </div>
            <div className="p-3">
              <div className="font-display font-bold text-sm truncate">{event.name}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{event.distance}</span>
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                <Ticket className="h-3 w-3 shrink-0" /> {event.date} · {event.time}
              </div>
              <div className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                <Users className="h-3 w-3" /> {event.participants} vao
              </div>
            </div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}
