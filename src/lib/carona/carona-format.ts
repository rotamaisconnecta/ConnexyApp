/* =========================================================
   carona-format.ts — Formatação e apresentação da Carona
   Amiga. Sem estado, sem store, sem rede: apenas transforma o
   modelo existente em texto legível.
========================================================= */

import { addDays, format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"] as const;

export function caronaTodayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function caronaAddDaysIso(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

/** "2026-10-05" → Date local (sem deslocamento de fuso). */
export function caronaParseIsoDate(value: string | null | undefined): Date | null {
  if (typeof value !== "string") return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Rótulo curto de data: "Hoje", "Amanhã" ou "sex, 10/10". */
export function caronaDateLabel(value: string | null | undefined, todayIso?: string): string {
  const date = caronaParseIsoDate(value);
  if (!date) return "Data a combinar";
  const today = todayIso ?? caronaTodayIso();
  const todayDate = caronaParseIsoDate(today) ?? new Date();
  if (value === today) return "Hoje";
  const tomorrowDate = addDays(todayDate, 1);
  const tomorrowStr = format(tomorrowDate, "yyyy-MM-dd");
  if (value === tomorrowStr) return "Amanhã";
  const weekday = WEEKDAYS[date.getDay()] ?? "";
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${weekday}, ${dd}/${mm}`;
}

/** "Hoje • 18:30" — a forma usada em toda a experiência de mobilidade. */
export function caronaDateAndTimeLabel(
  date: string | null | undefined,
  time: string | null | undefined,
  todayIso?: string,
): string {
  const dateLabel = caronaDateLabel(date, todayIso);
  const timeLabel =
    typeof time === "string" && /^\d{1,2}:\d{2}$/.test(time.trim()) ? time.trim() : "";
  return timeLabel ? `${dateLabel} • ${timeLabel}` : dateLabel;
}

export function caronaWhenLabel(value: string | null | undefined, todayIso?: string): string {
  const time = typeof value === "string" && /^\d{1,2}:\d{2}$/.test(value.trim()) ? value.trim() : "";
  const date = caronaDateLabel(value, todayIso);
  return time ? `${date} • ${time}` : date;
}

export function caronaSeatsLabel(seats: number): string {
  const value = Math.max(0, Math.round(seats));
  if (value === 0) return "Sem vagas";
  return `${value} ${value === 1 ? "vaga" : "vagas"}`;
}

export function caronaRequestStatusLabel(status: string): string {
  switch (status) {
    case "requested":
      return "Aguardando resposta";
    case "accepted":
      return "Confirmada";
    case "rejected":
      return "Recusada";
    case "cancelled":
      return "Cancelada";
    default:
      return status;
  }
}

export function caronaOfferStatusLabel(status: string): string {
  switch (status) {
    case "active":
      return "Disponível";
    case "full":
      return "Esgotada";
    case "cancelled":
      return "Cancelada";
    case "completed":
      return "Concluída";
    default:
      return status;
  }
}