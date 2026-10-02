/* =========================================================
   ride-choose-options.ts — Filtra e ordena as opções já
   existentes da frota demo (connexy / conforto / moto).
   Não cria motoristas nem tarifas paralelas.
========================================================= */

import { buildDemoFleet } from "@/lib/mobility/dispatch/demo-fleet";
import type { DemoDriver } from "@/lib/mobility/dispatch/dispatch-types";
import type { RideCategory } from "@/lib/mobility/demo-fare";
import { estimateRouteDistance } from "@/lib/mobility/route-utils";
import type { GeoLocation } from "@/lib/mobility/ride-types";

export type RideVehicleType = "carro" | "moto";
export type RideChooseSort = "recomendado" | "rapido" | "economico" | "premium";

export const RIDE_VEHICLE_TYPES: RideVehicleType[] = ["carro", "moto"];

export type RideChooseOption = {
  id: string;
  driver: DemoDriver;
  category: RideCategory;
  fare: number;
  etaMinutes: number;
  distanceMeters: number;
};

const CAR_CATEGORIES: RideCategory[] = ["connexy", "conforto"];

export function vehicleTypeFromCategory(category: RideCategory): RideVehicleType {
  return category === "moto" ? "moto" : "carro";
}

export function categoriesForVehicleTypes(types: RideVehicleType[]): RideCategory[] {
  const allowed: RideCategory[] = [];
  if (types.includes("carro")) allowed.push(...CAR_CATEGORIES);
  if (types.includes("moto")) allowed.push("moto");
  return allowed;
}

export function toggleRideVehicleType(
  selected: RideVehicleType[],
  type: RideVehicleType,
): RideVehicleType[] {
  if (selected.includes(type)) return selected.filter((item) => item !== type);
  return RIDE_VEHICLE_TYPES.filter((item) => selected.includes(item) || item === type);
}

export function toggleRideChooseOption(selected: string[], optionId: string): string[] {
  if (selected.includes(optionId)) return selected.filter((id) => id !== optionId);
  return [...selected, optionId];
}

export function pruneSelectedRideOptionIds(
  options: RideChooseOption[],
  selectedIds: string[],
): string[] {
  const visible = new Set(options.map((option) => option.id));
  return selectedIds.filter((id) => visible.has(id));
}

export function visibleSelectedRideOptions(
  options: RideChooseOption[],
  selectedIds: string[],
): RideChooseOption[] {
  return options.filter((option) => selectedIds.includes(option.id));
}

export function categoriesFromRideOptions(options: RideChooseOption[]): RideCategory[] {
  const seen = new Set<RideCategory>();
  const categories: RideCategory[] = [];
  for (const option of options) {
    if (seen.has(option.category)) continue;
    seen.add(option.category);
    categories.push(option.category);
  }
  return categories;
}

export function canConfirmRideChoose(
  types: RideVehicleType[],
  selected: RideChooseOption[],
): boolean {
  return types.length > 0 && selected.length > 0;
}

export function pickCategoryForOptions(
  current: RideCategory,
  options: RideChooseOption[],
): RideCategory | null {
  if (options.some((option) => option.category === current)) return current;
  return options[0]?.category ?? null;
}

export function rideChooseCategoryLabel(category: RideCategory): string {
  if (category === "conforto") return "Comfort";
  if (category === "moto") return "Moto";
  return "Connexy";
}

export function rideChooseOptionTag(
  option: RideChooseOption,
  all: RideChooseOption[],
): string {
  if (option.category === "conforto") return "Comfort";
  if (option.category === "moto") return "Moto";
  const cheapest = Math.min(...all.map((item) => item.fare));
  if (all.length > 1 && option.fare === cheapest) return "Mais econômico";
  return "Connexy";
}

export function listRideChooseOptions({
  origin,
  types,
  sort,
  fares,
  etaMap,
}: {
  origin: GeoLocation | null;
  types: RideVehicleType[];
  sort: RideChooseSort;
  fares: Record<RideCategory, number>;
  etaMap: Record<RideCategory, number>;
}): RideChooseOption[] {
  const allowed = new Set(categoriesForVehicleTypes(types));
  const options = buildDemoFleet()
    .filter((driver) => driver.status === "available" && allowed.has(driver.category))
    .map((driver) => ({
      id: driver.id,
      driver,
      category: driver.category,
      fare: fares[driver.category],
      etaMinutes: etaMap[driver.category],
      distanceMeters: origin
        ? estimateRouteDistance(origin, {
            lat: driver.lat,
            lng: driver.lng,
            label: driver.name,
          })
        : 0,
    }));

  if (sort === "premium") {
    return options.filter((option) => option.category === "conforto");
  }
  if (sort === "rapido") {
    return [...options].sort(
      (a, b) => a.etaMinutes - b.etaMinutes || a.distanceMeters - b.distanceMeters,
    );
  }
  if (sort === "economico") {
    return [...options].sort((a, b) => a.fare - b.fare);
  }
  return options;
}
