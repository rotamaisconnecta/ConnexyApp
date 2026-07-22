import { createFileRoute } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { BottomNav } from "@/components/bottom-nav";
import { RideHistoryList } from "@/components/mobility/ride-history-list";
import { ChevronLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { RideHistoryItem } from "@/lib/mobility/ride-types";
import { VehicleCategory } from "@/lib/mobility/ride-types";

export const Route = createFileRoute("/_app/ride/history")({
  head: () => ({ meta: [{ title: "Histórico — RotaMais" }] }),
  component: RideHistoryPage,
});

const MOCK_HISTORY: RideHistoryItem[] = [
  {
    id: "h1",
    driverName: "Carlos",
    driverPhoto: "https://i.pravatar.cc/200?img=68",
    vehicleName: "Onix Prata",
    origin: { lat: -23.55, lng: -46.64, label: "Rua Augusta, 1200" },
    destination: { lat: -23.58, lng: -46.65, label: "Shopping Ibirapuera" },
    distanceMeters: 3500,
    durationMinutes: 12,
    price: 18.5,
    currency: "BRL",
    category: VehicleCategory.ECONOMICO,
    rating: 5,
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
  {
    id: "h2",
    driverName: "Mariana",
    driverPhoto: "https://i.pravatar.cc/200?img=44",
    vehicleName: "HB20 Branco",
    origin: { lat: -23.56, lng: -46.65, label: "Av. Paulista, 1000" },
    destination: { lat: -23.54, lng: -46.62, label: "Rua Oscar Freire, 500" },
    distanceMeters: 2800,
    durationMinutes: 10,
    price: 24.9,
    currency: "BRL",
    category: VehicleCategory.CONFORTO,
    rating: 4,
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
  },
  {
    id: "h3",
    driverName: "Rafael",
    driverPhoto: "https://i.pravatar.cc/200?img=33",
    vehicleName: "Polo Preto",
    origin: { lat: -23.54, lng: -46.62, label: "Rua Haddock Lobo, 800" },
    destination: { lat: -23.58, lng: -46.65, label: "Shopping Center 3" },
    distanceMeters: 4200,
    durationMinutes: 15,
    price: 20.1,
    currency: "BRL",
    category: VehicleCategory.ECONOMICO,
    rating: null,
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
  },
  {
    id: "h4",
    driverName: "Ana",
    driverPhoto: "https://i.pravatar.cc/200?img=23",
    vehicleName: "Honda CG Vermelha",
    origin: { lat: -23.55, lng: -46.64, label: "Rua dos Pinheiros" },
    destination: { lat: -23.56, lng: -46.65, label: "Av. Brigadeiro Faria Lima" },
    distanceMeters: 1500,
    durationMinutes: 5,
    price: 12.5,
    currency: "BRL",
    category: VehicleCategory.MOTO,
    rating: 5,
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
  },
];

function RideHistoryPage() {
  return (
    <div className="flex-1 flex flex-col">
      <StatusBar />
      <div className="flex items-center gap-3 px-5 pt-1 pb-3">
        <Link to="/home" className="h-9 w-9 grid place-items-center rounded-full bg-secondary">
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-display font-bold text-base">Histórico de viagens</h1>
          <p className="text-[11px] text-muted-foreground">{MOCK_HISTORY.length} viagens</p>
        </div>
      </div>

      <div className="flex-1 px-5 pb-4 overflow-y-auto no-scrollbar">
        <RideHistoryList history={MOCK_HISTORY} />
      </div>

      <BottomNav />
    </div>
  );
}
