import type { Reel } from "./reel-types";
import { ReelCategory } from "./reel-types";
import { formatDistance } from "./reel-utils";

/* ─── Target tipado para navegação ──────────────────────── */

export type ReelContextTarget =
  | { type: "perfil"; id: string }
  | { type: "evento"; id: string }
  | { type: "local"; id: string }
  | { type: "negocio"; id: string }
  | { type: "oferta"; id: string }
  | { type: "corrida"; id: string };

export interface ReelContextInfo {
  badge: string;
  distance: string | null;
  actionLabel: string;
  actionTarget: ReelContextTarget;
  authorTarget: ReelContextTarget;
}

const PERSON_MAX_EXACT_DISTANCE = 2000;
const CLOSE_DISTANCE = 1000;

function sameDay(iso: string): boolean {
  const date = new Date(iso);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function shortDate(iso: string): string {
  const date = new Date(iso);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}`;
}

function targetForAuthor(reel: Reel): ReelContextTarget {
  if (reel.category === ReelCategory.BUSINESS && reel.business) {
    return { type: "negocio", id: reel.business.id };
  }
  if (reel.category === ReelCategory.OFFER && reel.business) {
    return { type: "oferta", id: reel.business.id };
  }
  if (reel.category === ReelCategory.EVENT && reel.event) {
    return { type: "evento", id: reel.event.id };
  }
  if (reel.category === ReelCategory.PLACE && reel.location) {
    return { type: "local", id: reel.location.id };
  }
  if (reel.category === ReelCategory.DRIVER && reel.driver) {
    return { type: "corrida", id: reel.driver.id };
  }
  if (reel.category === ReelCategory.TRAVEL && reel.location) {
    return { type: "local", id: reel.location.id };
  }
  if (reel.category === ReelCategory.NETWORKING && reel.event) {
    return { type: "evento", id: reel.event.id };
  }
  return { type: "perfil", id: reel.author.id };
}

export function getReelContext(reel: Reel): ReelContextInfo {
  const authorTarget = targetForAuthor(reel);
  const location = reel.location;

  let badge: string;
  let distance: string | null = null;
  let actionLabel: string;
  let actionTarget: ReelContextTarget;

  switch (reel.category) {
    case ReelCategory.PERSON:
      badge =
        location && location.distanceMeters < PERSON_MAX_EXACT_DISTANCE
          ? "Perto de você"
          : "Você por perto";
      if (location && location.distanceMeters < PERSON_MAX_EXACT_DISTANCE) {
        distance = "Bem próximo";
      } else if (location) {
        distance = formatDistance(location.distanceMeters);
      }
      actionLabel = "Conhecer perfil";
      actionTarget = { type: "perfil", id: reel.author.id };
      break;

    case ReelCategory.BUSINESS:
      badge =
        location && location.distanceMeters < CLOSE_DISTANCE ? "Bem próximo" : "Perto de você";
      if (location) distance = formatDistance(location.distanceMeters);
      actionLabel = "Ver negócio";
      actionTarget = reel.business
        ? { type: "negocio", id: reel.business.id }
        : { type: "perfil", id: reel.author.id };
      break;

    case ReelCategory.OFFER:
      badge = reel.business?.offers[0]?.validUntil
        ? sameDay(reel.business.offers[0].validUntil)
          ? "Hoje"
          : `Até ${shortDate(reel.business.offers[0].validUntil)}`
        : "Hoje";
      if (location) distance = formatDistance(location.distanceMeters);
      actionLabel = "Ativar oferta";
      actionTarget = reel.business
        ? { type: "oferta", id: reel.business.id }
        : { type: "perfil", id: reel.author.id };
      break;

    case ReelCategory.EVENT:
      badge = reel.event
        ? sameDay(reel.event.date)
          ? "Acontecendo agora"
          : `Em ${shortDate(reel.event.date)}`
        : "Hoje";
      if (location) distance = formatDistance(location.distanceMeters);
      actionLabel = "Ver evento";
      actionTarget = reel.event
        ? { type: "evento", id: reel.event.id }
        : { type: "perfil", id: reel.author.id };
      break;

    case ReelCategory.PLACE:
      badge =
        location && location.distanceMeters < CLOSE_DISTANCE ? "Bem próximo" : "Perto de você";
      if (location) distance = formatDistance(location.distanceMeters);
      actionLabel = "Ver local";
      actionTarget = location
        ? { type: "local", id: location.id }
        : { type: "perfil", id: reel.author.id };
      break;

    case ReelCategory.DRIVER:
      badge = reel.driver?.isAvailable ? "Disponível agora" : "Indisponível";
      if (location) distance = formatDistance(location.distanceMeters);
      actionLabel = "Pedir corrida";
      actionTarget = reel.driver
        ? { type: "corrida", id: reel.driver.id }
        : { type: "perfil", id: reel.author.id };
      break;

    case ReelCategory.NETWORKING:
      badge = reel.event ? "Acontecendo agora" : "Networking";
      if (location) distance = formatDistance(location.distanceMeters);
      actionLabel = reel.event ? "Ver evento" : "Conhecer perfil";
      actionTarget = reel.event
        ? { type: "evento", id: reel.event.id }
        : { type: "perfil", id: reel.author.id };
      break;

    case ReelCategory.TRAVEL:
      badge = location ? "Explore por perto" : "Viagem";
      if (location) distance = formatDistance(location.distanceMeters);
      actionLabel = location ? "Ver local" : "Conhecer perfil";
      actionTarget = location
        ? { type: "local", id: location.id }
        : { type: "perfil", id: reel.author.id };
      break;

    default:
      badge = sameDay(reel.createdAt) ? "Hoje" : `Em ${shortDate(reel.createdAt)}`;
      if (location) distance = formatDistance(location.distanceMeters);
      actionLabel = "Conhecer perfil";
      actionTarget = { type: "perfil", id: reel.author.id };
      break;
  }

  return { badge, distance, actionLabel, actionTarget, authorTarget };
}

export function contextActionTargetLabel(reel: Reel): ReelContextTarget {
  return getReelContext(reel).actionTarget;
}
