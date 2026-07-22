import { createFileRoute, Link } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { DriverHistory } from "@/components/driver/driver-history";
import { ChevronLeft } from "lucide-react";
import type { RideRequest } from "@/lib/driver/driver-types";

export const Route = createFileRoute("/_app/driver/history")({
  head: () => ({ meta: [{ title: "Histórico — Motorista" }] }),
  component: DriverHistoryPage,
});

const MOCK_TRIPS: RideRequest[] = [
  {
    id: "t1",
    passengerId: "p1",
    passengerName: "Ana Silva",
    passengerPhoto: "https://i.pravatar.cc/150?u=a1",
    passengerRating: 4.8,
    origin: "Paulista",
    originLat: 0,
    originLng: 0,
    destination: "Moema",
    destinationLat: 0,
    destinationLng: 0,
    distance: 3200,
    duration: 14,
    price: 18.9,
    paymentMethod: "PIX" as const,
    status: "COMPLETED" as const,
    createdAt: new Date(Date.now() - 3600000),
  },
  {
    id: "t2",
    passengerId: "p2",
    passengerName: "Carlos Souza",
    passengerPhoto: "https://i.pravatar.cc/150?u=a2",
    passengerRating: 4.5,
    origin: "Pinheiros",
    originLat: 0,
    originLng: 0,
    destination: "Liberdade",
    destinationLat: 0,
    destinationLng: 0,
    distance: 5100,
    duration: 22,
    price: 28.5,
    paymentMethod: "CASH" as const,
    status: "COMPLETED" as const,
    createdAt: new Date(Date.now() - 7200000),
  },
  {
    id: "t3",
    passengerId: "p3",
    passengerName: "Maria Santos",
    passengerPhoto: "https://i.pravatar.cc/150?u=a3",
    passengerRating: 4.9,
    origin: "Vila Mariana",
    originLat: 0,
    originLng: 0,
    destination: "Consolação",
    destinationLat: 0,
    destinationLng: 0,
    distance: 2100,
    duration: 10,
    price: 14.5,
    paymentMethod: "PIX" as const,
    status: "COMPLETED" as const,
    createdAt: new Date(Date.now() - 10800000),
  },
];

function DriverHistoryPage() {
  return (
    <div className="flex-1 pb-20">
      <StatusBar />
      <header className="px-5 pt-1 pb-3 flex items-center gap-3">
        <Link to="/driver" className="h-9 w-9 grid place-items-center rounded-full bg-secondary">
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-display font-bold text-lg">Histórico</h1>
      </header>
      <div className="px-4">
        <DriverHistory trips={MOCK_TRIPS} totalEarnings={61.9} />
      </div>
    </div>
  );
}
