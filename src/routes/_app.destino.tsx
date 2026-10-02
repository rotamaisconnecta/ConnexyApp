import { createFileRoute } from "@tanstack/react-router";
import { RideFlow } from "@/components/mobility/ride/ride-flow";
import { RideBlockedPanel } from "@/components/mobility/ride-blocked-panel";
import { resolveRideOrigin } from "@/lib/mobility/ride-request-context";
import { useDemoIdentity } from "@/lib/demo/demo-identity";
import { useRideBlock } from "@/hooks/use-ride-block";
import { useTrip } from "@/hooks/use-trip";
import { isTerminal } from "@/lib/mobility/trip/trip-machine";

export const Route = createFileRoute("/_app/destino")({
  head: () => ({ meta: [{ title: "Definir destino — Connexy" }] }),
  component: DestinationPage,
});

function DestinationPage() {
  const identity = useDemoIdentity();
  const block = useRideBlock(identity.id);
  const trip = useTrip();

  if (block && (!trip || isTerminal(trip.status))) {
    return <RideBlockedPanel block={block} />;
  }

  return <RideFlow origin={resolveRideOrigin()} destination={null} seedInitial />;
}
