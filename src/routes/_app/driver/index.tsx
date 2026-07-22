import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { DriverHeader } from "@/components/driver/driver-header";
import { DriverDashboard } from "@/components/driver/driver-dashboard";
import { DriverMap } from "@/components/driver/driver-map";
import { DriverEventsPanel } from "@/components/driver/driver-events-panel";
import { RideRequestCard } from "@/components/driver/ride-request-card";
import { DriverEmpty } from "@/components/driver/driver-empty";
import { CityHotspots } from "@/components/driver/city-hotspots";
import { currentUser } from "@/lib/mock-data";
import type {
  DriverEarnings,
  DriverEvent,
  CityHotspot,
  RideRequest,
  ActivityLevel,
} from "@/lib/driver/driver-types";
import { motion } from "framer-motion";

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

const MOCK_HOTSPOTS: CityHotspot[] = [
  {
    id: "h1",
    name: "Av. Paulista",
    lat: -23.5613,
    lng: -46.656,
    level: "BOMBANDO",
    category: "Região",
    eventCount: 3,
  },
  {
    id: "h2",
    name: "Centro",
    lat: -23.5505,
    lng: -46.6333,
    level: "EM_ALTA",
    category: "Região",
    eventCount: 2,
  },
  {
    id: "h3",
    name: "Pinheiros",
    lat: -23.5671,
    lng: -46.6918,
    level: "MODERADO",
    category: "Região",
    eventCount: 1,
  },
  {
    id: "h4",
    name: "Vila Madalena",
    lat: -23.5535,
    lng: -46.6912,
    level: "CALMO",
    category: "Região",
    eventCount: 0,
  },
];

const MOCK_EVENTS: DriverEvent[] = [
  {
    id: "e1",
    name: "Festival Gastronômico",
    category: "Gastronomia",
    distance: 1.2,
    level: "BOMBANDO",
    status: "🔥 Bombando",
  },
  {
    id: "e2",
    name: "Show MPB",
    category: "Música",
    distance: 3.5,
    level: "EM_ALTA",
    status: "🟡 Em Alta",
  },
  {
    id: "e3",
    name: "Feira de Artes",
    category: "Arte",
    distance: 5.1,
    level: "MODERADO",
    status: "🔵 Moderado",
  },
];

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
  const [isOnline, setIsOnline] = useState(false);
  const [showRideRequest, setShowRideRequest] = useState(false);

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
        <DriverDashboard
          earnings={MOCK_EARNINGS}
          isOnline={isOnline}
          onToggleOnline={() => setIsOnline(!isOnline)}
        />

        <DriverMap hotspots={MOCK_HOTSPOTS} driverLat={-23.5613} driverLng={-46.656} />

        {showRideRequest && (
          <RideRequestCard
            request={MOCK_RIDE_REQUEST}
            onAccept={() => setShowRideRequest(false)}
            onDecline={() => setShowRideRequest(false)}
          />
        )}

        {!showRideRequest && isOnline && (
          <DriverEmpty message="Aguardando solicitações..." icon="🚖" />
        )}

        <DriverEventsPanel events={MOCK_EVENTS} onNavigate={() => {}} />

        <CityHotspots hotspots={MOCK_HOTSPOTS} />

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <Link
            to="/driver/history"
            className="block rounded-2xl border border-border bg-surface p-4 shadow-soft text-center text-sm font-semibold text-primary"
          >
            Ver Histórico de Corridas
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
