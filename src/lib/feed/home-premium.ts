/* =========================================================
   home-premium.ts — Connexy Home Premium Experience
   Curated data + ranking for the premium Home feed.
   Pure TypeScript. No React. No side effects.
   Does NOT alter any engine — reuses mock-data only.
========================================================= */

import { people, places, compatibilityScore, currentUser } from "@/lib/mock-data";
import { formatDistance } from "@/lib/proximity";
import { getCommonalities, shouldShowNearbyPerson } from "./commonalities";
import type { PersonCommonalities } from "./commonalities";
import type {
  NearbyPeopleSectionData,
  NearbyPlacesSectionData,
  NearbyEventsSectionData,
} from "./feed-types";

/* ─── PremiumCard ─────────────────────────────────────── */

export type PremiumCardKind =
  | "restaurant"
  | "promotion"
  | "business"
  | "place"
  | "sponsored-event"
  | "event"
  | "hotel"
  | "gym"
  | "cinema"
  | "bar"
  | "store"
  | "cafe"
  | "service"
  | "person"
  | "post";

export interface PremiumCard {
  id: string;
  kind: PremiumCardKind;
  title: string;
  subtitle?: string;
  photo?: string;
  emoji?: string;
  route?: string;
  rating?: number;
  distance?: string;
  distanceMeters?: number;
  people?: number;
  promo?: string;
  category?: string;
  hours?: string;
  badge?: string;
  count?: number;
  trend?: "up" | "stable" | "new";
  online?: boolean;
  compatibility?: number;
  commonalities?: PersonCommonalities;
}

export const KIND_LABELS: Record<PremiumCardKind, string> = {
  restaurant: "Restaurante",
  promotion: "Promoção",
  business: "Negócio",
  place: "Lugar",
  "sponsored-event": "Evento patrocinado",
  event: "Evento",
  hotel: "Hotel",
  gym: "Academia",
  cinema: "Cinema",
  bar: "Bar",
  store: "Loja",
  cafe: "Cafeteria",
  service: "Serviço",
  person: "Pessoa",
  post: "Publicação",
};

export const KIND_EMOJI: Record<PremiumCardKind, string> = {
  restaurant: "🍽️",
  promotion: "🎁",
  business: "🏢",
  place: "📍",
  "sponsored-event": "✨",
  event: "🎉",
  hotel: "🏨",
  gym: "💪",
  cinema: "🎬",
  bar: "🍺",
  store: "🛍️",
  cafe: "☕",
  service: "🔧",
  person: "👤",
  post: "💬",
};

const INTEREST_KEYWORDS: Record<PremiumCardKind, string[]> = {
  restaurant: ["Gastronomia", "Socializar"],
  promotion: ["Lojas", "Gastronomia"],
  business: ["Negócios", "Socializar"],
  place: ["Viagens", "Eventos"],
  "sponsored-event": ["Eventos", "Socializar"],
  event: ["Eventos", "Música", "Socializar"],
  hotel: ["Viagens"],
  gym: ["Esportes", "Yoga"],
  cinema: ["Cinema", "Arte"],
  bar: ["Socializar", "Música"],
  store: ["Lojas", "Arte"],
  cafe: ["Café", "Socializar"],
  service: ["Negócios", "Tecnologia"],
  person: ["Socializar"],
  post: ["Socializar", "Música"],
};

/* ─── Ranking ─────────────────────────────────────────── */

export function interestScore(card: PremiumCard): number {
  const keywords = INTEREST_KEYWORDS[card.kind] ?? [];
  const user = new Set(currentUser.interests);
  return keywords.reduce((acc, k) => (user.has(k) ? acc + 10 : acc), 0);
}

export function scorePremiumCard(card: PremiumCard): number {
  let score = 0;

  score += (card.rating ?? 0) * 12;

  if (card.distanceMeters != null) {
    score += Math.max(0, 60 - card.distanceMeters / 100);
  }

  score += Math.min(card.people ?? 0, 1000) * 0.06;

  score += interestScore(card);

  score += Math.min(card.count ?? 0, 1000) * 0.04;

  if (card.promo) score += 8;
  if (card.badge === "Patrocinado") score += 10;

  return Math.round(score);
}

