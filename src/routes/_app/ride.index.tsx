import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RideFlow } from "@/components/mobility/ride/ride-flow";
import { rideSearchSchema, parseCompanions, buildCompanionStops, type RideSearch } from "@/lib/mobility/ride-search";
import { destinationFromRideSearch, resolveRideOrigin } from "@/lib/mobility/ride-request-context";
import { RideBlockedPanel } from "@/components/mobility/ride-blocked-panel";
import { useDemoIdentity } from "@/lib/demo/demo-identity";
import { useRideBlock } from "@/hooks/use-ride-block";
import { useTrip } from "@/hooks/use-trip";
import { isTerminal } from "@/lib/mobility/trip/trip-machine";

export const Route = createFileRoute("/_app/ride/")({
  head: () => ({ meta: [{ title: "Solicitar viagem — Connexy" }] }),
  validateSearch: rideSearchSchema,
  component: RideIndexPage,
});

function RideIndexPage() {
  const nav = useNavigate();
  const search = Route.useSearch() as RideSearch;
  const identity = useDemoIdentity();
  const block = useRideBlock(identity.id);
  const trip = useTrip();

  if (block && (!trip || isTerminal(trip.status))) {
    return <RideBlockedPanel block={block} />;
  }

  const origin = resolveRideOrigin();
  const destination = destinationFromRideSearch(search);
  const companions = parseCompanions(search.companions);
  const stops = origin && companions.length > 0 ? buildCompanionStops(origin, companions) : [];

  return (
    <RideFlow
      origin={origin}
      destination={destination}
      initialStops={stops}
      source={search.source}
      companionLabel={search.source === "invite" ? "Ir juntos" : undefined}
      seedInitial
      onBackToHome={() => nav({ to: "/home" })}
    />
  );
}
