import { people as mockPeople, type Person } from "@/lib/mock-data";
import { getDemoPosts, type DemoPost } from "@/lib/demo/demo-posts";
import { HOME_EVENTS } from "@/lib/feed/home-premium";
import { getAllBusinesses } from "@/lib/marketplace/mock-businesses";
import { allEngineEvents } from "@/lib/engine/engine-detail";
import { parseHomeEventDate } from "@/lib/marketplace/local-event-lookup";
import { mergeCatalogPlaces } from "@/lib/catalog/local-catalog";
import { places as mockPlaces } from "@/lib/mock-data";
import {
  isBusinessOpenAt,
  isPlaceOpenAt,
  matchesDayPeriod,
  periodFromHour,
  rankPulseItems,
  temporalState,
  type PulseRankable,
} from "@/lib/home/pulse-relevance";

const EVENT_DURATION_MS = 2 * 60 * 60 * 1000;
const RECENT_POST_MS = 24 * 60 * 60 * 1000;
const HAPPENING_LIMIT = 6;
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800";

export type HappeningNowTarget =
  | { to: "/solicitacao/$id"; params: { id: string }; search: { mode: "receive" } }
  | { to: "/perfil/$id"; params: { id: string } }
  | { to: "/event/$eventId"; params: { eventId: string } }
  | { to: "/local/$id"; params: { id: string } }
  | { to: "/business/$businessId"; params: { businessId: string } };

export type HappeningNowCard = {
  id: string;
  kind: "request" | "post" | "moment" | "event" | "business" | "offer" | "place";
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  tone: "primary" | "amber";
  target: HappeningNowTarget;
};

export type HappeningNowInput = {
  now?: Date;
  pendingRequest?: { fromUserId: string; message?: string } | null;
  posts?: DemoPost[];
  people?: Person[];
};

type RankedHappening = HappeningNowCard & PulseRankable;

function isRecentMoment(createdAgo: string): boolean {
  const value = createdAgo.toLowerCase();
  if (value.includes("ontem") || /\d+\s*d/.test(value) || value.includes("dia")) return false;
  return value.includes("min") || /\d+\s*h/.test(value) || value.includes("agora");
}

function uniqueCards(cards: HappeningNowCard[]): HappeningNowCard[] {
  const seen = new Set<string>();
  const unique: HappeningNowCard[] = [];
  for (const card of cards) {
    if (seen.has(card.id)) continue;
    seen.add(card.id);
    unique.push(card);
  }
  return unique;
}

function liveEventCards(now: Date): RankedHappening[] {
  const cards: RankedHappening[] = [];

  for (const event of HOME_EVENTS) {
    const start = parseHomeEventDate(event.date, event.time, now);
    const end = new Date(start.getTime() + EVENT_DURATION_MS);
    const rank: PulseRankable = {
      distanceMeters: event.distanceMeters,
      kind: "event",
      category: event.category,
      title: event.name,
      startAt: start.getTime(),
      endAt: end.getTime(),
    };
    const state = temporalState(rank, now);
    if (state !== "happening" && state !== "startingSoon") continue;
    cards.push({
      ...rank,
      id: `event:${event.id}`,
      kind: "event",
      eyebrow: state === "happening" ? "Acontecendo agora" : "Começa em breve",
      title: event.name,
      description: [event.date, event.time, event.location].filter(Boolean).join(" · "),
      image: event.banner,
      tone: "amber",
      target: { to: "/event/$eventId", params: { eventId: event.id } },
    });
  }

  for (const event of allEngineEvents()) {
    const rank: PulseRankable = {
      distanceMeters: 900,
      kind: "event",
      category: event.title,
      title: event.title,
      summary: event.description,
      startAt: event.startDate.getTime(),
      endAt: event.endDate.getTime(),
    };
    const state = temporalState(rank, now);
    if (state !== "happening" && state !== "startingSoon") continue;
    cards.push({
      ...rank,
      id: `event:${event.id}`,
      kind: "event",
      eyebrow: state === "happening" ? "Acontecendo agora" : "Começa em breve",
      title: event.title,
      description: [event.description, event.location].filter(Boolean).join(" · "),
      image: event.photo || FALLBACK_IMAGE,
      tone: "amber",
      target: { to: "/event/$eventId", params: { eventId: event.id } },
    });
  }

  return cards;
}

function livePlaceCards(now: Date): RankedHappening[] {
  return mergeCatalogPlaces(mockPlaces)
    .filter((place) => isPlaceOpenAt(place.hours, now))
    .map((place) => {
      const rank: PulseRankable = {
        distanceMeters: place.distanceMeters,
        kind: "place",
        category: place.category,
        title: place.name,
        summary: place.description,
        openNow: true,
        tags: [place.category],
      };
      return {
        ...rank,
        id: `place:${place.id}`,
        kind: "place" as const,
        eyebrow: place.hours,
        title: place.name,
        description: place.description,
        image: place.cover,
        tone: "amber" as const,
        target: { to: "/local/$id" as const, params: { id: place.id } },
      };
    });
}

