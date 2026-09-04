import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { StatusBar } from "@/components/phone-frame";
import { BackButton } from "@/components/navigation/back-button";
import { RideRequestForm } from "@/components/mobility/ride-request-form";
import { StopManager } from "@/components/mobility/stop-manager";
import { RoutePreview } from "@/components/mobility/route-preview";
import { RideTypeSelector } from "@/components/mobility/ride-type-selector";
import { PriceEstimateDisplay } from "@/components/mobility/price-estimate";
import { estimateAllCategories } from "@/lib/mobility/ride-pricing";
import {
  VehicleCategory,
  type GeoLocation,
  type VehicleCategoryValue,
} from "@/lib/mobility/ride-types";
import {
  createStop,
  estimateRouteDistance,
  estimateRouteDuration,
  type RouteStop,
} from "@/lib/mobility/route-utils";
import { toast } from "sonner";

const rideSearchSchema = z.object({
  destinationId: z.string().optional().nullable(),
  destinationName: z.string().optional().nullable(),
  destinationAddress: z.string().optional().nullable(),
  destinationLat: z.number().optional().nullable(),
  destinationLng: z.number().optional().nullable(),
  pickupName: z.string().optional().nullable(),
  pickupAddress: z.string().optional().nullable(),
  pickupLat: z.number().optional().nullable(),
  pickupLng: z.number().optional().nullable(),
  source: z.string().optional().nullable(),
});

export const Route = createFileRoute("/_app/ride/request")({
  head: () => ({ meta: [{ title: "Solicitar viagem — Connexy" }] }),
  validateSearch: rideSearchSchema,
  component: RideRequestConfirmPage,
});

function RideRequestConfirmPage() {
  const nav = useNavigate();
  const search = Route.useSearch();
  const [origin, setOrigin] = useState<GeoLocation>({
    lat: -23.55,
    lng: -46.64,
    label: "Minha localização",
  });
  const [destination, setDestination] = useState<GeoLocation>(() => ({
    lat: search.destinationLat ?? -23.58,
    lng: search.destinationLng ?? -46.65,
    label: search.destinationAddress || search.destinationName || "Para onde você vai?",
  }));
  const [stops, setStops] = useState<RouteStop[]>(() =>
    search.pickupName
      ? [
          createStop(
            {
              lat: search.pickupLat ?? -23.557,
              lng: search.pickupLng ?? -46.648,
              label: search.pickupAddress || search.pickupName,
            },
            search.pickupAddress || search.pickupName,
            1,
          ),
        ]
      : [],
  );
  const [category, setCategory] = useState<VehicleCategoryValue>(VehicleCategory.ECONOMICO);
  const [requesting, setRequesting] = useState(false);

  const distanceMeters = useMemo(() => {
    const direct = estimateRouteDistance(origin, destination);
    return Math.max(1400, Math.round(direct + stops.length * 900));
  }, [destination, origin, stops.length]);
  const durationMinutes = useMemo(
    () => estimateRouteDuration(distanceMeters) + stops.length * 3,
    [distanceMeters, stops.length],
  );
  const estimates = useMemo(
    () => estimateAllCategories(distanceMeters, durationMinutes),
    [distanceMeters, durationMinutes],
  );
  const estimate = estimates.find((item) => item.category === category) ?? estimates[0];

  const addStop = () => {
    const label = `Parada ${stops.length + 1}`;
    setStops((current) => [
      ...current,
      createStop({ lat: -23.56, lng: -46.64, label }, label, current.length + 1),
    ]);
  };

  const updateStop = (id: string, label: string) => {
    setStops((current) =>
      current.map((stop) =>
        stop.id === id ? { ...stop, label, location: { ...stop.location, label } } : stop,
      ),
    );
  };

  const requestDriver = () => {
    if (!destination.label.trim() || destination.label === "Para onde você vai?") {
      toast.error("Informe o destino antes de solicitar a viagem.");
      return;
    }
    setRequesting(true);
    window.setTimeout(() => {
      toast.success("Procurando o motorista mais próximo para sua rota.");
      nav({ to: "/ride/matching" });
    }, 450);
  };

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <StatusBar />
      <header className="flex items-center gap-3 px-5 pb-3 pt-1">
        <BackButton
          fallbackTo="/ride"
          className="grid h-9 w-9 place-items-center rounded-full bg-secondary"
        />
        <div>
          <h1 className="font-display text-base font-bold">Solicitar viagem</h1>
          <p className="text-[11px] text-muted-foreground">Defina a rota e chame um motorista</p>
        </div>
      </header>

      <main className="flex-1 space-y-4 overflow-y-auto px-5 pb-28 no-scrollbar">
        <RideRequestForm
          origin={origin}
          destination={destination}
          stops={stops}
          onOriginChange={(location) => location && setOrigin(location)}
          onDestinationChange={(location) => location && setDestination(location)}
          onAddStop={(location, label) =>
            setStops((current) => [...current, createStop(location, label, current.length + 1)])
          }
          onRemoveStop={(id) => setStops((current) => current.filter((stop) => stop.id !== id))}
          onUpdateStop={updateStop}
        />
        <StopManager
          stops={stops}
          onAddStop={addStop}
          onRemoveStop={(id) => setStops((current) => current.filter((stop) => stop.id !== id))}
          onUpdateStop={updateStop}
        />
        <RoutePreview
          origin={origin}
          destination={destination}
          stops={stops}
          distanceMeters={distanceMeters}
          durationMinutes={durationMinutes}
        />
        <RideTypeSelector selected={category} onSelect={setCategory} estimates={estimates} />
        <PriceEstimateDisplay estimate={estimate} />
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-background/95 px-5 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] pt-3 backdrop-blur">
        <button
          type="button"
          onClick={requestDriver}
          disabled={requesting}
          className="h-12 w-full rounded-full bg-gradient-brand text-sm font-bold text-white shadow-elegant disabled:opacity-70"
        >
          {requesting ? "Procurando motorista..." : "Solicitar viagem"}
        </button>
      </div>
    </div>
  );
}
