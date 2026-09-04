import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { DriverCommandCenter } from "@/components/driver/driver-command-center";
import { DriverRideBottomSheet } from "@/components/driver/driver-ride-bottom-sheet";
import { currentUser } from "@/lib/mock-data";
import type { DriverEarnings, RideRequest } from "@/lib/driver/driver-types";
import { isDriverApproved } from "@/lib/driver/driver-application-storage";

export const Route = createFileRoute("/_app/driver/")({
  head: () => ({ meta: [{ title: "Motorista — Connexy" }] }),
  component: DriverPage,
});

const MOCK_EARNINGS: DriverEarnings = {
  today: 156.8,
  week: 892.4,
  month: 3456.7,
  totalTrips: 234,
  averagePerTrip: 14.8,
  commission: 20,
};

const MOCK_RIDE_REQUEST: RideRequest = {
  id: "r1",
  passengerId: "p1",
  passengerName: "Ana Silva",
  passengerPhoto: currentUser.photo,
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
  status: "PENDING" as const,
  createdAt: new Date(),
};

function DriverPage() {
  const navigate = useNavigate();
  const approved = isDriverApproved();
  const [isOnline, setIsOnline] = useState(false);
  const [showRideRequest, setShowRideRequest] = useState(false);

  useEffect(() => {
    if (!approved) navigate({ to: "/driver/cadastro", replace: true });
  }, [approved, navigate]);

  if (!approved) return null;

  return (
    <div className="flex-1 pb-20">
      <StatusBar />
      <DriverCommandCenter
        driverName={currentUser.name}
        rating={4.93}
        earnings={MOCK_EARNINGS}
        isOnline={isOnline}
        onToggleOnline={() => {
          setIsOnline(!isOnline);
          if (!isOnline) setShowRideRequest(true);
        }}
      />

      <DriverRideBottomSheet
        isOpen={showRideRequest}
        onClose={() => setShowRideRequest(false)}
        request={showRideRequest ? MOCK_RIDE_REQUEST : null}
        onAccept={() => setShowRideRequest(false)}
        onDecline={() => setShowRideRequest(false)}
      />
    </div>
  );
}
