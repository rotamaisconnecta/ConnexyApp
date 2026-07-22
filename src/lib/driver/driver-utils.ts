import { DriverStatus, RideRequest } from "./driver-types";

export function getStatusLabel(status: DriverStatus): string {
  const labels: Record<DriverStatus, string> = {
    OFFLINE: "Offline",
    AVAILABLE: "Disponível",
    EN_ROUTE: "A caminho",
    ARRIVING: "Chegando",
    IN_RIDE: "Em corrida",
    COMPLETED: "Corrida concluída",
  };
  return labels[status];
}

export function getStatusColor(status: DriverStatus): string {
  const colors: Record<DriverStatus, string> = {
    OFFLINE: "text-gray-500",
    AVAILABLE: "text-green-500",
    EN_ROUTE: "text-blue-500",
    ARRIVING: "text-yellow-500",
    IN_RIDE: "text-purple-500",
    COMPLETED: "text-emerald-500",
  };
  return colors[status];
}

export function getStatusEmoji(status: DriverStatus): string {
  const emojis: Record<DriverStatus, string> = {
    OFFLINE: "⚫",
    AVAILABLE: "🟢",
    EN_ROUTE: "🔵",
    ARRIVING: "🟡",
    IN_RIDE: "🟣",
    COMPLETED: "✅",
  };
  return emojis[status];
}

export function canAcceptRide(status: DriverStatus): boolean {
  return status === DriverStatus.AVAILABLE;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining > 0 ? `${hours}h ${remaining}min` : `${hours}h`;
}

export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    const km = meters / 1000;
    return `${km.toFixed(1).replace(".", ",")} km`;
  }
  return `${Math.round(meters)} m`;
}

export function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}
