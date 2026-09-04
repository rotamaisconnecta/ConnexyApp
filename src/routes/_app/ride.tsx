import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { StatusBar } from "@/components/phone-frame";
import { RideRequestForm } from "@/components/mobility/ride-request-form";
import { StopManager } from "@/components/mobility/stop-manager";
import { FavoriteDestinationList } from "@/components/mobility/favorite-destination";
import { ScheduleRide } from "@/components/mobility/schedule-ride";
import { BackButton } from "@/components/navigation/back-button";
import { Home as HomeIcon, Briefcase, Star, Clock } from "lucide-react";
import { useState } from "react";
import type {
  GeoLocation,
  FavoriteDestination,
  VehicleCategoryValue,
  PaymentMethodValue,
} from "@/lib/mobility/ride-types";
import { VehicleCategory, PaymentMethod } from "@/lib/mobility/ride-types";
import { type RouteStop, createStop } from "@/lib/mobility/route-utils";

export const Route = createFileRoute("/_app/ride")({
  head: () => ({ meta: [{ title: "Solicitar viagem — RotaMais" }] }),
  validateSearch: z.object({
    destinationId: z.string().optional().nullable(),
    destinationName: z.string().optional().nullable(),
    destinationAddress: z.string().optional().nullable(),
    destinationLat: z.number().optional().nullable(),
    destinationLng: z.number().optional().nullable(),
    source: z.string().optional().nullable(),
  }),
  component: RideRequestPage,
});

const MOCK_DESTINATIONS: FavoriteDestination[] = [
  {
    id: "1",
    name: "Casa",
    icon: "🏠",
    location: { lat: -23.55, lng: -46.63, label: "Rua Augusta, 1200" },
  },
  {
    id: "2",
    name: "Trabalho",
    icon: "💼",
    location: { lat: -23.56, lng: -46.65, label: "Av. Paulista, 1000" },
  },
  {
    id: "3",
    name: "Academia",
    icon: "💪",
    location: { lat: -23.54, lng: -46.62, label: "Rua Oscar Freire, 500" },
  },
];

function RideRequestPage() {
  const nav = useNavigate();
  const search = Route.useSearch();
  const [origin] = useState<GeoLocation>({ lat: -23.55, lng: -46.64, label: "Minha localização" });
  const [destination, setDestination] = useState<GeoLocation | null>(() => {
    const label = search.destinationAddress || search.destinationName;
    return label
      ? {
          lat: search.destinationLat ?? -23.58,
          lng: search.destinationLng ?? -46.65,
          label,
        }
      : null;
  });
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [scheduled, setScheduled] = useState<Date | null>(null);

  function handleAddStop() {
    const loc: GeoLocation = { lat: -23.545, lng: -46.635, label: `Parada ${stops.length + 1}` };
    const newStop = createStop(loc, loc.label, stops.length + 1);
    setStops([...stops, newStop]);
  }

  function handleRemoveStop(id: string) {
    setStops(stops.filter((s) => s.id !== id));
  }

  function handleUpdateStop(id: string, label: string) {
    setStops((current) =>
      current.map((stop) =>
        stop.id === id ? { ...stop, label, location: { ...stop.location, label } } : stop,
      ),
    );
  }

  function handleSelectFavorite(fav: FavoriteDestination) {
    setDestination(fav.location);
  }

  return (
    <div className="flex-1 flex flex-col">
      <StatusBar />

      <div className="flex items-center gap-3 px-5 pt-1 pb-3">
        <BackButton
          fallbackTo="/home"
          className="h-9 w-9 grid place-items-center rounded-full bg-secondary"
        />
        <div>
          <h1 className="font-display font-bold text-base">Solicitar viagem</h1>
          <p className="text-[11px] text-muted-foreground">Para onde você vai?</p>
        </div>
      </div>

      <div className="flex-1 px-5 pb-4 space-y-4 overflow-y-auto no-scrollbar">
        <RideRequestForm
          origin={origin}
          destination={destination}
          stops={stops}
          onOriginChange={() => {}}
          onDestinationChange={setDestination}
          onAddStop={(loc, label) => {
            const newStop = createStop(loc, label, stops.length + 1);
            setStops([...stops, newStop]);
          }}
          onRemoveStop={handleRemoveStop}
          onUpdateStop={handleUpdateStop}
        />

        <StopManager
          stops={stops}
          onAddStop={handleAddStop}
          onRemoveStop={handleRemoveStop}
          onUpdateStop={handleUpdateStop}
        />

        <FavoriteDestinationList favorites={MOCK_DESTINATIONS} onSelect={handleSelectFavorite} />

        <ScheduleRide scheduledAt={scheduled} onSchedule={setScheduled} />

        {destination && (
          <button
            onClick={() =>
              nav({
                to: "/ride/request",
                search: {
                  destinationId: search.destinationId,
                  destinationName: destination.label,
                  destinationAddress: destination.label,
                  destinationLat: destination.lat,
                  destinationLng: destination.lng,
                  source: search.source || "ride",
                },
              })
            }
            className="w-full rounded-full bg-gradient-brand py-4 text-white font-semibold shadow-elegant"
          >
            Confirmar destino
          </button>
        )}
      </div>
    </div>
  );
}
