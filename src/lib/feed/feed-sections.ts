import type { ContextState } from "@/lib/context/context-types";
import { ContextEnvironment, ContextMovement } from "@/lib/context/context-types";
import type {
  SmartSection,
  HeroSectionData,
  HotAreaSectionData,
  RecommendationsSectionData,
  NearbyPeopleSectionData,
  NearbyPlacesSectionData,
  NearbyEventsSectionData,
  NearbyBusinessesSectionData,
  NearbyDriversSectionData,
  TrendingSectionData,
  FooterSectionData,
} from "./feed-types";

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

const MOCK_PEOPLE: NearbyPeopleSectionData["people"] = [
  {
    id: "p1",
    name: "Ana Silva",
    age: 27,
    compatibility: 92,
    photo: "https://i.pravatar.cc/80?img=1",
    distance: "150m",
    distanceMeters: 150,
    interests: ["Musica", "Cafe"],
    online: true,
  },
  {
    id: "p2",
    name: "Carlos Souza",
    age: 31,
    compatibility: 85,
    photo: "https://i.pravatar.cc/80?img=12",
    distance: "80m",
    distanceMeters: 80,
    interests: ["Tecnologia"],
    online: true,
  },
  {
    id: "p3",
    name: "Giulia Santos",
    age: 24,
    compatibility: 78,
    photo: "https://i.pravatar.cc/80?img=23",
    distance: "200m",
    distanceMeters: 200,
    interests: ["Arte", "Networking"],
    online: false,
  },
  {
    id: "p4",
    name: "Pedro Lima",
    age: 29,
    compatibility: 74,
    photo: "https://i.pravatar.cc/80?img=15",
    distance: "350m",
    distanceMeters: 350,
    interests: ["Esportes"],
    online: true,
  },
  {
    id: "p5",
    name: "Beatriz Silva",
    age: 26,
    compatibility: 88,
    photo: "https://i.pravatar.cc/80?img=47",
    distance: "120m",
    distanceMeters: 120,
    interests: ["Cafe", "Leitura"],
    online: true,
  },
  {
    id: "p6",
    name: "Rafael Costa",
    age: 33,
    compatibility: 69,
    photo: "https://i.pravatar.cc/80?img=53",
    distance: "500m",
    distanceMeters: 500,
    interests: ["Viagens", "Fotografia"],
    online: true,
  },
  {
    id: "p7",
    name: "Marina Lopes",
    age: 25,
    compatibility: 81,
    photo: "https://i.pravatar.cc/80?img=44",
    distance: "280m",
    distanceMeters: 280,
    interests: ["Cinema", "Musica"],
    online: false,
  },
];

const MOCK_PLACES: NearbyPlacesSectionData["places"] = [
  {
    id: "pl1",
    name: "Praça Central",
    photo: "https://images.unsplash.com/photo-1572417884940-c24659be9fbc?w=400",
    category: "Parque",
    rating: 4.7,
    distance: "80m",
    open: true,
    hours: "24h",
  },
  {
    id: "pl2",
    name: "Biblioteca Municipal",
    photo: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400",
    category: "Cultura",
    rating: 4.5,
    distance: "200m",
    open: true,
    hours: "08:00–18:00",
  },
  {
    id: "pl3",
    name: "Mirante do Sol",
    photo: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",
    category: "Natureza",
    rating: 4.9,
    distance: "350m",
    open: true,
    hours: "06:00–20:00",
  },
  {
    id: "pl4",
    name: "Shopping Center",
    photo: "https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?w=400",
    category: "Compras",
    rating: 4.3,
    distance: "500m",
    open: true,
    hours: "10:00–22:00",
  },
  {
    id: "pl5",
    name: "Academia Fit",
    photo: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400",
    category: "Esporte",
    rating: 4.6,
    distance: "600m",
    open: true,
    hours: "06:00–23:00",
  },
  {
    id: "pl6",
    name: "Museu de Arte",
    photo: "https://images.unsplash.com/photo-1566127444941-8e5b8f82aa26?w=400",
    category: "Cultura",
    rating: 4.8,
    distance: "800m",
    open: false,
    hours: "09:00–17:00",
  },
  {
    id: "pl7",
    name: "Praia da Costa",
    photo: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400",
    category: "Natureza",
    rating: 4.7,
    distance: "1.2km",
    open: true,
    hours: "24h",
  },
  {
    id: "pl8",
    name: "Estação de Trem",
    photo: "https://images.unsplash.com/photo-1545127398-14699f92334b?w=400",
    category: "Transporte",
    rating: 4.1,
    distance: "1.5km",
    open: true,
    hours: "05:00–23:00",
  },
  {
    id: "pl9",
    name: "Parque Aquático",
    photo: "https://images.unsplash.com/photo-1572331165267-854da2b10b9b?w=400",
    category: "Lazer",
    rating: 4.4,
    distance: "2.5km",
    open: false,
    hours: "10:00–18:00",
  },
  {
    id: "pl10",
    name: "Teatro Municipal",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    category: "Cultura",
    rating: 4.6,
    distance: "3km",
    open: false,
    hours: "14:00–22:00",
  },
];

