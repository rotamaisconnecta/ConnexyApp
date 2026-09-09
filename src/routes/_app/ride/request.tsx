import { createFileRoute } from "@tanstack/react-router";
import { RideFlow } from "@/components/mobility/ride/ride-flow";
import { rideSearchSchema, parseCompanions, buildCompanionStops } from "@/lib/mobility/ride-search";
import { DEMO_ORIGIN } from "@/components/mobility/ride/ride-data";

export const Route = createFileRoute("/_app/ride/request")({
  head: () => ({ meta: [{ title: "Solicitar viagem — Connexy" }] }),
  validateSearch: rideSearchSchema,
  component: RideRequestConfirmPage,
});

function RideRequestConfirmPage() {
  const search = Route.useSearch();

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
