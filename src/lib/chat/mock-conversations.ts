/* =========================================================
   mock-conversations.ts — Simulated data for the "Conversas"
   list (Fios de Conexão).
   Dados simulados locais. Banco de dados ainda não conectado.
   Pure TypeScript. No React. No side effects. No Supabase.
========================================================= */

export const ThreadIcon = {
  COFFEE: "coffee",
  RUN: "run",
  EVENT: "event",
  MUSIC: "music",
  TRAVEL: "travel",
  WORK: "work",
  CINEMA: "cinema",
  NATURE: "nature",
} as const;

export type ThreadIconValue = (typeof ThreadIcon)[keyof typeof ThreadIcon];

export const LastMessageType = {
  TEXT: "text",
  AUDIO: "audio",
  EVENT: "event",
  LOCATION: "location",
  IMAGE: "image",
} as const;

export type LastMessageTypeValue = (typeof LastMessageType)[keyof typeof LastMessageType];

export const NextGesture = {
  REPLY: "reply",
  CONFIRM: "confirm",
  LISTEN: "listen",
  VIEW_EVENT: "view_event",
  RESUME: "resume",
} as const;

export type NextGestureValue = (typeof NextGesture)[keyof typeof NextGesture];

export interface MockParticipant {
  id: string;
  name: string;
  photo?: string;
}

export interface MockConversation {
  id: string;
  participant: MockParticipant;
  initials: string;
  isOnline: boolean;
  proximityMeters?: number;
  currentThread: string;
  threadIcon: ThreadIconValue;
  lastMessage: string;
  lastMessageType: LastMessageTypeValue;
  updatedAt: Date;
  unreadCount: number;
  isMuted: boolean;
  isPinned: boolean;
  nextGesture?: NextGestureValue;
  sharedInterest?: string;
}

const min = (n: number) => 60 * 1000 * n;
const hour = (n: number) => 60 * min(n);
const day = (n: number) => 24 * hour(n);

