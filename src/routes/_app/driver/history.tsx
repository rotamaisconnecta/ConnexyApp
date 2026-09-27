import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { RideHistoryList } from "@/components/mobility/ride-history-list";
import { BackButton } from "@/components/navigation/back-button";
import { useTripHistory } from "@/hooks/use-trip-history";

export const Route = createFileRoute("/_app/driver/history")({
  head: () => ({ meta: [{ title: "Histórico — Motorista" }] }),
  component: DriverHistoryPage,
});

function DriverHistoryPage() {
  const history = useTripHistory();
  const navigate = useNavigate();

  return (
    <div className="flex-1 pb-20">
      <StatusBar />
      <header className="px-5 pt-1 pb-3 flex items-center gap-3">
        <BackButton
          fallbackTo="/driver"
          className="h-9 w-9 grid place-items-center rounded-full bg-secondary"
        />
        <h1 className="font-display font-bold text-lg">Histórico</h1>
      </header>
      <div className="px-4">
        <RideHistoryList
          history={history}
          onSelect={(tripId) => navigate({ to: "/ride/history/$tripId", params: { tripId } })}
        />
      </div>
    </div>
  );
}
