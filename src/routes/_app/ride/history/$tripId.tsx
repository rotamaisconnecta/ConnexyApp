import { createFileRoute, notFound } from "@tanstack/react-router";
import { RideTripDetail } from "@/components/mobility/ride-trip-detail";
import { getHistorySnapshot } from "@/lib/mobility/trip/trip-store";

export const Route = createFileRoute("/_app/ride/history/$tripId")({
  head: () => ({ meta: [{ title: "Detalhes da viagem — Connexy" }] }),
  component: RideHistoryDetailPage,
});

function RideHistoryDetailPage() {
  const { tripId } = Route.useParams();
  const trip = getHistorySnapshot().find((item) => item.id === tripId);

  if (!trip) {
    throw notFound();
  }

  return <RideTripDetail trip={trip} />;
}
