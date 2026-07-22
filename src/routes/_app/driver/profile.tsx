import { createFileRoute, Link } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { DriverVehicle } from "@/components/driver/driver-vehicle";
import { DriverPreferences } from "@/components/driver/driver-preferences";
import { ChevronLeft } from "lucide-react";
import { useState } from "react";
import type { VehicleInfo } from "@/lib/driver/driver-types";

export const Route = createFileRoute("/_app/driver/profile")({
  head: () => ({ meta: [{ title: "Perfil Motorista — Connexy" }] }),
  component: DriverProfilePage,
});

const MOCK_VEHICLE: VehicleInfo = {
  brand: "Fiat",
  model: "Argo",
  color: "Branco",
  plate: "ABC-1D23",
  year: "2023",
  passengers: 4,
  acceptsPet: true,
  acceptsBaggage: false,
  hasAirConditioning: true,
};

function DriverProfilePage() {
  const [prefs, setPrefs] = useState({
    acceptsPet: true,
    acceptsBaggage: false,
    hasAirConditioning: true,
    acceptsShared: false,
  });

  function handleToggle(key: string, value: boolean) {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="flex-1 pb-20">
      <StatusBar />
      <header className="px-5 pt-1 pb-3 flex items-center gap-3">
        <Link to="/driver" className="h-9 w-9 grid place-items-center rounded-full bg-secondary">
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-display font-bold text-lg">Perfil Motorista</h1>
      </header>
      <div className="px-4 space-y-4">
        <DriverVehicle vehicle={MOCK_VEHICLE} />
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-1 mb-2">
            Preferências
          </div>
          <DriverPreferences
            acceptsPet={prefs.acceptsPet}
            acceptsBaggage={prefs.acceptsBaggage}
            hasAirConditioning={prefs.hasAirConditioning}
            acceptsShared={prefs.acceptsShared}
            onToggle={handleToggle}
          />
        </div>
      </div>
    </div>
  );
}
