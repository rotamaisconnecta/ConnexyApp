import type { SchemaADatabase } from "../schema-a-database";

export type SchemaATables = SchemaADatabase["public"]["Tables"];

export type ProfileRow = SchemaATables["profiles"]["Row"];
export type ProfileUpdate = SchemaATables["profiles"]["Update"];
export type ProfilePrivateRow = SchemaATables["profile_private"]["Row"];
export type ProfilePrivateUpdate = SchemaATables["profile_private"]["Update"];

export type FollowRow = SchemaATables["follows"]["Row"];
export type ConnectionRequestRow = SchemaATables["connection_requests"]["Row"];
export type ConnectionRow = SchemaATables["connections"]["Row"];

export type ConversationRow = SchemaATables["conversations"]["Row"];
export type ConversationParticipantRow = SchemaATables["conversation_participants"]["Row"];
export type MessageRow = SchemaATables["messages"]["Row"];

export type PostRow = SchemaATables["posts"]["Row"];
export type ReelRow = SchemaATables["reels"]["Row"];
export type ReelLikeRow = SchemaATables["reel_likes"]["Row"];
export type ReelCommentRow = SchemaATables["reel_comments"]["Row"];

export type BusinessRow = SchemaATables["businesses"]["Row"];
export type PlaceRow = SchemaATables["places"]["Row"];
export type EventRow = SchemaATables["events"]["Row"];
export type OfferRow = SchemaATables["offers"]["Row"];

export type ReservationRow = SchemaATables["reservations"]["Row"];
export type CaronaOfferRow = SchemaATables["carona_offers"]["Row"];
export type CaronaRequestRow = SchemaATables["carona_requests"]["Row"];
export type SaveRow = SchemaATables["saves"]["Row"];

export type ConnectionRequestStatus = "pending" | "accepted" | "declined";
export type ConversationKind = "direct" | "group";
export type ParticipantStatus = "pending" | "accepted" | "declined" | "cancelled";
export type MessageKind = "text" | "event" | "location" | "image" | "video" | "audio" | "call";
export type PostPrivacy = "PUBLIC" | "CONNECTIONS" | "PRIVATE";
export type ReservationStatus = "pending" | "confirmed" | "cancelled";
export type ReservationResourceType = "business" | "place";
export type CaronaOfferStatus = "active" | "full" | "cancelled" | "completed";
export type CaronaRequestStatus = "requested" | "accepted" | "rejected" | "cancelled";
export type SaveTargetType = "business" | "place" | "event" | "offer" | "reel" | "post";