export function rankPremiumCards(cards: PremiumCard[]): PremiumCard[] {
  const seen = new Set<string>();
  const unique: PremiumCard[] = [];
  for (const card of cards) {
    if (seen.has(card.id)) continue;
    seen.add(card.id);
    unique.push(card);
  }
  return unique.sort((a, b) => scorePremiumCard(b) - scorePremiumCard(a));
}

/* ─── Events data ─────────────────────────────────────── */

export interface HomeEvent {
  id: string;
  name: string;
  banner: string;
  date: string;
  time: string;
  participants: number;
  distance: string;
  distanceMeters: number;
  location: string;
  category?: string;
}

export const HOME_EVENTS: HomeEvent[] = [
  {
    id: "ev1",
    name: "Sunset no Parque",
    banner: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=400",
    date: "Hoje",
    time: "17:00",
    participants: 128,
    distance: "450m",
    distanceMeters: 450,
    location: "Parque Central",
    category: "Música",
  },
  {
    id: "ev2",
    name: "Feira Gastronomica",
    banner: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400",
    date: "Hoje",
    time: "11:00",
    participants: 85,
    distance: "1,2km",
    distanceMeters: 1200,
    location: "Praca da Matriz",
    category: "Gastronomia",
  },
  {
    id: "ev3",
    name: "Show MPB ao Vivo",
    banner: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400",
    date: "Hoje",
    time: "20:00",
    participants: 200,
    distance: "2,1km",
    distanceMeters: 2100,
    location: "Teatro Municipal",
    category: "Música",
  },
  {
    id: "ev4",
    name: "Workshop de Fotografia",
    banner: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400",
    date: "Hoje",
    time: "14:00",
    participants: 45,
    distance: "800m",
    distanceMeters: 800,
    location: "Espaco Cultural",
    category: "Arte",
  },
  {
    id: "ev5",
    name: "Aula de Yoga ao Ar Livre",
    banner: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=400",
    date: "Hoje",
    time: "07:00",
    participants: 32,
    distance: "1,5km",
    distanceMeters: 1500,
    location: "Orla da Praia",
    category: "Bem-estar",
  },
  {
    id: "ev6",
    name: "Noite de Jazz",
    banner: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400",
    date: "Sab, 2 Ago",
    time: "21:00",
    participants: 67,
    distance: "1,8km",
    distanceMeters: 1800,
    location: "Blue Note Club",
    category: "Música",
  },
  {
    id: "ev7",
    name: "Feira de Artesanato",
    banner: "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=400",
    date: "Dom, 3 Ago",
    time: "09:00",
    participants: 110,
    distance: "3,2km",
    distanceMeters: 3200,
    location: "Praca Central",
    category: "Cultura",
  },
  {
    id: "ev8",
    name: "Palestra Inovacao",
    banner: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400",
    date: "Seg, 4 Ago",
    time: "19:00",
    participants: 78,
    distance: "2,5km",
    distanceMeters: 2500,
    location: "Auditorio do Sebrae",
    category: "Tecnologia",
  },
  {
    id: "ev9",
    name: "Corrida de Rua",
    banner: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400",
    date: "Ter, 5 Ago",
    time: "06:00",
    participants: 250,
    distance: "900m",
    distanceMeters: 900,
    location: "Avenida Beira-Mar",
    category: "Esporte",
  },
  {
    id: "ev10",
    name: "Clube do Livro",
    banner: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400",
    date: "Qua, 6 Ago",
    time: "18:30",
    participants: 25,
    distance: "1,1km",
    distanceMeters: 1100,
    location: "Biblioteca Municipal",
    category: "Literatura",
  },
];

export function eventsToday(): HomeEvent[] {
  return HOME_EVENTS.filter((e) => e.date === "Hoje");
}

export function eventsUpcoming(): HomeEvent[] {
  return HOME_EVENTS.filter((e) => e.date !== "Hoje");
}

/* ─── Section builders ────────────────────────────────── */

export function buildNearbyPeople(): NearbyPeopleSectionData {
  const visible = people.filter((p) => shouldShowNearbyPerson(p.id));
  return {
    kind: "NEARBY_PEOPLE",
    count: visible.length,
    people: visible
      .map((p) => ({
        id: p.id,
        name: p.name,
        photo: p.photo,
        age: p.age,
        compatibility: compatibilityScore(p),
        distance: formatDistance(p.distanceMeters),
        distanceMeters: p.distanceMeters,
        interests: p.interests,
        online: p.online,
        commonalities: getCommonalities(p),
      }))
      .sort((a, b) => a.distanceMeters - b.distanceMeters),
  };
}