const MOCK_EVENTS: NearbyEventsSectionData["events"] = [
  {
    id: "ev1",
    name: "Sunset no Parque",
    banner: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=400",
    date: "Hoje",
    time: "17:00",
    participants: 128,
    distance: "450m",
    location: "Parque Central",
  },
  {
    id: "ev2",
    name: "Feira Gastronomica",
    banner: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400",
    date: "Hoje",
    time: "11:00",
    participants: 85,
    distance: "1.2km",
    location: "Praca da Matriz",
  },
  {
    id: "ev3",
    name: "Show MPB ao Vivo",
    banner: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400",
    date: "Hoje",
    time: "20:00",
    participants: 200,
    distance: "2.1km",
    location: "Teatro Municipal",
  },
  {
    id: "ev4",
    name: "Workshop de Fotografia",
    banner: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400",
    date: "Hoje",
    time: "14:00",
    participants: 45,
    distance: "800m",
    location: "Espaco Cultural",
  },
  {
    id: "ev5",
    name: "Aula de Yoga ao Ar Livre",
    banner: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=400",
    date: "Hoje",
    time: "07:00",
    participants: 32,
    distance: "1.5km",
    location: "Orla da Praia",
  },
  {
    id: "ev6",
    name: "Noite de Jazz",
    banner: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400",
    date: "Sab, 2 Ago",
    time: "21:00",
    participants: 67,
    distance: "1.8km",
    location: "Blue Note Club",
  },
  {
    id: "ev7",
    name: "Feira de Artesanato",
    banner: "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=400",
    date: "Dom, 3 Ago",
    time: "09:00",
    participants: 110,
    distance: "3.2km",
    location: "Praca Central",
  },
  {
    id: "ev8",
    name: "Palestra Inovacao",
    banner: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400",
    date: "Seg, 4 Ago",
    time: "19:00",
    participants: 78,
    distance: "2.5km",
    location: "Auditorio do Sebrae",
  },
  {
    id: "ev9",
    name: "Corrida de Rua",
    banner: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400",
    date: "Ter, 5 Ago",
    time: "06:00",
    participants: 250,
    distance: "900m",
    location: "Avenida Beira-Mar",
  },
  {
    id: "ev10",
    name: "Clube do Livro",
    banner: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400",
    date: "Qua, 6 Ago",
    time: "18:30",
    participants: 25,
    distance: "1.1km",
    location: "Biblioteca Municipal",
  },
];

const MOCK_BUSINESSES: NearbyBusinessesSectionData["businesses"] = [
  {
    id: "b1",
    name: "Cafe Central",
    cover: "https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?w=400",
    category: "Cafes",
    rating: 4.6,
    distance: "200m",
    offer: "20% OFF",
  },
  {
    id: "b2",
    name: "Burger House",
    cover: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=400",
    category: "Restaurantes",
    rating: 4.4,
    distance: "350m",
    offer: "Frete gratis",
  },
  {
    id: "b3",
    name: "Vinil Store",
    cover: "https://images.unsplash.com/photo-1539375665275-f9de415ef9ac?w=400",
    category: "Lojas",
    rating: 4.8,
    distance: "500m",
    offer: "Promocao hoje",
  },
];

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

