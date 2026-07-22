/* =========================================================
   notification-utils.ts — Pure utility functions
   for notifications. No React. No side effects.
========================================================= */

import { NotificationCategory, NotificationPriority } from "./notification-types";
import type {
  Notification,
  NotificationCategoryValue,
  NotificationPriorityValue,
} from "./notification-types";

/* ─── Category metadata ──────────────────────────────────── */

const CATEGORY_META: Record<
  NotificationCategoryValue,
  { icon: string; color: string; label: string }
> = {
  [NotificationCategory.MESSAGE]: { icon: "MessageCircle", color: "#6C3BFF", label: "Mensagem" },
  [NotificationCategory.CONNECTION_REQUEST]: {
    icon: "UserPlus",
    color: "#8B5CFF",
    label: "Pedido de conexão",
  },
  [NotificationCategory.CONNECTION_ACCEPTED]: {
    icon: "CheckCircle",
    color: "#22C55E",
    label: "Conexão aceita",
  },
  [NotificationCategory.NEARBY_PERSON]: {
    icon: "MapPin",
    color: "#A88DFF",
    label: "Pessoa próxima",
  },
  [NotificationCategory.NEARBY_MOMENT]: {
    icon: "Camera",
    color: "#EC4899",
    label: "Momento próximo",
  },
  [NotificationCategory.NEARBY_OFFER]: {
    icon: "Tag",
    color: "#F59E0B",
    label: "Oferta perto de você",
  },
  [NotificationCategory.NEARBY_EVENT]: {
    icon: "Calendar",
    color: "#3B82F6",
    label: "Evento próximo",
  },
  [NotificationCategory.DRIVER_FOUND]: {
    icon: "Car",
    color: "#22C55E",
    label: "Motorista encontrado",
  },
  [NotificationCategory.RIDE_STARTED]: {
    icon: "Navigation",
    color: "#6C3BFF",
    label: "Corrida iniciada",
  },
  [NotificationCategory.RIDE_FINISHED]: {
    icon: "Flag",
    color: "#71717A",
    label: "Corrida finalizada",
  },
  [NotificationCategory.BUSINESS_FOLLOW]: {
    icon: "Building2",
    color: "#3B82F6",
    label: "Empresa começou a seguir",
  },
  [NotificationCategory.COUPON_AVAILABLE]: {
    icon: "Ticket",
    color: "#F59E0B",
    label: "Cupom disponível",
  },
  [NotificationCategory.LIKE]: { icon: "Heart", color: "#EF4444", label: "Curtida" },
  [NotificationCategory.COMMENT]: { icon: "MessageSquare", color: "#6C3BFF", label: "Comentário" },
  [NotificationCategory.MENTION]: { icon: "AtSign", color: "#A855F7", label: "Menção" },
  [NotificationCategory.SHARE]: { icon: "Share2", color: "#3B82F6", label: "Compartilhamento" },
};

export function getCategoryIcon(category: NotificationCategoryValue): string {
  return CATEGORY_META[category].icon;
}

export function getCategoryColor(category: NotificationCategoryValue): string {
  return CATEGORY_META[category].color;
}

export function getCategoryLabel(category: NotificationCategoryValue): string {
  return CATEGORY_META[category].label;
}

/* ─── Priority sort weight ───────────────────────────────── */

const PRIORITY_WEIGHT: Record<NotificationPriorityValue, number> = {
  [NotificationPriority.HIGH]: 3,
  [NotificationPriority.MEDIUM]: 2,
  [NotificationPriority.LOW]: 1,
};

export function getPriorityWeight(priority: NotificationPriorityValue): number {
  return PRIORITY_WEIGHT[priority];
}

/* ─── Sorting ────────────────────────────────────────────── */

export function sortByPriority(items: Notification[]): Notification[] {
  return [...items].sort((a, b) => getPriorityWeight(b.priority) - getPriorityWeight(a.priority));
}

export function sortByDate(items: Notification[]): Notification[] {
  return [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

/* ─── Count helpers ──────────────────────────────────────── */

export function countUnread(items: Notification[]): number {
  return items.filter((n) => !n.isRead).length;
}

/* ─── Time-relative labels ───────────────────────────────── */

export function getRelativeTimeLabel(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Agora";
  if (diffMin < 60) return `${diffMin}min`;

  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;

  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "Ontem";
  if (diffD < 7) return `${diffD}d`;

  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}
