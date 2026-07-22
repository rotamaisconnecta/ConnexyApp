import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { DriverCard } from "@/components/mobility/driver-card";
import { LoadingRide } from "@/components/mobility/loading-ride";
import { ChevronLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import type { DriverMatch } from "@/lib/mobility/ride-types";
import { VehicleCategory } from "@/lib/mobility/ride-types";
import { rankDrivers } from "@/lib/mobility/ride-matching";
import { getDriverMatchSummary } from "@/lib/mobility/ride-matching";

export const Route = createFileRoute("/_app/ride/matching")({
  head: () => ({ meta: [{ title: "Motoristas — RotaMais" }] }),
  component: MatchingPage,
});

const MOCK_DRIVERS: DriverMatch[] = [
  {
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
    etaMinutes: 3,
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
  },
  {
    id: "d2",
    name: "Mariana",
    photo: "https://i.pravatar.cc/200?img=44",
    rating: 4.9,
    totalRides: 890,
    vehicle: {
      name: "HB20",
      color: "Branco",
      plate: "DEF2E34",
      category: VehicleCategory.CONFORTO,
      seats: 4,
      year: 2023,
    },
    etaMinutes: 4,
    distanceMeters: 1100,
    priceEstimate: {
      category: VehicleCategory.CONFORTO,
      basePrice: 22,
      discount: 0,
      finalPrice: 24.9,
      currency: "BRL",
      label: "R$ 24,90",
      description: "Carro confortável",
      etaMinutes: 4,
      surgeMultiplier: 1,
    },
    isFavorite: false,
  },
  {
    id: "d3",
    name: "Rafael",
    photo: "https://i.pravatar.cc/200?img=33",
    rating: 4.7,
    totalRides: 560,
    vehicle: {
      name: "Polo",
      color: "Preto",
      plate: "GHI3F45",
      category: VehicleCategory.ECONOMICO,
      seats: 4,
      year: 2021,
    },
    etaMinutes: 5,
    distanceMeters: 1500,
    priceEstimate: {
      category: VehicleCategory.ECONOMICO,
      basePrice: 16,
      discount: 0,
      finalPrice: 20.1,
      currency: "BRL",
      label: "R$ 20,10",
      description: "Até 4 passageiros",
      etaMinutes: 5,
      surgeMultiplier: 1,
    },
    isFavorite: false,
  },
  {
    id: "d4",
    name: "Ana",
    photo: "https://i.pravatar.cc/200?img=23",
    rating: 4.8,
    totalRides: 320,
    vehicle: {
      name: "Honda CG",
      color: "Vermelha",
      plate: "JKL4G56",
      category: VehicleCategory.MOTO,
      seats: 1,
      year: 2023,
    },
    etaMinutes: 2,
    distanceMeters: 400,
    priceEstimate: {
      category: VehicleCategory.MOTO,
      basePrice: 10,
      discount: 0,
      finalPrice: 12.5,
      currency: "BRL",
      label: "R$ 12,50",
      description: "1 passageiro · mais rápido",
      etaMinutes: 2,
      surgeMultiplier: 1,
    },
    isFavorite: false,
  },
];

function MatchingPage() {
  const nav = useNavigate();
  const [favorites, setFavorites] = useState<Set<string>>(
    new Set(MOCK_DRIVERS.filter((d) => d.isFavorite).map((d) => d.id)),
  );

  const driversWithFavs = useMemo(
    () => MOCK_DRIVERS.map((d) => ({ ...d, isFavorite: favorites.has(d.id) })),
    [favorites],
  );

  const ranked = useMemo(() => rankDrivers(driversWithFavs, { sortBy: "eta" }), [driversWithFavs]);
  const summary = useMemo(() => getDriverMatchSummary(ranked), [ranked]);

  function handleToggleFavorite(id: string) {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex-1 flex flex-col">
      <StatusBar />
      <div className="flex items-center gap-3 px-5 pt-1 pb-3">
        <Link to="/ride" className="h-9 w-9 grid place-items-center rounded-full bg-secondary">
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-display font-bold text-base">Motoristas disponíveis</h1>
          <p className="text-[11px] text-muted-foreground">
            {summary.total} disponíveis · destino Shopping Ibirapuera
          </p>
        </div>
      </div>

      <div className="flex-1 px-5 pb-4 overflow-y-auto no-scrollbar">
        <div className="flex gap-2 mb-3">
          <button className="rounded-full bg-primary text-primary-foreground text-xs font-semibold px-3 py-1.5">
            Mais rápido
          </button>
          <button className="rounded-full bg-secondary text-muted-foreground text-xs font-medium px-3 py-1.5">
            Mais barato
          </button>
          <button className="rounded-full bg-secondary text-muted-foreground text-xs font-medium px-3 py-1.5">
            Melhor avaliado
          </button>
        </div>

        <div className="space-y-2">
          {ranked.map((driver) => (
            <motion.div
              key={driver.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <DriverCard
                driver={driver}
                onSelect={() => nav({ to: "/ride/active" })}
                onToggleFavorite={handleToggleFavorite}
              />
            </motion.div>
          ))}
        </div>

        <div className="mt-4 rounded-2xl bg-accent/50 border border-primary/20 p-4 flex items-center justify-between">
          <div>
            <div className="font-semibold text-sm">Viagem compartilhada</div>
            <div className="text-[11px] text-muted-foreground">
              Até 20% mais barato · combine com outros passageiros
            </div>
          </div>
          <button className="h-6 w-11 rounded-full bg-border relative transition">
            <span className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition" />
          </button>
        </div>
      </div>

      <div className="px-5 pb-4">
        <button
          onClick={() => nav({ to: "/ride/active" })}
          className="w-full rounded-full bg-gradient-brand py-4 text-white font-semibold shadow-elegant"
        >
          Confirmar corrida
        </button>
      </div>
    </div>
  );
}
