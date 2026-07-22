/* =========================================================
   chat-types.ts — Chat Premium type definitions
   Pure TypeScript. No React. No side effects. No Supabase.
========================================================= */

/* ─── Enums ──────────────────────────────────────────────── */

export const MessageKind = {
  TEXT: "text",
  IMAGE: "image",
  VIDEO: "video",
  AUDIO: "audio",
  FILE: "file",
  LOCATION: "location",
} as const;

export type MessageKindValue = (typeof MessageKind)[keyof typeof MessageKind];

export const MessageStatus = {
  SENDING: "sending",
  SENT: "sent",
  DELIVERED: "delivered",
  READ: "read",
} as const;

export type MessageStatusValue = (typeof MessageStatus)[keyof typeof MessageStatus];

export const ConversationSort = {
  LAST_MESSAGE: "LAST_MESSAGE",
  UNREAD: "UNREAD",
  ALPHABETICAL: "ALPHABETICAL",
} as const;

export type ConversationSortValue = (typeof ConversationSort)[keyof typeof ConversationSort];

export const QUICK_REACTIONS = ["❤️", "😂", "😮", "😢", "👍", "🔥"] as const;

export type QuickReaction = (typeof QUICK_REACTIONS)[number];

/* ─── Message Base ───────────────────────────────────────── */

export interface MessageBase {
  id: string;
  conversationId: string;
  from: "me" | "them";
  at: Date;
  status: MessageStatusValue;
  reaction?: QuickReaction;
}

/* ─── Message Variants ───────────────────────────────────── */

export interface TextMessage extends MessageBase {
  kind: typeof MessageKind.TEXT;
  text: string;
}

export interface ImageMessage extends MessageBase {
  kind: typeof MessageKind.IMAGE;
  url: string;
  caption?: string;
  width?: number;
  height?: number;
}

export interface VideoMessage extends MessageBase {
  kind: typeof MessageKind.VIDEO;
  url: string;
  thumbnail?: string;
  durationSec?: number;
}

export interface AudioMessage extends MessageBase {
  kind: typeof MessageKind.AUDIO;
  durationSec: number;
  waveform?: number[];
}

export interface FileMessage extends MessageBase {
  kind: typeof MessageKind.FILE;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface LocationMessage extends MessageBase {
  kind: typeof MessageKind.LOCATION;
  label: string;
  proximity: string;
  lat?: number;
  lng?: number;
  cover?: string;
}

/* ─── Union ──────────────────────────────────────────────── */

export type ChatMessage =
  TextMessage | ImageMessage | VideoMessage | AudioMessage | FileMessage | LocationMessage;

export type MessageDraft =
  | Pick<TextMessage, "from" | "kind" | "text">
  | Pick<AudioMessage, "from" | "kind" | "durationSec">
  | Pick<LocationMessage, "from" | "kind" | "label" | "proximity">
  | Pick<ImageMessage, "from" | "kind" | "url">
  | Pick<VideoMessage, "from" | "kind" | "url">
  | Pick<FileMessage, "from" | "kind" | "fileName" | "fileSize" | "mimeType">;

/* ─── Conversation ───────────────────────────────────────── */

export interface ConversationParticipant {
  id: string;
  name: string;
  photo: string;
  online: boolean;
  lastSeen?: string;
}

export interface Conversation {
  id: string;
  participant: ConversationParticipant;
  lastMessage: ChatMessage | null;
  unreadCount: number;
  pinned: boolean;
  muted: boolean;
  createdAt: Date;
}

/* ─── Typing ─────────────────────────────────────────────── */

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  startedAt: Date;
}

/* ─── Search ─────────────────────────────────────────────── */

export interface ChatSearchResult {
  messageId: string;
  conversationId: string;
  snippet: string;
  matchStart: number;
  matchEnd: number;
}

/* ─── Filters ────────────────────────────────────────────── */

export interface ConversationFilters {
  query: string;
  unreadOnly: boolean;
  onlineOnly: boolean;
}

export const INITIAL_CONVERSATION_FILTERS: ConversationFilters = {
  query: "",
  unreadOnly: false,
  onlineOnly: false,
};

/* ─── Attachment Types ───────────────────────────────────── */

export interface AttachmentOption {
  kind: MessageKindValue;
  label: string;
  icon: string;
}

export const ATTACHMENT_OPTIONS: AttachmentOption[] = [
  { kind: MessageKind.IMAGE, label: "Foto", icon: "📷" },
  { kind: MessageKind.VIDEO, label: "Vídeo", icon: "🎬" },
  { kind: MessageKind.AUDIO, label: "Áudio", icon: "🎤" },
  { kind: MessageKind.FILE, label: "Arquivo", icon: "📄" },
  { kind: MessageKind.LOCATION, label: "Localização", icon: "📍" },
];