export function buildNearbyPlaces(): NearbyPlacesSectionData {
  return {
    kind: "NEARBY_PLACES",
    count: places.length,
    places: places
      .map((p) => ({
        id: p.id,
        name: p.name,
        photo: p.cover,
        category: p.category,
        rating: p.rating,
        distance: formatDistance(p.distanceMeters),
        open: p.hours.startsWith("Aberto") || p.hours.includes("Hoje"),
        hours: p.hours,
      }))
      .sort((a, b) => {
        const am = a.distance;
        const bm = b.distance;
        return am.localeCompare(bm);
      }),
  };
}

export function buildEventsToday(): NearbyEventsSectionData {
  const today = eventsToday();
  return {
    kind: "NEARBY_EVENTS",
    count: today.length,
    events: today.map((e) => ({
      id: e.id,
      name: e.name,
      banner: e.banner,
      date: e.date,
      time: e.time,
      participants: e.participants,
      distance: e.distance,
      location: e.location,
    })),
  };
}

export function buildEventsUpcoming(): NearbyEventsSectionData {
  const upcoming = eventsUpcoming();
  return {
    kind: "NEARBY_EVENTS",
    count: upcoming.length,
    events: upcoming.map((e) => ({
      id: e.id,
      name: e.name,
      banner: e.banner,
      date: e.date,
      time: e.time,
      participants: e.participants,
      distance: e.distance,
      location: e.location,
    })),
  };
}

/* ─── Curated premium cards ───────────────────────────── */

function placeToCard(p: (typeof places)[number]): PremiumCard {
  const kind: PremiumCardKind =
    p.category === "Restaurantes"
      ? "restaurant"
      : p.category === "Cafés"
        ? "cafe"
        : p.category === "Eventos"
          ? "sponsored-event"
          : p.category === "Lojas"
            ? "store"
            : "place";

  return {
    id: p.id,
    kind,
    title: p.name,
    subtitle: p.description,
    photo: p.cover,
    route: `/local/${p.id}`,
    rating: p.rating,
    distance: formatDistance(p.distanceMeters),
    distanceMeters: p.distanceMeters,
    promo: p.promo,
    category: p.category,
    hours: p.hours,
    badge: p.promo ? "Promoção" : kind === "sponsored-event" ? "Patrocinado" : undefined,
  };
}

const EXTRA_CARDS: PremiumCard[] = [
  {
    id: "hotel-prime",
    kind: "hotel",
    title: "Hotel Paulista Prime",
    subtitle: "Conforto no coração da cidade",
    photo: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400",
    route: "/business/hotel-prime",
    rating: 4.8,
    distance: "2,1km",
    distanceMeters: 2100,
    category: "Hotéis",
    hours: "24h",
    badge: "Patrocinado",
    count: 320,
  },
  {
    id: "gym-arena",
    kind: "gym",
    title: "Academia Arena Fit",
    subtitle: "Treine com os melhores equipamentos",
    photo: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400",
    route: "/business/gym-arena",
    rating: 4.6,
    distance: "950m",
    distanceMeters: 950,
    category: "Academias",
    hours: "06:00–23:00",
    people: 74,
    count: 189,
  },
  {
    id: "cine-palace",
    kind: "cinema",
    title: "Cine Palace",
    subtitle: "Sessões de estreia em IMAX",
    photo: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400",
    route: "/business/cine-palace",
    rating: 4.5,
    distance: "1,3km",
    distanceMeters: 1300,
    category: "Cinema",
    hours: "12:00–00:00",
    people: 210,
    count: 540,
  },
  {
    id: "bar-ze",
    kind: "bar",
    title: "Bar do Zé",
    subtitle: "Petiscos e música ao vivo",
    photo: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400",
    route: "/business/bar-ze",
    rating: 4.4,
    distance: "700m",
    distanceMeters: 700,
    category: "Bares",
    hours: "17:00–02:00",
    people: 96,
    count: 267,
  },
  {
    id: "sushi-tanaka",
    kind: "restaurant",
    title: "Sushi Tanaka",
    subtitle: "Culinária japonesa autêntica",
    photo: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400",
    route: "/business/sushi-tanaka",
    rating: 4.9,
    distance: "180m",
    distanceMeters: 180,
    category: "Restaurantes",
    hours: "11:30–23:30",
    people: 38,
    count: 312,
  },
  {
    id: "studio-criativo",
    kind: "service",
    title: "Studio Criativo",
    subtitle: "Coworking e salas de evento",
    photo: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400",
    route: "/business/studio-criativo",
    rating: 4.3,
    distance: "350m",
    distanceMeters: 350,
    category: "Serviços",
    hours: "08:00–22:00",
    people: 42,
    count: 87,
  },
  {
    id: "praca-central",
    kind: "place",
    title: "Praça Central",
    subtitle: "Encontro de pessoas e eventos",
    photo: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400",
    route: "/business/praca-central",
    rating: 4.7,
    distance: "80m",
    distanceMeters: 80,
    category: "Lugares",
    hours: "24h",
    people: 320,
    count: 456,
  },
];

