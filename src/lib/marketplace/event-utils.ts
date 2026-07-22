/* =========================================================
   event-utils.ts — Event utility functions
   Pure TypeScript. No React. No side effects.
========================================================= */

import type { BusinessEvent } from "./business-types";
import { EventStatus, type EventStatusValue } from "./business-types";

/* ─── getEventStatusLabel ────────────────────────────────── */

export function getEventStatusLabel(status: EventStatusValue): string {
  switch (status) {
    case EventStatus.UPCOMING:
      return "Próximo";
    case EventStatus.ONGOING:
      return "Acontecendo";
    case EventStatus.FINISHED:
      return "Finalizado";
    case EventStatus.CANCELLED:
      return "Cancelado";
    default:
      return status;
  }
}

/* ─── getEventStatusColor ───────────────────────────────── */

export function getEventStatusColor(status: EventStatusValue): string {
  switch (status) {
    case EventStatus.UPCOMING:
      return "text-blue-soft";
    case EventStatus.ONGOING:
      return "text-success";
    case EventStatus.FINISHED:
      return "text-muted-foreground";
    case EventStatus.CANCELLED:
      return "text-error";
    default:
      return "text-muted-foreground";
  }
}

/* ─── getEventStatusBgColor ─────────────────────────────── */

export function getEventStatusBgColor(status: EventStatusValue): string {
  switch (status) {
    case EventStatus.UPCOMING:
      return "bg-blue-soft/15 text-blue-soft";
    case EventStatus.ONGOING:
      return "bg-success/15 text-success";
    case EventStatus.FINISHED:
      return "bg-muted text-muted-foreground";
    case EventStatus.CANCELLED:
      return "bg-error/15 text-error";
    default:
      return "bg-muted text-muted-foreground";
  }
}

/* ─── isEventUpcoming ───────────────────────────────────── */

export function isEventUpcoming(event: BusinessEvent): boolean {
  return event.status === EventStatus.UPCOMING;
}

/* ─── isEventOngoing ────────────────────────────────────── */

export function isEventOngoing(event: BusinessEvent): boolean {
  return event.status === EventStatus.ONGOING;
}

/* ─── getUpcomingEvents ─────────────────────────────────── */

export function getUpcomingEvents(events: BusinessEvent[]): BusinessEvent[] {
  return events.filter(isEventUpcoming);
}

/* ─── getFeaturedEvents ─────────────────────────────────── */

export function getFeaturedEvents(events: BusinessEvent[]): BusinessEvent[] {
  return events.filter((e) => e.isFeatured && e.status !== EventStatus.CANCELLED);
}

/* ─── sortEventsByDate ──────────────────────────────────── */

export function sortEventsByDate(events: BusinessEvent[]): BusinessEvent[] {
  return [...events].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
}

/* ─── formatEventDate ───────────────────────────────────── */

export function formatEventDate(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* ─── formatEventTime ───────────────────────────────────── */

export function formatEventTime(date: Date): string {
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ─── formatEventDateTimeRange ──────────────────────────── */

export function formatEventDateTimeRange(start: Date, end: Date): string {
  const sameDay = start.toDateString() === end.toDateString();
  if (sameDay) {
    return `${formatEventDate(start)} · ${formatEventTime(start)} - ${formatEventTime(end)}`;
  }
  return `${formatEventDate(start)} - ${formatEventDate(end)}`;
}

/* ─── formatAttendeesCount ──────────────────────────────── */

export function formatAttendeesCount(count: number): string {
  if (count === 0) return "Nenhum participante";
  if (count === 1) return "1 participante";
  return `${count} participantes`;
}

/* ─── getEventCapacityPercent ───────────────────────────── */

export function getEventCapacityPercent(attendeesCount: number, capacity: number): number {
  if (capacity <= 0) return 0;
  return Math.min(100, Math.round((attendeesCount / capacity) * 100));
}

/* ─── getEventSummary ───────────────────────────────────── */

export interface EventSummary {
  total: number;
  upcoming: number;
  ongoing: number;
  featured: number;
}

export function getEventSummary(events: BusinessEvent[]): EventSummary {
  return {
    total: events.length,
    upcoming: getUpcomingEvents(events).length,
    ongoing: events.filter(isEventOngoing).length,
    featured: getFeaturedEvents(events).length,
  };
}