export const MOCK_CONVERSATIONS: MockConversation[] = [
  {
    id: "beatriz",
    participant: { id: "beatriz", name: "Beatriz", photo: "https://i.pravatar.cc/200?img=47" },
    initials: "BE",
    isOnline: true,
    proximityMeters: 15,
    currentThread: "Café e novos lugares",
    threadIcon: ThreadIcon.COFFEE,
    lastMessage: "Encontrei um café novo que você vai amar ☕",
    lastMessageType: LastMessageType.TEXT,
    updatedAt: new Date(Date.now() - 12 * min(1)),
    unreadCount: 2,
    isMuted: false,
    isPinned: true,
    nextGesture: NextGesture.REPLY,
    sharedInterest: "Café",
  },
  {
    id: "rafael",
    participant: { id: "rafael", name: "Rafael", photo: "https://i.pravatar.cc/200?img=13" },
    initials: "RA",
    isOnline: true,
    proximityMeters: 80,
    currentThread: "Corrida de domingo",
    threadIcon: ThreadIcon.RUN,
    lastMessage: "Você recebeu um áudio",
    lastMessageType: LastMessageType.AUDIO,
    updatedAt: new Date(Date.now() - 28 * min(1)),
    unreadCount: 1,
    isMuted: false,
    isPinned: false,
    nextGesture: NextGesture.LISTEN,
    sharedInterest: "Esportes",
  },
  {
    id: "larissa",
    participant: {
      id: "larissa",
      name: "Larissa",
      photo: "https://i.pravatar.cc/200?img=32",
    },
    initials: "LA",
    isOnline: true,
    proximityMeters: 600,
    currentThread: "Trilhas e natureza",
    threadIcon: ThreadIcon.NATURE,
    lastMessage: "Que tal uma trilha leve no domingo?",
    lastMessageType: LastMessageType.TEXT,
    updatedAt: new Date(Date.now() - 2 * hour(1)),
    unreadCount: 0,
    isMuted: true,
    isPinned: true,
    sharedInterest: "Socializar",
  },
  {
    id: "juliana",
    participant: { id: "juliana", name: "Juliana", photo: "https://i.pravatar.cc/200?img=45" },
    initials: "JU",
    isOnline: true,
    proximityMeters: 350,
    currentThread: "Evento de tecnologia",
    threadIcon: ThreadIcon.EVENT,
    lastMessage: "Evento salvo para sábado",
    lastMessageType: LastMessageType.EVENT,
    updatedAt: new Date(Date.now() - 1 * hour(1)),
    unreadCount: 0,
    isMuted: false,
    isPinned: false,
    nextGesture: NextGesture.VIEW_EVENT,
    sharedInterest: "Eventos",
  },
  {
    id: "carlos",
    participant: { id: "carlos", name: "Carlos", photo: "https://i.pravatar.cc/200?img=15" },
    initials: "CA",
    isOnline: false,
    proximityMeters: 1400,
    currentThread: "Networking e empreendedorismo",
    threadIcon: ThreadIcon.WORK,
    lastMessage: "Reunião confirmada para amanhã, 10h.",
    lastMessageType: LastMessageType.TEXT,
    updatedAt: new Date(Date.now() - 3 * hour(1)),
    unreadCount: 0,
    isMuted: false,
    isPinned: false,
    nextGesture: NextGesture.CONFIRM,
    sharedInterest: "Negócios",
  },
  {
    id: "thiago",
    participant: { id: "thiago", name: "Thiago", photo: "https://i.pravatar.cc/200?img=68" },
    initials: "TH",
    isOnline: true,
    proximityMeters: 200,
    currentThread: "Rolês de sexta",
    threadIcon: ThreadIcon.COFFEE,
    lastMessage: "Te mandei a localização do Café Central",
    lastMessageType: LastMessageType.LOCATION,
    updatedAt: new Date(Date.now() - 6 * hour(1)),
    unreadCount: 0,
    isMuted: false,
    isPinned: false,
    sharedInterest: "Gastronomia",
  },
  {
    id: "marina",
    participant: { id: "marina", name: "Marina", photo: "https://i.pravatar.cc/200?img=48" },
    initials: "MA",
    isOnline: true,
    proximityMeters: 3200,
    currentThread: "Música e ilustração",
    threadIcon: ThreadIcon.MUSIC,
    lastMessage: "Te mostro os rascunhos hoje à noite",
    lastMessageType: LastMessageType.TEXT,
    updatedAt: new Date(Date.now() - 5 * hour(1)),
    unreadCount: 0,
    isMuted: true,
    isPinned: false,
    nextGesture: NextGesture.RESUME,
    sharedInterest: "Arte",
  },
  {
    id: "ana",
    participant: { id: "ana", name: "Ana Lima" },
    initials: "AL",
    isOnline: false,
    currentThread: "Viagem para o litoral",
    threadIcon: ThreadIcon.TRAVEL,
    lastMessage: "Fechado o fim de semana na praia! 🏖",
    lastMessageType: LastMessageType.TEXT,
    updatedAt: new Date(Date.now() - 1 * day(1)),
    unreadCount: 0,
    isMuted: false,
    isPinned: false,
    nextGesture: NextGesture.RESUME,
    sharedInterest: "Viagens",
  },
  {
    id: "camila",
    participant: {
      id: "camila",
      name: "Camila",
      photo: "https://i.pravatar.cc/200?img=44",
    },
    initials: "CA",
    isOnline: false,
    currentThread: "Playlists compartilhadas",
    threadIcon: ThreadIcon.MUSIC,
    lastMessage: "Manda sua playlist do mês!",
    lastMessageType: LastMessageType.TEXT,
    updatedAt: new Date(Date.now() - 2 * day(1)),
    unreadCount: 0,
    isMuted: false,
    isPinned: false,
    sharedInterest: "Música",
  },
  {
    id: "diego",
    participant: { id: "diego", name: "Diego", photo: "https://i.pravatar.cc/200?img=52" },
    initials: "DI",
    isOnline: false,
    currentThread: "Cinema de fim de semana",
    threadIcon: ThreadIcon.CINEMA,
    lastMessage: "Bora no cinema sábado?",
    lastMessageType: LastMessageType.TEXT,
    updatedAt: new Date(Date.now() - 4 * day(1)),
    unreadCount: 0,
    isMuted: false,
    isPinned: false,
    sharedInterest: "Cinema",
  },
];

export function sortMockConversations(
  conversations: readonly MockConversation[],
): MockConversation[] {
  return [...conversations].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    const aUnread = a.unreadCount > 0 ? 1 : 0;
    const bUnread = b.unreadCount > 0 ? 1 : 0;
    if (aUnread !== bUnread) return bUnread - aUnread;
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });
}

export function searchMockConversations(
  conversations: readonly MockConversation[],
  query: string,
): MockConversation[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...conversations];

  return conversations.filter((conversation) =>
    [
      conversation.participant.name,
      conversation.lastMessage,
      conversation.currentThread,
      conversation.sharedInterest ?? "",
    ].some((value) => value.toLowerCase().includes(q)),
  );
}
