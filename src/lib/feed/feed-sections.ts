/* ============================================================
   CONNEXY
   Phase 8.4
   Smart Feed — Section Definitions & Mock Data
   All mock data lives here. Prepared for API integration.
   Pure functions. No side effects. No React.
=========================================================== */

import type { ContextState } from "@/lib/context/context-types";
import { ContextEnvironment, ContextMovement } from "@/lib/context/context-types";
import type {
  SmartSection,
  HeroSectionData,
  HotAreaSectionData,
  RecommendationsSectionData,
  NearbyPeopleSectionData,
  NearbyEventsSectionData,
  NearbyBusinessesSectionData,
  NearbyDriversSectionData,
  TrendingSectionData,
  FooterSectionData,
} from "./feed-types";

/* ─── Hero Messages ──────────────────────────────────────── */

const HERO_MESSAGES: Record<string, Array<{ message: string; emoji: string; subtitle: string }>> = {
  [ContextEnvironment.CITY]: [
    {
      message: "A regiao esta bombando",
      emoji: "🔥",
      subtitle: "Muita gente ativa na regiao agora",
    },
    {
      message: "Eventos acontecendo perto",
      emoji: "🎉",
      subtitle: "Veja o que rola na sua regiao",
    },
  ],
  [ContextEnvironment.SHOPPING]: [
    {
      message: "Ofertas imperdiveis aqui",
      emoji: "🏷",
      subtitle: "Promocoes ativas nas lojas proximas",
    },
    {
      message: "Descubra novos negocios",
      emoji: "🛍",
      subtitle: "Lugares que voce ainda nao conhece",
    },
  ],
  [ContextEnvironment.EVENT]: [
    {
      message: "Ha um evento acontecendo perto",
      emoji: "🎉",
      subtitle: "Participe e conecte-se com pessoas",
    },
    {
      message: "Momento perfeito para networking",
      emoji: "🤝",
      subtitle: "Conecte-se com participantes",
    },
  ],
  [ContextEnvironment.ROAD]: [
    {
      message: "Alta demanda de corridas",
      emoji: "🚗",
      subtitle: "Motoristas disponiveis na regiao",
    },
    {
      message: "Em deslocamento pela cidade",
      emoji: "🛣",
      subtitle: "Veja o que tem perto do seu caminho",
    },
  ],
  [ContextEnvironment.HOME]: [
    {
      message: "Bem-vindo de volta",
      emoji: "🏠",
      subtitle: "Veja o que seus contatos estao postando",
    },
    {
      message: "Momento de relaxar",
      emoji: "☕",
      subtitle: "Conteudo curado para voce",
    },
  ],
  [ContextEnvironment.BUSINESS]: [
    {
      message: "Seus negocios estao ativos",
      emoji: "📊",
      subtitle: "Acompanhe metricas e oportunidades",
    },
    {
      message: "Novos clientes por perto",
      emoji: "👥",
      subtitle: "Pessoas na regiao empresarial",
    },
  ],
  [ContextEnvironment.AIRPORT]: [
    {
      message: "Bem-vindo ao aeroporto",
      emoji: "✈",
      subtitle: "Motoristas e servicos disponiveis",
    },
  ],
  [ContextEnvironment.UNIVERSITY]: [
    {
      message: "Campus ativo agora",
      emoji: "🎓",
      subtitle: "Eventos e pessoas proximas",
    },
  ],
  [ContextEnvironment.BEACH]: [
    {
      message: "Dia de praia",
      emoji: "🏖",
      subtitle: "Momentos e lugares na orla",
    },
  ],
  [ContextEnvironment.PARK]: [
    {
      message: "Atividades ao ar livre",
      emoji: "🌳",
      subtitle: "O que fazer no parque agora",
    },
  ],
};

/* ─── Movement Labels ────────────────────────────────────── */

const MOVEMENT_LABELS: Record<
  string,
  { level: HotAreaSectionData["level"]; label: string; emoji: string; description: string }
> = {
  [ContextMovement.CALM]: {
    level: "CALMO",
    label: "Calmo",
    emoji: "🌙",
    description: "Pouca movimentacao na regiao",
  },
  [ContextMovement.NORMAL]: {
    level: "NORMAL",
    label: "Normal",
    emoji: "☀",
    description: "Movimentacao normal para este horario",
  },
  [ContextMovement.BUSY]: {
    level: "MOVIMENTADO",
    label: "Movimentado",
    emoji: "🟡",
    description: "Regiao movimentada agora",
  },
  [ContextMovement.CROWDED]: {
    level: "BOMBANDO",
    label: "Bombando",
    emoji: "🔥",
    description: "Alta concentracao de pessoas na regiao",
  },
};

/* ─── Mock People ────────────────────────────────────────── */

