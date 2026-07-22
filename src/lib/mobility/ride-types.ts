/* =========================================================
   ride-types.ts — RotaMais mobility module types
   Pure TypeScript. No React. No side effects.
========================================================= */

/* ─── Enums ──────────────────────────────────────────────── */

export const VehicleCategory = {
  ECONOMICO: "ECONOMICO",
  CONFORTO: "CONFORTO",
  PREMIUM: "PREMIUM",
  MOTO: "MOTO",
  COMPARTILHADO: "COMPARTILHADO",
} as const;

export type VehicleCategoryValue = (typeof VehicleCategory)[keyof typeof VehicleCategory];

export const RIDE_STATUS = {
  IDLE: "IDLE",
  REQUESTING: "REQUESTING",
  MATCHING: "MATCHING",
  DRIVER_EN_ROUTE: "DRIVER_EN_ROUTE",
  ARRIVED: "ARRIVED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export type RideStatusValue = (typeof RIDE_STATUS)[keyof typeof RIDE_STATUS];

export const PaymentMethod = {
  CREDIT: "CREDIT",
  DEBIT: "DEBIT",
  CASH: "CASH",
  PIX: "PIX",
  WALLET: "WALLET",
} as const;

export type PaymentMethodValue = (typeof PaymentMethod)[keyof typeof PaymentMethod];

/* ─── Location ───────────────────────────────────────────── */

export interface GeoLocation {
  lat: number;
  lng: number;
  label: string;
  address?: string;
}

/* ─── Route Point ────────────────────────────────────────── */

export interface RoutePoint {
  id: string;
  location: GeoLocation;
  type: "origin" | "destination" | "stop";
}

/* ─── Ride Request ───────────────────────────────────────── */

export interface RideRequest {
  id: string;
  origin: GeoLocation;
  destination: GeoLocation;
  stops: GeoLocation[];
  category: VehicleCategoryValue;
  distanceMeters: number;
  durationMinutes: number;
  scheduledAt: Date | null;
  couponCode: string | null;
  paymentMethod: PaymentMethodValue;
  createdAt: Date;
}

/* ─── Price Estimate ─────────────────────────────────────── */

export interface PriceEstimate {
  category: VehicleCategoryValue;
  basePrice: number;
  discount: number;
  finalPrice: number;
  currency: string;
  label: string;
  description: string;
  etaMinutes: number;
  surgeMultiplier: number;
}

/* ─── Driver Match ───────────────────────────────────────── */

export interface DriverMatch {
  id: string;
  name: string;
  photo: string;
  rating: number;
  totalRides: number;
  vehicle: VehicleInfo;
  etaMinutes: number;
  distanceMeters: number;
  priceEstimate: PriceEstimate;
  isFavorite: boolean;
}

/* ─── Vehicle ────────────────────────────────────────────── */

export interface VehicleInfo {
  name: string;
  color: string;
  plate: string;
  category: VehicleCategoryValue;
  seats: number;
  year: number;
}

/* ─── Trip ───────────────────────────────────────────────── */

export interface Trip {
  id: string;
  driver: DriverMatch;
  request: RideRequest;
  status: RideStatusValue;
  startedAt: Date | null;
  arrivedAt: Date | null;
  completedAt: Date | null;
  currentLocation: GeoLocation | null;
  progressPercent: number;
  estimatedArrival: string;
  sharedWith: string[];
  rating: TripRating | null;
  receipt: TripReceipt | null;
}

/* ─── Trip Rating ────────────────────────────────────────── */

export interface TripRating {
  score: number;
  comment: string;
  tags: string[];
  createdAt: Date;
}

/* ─── Trip Receipt ───────────────────────────────────────── */

export interface TripReceipt {
  tripId: string;
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  discount: number;
  total: number;
  currency: string;
  paymentMethod: PaymentMethodValue;
  paidAt: Date;
}

/* ─── Ride History ───────────────────────────────────────── */

export interface RideHistoryItem {
  id: string;
  driverName: string;
  driverPhoto: string;
  vehicleName: string;
  origin: GeoLocation;
  destination: GeoLocation;
  distanceMeters: number;
  durationMinutes: number;
  price: number;
  currency: string;
  category: VehicleCategoryValue;
  rating: number | null;
  completedAt: Date;
}

/* ─── Favorite Destination ───────────────────────────────── */

export interface FavoriteDestination {
  id: string;
  name: string;
  icon: string;
  location: GeoLocation;
}

/* ─── Coupon ─────────────────────────────────────────────── */

export interface Coupon {
  id: string;
  code: string;
  label: string;
  description: string;
  discountPercent: number;
  maxDiscount: number;
  validUntil: Date;
  active: boolean;
}

/* ─── Category Options ───────────────────────────────────── */

export const VEHICLE_CATEGORY_OPTIONS: {
  value: VehicleCategoryValue;
  label: string;
  description: string;
  icon: string;
  seats: number;
}[] = [
  {
    value: VehicleCategory.ECONOMICO,
    label: "Econômico",
    description: "Viagem econômica",
    icon: "🚗",
    seats: 4,
  },
  {
    value: VehicleCategory.CONFORTO,
    label: "Conforto",
    description: "Mais conforto",
    icon: "🚙",
    seats: 4,
  },
  {
    value: VehicleCategory.PREMIUM,
    label: "Premium",
    description: "Experiência premium",
    icon: "🏎️",
    seats: 4,
  },
  {
    value: VehicleCategory.MOTO,
    label: "Moto",
    description: "Rápido e direto",
    icon: "🏍️",
    seats: 1,
  },
  {
    value: VehicleCategory.COMPARTILHADO,
    label: "Compartilhado",
    description: "Até 20% mais barato",
    icon: "👥",
    seats: 4,
  },
];

export const PAYMENT_METHOD_OPTIONS: {
  value: PaymentMethodValue;
  label: string;
  icon: string;
}[] = [
  { value: PaymentMethod.CREDIT, label: "Cartão de crédito", icon: "💳" },
  { value: PaymentMethod.DEBIT, label: "Cartão de débito", icon: "💳" },
  { value: PaymentMethod.CASH, label: "Dinheiro", icon: "💵" },
  { value: PaymentMethod.PIX, label: "PIX", icon: "📱" },
  { value: PaymentMethod.WALLET, label: "Carteira digital", icon: "💰" },
];
