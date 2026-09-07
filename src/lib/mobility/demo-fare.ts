/* =========================================================
   demo-fare.ts — Tarifa simulada e consistente para o modo
   demo (distância + paradas + categoria). Coerente durante
   os testes, sem qualquer integração real.
   Pure TypeScript. No React.
========================================================= */

export type RideCategory = "connexy" | "conforto" | "moto";

const FARE: Record<
  RideCategory,
  { label: string; perKm: number; perMin: number; perStop: number; min: number }
> = {
  connexy: { label: "Connexy", perKm: 1.4, perMin: 0.25, perStop: 1.5, min: 8 },
  conforto: { label: "Connexy Comfort", perKm: 1.9, perMin: 0.35, perStop: 2, min: 12 },
  moto: { label: "Moto", perKm: 1.0, perMin: 0.18, perStop: 1, min: 6 },
};

export function estimateDemoFare(
  category: RideCategory,
  distanceMeters: number,
  durationMinutes: number,
  stopsCount: number,
): number {
  const fare = FARE[category];
  const km = distanceMeters / 1000;
  return Math.max(
    fare.min,
    fare.perKm * km + fare.perMin * durationMinutes + fare.perStop * stopsCount,
  );
}

export function demoCategoryLabel(category: RideCategory): string {
  return FARE[category].label;
}

export const RIDE_CATEGORIES: RideCategory[] = ["connexy", "conforto", "moto"];