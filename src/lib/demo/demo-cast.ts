/* =========================================================
   demo-cast.ts — Elenco fictício estável para o ambiente DEMO.
   Pessoas e motoristas com IDs fixos, offsets em torno da
   origem demo, e flags de comportamento. Sem side effects.
   Só entra no diretório quando isDemoMode() é verdadeiro.
========================================================= */

import { DEMO_ORIGIN } from "@/components/mobility/ride/ride-data";
import type { Person } from "@/lib/mock-data";
import type { DemoDriver } from "@/lib/mobility/dispatch/dispatch-types";
import { demoStorageKey, isDemoMode } from "./demo-config";

export const DEMO_CAST_SEED_VERSION = "2";

export const DEMO_USER_MARIANA = "demo_user_mariana";
export const DEMO_USER_LUCAS = "demo_user_lucas";
export const DEMO_USER_ANA = "demo_user_ana";
export const DEMO_USER_RAFAEL = "demo_user_rafael";
export const DEMO_DRIVER_01 = "demo_driver_01";
export const DEMO_DRIVER_02 = "demo_driver_02";

export type DemoCastRole = "social" | "driver";

export type DemoDriverBehavior = {
  autoAcceptRide: boolean;
  autoCompleteRide: boolean;
};

const DRIVER_BEHAVIOR_KEY = demoStorageKey("driver-behavior");
const DEFAULT_DRIVER_BEHAVIOR: DemoDriverBehavior = {
  autoAcceptRide: true,
  autoCompleteRide: true,
};

type Offset = { eastMeters: number; northMeters: number };

function offsetFromOrigin(offset: Offset): { lat: number; lng: number; distanceMeters: number } {
  const origin = DEMO_ORIGIN;
  const dLat = offset.northMeters / 111_320;
  const dLng = offset.eastMeters / (111_320 * Math.cos((origin.lat * Math.PI) / 180));
  const lat = origin.lat + dLat;
  const lng = origin.lng + dLng;
  const distanceMeters = Math.round(Math.hypot(lat - origin.lat, lng - origin.lng) * 111_320);
  return { lat, lng, distanceMeters };
}

type SocialSpec = {
  id: string;
  name: string;
  age: number;
  photo: string;
  interests: string[];
  headline: string;
  bio: string;
  handle: string;
  address: string;
  offset: Offset;
  autoAcceptConnection: boolean;
  vibeTags: string[];
  looksFor: string[];
};

const SOCIAL_SPECS: SocialSpec[] = [
  {
    id: DEMO_USER_MARIANA,
    name: "Mariana Costa",
    age: 27,
    photo: "https://i.pravatar.cc/200?img=32",
    interests: ["Café", "Arte", "Música", "Socializar"],
    headline: "Cafés novos e exposições de fim de semana",
    bio: "Designer de produto. Sempre com um sketchbook e um espresso.",
    handle: "mari.costa",
    address: "Rua da Consolação, 210 — Consolação",
    offset: { eastMeters: 90, northMeters: 150 },
    autoAcceptConnection: true,
    vibeTags: ["explorador de bairro", "café antes de tudo"],
    looksFor: ["amizade", "parceria de rolês"],
  },
  {
    id: DEMO_USER_LUCAS,
    name: "Lucas Mendes",
    age: 29,
    photo: "https://i.pravatar.cc/200?img=14",
    interests: ["Esportes", "Tecnologia", "Viagens"],
    headline: "Corrida de rua e apps de mapa",
    bio: "Dev e corredor. Testo rotas novas todo sábado.",
    handle: "lucas.mendes",
    address: "Alameda Jaú, 48 — Jardins",
    offset: { eastMeters: 380, northMeters: 70 },
    autoAcceptConnection: true,
    vibeTags: ["madrugador", "trilheiro"],
    looksFor: ["parceiros de corrida", "papo de tech"],
  },
  {
    id: DEMO_USER_ANA,
    name: "Ana Beatriz",
    age: 25,
    photo: "https://i.pravatar.cc/200?img=5",
    interests: ["Eventos", "Música", "Socializar", "Viagens"],
    headline: "Sempre num show ou num picnic improvisado",
    bio: "Produzo eventos pequenos e adoro conhecer gente do bairro.",
    handle: "ana.bea",
    address: "Rua Harmonia, 120 — Vila Madalena",
    offset: { eastMeters: 60, northMeters: -920 },
    autoAcceptConnection: false,
    vibeTags: ["corujão", "explorador de bairro"],
    looksFor: ["amizade", "ir junto em eventos"],
  },
  {
    id: DEMO_USER_RAFAEL,
    name: "Rafael Martins",
    age: 31,
    photo: "https://i.pravatar.cc/200?img=15",
    interests: ["Gastronomia", "Cinema", "Café"],
    headline: "Filmes de bairro e jantar depois",
    bio: "Fotógrafo freelancer. Prefiro lugares quietos depois do rush.",
    handle: "rafa.martins",
    address: "Rua Augusta, 900 — Cerqueira César",
    offset: { eastMeters: -880, northMeters: -780 },
    autoAcceptConnection: false,
    vibeTags: ["cinéfilo", "café antes de tudo"],
    looksFor: ["indicação de filme", "gastronomia"],
  },
];

