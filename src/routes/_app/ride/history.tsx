import { createFileRoute } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { RideHistoryList } from "@/components/mobility/ride-history-list";
import { BackButton } from "@/components/navigation/back-button";
import { useTripHistory } from "@/hooks/use-trip-history";

export const Route = createFileRoute("/_app/ride/history")({
  head: () => ({ meta: [{ title: "Histórico de viagens" }] }),
  component: RideHistoryPage,
});

function RideHistoryPage() {
  const history = useTripHistory();

  return (
    <div className="flex-1 flex flex-col">
      <StatusBar />
      <div className="flex items-center gap-3 px-5 pt-1 pb-3">
        <BackButton
          fallbackTo="/home"
          className="h-9 w-9 grid place-items-center rounded-full bg-secondary"
        />
        <div>
          <h1 className="font-display font-bold text-base">Histórico de viagens</h1>
          <p className="text-[11px] text-muted-foreground">
            {history.length} {history.length === 1 ? "viagem" : "viagens"}
          </p>
        </div>
      </div>

      <div className="flex-1 px-5 pb-4 overflow-y-auto no-scrollbar">
        <RideHistoryList history={history} />
      </div>
    </div>
  );
}
