import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { TripMapPanel } from "@/components/mobility/trip-map-panel";
import { TripProgress } from "@/components/mobility/trip-progress";
import { DriverArrival } from "@/components/mobility/driver-arrival";
import { TripActions } from "@/components/mobility/trip-actions";
import { ShareTrip } from "@/components/mobility/share-trip";
import { SosButton } from "@/components/mobility/sos-button";
import { useState } from "react";
import type {
  Trip,
  DriverMatch,
  VehicleCategoryValue,
  GeoLocation,
} from "@/lib/mobility/ride-types";
import { RIDE_STATUS, VehicleCategory } from "@/lib/mobility/ride-types";

export const Route = createFileRoute("/_app/ride/active")({
  head: () => ({ meta: [{ title: "Viagem ativa — RotaMais" }] }),
  component: ActiveRidePage,
});

const MOCK_DRIVER: DriverMatch = {
  id: "d1",
  name: "Carlos",
  photo: "https://i.pravatar.cc/200?img=68",
  rating: 4.9,
  totalRides: 1240,
  vehicle: {
    name: "Onix",
    color: "Prata",
    plate: "ABC1D23",
    category: VehicleCategory.ECONOMICO,
    seats: 4,
    year: 2022,
  },
  etaMinutes: 2,
  distanceMeters: 800,
  priceEstimate: {
    category: VehicleCategory.ECONOMICO,
    basePrice: 15,
    discount: 0,
    finalPrice: 18.5,
    currency: "BRL",
    label: "R$ 18,50",
    description: "Até 4 passageiros",
    etaMinutes: 3,
    surgeMultiplier: 1,
  },
  isFavorite: true,
};

const MOCK_TRIP: Trip = {
  id: "trip-1",
  driver: MOCK_DRIVER,
  request: {
    id: "req-1",
    origin: { lat: -23.55, lng: -46.64, label: "Minha localização" },
    destination: { lat: -23.58, lng: -46.65, label: "Shopping Ibirapuera" },
    stops: [],
    category: VehicleCategory.ECONOMICO,
    distanceMeters: 3500,
    durationMinutes: 12,
    scheduledAt: null,
    couponCode: null,
    paymentMethod: "CREDIT",
    createdAt: new Date(),
  },
  status: RIDE_STATUS.DRIVER_EN_ROUTE,
  startedAt: new Date(),
  arrivedAt: null,
  completedAt: null,
  currentLocation: { lat: -23.56, lng: -46.645, label: "Em trânsito" },
  progressPercent: 45,
  estimatedArrival: "2 min",
  sharedWith: [],
  rating: null,
  receipt: null,
};

function ActiveRidePage() {
  const nav = useNavigate();
  const [trip, setTrip] = useState<Trip>(MOCK_TRIP);
  const [showShare, setShowShare] = useState(false);

  function handleCancel() {
    setTrip((prev) => ({ ...prev, status: RIDE_STATUS.CANCELLED }));
    nav({ to: "/home" });
  }

  function handleComplete() {
    setTrip((prev) => ({
      ...prev,
      status: RIDE_STATUS.COMPLETED,
      completedAt: new Date(),
    }));
    nav({ to: "/ride/history" });
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="relative">
        <TripMapPanel
          origin={trip.request.origin}
          destination={trip.request.destination}
          driver={trip.driver}
        />
        <div className="absolute top-0 left-0 right-0">
          <StatusBar />
        </div>
        <div className="absolute top-14 right-4">
          <SosButton status={trip.status} onSOS={() => {}} />
        </div>
        <div className="absolute top-14 left-1/2 -translate-x-1/2 rounded-full bg-surface/95 backdrop-blur px-4 py-1.5 text-xs font-semibold shadow-soft">
          {trip.estimatedArrival} · {Math.round((trip.request.distanceMeters / 1000) * 10) / 10} km
        </div>
      </div>

      <div className="-mt-4 relative bg-surface rounded-t-3xl px-5 pt-4 pb-3 flex-1 overflow-y-auto no-scrollbar space-y-3">
        <div className="h-1 w-10 rounded-full bg-border mx-auto mb-2" />

        <DriverArrival
          driver={trip.driver}
          etaMinutes={trip.driver.etaMinutes}
          onCall={() => {}}
          onMessage={() => {}}
          onSOS={() => {}}
        />

        <TripProgress trip={trip} />

        <TripActions
          status={trip.status}
          onShare={() => setShowShare(!showShare)}
          onSOS={() => {}}
          onCancel={handleCancel}
          onMessage={() => {}}
        />

        {showShare && (
          <ShareTrip
            tripId={trip.id}
            driverName={trip.driver.name}
            origin={trip.request.origin.label}
            destination={trip.request.destination.label}
            eta={trip.estimatedArrival}
          />
        )}

        <button
          onClick={handleComplete}
          className="w-full rounded-full bg-gradient-brand py-3.5 text-white font-semibold shadow-elegant"
        >
          Finalizar viagem (demo)
        </button>
      </div>
    </div>
  );
}
