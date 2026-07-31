export const CheckinStatus = {
  PENDING: "PENDING",
  CHECKED_IN: "CHECKED_IN",
  CHECKED_OUT: "CHECKED_OUT",
  INTERESTED: "INTERESTED",
  FAVORITE: "FAVORITE",
  FOLLOWING: "FOLLOWING",
} as const;

export type CheckinStatus = (typeof CheckinStatus)[keyof typeof CheckinStatus];

export const PresenceVisibility = {
  PUBLIC: "PUBLIC",
  FRIENDS: "FRIENDS",
  ANONYMOUS: "ANONYMOUS",
} as const;

export type PresenceVisibilityValue = (typeof PresenceVisibility)[keyof typeof PresenceVisibility];

export const PresenceVisibilityMeta: Record<
  PresenceVisibilityValue,
  { emoji: string; label: string; description: string }
> = {
  PUBLIC: {
    emoji: "🌍",
    label: "Público",
    description: "Todos poderão visualizar que você está presente.",
  },
  FRIENDS: {
    emoji: "👥",
    label: "Apenas amigos",
    description: "Somente amigos visualizarão sua presença.",
  },
  ANONYMOUS: {
    emoji: "🙈",
    label: "Anônimo",
    description:
      "Seu check-in contará para o movimento do local, mas seu nome não aparecerá em nenhuma lista.",
  },
};

export type PresenceTargetType = "place" | "event";

export interface PresenceRecord {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  visibility: PresenceVisibilityValue;
  targetId: string;
  targetName: string;
  targetType: PresenceTargetType;
  lat?: number;
  lng?: number;
  checkedInAt: string;
  leftAt?: string;
}

export const CheckinAction = {
  FAVORITE: "FAVORITE",
  FOLLOW_ORGANIZER: "FOLLOW_ORGANIZER",
  INTERESTED: "INTERESTED",
  PARTICIPATING: "PARTICIPATING",
  CHECK_IN: "CHECK_IN",
} as const;

export type CheckinAction = (typeof CheckinAction)[keyof typeof CheckinAction];

export interface CheckinEvent {
  id: string;
  name: string;
  category: string;
  venue: string;
  latitude: number;
  longitude: number;
  startTime: Date;
  endTime: Date;
  organizerId: string;
  organizerName: string;
  checkinRadius: number;
}

export interface CheckinUser {
  id: string;
  name: string;
  photo: string;
  status: CheckinStatus;
  checkedInAt?: Date;
  distanceMeters: number;
  visibility?: PresenceVisibilityValue;
}

export interface CheckinFeedItem {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  eventName: string;
  action: string;
  timestamp: Date;
}

export interface EventRoom {
  eventId: string;
  eventName: string;
  participantCount: number;
  participants: CheckinUser[];
}
