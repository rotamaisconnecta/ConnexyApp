import { Bike, Car, CarTaxiFront, type LucideIcon } from "lucide-react";
import type { GeoLocation } from "@/lib/mobility/ride-types";
import type { RideCategory } from "@/lib/mobility/demo-fare";

export const DEMO_ORIGIN: GeoLocation = {
  lat: -23.55,
  lng: -46.64,
  label: "Sua localização",
  address: "Bela Cintra, 750",
};

export type DemoDestination = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  icon: string;
  recent?: boolean;
};

export const DEMO_DESTINATIONS: DemoDestination[] = [
  {
    id: "casa",
    name: "Casa",
    address: "Rua Harmonia, 340 — Vila Madalena",
    lat: -23.5535,
    lng: -46.638,
    icon: "🏠",
  },
  {
    id: "trabalho",
    name: "Trabalho",
    address: "Av. Paulista, 1578 — Bela Vista",
    lat: -23.5305,
    lng: -46.642,
    icon: "💼",
  },
  {
    id: "ibirapuera",
    name: "Parque Ibirapuera",
    address: "Av. Pedro Álvares Cabral — Ibirapuera",
    lat: -23.5874,
    lng: -46.6576,
    icon: "🌳",
    recent: true,
  },
  {
    id: "cafe-central",
    name: "Café Central",
    address: "Rua Augusta, 1200",
    lat: -23.561,
    lng: -46.656,
    icon: "☕",
    recent: true,
  },
];

export const PICKUP_CHIPS = [
  { label: "Entrada principal", active: "Entrada principal" },
  { label: "Portaria", active: "Portaria" },
  { label: "Esquina", active: "Esquina" },
  { label: "Ponto seguro", active: "Ponto seguro" },
] as const;

export const MOCK_DRIVER = {
  id: "marcos",
  name: "Marcos Oliveira",
  rating: 4.92,
  totalRides: 1842,
  photo: "https://i.pravatar.cc/200?img=68",
  vehicle: { name: "Honda City", color: "Branco", plate: "ABC1D23", seats: 4 },
  boardingCode: "4281",
  verified: true,
};

export type DriverMock = typeof MOCK_DRIVER;

export const CATEGORY_INFO: Record<
  RideCategory,
  { label: string; description: string; etaMinutes: number; icon: LucideIcon }
> = {
  connexy: { label: "Connexy", description: "Até 4 pessoas", etaMinutes: 4, icon: Car },
  conforto: {
    label: "Connexy Comfort",
    description: "Mais espaço e conforto · até 4",
    etaMinutes: 6,
    icon: CarTaxiFront,
  },
  moto: { label: "Moto", description: "1 pessoa · mais rápido", etaMinutes: 3, icon: Bike },
};

export const STOP_SUGGESTIONS = [
  {
    label: "Padaria Bella Paulista",
    address: "Rua Haddock Lobo, 900",
    lat: -23.5405,
    lng: -46.643,
  },
  { label: "Shopping Cidade São Paulo", address: "Av. Paulista, 1230", lat: -23.547, lng: -46.645 },
  {
    label: "Praça Benedito Calixto",
    address: "Praça Benedito Calixto, 1 — Pinheiros",
    lat: -23.559,
    lng: -46.673,
  },
] as const;

export function destinationToGeo(dest: DemoDestination): GeoLocation {
  return { lat: dest.lat, lng: dest.lng, label: dest.address, address: dest.address };
}
