/* =========================================================
   notification-format.ts — Formatting helpers for
   notifications. Pure TypeScript. No React. No side effects.
========================================================= */

import { NotificationCategory } from "./notification-types";
import type { Notification, NotificationCategoryValue } from "./notification-types";

/* ─── Title formatters by category ──────────────────────── */

const TITLE_TEMPLATE: Record<NotificationCategoryValue, (n: Notification) => string> = {
  [NotificationCategory.MESSAGE]: (n) => `${n.actorName ?? "Alguém"} enviou uma mensagem`,
  [NotificationCategory.CONNECTION_REQUEST]: (n) => `${n.actorName ?? "Alguém"} quer se conectar`,
  [NotificationCategory.CONNECTION_ACCEPTED]: (n) =>
    `${n.actorName ?? "Alguém"} aceitou sua conexão`,
  [NotificationCategory.NEARBY_PERSON]: (n) => `${n.actorName ?? "Alguém"} está perto de você`,
  [NotificationCategory.NEARBY_MOMENT]: (n) => `${n.actorName ?? "Alguém"} compartilhou um momento`,
  [NotificationCategory.NEARBY_OFFER]: () => "Nova oferta perto de você",
  [NotificationCategory.NEARBY_EVENT]: () => "Evento acontecendo perto",
  [NotificationCategory.DRIVER_FOUND]: () => "Motorista encontrado",
  [NotificationCategory.RIDE_STARTED]: () => "Sua corrida começou",
  [NotificationCategory.RIDE_FINISHED]: () => "Corrida finalizada",
  [NotificationCategory.BUSINESS_FOLLOW]: (n) =>
    `${n.actorName ?? "Empresa"} começou a seguir você`,
  [NotificationCategory.COUPON_AVAILABLE]: () => "Novo cupom disponível",
  [NotificationCategory.LIKE]: (n) => `${n.actorName ?? "Alguém"} curtiu seu post`,
  [NotificationCategory.COMMENT]: (n) => `${n.actorName ?? "Alguém"} comentou no seu post`,
  [NotificationCategory.MENTION]: (n) => `${n.actorName ?? "Alguém"} te mencionou`,
  [NotificationCategory.SHARE]: (n) => `${n.actorName ?? "Alguém"} compartilhou seu post`,
};

/* ─── Public helpers ─────────────────────────────────────── */

export function formatNotificationTitle(notification: Notification): string {
  const formatter = TITLE_TEMPLATE[notification.category];
  return formatter ? formatter(notification) : notification.title;
}

export function formatNotificationBody(notification: Notification): string {
  return notification.body;
}

export function formatCount(count: number): string {
  if (count === 0) return "";
  if (count > 99) return "99+";
  return String(count);
}
