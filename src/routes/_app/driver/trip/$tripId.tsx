import { createFileRoute } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { DriverTrip } from "@/components/driver/driver-trip";
import type { RideRequest } from "@/lib/driver/driver-types";

export const Route = createFileRoute("/_app/driver/trip/$tripId")({
  head: () => ({ meta: [{ title: "Corrida — Motorista" }] }),
  component: DriverTripPage,
});

const MOCK_RIDE: RideRequest = {
  id: "trip-1",
  passengerId: "p1",
  passengerName: "Ana Silva",
  passengerPhoto: "https://i.pravatar.cc/150?u=a1",
  passengerRating: 4.8,
  origin: "Av. Paulista, 1000",
  originLat: -23.5613,
  originLng: -46.656,
  destination: "Shopping Center 3",
  destinationLat: -23.5955,
  destinationLng: -46.6892,
  distance: 4200,
  duration: 18,
  price: 22.5,
  paymentMethod: "PIX" as const,
  status: "ACCEPTED" as const,
  createdAt: new Date(),
};

function DriverTripPage() {
  return (
    <div className="flex-1 pb-20">
      <StatusBar />
      <DriverTrip ride={MOCK_RIDE} onAction={(action) => console.log(action)} />
    </div>
  );
}
