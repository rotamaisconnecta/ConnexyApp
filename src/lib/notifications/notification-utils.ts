/* =========================================================
   notification-utils.ts — Pure utility functions
   for notifications. No React. No side effects.
========================================================= */

import { Colors } from "@/theme";
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
  [NotificationCategory.MESSAGE]: {
    icon: "MessageCircle",
    color: Colors.brand.primary,
    label: "Mensagem",
  },
  [NotificationCategory.CONNECTION_REQUEST]: {
    icon: "UserPlus",
    color: Colors.brand.secondary,
    label: "Pedido de conexão",
  },
  [NotificationCategory.CONNECTION_ACCEPTED]: {
    icon: "CheckCircle",
    color: Colors.success,
    label: "Conexão aceita",
  },
  [NotificationCategory.NEARBY_PERSON]: {
    icon: "MapPin",
    color: Colors.brand.light,
    label: "Pessoa próxima",
  },
  [NotificationCategory.NEARBY_MOMENT]: {
    icon: "Camera",
    color: Colors.brand.light,
    label: "Momento próximo",
  },
  [NotificationCategory.NEARBY_OFFER]: {
    icon: "Tag",
    color: Colors.warning,
    label: "Oferta perto de você",
  },
  [NotificationCategory.NEARBY_EVENT]: {
    icon: "Calendar",
    color: Colors.brand.primary,
    label: "Evento próximo",
  },
  [NotificationCategory.DRIVER_FOUND]: {
    icon: "Car",
    color: Colors.success,
    label: "Motorista encontrado",
  },
  [NotificationCategory.RIDE_STARTED]: {
    icon: "Navigation",
    color: Colors.brand.primary,
    label: "Corrida iniciada",
  },
  [NotificationCategory.RIDE_FINISHED]: {
    icon: "Flag",
    color: Colors.text.secondary,
    label: "Corrida finalizada",
  },
  [NotificationCategory.BUSINESS_FOLLOW]: {
    icon: "Building2",
    color: Colors.brand.primary,
    label: "Empresa começou a seguir",
  },
  [NotificationCategory.COUPON_AVAILABLE]: {
    icon: "Ticket",
    color: Colors.warning,
    label: "Cupom disponível",
  },
  [NotificationCategory.LIKE]: { icon: "Heart", color: Colors.danger, label: "Curtida" },
  [NotificationCategory.COMMENT]: {
    icon: "MessageSquare",
    color: Colors.brand.primary,
    label: "Comentário",
  },
  [NotificationCategory.MENTION]: {
    icon: "AtSign",
    color: Colors.brand.secondary,
    label: "Menção",
  },
  [NotificationCategory.SHARE]: {
    icon: "Share2",
    color: Colors.brand.primary,
    label: "Compartilhamento",
  },
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
