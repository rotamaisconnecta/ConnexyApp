import type { RideHistoryItem } from "@/lib/mobility/ride-types";
import { RideHistoryCard } from "./ride-history-card";
import { EmptyHistory } from "./empty-history";
import { getTotalHistoryPrice } from "@/lib/mobility/ride-utils";
import { formatPrice } from "@/lib/mobility/ride-pricing";

interface RideHistoryListProps {
  history: RideHistoryItem[];
  onSelect?: (id: string) => void;
}

export function RideHistoryList({ history, onSelect }: RideHistoryListProps) {
  if (history.length === 0) {
    return <EmptyHistory />;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-base">Histórico</h2>
        <span className="text-[11px] text-muted-foreground">
          {history.length} viagem{history.length > 1 ? "s" : ""}
        </span>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-3 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Total gasto</span>
        <span className="font-display font-bold text-primary">
          {formatPrice(getTotalHistoryPrice(history))}
        </span>
      </div>

      <div className="space-y-2">
        {history.map((item) => (
          <RideHistoryCard key={item.id} item={item} onClick={onSelect} />
        ))}
      </div>
    </div>
  );
}
