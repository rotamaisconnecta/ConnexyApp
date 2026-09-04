/* =========================================================
   mock-sponsored-content.ts — Simulated sponsored content for
   the "Descobertas locais" section of the home feed.
   Dados simulados locais. Banco de dados ainda não conectado.
   Pure TypeScript. No React. No side effects. No Supabase.
========================================================= */

export type SponsoredAction = "view-offer" | "view-place" | "view-event" | "book" | "learn-more";

export interface SponsoredContent {
  id: string;
  title: string;
  category: string;
  subtitle?: string;
  distanceMeters: number;
  latitude: number;
  longitude: number;
  cover?: string;
  emoji?: string;
  action: SponsoredAction;
  ctaLabel: string;
}

export const SPONSORED_ADS: SponsoredContent[] = [
  {
    id: "cafe-aurora",
    title: "Café Aurora",
    category: "Cafés",
    subtitle: "Novo blend de torra média + brunch até as 13h",
    distanceMeters: 600,
    latitude: -23.546,
    longitude: -46.642,
    cover: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800",
    emoji: "☕",
    action: "view-offer",
    ctaLabel: "Ver oferta",
  },
  {
    id: "arena-move",
    title: "Arena Move",
    category: "Atividades",
    subtitle: "Aula experimental gratuita de funcional",
    distanceMeters: 1800,
    latitude: -23.537,
    longitude: -46.649,
    cover: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800",
    emoji: "🏋️",
    action: "book",
    ctaLabel: "Reservar",
  },
  {
    id: "estudio-alma",
    title: "Estúdio Alma",
    category: "Bem-estar",
    subtitle: "Sessão de yoga no rooftop ao pôr do sol",
    distanceMeters: 750,
    latitude: -23.553,
    longitude: -46.634,
    cover: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800",
    emoji: "🧘",
    action: "book",
    ctaLabel: "Agendar",
  },
  {
    id: "festival-conecta",
    title: "Festival Conecta",
    category: "Eventos",
    subtitle: "3 dias de música e cultura no centro",
    distanceMeters: 3400,
    latitude: -23.525,
    longitude: -46.667,
    cover: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800",
    emoji: "🎉",
    action: "view-event",
    ctaLabel: "Ver evento",
  },
  {
    id: "vinil-da-esquina",
    title: "Vinil da Esquina",
    category: "Lojas",
    subtitle: "Vinil raro com 30% OFF no lançamento",
    distanceMeters: 1200,
    latitude: -23.557,
    longitude: -46.635,
    cover: "https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?w=800",
    emoji: "🎵",
    action: "view-place",
    ctaLabel: "Ver local",
  },
  {
    id: "restaurante-horizonte",
    title: "Restaurante Horizonte",
    category: "Restaurantes",
    subtitle: "Menu degustação com vista para o parque",
    distanceMeters: 5200,
    latitude: -23.594,
    longitude: -46.605,
    cover: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800",
    emoji: "🍽️",
    action: "learn-more",
    ctaLabel: "Conhecer",
  },
];

export function sponsoredActionMessage(action: SponsoredAction, title: string): string {
  switch (action) {
    case "view-offer":
      return `Oferta "${title}" salva!`;
    case "view-place":
      return `Abrindo ${title}...`;
    case "view-event":
      return `Evento "${title}" em breve`;
    case "book":
      return `Reserva simulada em ${title}`;
    case "learn-more":
      return `Mais informações em breve`;
  }
}
