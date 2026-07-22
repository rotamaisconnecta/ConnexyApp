/* =========================================================
   message-status.ts — Message delivery status utilities
   Pure TypeScript. No React. No side effects. No Supabase.
========================================================= */

import { MessageStatus, type MessageStatusValue } from "./chat-types";

/* ─── getStatusConfig ────────────────────────────────────── */

interface StatusConfig {
  label: string;
  color: string;
  icon: "sending" | "sent" | "delivered" | "read";
}

const STATUS_CONFIG: Record<MessageStatusValue, StatusConfig> = {
  [MessageStatus.SENDING]: {
    label: "Enviando",
    color: "text-muted-foreground",
    icon: "sending",
  },
  [MessageStatus.SENT]: {
    label: "Enviada",
    color: "text-muted-foreground",
    icon: "sent",
  },
  [MessageStatus.DELIVERED]: {
    label: "Recebida",
    color: "text-muted-foreground",
    icon: "delivered",
  },
  [MessageStatus.READ]: {
    label: "Lida",
    color: "text-primary",
    icon: "read",
  },
};

export function getStatusConfig(status: MessageStatusValue): StatusConfig {
  return STATUS_CONFIG[status];
}

/* ─── getStatusColor ─────────────────────────────────────── */

export function getStatusColor(status: MessageStatusValue): string {
  return STATUS_CONFIG[status].color;
}

/* ─── getStatusLabel ─────────────────────────────────────── */

export function getStatusLabel(status: MessageStatusValue): string {
  return STATUS_CONFIG[status].label;
}

/* ─── getStatusOrder ─────────────────────────────────────── */

export function getStatusOrder(status: MessageStatusValue): number {
  switch (status) {
    case MessageStatus.SENDING:
      return 0;
    case MessageStatus.SENT:
      return 1;
    case MessageStatus.DELIVERED:
      return 2;
    case MessageStatus.READ:
      return 3;
    default:
      return 0;
  }
}

/* ─── canRetry ───────────────────────────────────────────── */

export function canRetry(status: MessageStatusValue): boolean {
  return status === MessageStatus.SENDING;
}

/* ─── advanceStatus ──────────────────────────────────────── */

export function advanceStatus(current: MessageStatusValue): MessageStatusValue {
  switch (current) {
    case MessageStatus.SENDING:
      return MessageStatus.SENT;
    case MessageStatus.SENT:
      return MessageStatus.DELIVERED;
    case MessageStatus.DELIVERED:
      return MessageStatus.READ;
    default:
      return current;
  }
}

/* ─── mergeStatus ────────────────────────────────────────── */

export function mergeStatus(
  current: MessageStatusValue,
  incoming: MessageStatusValue,
): MessageStatusValue {
  const currentOrder = getStatusOrder(current);
  const incomingOrder = getStatusOrder(incoming);
  return incomingOrder > currentOrder ? incoming : current;
}
