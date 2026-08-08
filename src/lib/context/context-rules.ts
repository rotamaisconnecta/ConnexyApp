/* ============================================================
   CONNEXY
   Phase 8.3
   Context AI Engine — Rules
   Pure functions. No side effects. No React.
============================================================ */

import { ContextEnvironment, ContextPeriod, ContextMovement } from "./context-types";
import type {
  ContextEnvironmentValue,
  ContextPeriodValue,
  ContextMovementValue,
  ContextRecommendation,
} from "./context-types";

/* ─── Environment Rules ─────────────────────────────────── */

const ENVIRONMENT_RULES: Record<ContextEnvironmentValue, Omit<ContextRecommendation, "id">[]> = {
  [ContextEnvironment.SHOPPING]: [
    {
      type: "action",
      title: "Ver ofertas próximas",
      description: "Descubra promoções nas lojas ao redor",
      icon: "🏷",
      route: "/marketplace",
      priority: 1,
    },
    {
      type: "action",
      title: "Restaurantes nearby",
      description: "Onde comer perto de você",
      icon: "🍽",
      route: "/discover",
      priority: 2,
    },
    {
      type: "suggestion",
      title: "Publique uma oferta",
      description: "Se tem empresa, crie uma promoção",
      icon: "📢",
      route: "/create",
      priority: 3,
    },
  ],

  [ContextEnvironment.EVENT]: [
    {
      type: "action",
      title: "Fazer check-in",
      description: "Registre sua presença no evento",
      icon: "✅",
      route: "/feed",
      priority: 1,
    },
    {
      type: "content",
      title: "Criar reel do evento",
      description: "Compartilhe os melhores momentos",
      icon: "🎬",
      route: "/create/reel",
      priority: 2,
    },
    {
      type: "suggestion",
      title: "Networking",
      description: "Conecte-se com participantes",
      icon: "🤝",
      route: "/pessoas",
      priority: 3,
    },
    {
      type: "content",
      title: "Ver eventos ao vivo",
      description: "Acompanhe outros eventos acontecendo",
      icon: "🎉",
      route: "/feed",
      priority: 4,
    },
  ],

  [ContextEnvironment.ROAD]: [
    {
      type: "action",
      title: "Encontrar motorista",
      description: "Motoristas disponíveis na região",
      icon: "🚗",
      route: "/discover",
      priority: 1,
    },
    {
      type: "action",
      title: "Oferecer carona",
      description: "Compartilhe sua viagem",
      icon: "🛣",
      route: "/create/ride",
      priority: 2,
    },
    {
      type: "content",
      title: "Ver trânsito",
      description: "Condições do trânsito ao vivo",
      icon: "🚦",
      route: "/discover",
      priority: 3,
    },
  ],

  [ContextEnvironment.HOME]: [
    {
      type: "content",
      title: "Feed personalizado",
      description: "Veja o que seus contatos estão postando",
      icon: "📰",
      route: "/feed",
      priority: 1,
    },
    {
      type: "content",
      title: "Assistir reels",
      description: "Conteúdo curto para relaxar",
      icon: "▶",
      route: "/reels",
      priority: 2,
    },
    {
      type: "action",
      title: "Conversar no chat",
      description: "Mensagens pendentes",
      icon: "💬",
      route: "/chat",
      priority: 3,
    },
  ],

  [ContextEnvironment.CITY]: [
    {
      type: "content",
      title: "Explorar por perto",
      description: "Lugares e pessoas na região",
      icon: "📍",
      route: "/discover",
      priority: 1,
    },
    {
      type: "action",
      title: "Ver eventos do dia",
      description: "O que acontece na cidade",
      icon: "📅",
      route: "/feed",
      priority: 2,
    },
    {
      type: "suggestion",
      title: "Compartilhar momento",
      description: "O que você está fazendo agora?",
      icon: "⚡",
      route: "/create/moment",
      priority: 3,
    },
  ],

  [ContextEnvironment.BUSINESS]: [
    {
      type: "content",
      title: "Dashboard de negócios",
      description: "Acompanhe suas métricas",
      icon: "📊",
      route: "/marketplace",
      priority: 1,
    },
    {
      type: "action",
      title: "Criar oferta",
      description: "Promova seus produtos",
      icon: "🏷",
      route: "/create/offer",
      priority: 2,
    },
    {
      type: "suggestion",
      title: "Gerenciar cupons",
      description: "Atraia novos clientes",
      icon: "🎟",
      route: "/marketplace/manage",
      priority: 3,
    },
  ],

  [ContextEnvironment.AIRPORT]: [
    {
      type: "action",
      title: "Solicitar corrida",
      description: "Motoristas no aeroporto",
      icon: "🚗",
      route: "/discover",
      priority: 1,
    },
    {
      type: "content",
      title: "Dicas de viagem",
      description: "Conteúdo para sua jornada",
      icon: "✈",
      route: "/feed",
      priority: 2,
    },
  ],

  [ContextEnvironment.UNIVERSITY]: [
    {
      type: "content",
      title: "Pessoas próximas",
      description: "Outros estudantes no campus",
      icon: "👥",
      route: "/pessoas",
      priority: 1,
    },
    {
      type: "suggestion",
      title: "Compartilhar estudio",
      description: "Poste sobre seus estudos",
      icon: "📚",
      route: "/create/text",
      priority: 2,
    },
    {
      type: "action",
      title: "Eventos acadêmicos",
      description: "Workshops e palestras",
      icon: "🎓",
      route: "/feed",
      priority: 3,
    },
  ],

  [ContextEnvironment.BEACH]: [
    {
      type: "content",
      title: "Momentos na praia",
      description: "Veja posts da praia",
      icon: "🏖",
      route: "/feed",
      priority: 1,
    },
    {
      type: "action",
      title: "Compartilhar foto",
      description: "Mostre sua vista",
      icon: "📸",
      route: "/create/photo",
      priority: 2,
    },
    {
      type: "suggestion",
      title: "Restaurantes na orla",
      description: "Onde comer perto da praia",
      icon: "🍽",
      route: "/discover",
      priority: 3,
    },
  ],

  [ContextEnvironment.PARK]: [
    {
      type: "content",
      title: "Atividades ao ar livre",
      description: "O que fazer no parque",
      icon: "🌳",
      route: "/discover",
      priority: 1,
    },
    {
      type: "action",
      title: "Criar momento",
      description: "Compartilhe sua experiência",
      icon: "⚡",
      route: "/create/moment",
      priority: 2,
    },
    {
      type: "suggestion",
      title: "Encontrar amigos",
      description: "Quem está no parque",
      icon: "👥",
      route: "/pessoas",
      priority: 3,
    },
  ],
};

