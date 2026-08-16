import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { Calendar, MapPin, Users } from "lucide-react";
import { BackButton } from "@/components/navigation/back-button";
import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { eventsToday, eventsUpcoming, type HomeEvent } from "@/lib/feed/home-premium";
import { formatEventDistance } from "@/lib/marketplace/event-utils";

const searchSchema = z.object({
  today: z.enum(["true", "false"]).optional(),
});

export const Route = createFileRoute("/_app/events")({
  head: () => ({ meta: [{ title: "Eventos — Connexy" }] }),
  validateSearch: searchSchema,
  component: EventsPage,
});

function EventCard({ event }: { event: HomeEvent }) {
  const distanceLabel = formatEventDistance(event.distance);

  return (
    <Link
      to="/event/$eventId"
      params={{ eventId: event.id }}
      className="block rounded-2xl overflow-hidden bg-surface border border-border/50 shadow-soft transition-all duration-300 hover:shadow-elevated active:scale-[0.98]"
    >
      <div className="relative" style={{ paddingBottom: "62%" }}>
        <img
          src={event.banner}
          alt={event.name}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 to-transparent" />
        <span className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-gray-800 shadow-soft">
          <Users className="h-3 w-3" />
          {event.participants}
        </span>
        {distanceLabel && (
          <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-gray-800 shadow-soft">
            <MapPin className="h-3 w-3" />
            {distanceLabel}
          </span>
        )}
      </div>
      <div className="p-3.5">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate font-display text-sm font-bold">{event.name}</span>
          <span className="shrink-0 text-[11px] font-semibold text-primary">{event.date}</span>
        </div>
        <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
          <Calendar className="h-3 w-3 shrink-0" />
          <span className="truncate">
            {event.location} · {event.time}
          </span>
        </div>
      </div>
    </Link>
  );
}

function EventsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [today, setToday] = useState(search.today === "true");

  const events = today ? eventsToday() : eventsUpcoming();

  function selectToday(next: boolean) {
    setToday(next);
    navigate({ to: "/events", search: next ? { today: "true" } : undefined, replace: true });
  }

  return (
    <div className="flex-1">
      <StatusBar />
      <header className="px-5 pt-1 pb-3 flex items-center gap-3">
        <BackButton
          fallbackTo="/home"
          className="h-10 w-10 grid place-items-center rounded-full bg-secondary"
          ariaLabel="Voltar"
        />
        <div className="min-w-0">
          <h1 className="font-display text-xl font-bold">
            {today ? "📅 Eventos de Hoje" : "🎉 Eventos Próximos"}
          </h1>
          <p className="text-[11px] text-muted-foreground">
            {events.length} eventos {today ? "acontecendo agora" : "por vir"}
          </p>
        </div>
      </header>

      <div className="px-5">
        <div className="flex gap-2 rounded-full bg-secondary p-1">
          <button
            type="button"
            onClick={() => selectToday(true)}
            className={cn(
              "flex-1 rounded-full py-2 text-xs font-semibold transition-all",
              today ? "bg-gradient-brand text-white shadow-soft" : "text-muted-foreground",
            )}
          >
            Hoje
          </button>
          <button
            type="button"
            onClick={() => selectToday(false)}
            className={cn(
              "flex-1 rounded-full py-2 text-xs font-semibold transition-all",
              !today ? "bg-gradient-brand text-white shadow-soft" : "text-muted-foreground",
            )}
          >
            Próximos
          </button>
        </div>
      </div>

      <div className="px-4 py-4 pb-6">
        {events.length === 0 ? (
          <div className="rounded-3xl border border-border bg-surface p-8 text-center shadow-soft">
            <div className="text-4xl">🗓️</div>
            <h2 className="mt-3 font-display font-bold text-base">Nenhum evento por aqui</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {today
                ? "Ainda não há eventos acontecendo hoje. Volte mais tarde."
                : "Não há eventos futuros no momento. Verifique novamente em breve."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
