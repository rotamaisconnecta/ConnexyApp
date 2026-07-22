import type { BusinessEvent } from "@/lib/marketplace/business-types";
import { EventCard } from "./event-card";
import { EmptyMarketplace } from "./empty-marketplace";

interface EventListProps {
  events: BusinessEvent[];
  title?: string;
  onSelect?: (id: string) => void;
}

export function EventList({ events, title = "Eventos", onSelect }: EventListProps) {
  if (events.length === 0) {
    return (
      <div className="space-y-2">
        <h3 className="font-semibold text-sm">{title}</h3>
        <EmptyMarketplace message="Nenhum evento disponível" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-sm">{title}</h3>
      <div className="space-y-3">
        {events.map((event) => (
          <EventCard key={event.id} event={event} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}
