import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { DriverHeader } from "@/components/driver/driver-header";
import { DriverPremiumDashboard } from "@/components/driver/driver-premium-dashboard";
import { DriverRideBottomSheet } from "@/components/driver/driver-ride-bottom-sheet";
import { DriverNotifications } from "@/components/driver/driver-notifications";
import { SmartFeed } from "@/components/feed/SmartFeed";
import { currentUser } from "@/lib/mock-data";
import type { DriverEarnings, RideRequest } from "@/lib/driver/driver-types";

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

const MOCK_NOTIFICATIONS = [
  {
    id: "n1",
    type: "hotspot" as const,
    title: "Av. Paulista esta bombando",
    body: "3 eventos acontecendo agora na regiao",
    icon: "📍",
    priority: "HIGH" as const,
    read: false,
    createdAt: "2 min",
  },
  {
    id: "n2",
    type: "event_nearby" as const,
    title: "Festival Gastronomico",
    body: "Evento a 1.2 km — alta demanda de corridas",
    icon: "📅",
    priority: "MEDIUM" as const,
    read: false,
    createdAt: "5 min",
  },
  {
    id: "n3",
    type: "earnings" as const,
    title: "Ganhos de hoje",
    body: "Voce ja ganhou R$ 156,80 hoje!",
    icon: "💰",
    priority: "LOW" as const,
    read: true,
    createdAt: "1h",
  },
];

function DriverPage() {
  const [isOnline, setIsOnline] = useState(false);
  const [showRideRequest, setShowRideRequest] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  return (
    <div className="flex-1 pb-20">
      <StatusBar />

      <DriverHeader
        driverName={currentUser.name}
        rating={4.9}
        isOnline={isOnline}
        onToggleOnline={() => {
          setIsOnline(!isOnline);
          if (!isOnline) setShowRideRequest(true);
        }}
      />

      <div className="px-4 space-y-4">
        <DriverPremiumDashboard
          earnings={MOCK_EARNINGS}
          isOnline={isOnline}
          onToggleOnline={() => {
            setIsOnline(!isOnline);
            if (!isOnline) setShowRideRequest(true);
          }}
          acceptanceRate={92}
          onlineMinutes={isOnline ? 45 : 0}
          cancelledTrips={3}
        />

        <SmartFeed />

        <DriverNotifications
          notifications={notifications}
          onMarkAsRead={(id) =>
            setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
          }
          onMarkAllRead={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
          onDismiss={(id) => setNotifications((prev) => prev.filter((n) => n.id !== id))}
        />

        <Link
          to="/driver/history"
          className="block rounded-2xl border border-border bg-surface p-4 shadow-soft text-center text-sm font-semibold text-primary"
        >
          Ver Historico de Corridas
        </Link>
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
