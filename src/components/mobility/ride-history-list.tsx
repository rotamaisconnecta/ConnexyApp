import type { Trip } from "@/lib/mobility/trip/trip-types";
import { RideHistoryCard } from "./ride-history-card";
import { EmptyHistory } from "./empty-history";
import { getTotalHistoryPrice } from "@/lib/mobility/ride-utils";
import { formatPrice } from "@/lib/mobility/ride-pricing";

interface RideHistoryListProps {
  history: Trip[];
  onSelect?: (id: string) => void;
}

function tripTimestamp(trip: Trip): string {
  return trip.completedAt ?? trip.cancelledAt ?? trip.createdAt;
}

export function RideHistoryList({ history, onSelect }: RideHistoryListProps) {
  const sorted = [...history].sort((a, b) => {
    return tripTimestamp(b).localeCompare(tripTimestamp(a));
  });

  if (sorted.length === 0) {
    return <EmptyHistory />;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-base">Histórico</h2>
        <span className="text-[11px] text-muted-foreground">
          {sorted.length} {sorted.length === 1 ? "viagem" : "viagens"}
        </span>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-3 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Total gasto</span>
        <span className="font-display font-bold text-primary">
          {formatPrice(getTotalHistoryPrice(sorted))}
        </span>
      </div>

      <div className="space-y-2">
        {sorted.map((trip) => (
          <RideHistoryCard key={trip.id} trip={trip} onClick={onSelect} />
        ))}
      </div>
    </div>
  );
}