const MOCK_PEOPLE: NearbyPeopleSectionData["people"] = [
  {
    id: "p1",
    name: "Ana Silva",
    photo: "https://i.pravatar.cc/80?img=1",
    distance: "150m",
    interests: ["Musica", "Cafe"],
    online: true,
  },
  {
    id: "p2",
    name: "Carlos Souza",
    photo: "https://i.pravatar.cc/80?img=12",
    distance: "80m",
    interests: ["Tecnologia"],
    online: true,
  },
  {
    id: "p3",
    name: "Giulia Santos",
    photo: "https://i.pravatar.cc/80?img=23",
    distance: "200m",
    interests: ["Arte", "Networking"],
    online: false,
  },
  {
    id: "p4",
    name: "Pedro Lima",
    photo: "https://i.pravatar.cc/80?img=15",
    distance: "350m",
    interests: ["Esportes"],
    online: true,
  },
  {
    id: "p5",
    name: "Beatriz Silva",
    photo: "https://i.pravatar.cc/80?img=47",
    distance: "120m",
    interests: ["Cafe", "Leitura"],
    online: true,
  },
];

/* ─── Mock Events ────────────────────────────────────────── */

const MOCK_EVENTS: NearbyEventsSectionData["events"] = [
  {
    id: "ev1",
    name: "Sunset no Parque",
    banner: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=400",
    date: "Sab, 26 Jul",
    time: "17:00",
    participants: 128,
    distance: "450m",
  },
  {
    id: "ev2",
    name: "Feira Gastronomica",
    banner: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400",
    date: "Dom, 27 Jul",
    time: "11:00",
    participants: 85,
    distance: "1.2km",
  },
  {
    id: "ev3",
    name: "Show MPB ao Vivo",
    banner: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400",
    date: "Sex, 25 Jul",
    time: "20:00",
    participants: 200,
    distance: "2.1km",
  },
];

/* ─── Mock Businesses ────────────────────────────────────── */

const MOCK_BUSINESSES: NearbyBusinessesSectionData["businesses"] = [
  {
    id: "b1",
    name: "Cafe Central",
    cover: "https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?w=400",
    category: "Cafes",
    rating: 4.6,
    distance: "200m",
  },
  {
    id: "b2",
    name: "Burger House",
    cover: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=400",
    category: "Restaurantes",
    rating: 4.4,
    distance: "350m",
  },
  {
    id: "b3",
    name: "Vinil Store",
    cover: "https://images.unsplash.com/photo-1539375665275-f9de415ef9ac?w=400",
    category: "Lojas",
    rating: 4.8,
    distance: "500m",
  },
];

/* ─── Mock Drivers ───────────────────────────────────────── */

const MOCK_DRIVERS: NearbyDriversSectionData["drivers"] = [
  {
    id: "d1",
    name: "Carlos Motorista",
    photo: "https://i.pravatar.cc/80?img=33",
    car: "Honda Civic",
    rating: 4.9,
    distance: "2 min",
    available: true,
  },
  {
    id: "d2",
    name: "Roberto Silva",
    photo: "https://i.pravatar.cc/80?img=51",
    car: "Toyota Corolla",
    rating: 4.7,
    distance: "5 min",
    available: true,
  },
  {
    id: "d3",
    name: "Fernanda Costa",
    photo: "https://i.pravatar.cc/80?img=25",
    car: "Volkswagen Gol",
    rating: 4.8,
    distance: "8 min",
    available: true,
  },
];

/* ─── Mock Trending ──────────────────────────────────────── */

const MOCK_TRENDING: TrendingSectionData["items"] = [
  { id: "t1", title: "Sunset no Parque", emoji: "🌅", count: 128, trend: "up" },
  { id: "t2", title: "Feira Gastronomica", emoji: "🍽", count: 85, trend: "stable" },
  { id: "t3", title: "Connexy Meetup", emoji: "🤝", count: 64, trend: "new" },
  { id: "t4", title: "Workshop de Fotografia", emoji: "📸", count: 42, trend: "up" },
  { id: "t5", title: "Noite de Jazz", emoji: "🎷", count: 37, trend: "stable" },
];

/* ─── Section Factory ────────────────────────────────────── */

function createHeroSection(context: ContextState): SmartSection {
  const messages = HERO_MESSAGES[context.environment] ?? HERO_MESSAGES[ContextEnvironment.CITY];
  const idx = Math.floor(Date.now() / 3600000) % messages.length;
  const msg = messages[idx];

  const data: HeroSectionData = {
    kind: "HERO",
    message: msg.message,
    emoji: msg.emoji,
    subtitle: msg.subtitle,
  };

  return {
    id: "hero",
    type: "HERO",
    title: "",
    subtitle: "",
    emoji: msg.emoji,
    priority: 100,
    data,
  };
}

