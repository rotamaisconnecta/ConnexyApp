/* =========================================================
   demo-fleet.ts — Frota demo de motoristas do Connexy.
   Pequena frota local usada pelo dispatcher em modo demo.
   Reutiliza o MOCK_DRIVER existente (ride-data) como um dos
   motoristas da frota — sem criar segunda estrutura.
========================================================= */

import { MOCK_DRIVER } from "@/components/mobility/ride/ride-data";
import type { DemoDriver } from "./dispatch-types";

export const DEMO_DRIVER_IDS = ["marcos", "carla", "joao"] as const;

export type DemoDriverId = (typeof DEMO_DRIVER_IDS)[number];

export function buildDemoFleet(): DemoDriver[] {
  const marcos: DemoDriver = {
    ...MOCK_DRIVER,
    category: "connexy",
    lat: -23.5512,
    lng: -46.6411,
    status: "available",
  };

  const carla: DemoDriver = {
    id: "carla",
    name: "Carla Mendes",
    photo: "https://i.pravatar.cc/200?img=45",
    rating: 4.87,
    totalRides: 2104,
    vehicle: { name: "Toyota Corolla", color: "Prata", plate: "DEF4E56", seats: 4 },
    boardingCode: "8137",
    verified: true,
    category: "conforto",
    lat: -23.5488,
    lng: -46.6394,
    status: "available",
  };

  const joao: DemoDriver = {
    id: "joao",
    name: "João Pereira",
    photo: "https://i.pravatar.cc/200?img=33",
    rating: 4.75,
    totalRides: 932,
    vehicle: { name: "Honda CG 160", color: "Vermelha", plate: "GHI5J89", seats: 1 },
    boardingCode: "5402",
    verified: true,
    category: "moto",
    lat: -23.5524,
    lng: -46.643,
    status: "available",
  };

  return [marcos, carla, joao];
}

/* ─── Motorista padrão deste dispositivo (demo do app) ─────
   Usado pela tela /driver para simular "o motorista logado". */

export const DEMO_DRIVER_ID: DemoDriverId = "marcos";
