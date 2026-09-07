import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { RideFlow } from "@/components/mobility/ride/ride-flow";
import { parseCompanions, buildCompanionStops, type RideSearch } from "@/lib/mobility/ride-search";
import { DEMO_ORIGIN } from "@/components/mobility/ride/ride-data";

export const Route = createFileRoute("/_app/ride/")({
  head: () => ({ meta: [{ title: "Solicitar viagem — Connexy" }] }),
  validateSearch: z.object({
    destinationId: z.string().optional().nullable(),
    destinationName: z.string().optional().nullable(),
    destinationAddress: z.string().optional().nullable(),
    destinationLat: z.number().optional().nullable(),
    destinationLng: z.number().optional().nullable(),
    pickupName: z.string().optional().nullable(),
    pickupAddress: z.string().optional().nullable(),
    pickupLat: z.number().optional().nullable(),
    pickupLng: z.number().optional().nullable(),
    companions: z.string().optional().nullable(),
    source: z.string().optional().nullable(),
  }),
  component: RideIndexPage,
});

function RideIndexPage() {
  const nav = useNavigate();
  const search = Route.useSearch() as RideSearch;

  const destination =
    search.destinationAddress || search.destinationName
      ? {
          lat: search.destinationLat ?? -23.58,
          lng: search.destinationLng ?? -46.65,
          label: search.destinationAddress || search.destinationName || "",
        }
      : null;

  const companions = parseCompanions(search.companions);
  const stops = companions.length > 0 ? buildCompanionStops(DEMO_ORIGIN, companions) : [];

  return (
    <RideFlow
      origin={DEMO_ORIGIN}
      destination={destination}
      initialStops={stops}
      source={search.source}
      companionLabel={search.source === "invite" ? "Ir juntos" : undefined}
      onBackToHome={() => nav({ to: "/home" })}
    />
  );
}