function createHotAreaSection(context: ContextState): SmartSection {
  const movement = MOVEMENT_LABELS[context.movement] ?? MOVEMENT_LABELS[ContextMovement.NORMAL];

  const data: HotAreaSectionData = {
    kind: "HOT_AREA",
    level: movement.level,
    label: movement.label,
    emoji: movement.emoji,
    description: movement.description,
  };

  return {
    id: "hot-area",
    type: "HOT_AREA",
    title: "Movimento na Regiao",
    subtitle: movement.label,
    emoji: movement.emoji,
    priority: 85,
    data,
  };
}

function createRecommendationsSection(context: ContextState): SmartSection {
  const items: RecommendationsSectionData["items"] = [
    {
      id: "rec-1",
      title: "Explorar por perto",
      description: "Lugares e pessoas na regiao",
      icon: "📍",
      route: "/discover",
    },
    {
      id: "rec-2",
      title: "Ver eventos do dia",
      description: "O que acontece na cidade",
      icon: "📅",
      route: "/events",
    },
    {
      id: "rec-3",
      title: "Compartilhar momento",
      description: "O que voce esta fazendo agora?",
      icon: "⚡",
      route: "/create/moment",
    },
  ];

  const data: RecommendationsSectionData = {
    kind: "RECOMMENDATIONS",
    items,
  };

  return {
    id: "recommendations",
    type: "RECOMMENDATIONS",
    title: "Recomendacoes",
    subtitle: "Sugerido para voce",
    emoji: "✨",
    priority: 80,
    data,
  };
}

function createNearbyPeopleSection(context: ContextState): SmartSection {
  const count = context.nearPeople;
  const data: NearbyPeopleSectionData = {
    kind: "NEARBY_PEOPLE",
    count,
    people: MOCK_PEOPLE.slice(0, 5),
  };

  return {
    id: "nearby-people",
    type: "NEARBY_PEOPLE",
    title: "Pessoas Proximas",
    subtitle: `${count} pessoas por perto`,
    emoji: "👥",
    priority: 70,
    data,
  };
}

function createNearbyEventsSection(context: ContextState): SmartSection {
  const count = context.nearEvents;
  const data: NearbyEventsSectionData = {
    kind: "NEARBY_EVENTS",
    count,
    events: MOCK_EVENTS.slice(0, 3),
  };

  return {
    id: "nearby-events",
    type: "NEARBY_EVENTS",
    title: "Eventos Proximos",
    subtitle: `${count} eventos acontecendo`,
    emoji: "🎉",
    priority: 65,
    data,
  };
}

function createNearbyBusinessesSection(context: ContextState): SmartSection {
  const count = context.nearBusinesses;
  const data: NearbyBusinessesSectionData = {
    kind: "NEARBY_BUSINESSES",
    count,
    businesses: MOCK_BUSINESSES.slice(0, 3),
  };

  return {
    id: "nearby-businesses",
    type: "NEARBY_BUSINESSES",
    title: "Lugares Proximos",
    subtitle: `${count} negocios por perto`,
    emoji: "🏪",
    priority: 60,
    data,
  };
}

function createNearbyDriversSection(context: ContextState): SmartSection {
  const count = context.nearDrivers;
  const data: NearbyDriversSectionData = {
    kind: "NEARBY_DRIVERS",
    count,
    drivers: MOCK_DRIVERS.slice(0, 3),
  };

  return {
    id: "nearby-drivers",
    type: "NEARBY_DRIVERS",
    title: "Motoristas Disponiveis",
    subtitle: `${count} motoristas proximos`,
    emoji: "🚗",
    priority: 55,
    data,
  };
}

function createTrendingSection(): SmartSection {
  const data: TrendingSectionData = {
    kind: "TRENDING",
    items: MOCK_TRENDING,
  };

  return {
    id: "trending",
    type: "TRENDING",
    title: "Em Alta",
    subtitle: "O que esta acontecendo",
    emoji: "📈",
    priority: 50,
    data,
  };
}

function createFooterSection(): SmartSection {
  const data: FooterSectionData = {
    kind: "FOOTER",
    message: "Connexy — Conectando pessoas, lugares e momentos",
  };

  return {
    id: "footer",
    type: "FOOTER",
    title: "",
    subtitle: "",
    emoji: "",
    priority: 10,
    data,
  };
}

/* ─── Export Section Creators ─────────────────────────────── */

export {
  createHeroSection,
  createHotAreaSection,
  createRecommendationsSection,
  createNearbyPeopleSection,
  createNearbyEventsSection,
  createNearbyBusinessesSection,
  createNearbyDriversSection,
  createTrendingSection,
  createFooterSection,
};
