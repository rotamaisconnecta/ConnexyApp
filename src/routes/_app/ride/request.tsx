import { createFileRoute } from "@tanstack/react-router";
import { RideFlow } from "@/components/mobility/ride/ride-flow";
import { RideBlockedPanel } from "@/components/mobility/ride-blocked-panel";
import { rideSearchSchema, parseCompanions, buildCompanionStops } from "@/lib/mobility/ride-search";
import { DEMO_ORIGIN } from "@/components/mobility/ride/ride-data";
import { useDemoIdentity } from "@/lib/demo/demo-identity";
import { useRideBlock } from "@/hooks/use-ride-block";
import { useTrip } from "@/hooks/use-trip";
import { isTerminal } from "@/lib/mobility/trip/trip-machine";

export const Route = createFileRoute("/_app/ride/request")({
  head: () => ({ meta: [{ title: "Solicitar viagem — Connexy" }] }),
  validateSearch: rideSearchSchema,
  component: RideRequestConfirmPage,
});

function RideRequestConfirmPage() {
  const search = Route.useSearch();
  const identity = useDemoIdentity();
  const block = useRideBlock(identity.id);
  const trip = useTrip();

  if (block && (!trip || isTerminal(trip.status))) {
    return <RideBlockedPanel block={block} />;
  }

  const destination =
    search.destinationAddress || search.destinationName
      ? {
          lat: search.destinationLat ?? -23.58,
          lng: search.destinationLng ?? -46.65,
          label: search.destinationAddress || search.destinationName || "",
        }
      : null;

  const companions = parseCompanions(search.companions);
  const companionStops = companions.length > 0 ? buildCompanionStops(DEMO_ORIGIN, companions) : [];

  return (
    <RideFlow
      origin={DEMO_ORIGIN}
      destination={destination}
      initialStops={companionStops}
      source={search.source}
      companionLabel={search.source === "invite" ? "Ir juntos" : undefined}
      seedInitial
    />
  );
}