const MOCK_TRENDING: TrendingSectionData["items"] = [
  { id: "t1", title: "Sunset no Parque", emoji: "🌅", count: 128, trend: "up" },
  { id: "t2", title: "Feira Gastronomica", emoji: "🍽", count: 85, trend: "stable" },
  { id: "t3", title: "Connexy Meetup", emoji: "🤝", count: 64, trend: "new" },
  { id: "t4", title: "Workshop de Fotografia", emoji: "📸", count: 42, trend: "up" },
  { id: "t5", title: "Noite de Jazz", emoji: "🎷", count: 37, trend: "stable" },
  { id: "t6", title: "Aula de Yoga", emoji: "🧘", count: 32, trend: "new" },
  { id: "t7", title: "Feira de Artesanato", emoji: "🎨", count: 110, trend: "up" },
  { id: "t8", title: "Palestra Inovacao", emoji: "💡", count: 78, trend: "stable" },
  { id: "t9", title: "Corrida de Rua", emoji: "🏃", count: 250, trend: "up" },
  { id: "t10", title: "Clube do Livro", emoji: "📚", count: 25, trend: "new" },
  { id: "t11", title: "Pocket Show MPB", emoji: "🎤", count: 56, trend: "stable" },
  { id: "t12", title: "Hackathon Connexy", emoji: "💻", count: 89, trend: "up" },
];

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

function createRecommendationsSection(): SmartSection {
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
      route: "/feed",
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

const todayEvents = MOCK_EVENTS.filter((e) => e.date === "Hoje");
const upcomingEvents = MOCK_EVENTS.filter((e) => e.date !== "Hoje");

function createNearbyEventsTodaySection(context: ContextState): SmartSection {
  const count = context.nearEvents;
  const data: NearbyEventsSectionData = {
    kind: "NEARBY_EVENTS",
    count,
    events: todayEvents.slice(0, 5),
  };

  return {
    id: "nearby-events-today",
    type: "NEARBY_EVENTS",
    title: "Eventos Hoje",
    subtitle: `${todayEvents.length} eventos acontecendo agora`,
    emoji: "🎉",
    priority: 66,
    data,
  };
}

function createNearbyEventsUpcomingSection(context: ContextState): SmartSection {
  const count = context.nearEvents;
  const data: NearbyEventsSectionData = {
    kind: "NEARBY_EVENTS",
    count,
    events: upcomingEvents.slice(0, 5),
  };

  return {
    id: "nearby-events-upcoming",
    type: "NEARBY_EVENTS",
    title: "Eventos Proximos",
    subtitle: `${upcomingEvents.length} eventos por vir`,
    emoji: "📅",
    priority: 65,
    data,
  };
}

function createNearbyPeopleSection(context: ContextState): SmartSection {
  const count = context.nearPeople;
  const data: NearbyPeopleSectionData = {
    kind: "NEARBY_PEOPLE",
    count,
    people: MOCK_PEOPLE.slice(0, 7),
  };

  return {
    id: "nearby-people",
    type: "NEARBY_PEOPLE",
    title: "Pessoas Proximas",
    subtitle: `${count} pessoas por perto`,
    emoji: "👥",
    priority: 75,
    data,
  };
}

function createNearbyPlacesSection(): SmartSection {
  const count = MOCK_PLACES.length;
  const data: NearbyPlacesSectionData = {
    kind: "NEARBY_PLACES",
    count,
    places: MOCK_PLACES.slice(0, 10),
  };

  return {
    id: "nearby-places",
    type: "NEARBY_PLACES",
    title: "Locais Proximos",
    subtitle: `${count} lugares para conhecer`,
    emoji: "📍",
    priority: 73,
    data,
  };
}

function createNearbyEventsSection(context: ContextState): SmartSection {
  return createNearbyEventsTodaySection(context);
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
    title: "Negocios Proximos",
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

export {
  createHeroSection,
  createHotAreaSection,
  createRecommendationsSection,
  createNearbyPeopleSection,
  createNearbyPlacesSection,
  createNearbyEventsSection,
  createNearbyEventsTodaySection,
  createNearbyEventsUpcomingSection,
  createNearbyBusinessesSection,
  createNearbyDriversSection,
  createTrendingSection,
  createFooterSection,
};
