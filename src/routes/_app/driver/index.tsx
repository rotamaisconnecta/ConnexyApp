import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { DriverOperationsDashboard } from "@/components/driver/driver-operations-dashboard";
import { DriverRideBottomSheet } from "@/components/driver/driver-ride-bottom-sheet";
import { currentUser } from "@/lib/mock-data";
import type { RideRequest } from "@/lib/driver/driver-types";

export const Route = createFileRoute("/_app/driver/")({
  head: () => ({ meta: [{ title: "Motorista — Connexy" }] }),
  component: DriverPage,
});

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
  const [isOnline, setIsOnline] = useState(false);
  const [showRideRequest, setShowRideRequest] = useState(false);

  return (
    <div className="flex-1">
      <StatusBar />
      <div className="px-4 pt-1">
        <DriverOperationsDashboard
          driverName={currentUser.name}
          driverPhoto={currentUser.photo}
          isOnline={isOnline}
          onToggleOnline={() => {
            setIsOnline(!isOnline);
            if (!isOnline) setShowRideRequest(true);
          }}
          onOpenMap={() => navigate({ to: "/discover" })}
          onOpenDocuments={() => navigate({ to: "/driver/profile" })}
        />
      </div>

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
