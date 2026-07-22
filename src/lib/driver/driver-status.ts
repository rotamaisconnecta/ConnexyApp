import { DriverStatus } from "./driver-types";

export function getNextStatus(current: DriverStatus): DriverStatus | null {
  const transitions: Record<DriverStatus, DriverStatus | null> = {
    OFFLINE: DriverStatus.AVAILABLE,
    AVAILABLE: DriverStatus.EN_ROUTE,
    EN_ROUTE: DriverStatus.ARRIVING,
    ARRIVING: DriverStatus.IN_RIDE,
    IN_RIDE: DriverStatus.COMPLETED,
    COMPLETED: DriverStatus.AVAILABLE,
  };
  return transitions[current];
}

export function getStatusTransition(from: DriverStatus, to: DriverStatus): string {
  const transitions: Record<string, string> = {
    "OFFLINE->AVAILABLE": "Driver came online and is ready for rides",
    "AVAILABLE->EN_ROUTE": "Accepted a ride, heading to pickup",
    "EN_ROUTE->ARRIVING": "Near the pickup location",
    "ARRIVING->IN_RIDE": "Picked up passenger, ride in progress",
    "IN_RIDE->COMPLETED": "Ride finished, passenger dropped off",
    "COMPLETED->AVAILABLE": "Ready for new rides",
  };
  return transitions[`${from}->${to}`] ?? "Invalid transition";
}

export function isRideActive(status: DriverStatus): boolean {
  return (
    status === DriverStatus.EN_ROUTE ||
    status === DriverStatus.ARRIVING ||
    status === DriverStatus.IN_RIDE
  );
}

export function getStatusIcon(status: DriverStatus): string {
  const icons: Record<DriverStatus, string> = {
    OFFLINE: "PowerOff",
    AVAILABLE: "CheckCircle",
    EN_ROUTE: "Navigation",
    ARRIVING: "MapPin",
    IN_RIDE: "Car",
    COMPLETED: "Flag",
  };
  return icons[status];
}
