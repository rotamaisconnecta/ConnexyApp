import { CheckinStatus } from "./checkin-types";

export function canCheckIn(distanceMeters: number, radius: number): boolean {
  return distanceMeters <= radius;
}

export function getCheckinLabel(status: CheckinStatus): string {
  const labels: Record<CheckinStatus, string> = {
    [CheckinStatus.PENDING]: "Pendente",
    [CheckinStatus.CHECKED_IN]: "Presente",
    [CheckinStatus.CHECKED_OUT]: "Saiu",
    [CheckinStatus.INTERESTED]: "Interessado",
    [CheckinStatus.FAVORITE]: "Favorito",
    [CheckinStatus.FOLLOWING]: "Seguindo",
  };
  return labels[status];
}

export function getCheckinColor(status: CheckinStatus): string {
  const colors: Record<CheckinStatus, string> = {
    [CheckinStatus.PENDING]: "text-gray-500",
    [CheckinStatus.CHECKED_IN]: "text-green-500",
    [CheckinStatus.CHECKED_OUT]: "text-red-500",
    [CheckinStatus.INTERESTED]: "text-yellow-500",
    [CheckinStatus.FAVORITE]: "text-pink-500",
    [CheckinStatus.FOLLOWING]: "text-blue-500",
  };
  return colors[status];
}

export function getCheckinEmoji(status: CheckinStatus): string {
  const emojis: Record<CheckinStatus, string> = {
    [CheckinStatus.PENDING]: "⏳",
    [CheckinStatus.CHECKED_IN]: "✅",
    [CheckinStatus.CHECKED_OUT]: "🚪",
    [CheckinStatus.INTERESTED]: "🤔",
    [CheckinStatus.FAVORITE]: "❤️",
    [CheckinStatus.FOLLOWING]: "👥",
  };
  return emojis[status];
}

export function formatCheckinTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function isEventActive(start: Date, end: Date): boolean {
  const now = new Date();
  return now >= start && now <= end;
}

export function getEventProgress(start: Date, end: Date): number {
  const now = new Date();
  if (now < start) return 0;
  if (now > end) return 100;
  const total = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  return Math.round((elapsed / total) * 100);
}
