/* =========================================================
   chat-format.ts — Time, date, and content formatting
   Pure TypeScript. No React. No side effects. No Supabase.
========================================================= */

import type { ChatMessage } from "./chat-types";
import { MessageKind } from "./chat-types";

/* ─── formatMessageTime ──────────────────────────────────── */

export function formatMessageTime(date: Date): string {
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ─── formatDateDivider ──────────────────────────────────── */

export function formatDateDivider(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffMs = today.getTime() - target.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Ontem";
  if (diffDays < 7) {
    return date.toLocaleDateString("pt-BR", { weekday: "long" });
  }
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

/* ─── formatFileSize ─────────────────────────────────────── */

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1).replace(".", ",")} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1).replace(".", ",")} GB`;
}

/* ─── formatAudioDuration ────────────────────────────────── */

export function formatAudioDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/* ─── formatConversationPreview ──────────────────────────── */

export function formatConversationPreview(message: ChatMessage | null): string {
  if (!message) return "Nenhuma mensagem ainda";

  switch (message.kind) {
    case MessageKind.TEXT:
      return message.text;
    case MessageKind.IMAGE:
      return message.from === "me" ? "📷 Você enviou uma foto" : "📷 Foto recebida";
    case MessageKind.VIDEO:
      return message.from === "me" ? "🎬 Você enviou um vídeo" : "🎬 Vídeo recebido";
    case MessageKind.AUDIO:
      return message.from === "me" ? "🎤 Mensagem de voz" : "🎤 Mensagem de voz recebida";
    case MessageKind.FILE:
      return message.from === "me"
        ? `📄 Você enviou ${message.fileName}`
        : `📄 ${message.fileName}`;
    case MessageKind.LOCATION:
      return message.from === "me"
        ? `📍 Você compartilhou ${message.label}`
        : `📍 ${message.label}`;
    default:
      return "";
  }
}

/* ─── formatConversationTime ─────────────────────────────── */

export function formatConversationTime(date: Date | null): string {
  if (!date) return "";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / (1000 * 60));
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `${diffMin}min`;
  if (diffH < 24) return `${diffH}h`;
  if (diffDays === 1) return "ontem";
  if (diffDays < 7) return `${diffDays}d`;

  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

/* ─── truncateText ───────────────────────────────────────── */

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}…`;
}