const TRENDING_POSTS: PremiumCard[] = [
  {
    id: "post-sunset",
    kind: "post",
    title: "Sunset hoje tá impecável. Vem quem quer.",
    subtitle: "Juliana · curadora cultural",
    photo: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400",
    route: "/connecta",
    category: "Publicações",
    people: 58,
    count: 24,
  },
  {
    id: "post-corrida",
    kind: "post",
    title: "10k antes do café. Nada mal pra segunda.",
    subtitle: "Rafael · dev e corredor",
    photo: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400",
    route: "/connecta",
    category: "Publicações",
    people: 33,
    count: 19,
  },
  {
    id: "post-cafe",
    kind: "post",
    title: "Descoberta da semana: novo blend da casa.",
    subtitle: "Beatriz · vinil e café",
    photo: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400",
    route: "/connecta",
    category: "Publicações",
    people: 24,
    count: 12,
  },
];

function peopleToCards(): PremiumCard[] {
  return people
    .filter((p) => shouldShowNearbyPerson(p.id))
    .map((p) => ({
      id: `person-${p.id}`,
      kind: "person" as const,
      title: p.name,
      subtitle: p.interests.slice(0, 2).join(", "),
      photo: p.photo,
      route: `/perfil/${p.id}`,
      distance: formatDistance(p.distanceMeters),
      distanceMeters: p.distanceMeters,
      compatibility: compatibilityScore(p),
      online: p.online,
      category: "Pessoas",
      commonalities: getCommonalities(p),
    }));
}

function eventsToCards(): PremiumCard[] {
  return HOME_EVENTS.map((e) => ({
    id: `event-${e.id}`,
    kind: "event" as PremiumCardKind,
    title: e.name,
    subtitle: `${e.date} às ${e.time}`,
    photo: e.banner,
    route: `/event/${e.id}`,
    distance: e.distance,
    distanceMeters: e.distanceMeters,
    people: e.participants,
    category: e.category ?? "Eventos",
  }));
}

/* ─── Public builders ─────────────────────────────────── */

export function buildTrendingCards(): PremiumCard[] {
  const cards: PremiumCard[] = [
    ...eventsToCards(),
    ...places.map(placeToCard),
    ...peopleToCards(),
    ...EXTRA_CARDS.filter((c) => c.kind === "bar" || c.kind === "gym" || c.kind === "cinema"),
    ...TRENDING_POSTS,
  ];

  return rankPremiumCards(cards)
    .slice(0, 16)
    .map((card, i) => ({
      ...card,
      trend: (i < 5 ? "up" : i < 10 ? "new" : "stable") as "up" | "stable" | "new",
      badge: card.badge ?? (i < 5 ? "Em alta" : undefined),
    }));
}

export function buildRecommendationCards(): PremiumCard[] {
  const cards: PremiumCard[] = [
    ...places.map(placeToCard),
    ...EXTRA_CARDS,
    ...eventsToCards().map((card) => ({ ...card, kind: "sponsored-event" as PremiumCardKind })),
  ];

  return rankPremiumCards(cards).slice(0, 18);
}

export function buildFullPeopleCards(): PremiumCard[] {
  return rankPremiumCards(peopleToCards());
}
