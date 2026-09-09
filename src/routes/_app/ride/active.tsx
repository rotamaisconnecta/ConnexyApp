import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { RideFlow } from "@/components/mobility/ride/ride-flow";
import { rideSearchSchema } from "@/lib/mobility/ride-search";
import { DEMO_ORIGIN } from "@/components/mobility/ride/ride-data";
import { getTrip } from "@/lib/mobility/trip/trip-store";
import { isTerminal } from "@/lib/mobility/trip/trip-machine";

export const Route = createFileRoute("/_app/ride/active")({
  head: () => ({ meta: [{ title: "Viagem — Connexy" }] }),
  validateSearch: rideSearchSchema,
  component: ActiveRidePage,
});

function ActiveRidePage() {
  const navigate = useNavigate();
  const trip = getTrip();

  useEffect(() => {
    if (!trip || isTerminal(trip.status)) {
      navigate({ to: "/ride/request", replace: true });
    }
  }, [trip, navigate]);

  if (!trip || isTerminal(trip.status)) return null;

  return (
    <RideFlow
      origin={DEMO_ORIGIN}
      source={trip.source ?? undefined}
      companionLabel={trip.companionLabel ?? undefined}
    />
  );
}
