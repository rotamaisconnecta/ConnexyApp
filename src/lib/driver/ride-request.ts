import { RideRequest, RideRequestStatus } from "./driver-types";
import { formatCurrency, formatDistance, formatDuration } from "./driver-utils";

export function calculateRidePrice(distance: number, duration: number): number {
  const baseFare = 5.0;
  const pricePerKm = 2.5;
  const pricePerMinute = 0.4;
  const distanceKm = distance / 1000;
  const price = baseFare + distanceKm * pricePerKm + duration * pricePerMinute;
  return Math.round(price * 100) / 100;
}

export function getEstimatedArrival(distance: number): number {
  const avgSpeedKmH = 30;
  const distanceKm = distance / 1000;
  const hours = distanceKm / avgSpeedKmH;
  return Math.max(1, Math.round(hours * 60));
}

export function formatRideRequest(req: RideRequest): {
  price: string;
  distance: string;
  duration: string;
} {
  return {
    price: formatCurrency(req.price),
    distance: formatDistance(req.distance),
    duration: formatDuration(req.duration),
  };
}

export function canCancelRide(status: RideRequestStatus): boolean {
  return status === RideRequestStatus.PENDING || status === RideRequestStatus.ACCEPTED;
}

export function getRideStatusLabel(status: RideRequestStatus): string {
  const labels: Record<RideRequestStatus, string> = {
    PENDING: "Aguardando",
    ACCEPTED: "Aceita",
    ARRIVED: "Chegou",
    IN_PROGRESS: "Em andamento",
    COMPLETED: "Concluída",
    CANCELLED: "Cancelada",
  };
  return labels[status];
}