/* ─── Period Rules ──────────────────────────────────────── */

const PERIOD_RULES: Record<ContextPeriodValue, { emphasize: string[]; suggest: string[] }> = {
  [ContextPeriod.MORNING]: {
    emphasize: ["feed", "events", "moment"],
    suggest: ["Bom dia! Veja o que aconteceu enquanto você dormia"],
  },
  [ContextPeriod.AFTERNOON]: {
    emphasize: ["marketplace", "offers", "places"],
    suggest: ["Hora do almoço? Confira ofertas próximas"],
  },
  [ContextPeriod.EVENING]: {
    emphasize: ["events", "reels", "ride"],
    suggest: ["Noite de entretenimento. Veja o que rola"],
  },
  [ContextPeriod.NIGHT]: {
    emphasize: ["chat", "reels", "feed"],
    suggest: ["Relaxe com conteúdo do feed ou converse no chat"],
  },
};

/* ─── Movement Rules ────────────────────────────────────── */

const MOVEMENT_RULES: Record<ContextMovementValue, { boost: string[]; suppress: string[] }> = {
  [ContextMovement.CALM]: {
    boost: ["feed", "reels", "chat", "text"],
    suppress: ["ride", "moment"],
  },
  [ContextMovement.NORMAL]: {
    boost: ["feed", "events", "places"],
    suppress: [],
  },
  [ContextMovement.BUSY]: {
    boost: ["ride", "offer", "marketplace"],
    suppress: ["reels", "text"],
  },
  [ContextMovement.CROWDED]: {
    boost: ["ride", "moment", "event"],
    suppress: ["text"],
  },
};

/* ─── Public API ────────────────────────────────────────── */

export function getEnvironmentRecommendations(
  environment: ContextEnvironmentValue,
): ContextRecommendation[] {
  const rules = ENVIRONMENT_RULES[environment] ?? [];
  return rules.map((r, i) => ({
    ...r,
    id: `${environment.toLowerCase()}-${i}`,
  }));
}

export function getPeriodEmphasis(period: ContextPeriodValue): {
  emphasize: string[];
  suggest: string[];
} {
  return PERIOD_RULES[period] ?? PERIOD_RULES[ContextPeriod.MORNING];
}

export function getMovementModifiers(movement: ContextMovementValue): {
  boost: string[];
  suppress: string[];
} {
  return MOVEMENT_RULES[movement] ?? MOVEMENT_RULES[ContextMovement.NORMAL];
}

export function getAllEnvironmentValues(): ContextEnvironmentValue[] {
  return Object.values(ContextEnvironment);
}
