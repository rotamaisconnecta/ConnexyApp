import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { DriverHeader } from "@/components/driver/driver-header";
import { DriverPremiumDashboard } from "@/components/driver/driver-premium-dashboard";
import { DriverSmartMap } from "@/components/driver/driver-smart-map";
import { DriverEventMarker } from "@/components/driver/driver-event-marker";
import { DriverRideBottomSheet } from "@/components/driver/driver-ride-bottom-sheet";
import { DriverEmpty } from "@/components/driver/driver-empty";
import { CityHotspots } from "@/components/driver/city-hotspots";
import { DriverNotifications } from "@/components/driver/driver-notifications";
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

const MOCK_NOTIFICATIONS = [
  {
    id: "n1",
    type: "hotspot" as const,
    title: "Av. Paulista está bombando",
    body: "3 eventos acontecendo agora na região",
    icon: "📍",
    priority: "HIGH" as const,
    read: false,
    createdAt: "2 min",
  },
  {
    id: "n2",
    type: "event_nearby" as const,
    title: "Festival Gastronômico",
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
    body: "Você já ganhou R$ 156,80 hoje!",
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

        <DriverSmartMap hotspots={MOCK_HOTSPOTS} driverLat={-23.5613} driverLng={-46.656} />

        {!showRideRequest && isOnline && (
          <DriverEmpty message="Aguardando solicitações..." icon="🚖" />
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Eventos Próximos
            </h3>
            <span className="text-[10px] text-muted-foreground">{MOCK_EVENTS.length} eventos</span>
          </div>
          {MOCK_EVENTS.map((event, i) => (
            <DriverEventMarker key={event.id} event={event} index={i} />
          ))}
        </div>

        <CityHotspots hotspots={MOCK_HOTSPOTS} />

        <DriverNotifications
          notifications={notifications}
          onMarkAsRead={(id) =>
            setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
          }
          onMarkAllRead={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
          onDismiss={(id) => setNotifications((prev) => prev.filter((n) => n.id !== id))}
        />

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <Link
            to="/driver/history"
            className="block rounded-2xl border border-border bg-surface p-4 shadow-soft text-center text-sm font-semibold text-primary"
          >
            Ver Histórico de Corridas
          </Link>
        </motion.div>
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