function liveBusinessCards(now: Date): RankedHappening[] {
  const period = periodFromHour(now.getHours());
  const cards: RankedHappening[] = [];
  for (const business of getAllBusinesses()) {
    if (!isBusinessOpenAt(business, now)) continue;
    const photo =
      business.photos.find((entry) => entry.isPrimary)?.url ?? business.photos[0]?.url ?? FALLBACK_IMAGE;
    const businessRank: PulseRankable = {
      distanceMeters: business.distanceMeters,
      kind: "business",
      category: business.category,
      title: business.name,
      summary: business.description,
      openNow: true,
      tags: business.tags,
      createdAt: business.createdAt.getTime(),
    };
    const nearOrPeriod = matchesDayPeriod(businessRank, period) || business.distanceMeters <= 1500;
    if (nearOrPeriod) {
      cards.push({
        ...businessRank,
        id: `business:${business.id}`,
        kind: "business",
        eyebrow: "Aberto agora",
        title: business.name,
        description: business.description,
        image: photo,
        tone: "amber",
        target: { to: "/business/$businessId", params: { businessId: business.id } },
      });
    }
    for (const promotion of business.promotions) {
      if (!promotion.isActive) continue;
      const offerRank: PulseRankable = {
        distanceMeters: business.distanceMeters,
        kind: "offer",
        category: business.category,
        title: promotion.title,
        summary: promotion.description,
        isActiveOffer: true,
        openNow: true,
        tags: business.tags,
      };
      cards.push({
        ...offerRank,
        id: `offer:${promotion.id}`,
        kind: "offer",
        eyebrow: "Oferta ativa",
        title: promotion.title,
        description: promotion.description,
        image: photo,
        tone: "amber",
        target: { to: "/business/$businessId", params: { businessId: business.id } },
      });
    }
  }
  return cards;
}

function momentCards(people: Person[]): RankedHappening[] {
  const cards: RankedHappening[] = [];
  for (const person of people) {
    const moment = person.moments?.[0];
    if (!moment || !isRecentMoment(moment.createdAgo)) continue;
    const rank: PulseRankable = {
      distanceMeters: person.distanceMeters,
      kind: "moment",
      category: person.interests.join(" "),
      title: person.name,
      summary: moment.text,
      createdAt: Date.now(),
      favorite: true,
    };
    cards.push({
      ...rank,
      id: `moment:${person.id}:${moment.id}`,
      kind: "moment",
      eyebrow: "Publicação recente",
      title: person.name,
      description: moment.text,
      image: moment.photo ?? person.photo,
      tone: "primary",
      target: { to: "/perfil/$id", params: { id: person.id } },
    });
  }
  return cards;
}

function postCards(posts: DemoPost[], now: Date): RankedHappening[] {
  return posts
    .filter((post) => now.getTime() - post.createdAt <= RECENT_POST_MS)
    .map((post) => {
      const rank: PulseRankable = {
        distanceMeters: 0,
        kind: "post",
        category: post.category ?? undefined,
        title: post.authorName,
        summary: post.text,
        createdAt: post.createdAt,
        favorite: true,
      };
      return {
        ...rank,
        id: `post:${post.id}`,
        kind: "post" as const,
        eyebrow: "Publicação recente",
        title: post.authorName,
        description: post.text,
        image: post.media[0]?.preview ?? post.authorPhoto,
        tone: "primary" as const,
        target: { to: "/perfil/$id" as const, params: { id: post.authorId } },
      };
    });
}

export function listHappeningNowCards(input: HappeningNowInput = {}): HappeningNowCard[] {
  const now = input.now ?? new Date();
  const people = input.people ?? mockPeople;
  const posts = input.posts ?? (typeof window === "undefined" ? [] : getDemoPosts());

  let pending: HappeningNowCard | null = null;
  if (input.pendingRequest) {
    const person =
      people.find((entry) => entry.id === input.pendingRequest?.fromUserId) ?? people[0];
    if (person) {
      pending = {
        id: `request:${person.id}`,
        kind: "request",
        eyebrow: "Novo pedido de conversa",
        title: person.name,
        description: input.pendingRequest.message || "Quer conversar com você.",
        image: person.photo,
        tone: "primary",
        target: {
          to: "/solicitacao/$id",
          params: { id: person.id },
          search: { mode: "receive" },
        },
      };
    }
  }

  const ranked = rankPulseItems(
    [
      ...postCards(posts, now),
      ...momentCards(people),
      ...liveEventCards(now),
      ...livePlaceCards(now),
      ...liveBusinessCards(now),
    ],
    now,
  );

  const live = uniqueCards(ranked).slice(0, pending ? HAPPENING_LIMIT - 1 : HAPPENING_LIMIT);
  return uniqueCards(pending ? [pending, ...live] : live);
}
