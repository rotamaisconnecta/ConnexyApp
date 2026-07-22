export const DriverStatus = {
  OFFLINE: "OFFLINE",
  AVAILABLE: "AVAILABLE",
  EN_ROUTE: "EN_ROUTE",
  ARRIVING: "ARRIVING",
  IN_RIDE: "IN_RIDE",
  COMPLETED: "COMPLETED",
} as const;

export type DriverStatus = (typeof DriverStatus)[keyof typeof DriverStatus];

export const RideRequestStatus = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  ARRIVED: "ARRIVED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export type RideRequestStatus = (typeof RideRequestStatus)[keyof typeof RideRequestStatus];

export const PaymentMethod = {
  CASH: "CASH",
  PIX: "PIX",
  CREDIT_CARD: "CREDIT_CARD",
  DEBIT_CARD: "DEBIT_CARD",
} as const;

export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const ActivityLevel = {
  CALMO: "CALMO",
  MODERADO: "MODERADO",
  EM_ALTA: "EM_ALTA",
  BOMBANDO: "BOMBANDO",
  MUITO_CHEIO: "MUITO_CHEIO",
} as const;

export type ActivityLevel = (typeof ActivityLevel)[keyof typeof ActivityLevel];

export interface VehicleInfo {
  brand: string;
  model: string;
  color: string;
  plate: string;
  year: string;
  passengers: number;
  acceptsPet: boolean;
  acceptsBaggage: boolean;
  hasAirConditioning: boolean;
}

export interface DriverProfile {
  id: string;
  name: string;
  photo: string;
  rating: number;
  totalTrips: number;
  vehicle: VehicleInfo;
  cnh: string;
  cnhCategory: string;
  isOnline: boolean;
  status: DriverStatus;
  serviceArea: string;
  schedules: string;
  pixKey: string;
  bankAccount: string;
}

export interface RideRequest {
  id: string;
  passengerId: string;
  passengerName: string;
  passengerPhoto: string;
  passengerRating: number;
  origin: string;
  originLat: number;
  originLng: number;
  destination: string;
  destinationLat: number;
  destinationLng: number;
  distance: number;
  duration: number;
  price: number;
  paymentMethod: PaymentMethod;
  status: RideRequestStatus;
  createdAt: Date;
}

export interface DriverEarnings {
  today: number;
  week: number;
  month: number;
  totalTrips: number;
  averagePerTrip: number;
  commission: number;
}

export interface DriverFinanceEntry {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type: "credit" | "debit";
}

export interface CityHotspot {
  id: string;
  name: string;
  lat: number;
  lng: number;
  level: ActivityLevel;
  category: string;
  eventCount: number;
}

export interface DriverEvent {
  id: string;
  name: string;
  category: string;
  distance: number;
  level: ActivityLevel;
  status: string;
}
