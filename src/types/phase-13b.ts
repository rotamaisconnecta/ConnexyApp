export type ConnectionRequestStatus = "pending" | "accepted" | "rejected" | "canceled";
export type PresenceStatus = "online" | "available" | "dnd";
export type PresencePreference = PresenceStatus | "invisible";
export type MessageKind = "text" | "share" | "audio" | "system";

export interface ConnectionRequestRow {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: ConnectionRequestStatus;
  created_at: string;
  responded_at: string | null;
}

export interface ConnectionRow {
  id: string;
  user_a_id: string;
  user_b_id: string;
  created_at: string;
}

export interface UserLocationInput {
  latitude: number;
  longitude: number;
  accuracy_m?: number | null;
  discoverable: boolean;
}

export interface NearbyProfile {
  id: string;
  name: string;
  handle: string;
  photo_url: string | null;
  headline: string | null;
  age: number | null;
  common_interests: string[];
  common_vibe_tags: string[];
  common_looks_for: string[];
  compatibility_score: number | null;
  proximity_tier: "very_close" | "around_here" | "nearby" | "distance";
  distance_km: number | null;
}

export interface UserPresenceRow {
  user_id: string;
  status: PresenceStatus;
  last_seen_at: string;
  updated_at: string;
}

export const PRESENCE_TTL_MS = 90_000;
export const PRESENCE_HEARTBEAT_MS = 45_000;

export function isPresenceFresh(presence: UserPresenceRow, now = Date.now()): boolean {
  return now - new Date(presence.last_seen_at).getTime() < PRESENCE_TTL_MS;
}
