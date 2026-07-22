import { ActivityLevel, DriverEvent } from "./driver-types";

export function getNearbyEvents(events: DriverEvent[], radius: number): DriverEvent[] {
  return events.filter((event) => event.distance <= radius);
}

export function sortEventsByDistance(events: DriverEvent[]): DriverEvent[] {
  return [...events].sort((a, b) => a.distance - b.distance);
}

export function getEventsByLevel(events: DriverEvent[], level: ActivityLevel): DriverEvent[] {
  return events.filter((event) => event.level === level);
}

export function getHighestActivityEvent(events: DriverEvent[]): DriverEvent | null {
  if (events.length === 0) return null;

  const levelPriority: Record<ActivityLevel, number> = {
    MUITO_CHEIO: 5,
    BOMBANDO: 4,
    EM_ALTA: 3,
    MODERADO: 2,
    CALMO: 1,
  };

  return events.reduce((highest, current) =>
    levelPriority[current.level] > levelPriority[highest.level] ? current : highest,
  );
}