const AUTO_ACCEPT_IDS = new Set(
  SOCIAL_SPECS.filter((spec) => spec.autoAcceptConnection).map((spec) => spec.id),
);

const ALL_CAST_IDS = new Set<string>([
  ...SOCIAL_SPECS.map((spec) => spec.id),
  DEMO_DRIVER_01,
  DEMO_DRIVER_02,
  "demo_user_lucas_mendes",
  "demo_user_rafael_martins",
]);

export function isDemoCastUser(id: string): boolean {
  return ALL_CAST_IDS.has(id);
}

export function demoCastAutoAcceptsConnection(id: string): boolean {
  return AUTO_ACCEPT_IDS.has(id);
}

export function shouldAutoAcceptDemoConnection(toUserId: string, enabled = isDemoMode()): boolean {
  return enabled && isDemoCastUser(toUserId) && demoCastAutoAcceptsConnection(toUserId);
}

export function listDemoCastIds(): string[] {
  return [...ALL_CAST_IDS];
}

export function listDemoSocialPeople(): Person[] {
  return SOCIAL_SPECS.map((spec) => {
    const geo = offsetFromOrigin(spec.offset);
    return {
      id: spec.id,
      name: spec.name,
      age: spec.age,
      distanceMeters: geo.distanceMeters,
      online: true,
      photo: spec.photo,
      interests: spec.interests,
      bio: spec.bio,
      handle: spec.handle,
      headline: spec.headline,
      address: spec.address,
      latitude: geo.lat,
      longitude: geo.lng,
      vibeTags: spec.vibeTags,
      looksFor: spec.looksFor,
      favoritePlaceIds: ["cafe-central"],
      stats: { connections: 24, meetups: 3, joinedAt: "jan/2026" },
      isDemoUser: true,
    };
  });
}

export function listDemoCastDrivers(): DemoDriver[] {
  const one = offsetFromOrigin({ eastMeters: 40, northMeters: 320 });
  const two = offsetFromOrigin({ eastMeters: -480, northMeters: 90 });
  return [
    {
      id: DEMO_DRIVER_01,
      name: "Diego Castro",
      photo: "https://i.pravatar.cc/200?img=59",
      rating: 4.91,
      totalRides: 640,
      vehicle: { name: "VW Virtus", color: "Prata", plate: "QWE1A23", seats: 4 },
      boardingCode: "2618",
      verified: true,
      category: "connexy",
      lat: one.lat,
      lng: one.lng,
      status: "available",
    },
    {
      id: DEMO_DRIVER_02,
      name: "Camila Duarte",
      photo: "https://i.pravatar.cc/200?img=44",
      rating: 4.88,
      totalRides: 1120,
      vehicle: { name: "Jeep Renegade", color: "Preto", plate: "RTY2B45", seats: 4 },
      boardingCode: "7741",
      verified: true,
      category: "conforto",
      lat: two.lat,
      lng: two.lng,
      status: "available",
    },
  ];
}

export function getDemoDriverBehavior(): DemoDriverBehavior {
  if (!isDemoMode() || typeof window === "undefined") return DEFAULT_DRIVER_BEHAVIOR;
  try {
    const raw = window.localStorage.getItem(DRIVER_BEHAVIOR_KEY);
    if (!raw) return DEFAULT_DRIVER_BEHAVIOR;
    const parsed = JSON.parse(raw) as Partial<DemoDriverBehavior>;
    return {
      autoAcceptRide: parsed.autoAcceptRide ?? DEFAULT_DRIVER_BEHAVIOR.autoAcceptRide,
      autoCompleteRide: parsed.autoCompleteRide ?? DEFAULT_DRIVER_BEHAVIOR.autoCompleteRide,
    };
  } catch {
    return DEFAULT_DRIVER_BEHAVIOR;
  }
}

export function setDemoDriverBehavior(partial: Partial<DemoDriverBehavior>): void {
  if (!isDemoMode() || typeof window === "undefined") return;
  const next = { ...getDemoDriverBehavior(), ...partial };
  try {
    window.localStorage.setItem(DRIVER_BEHAVIOR_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable */
  }
}
