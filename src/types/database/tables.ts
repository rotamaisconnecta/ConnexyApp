import type { Database } from "@/integrations/supabase/types";

type Tables = Database["public"]["Tables"];
type TableName = keyof Tables;

/**
 * Some tables referenced by the repository/service layer are not part of the
 * generated database types yet. These helpers resolve to the generated shape
 * when available and fall back to a permissive record otherwise.
 */
type FallbackRow = Record<string, unknown>;

type Row<T extends string> = T extends TableName ? Tables[T]["Row"] : FallbackRow;
type Insert<T extends string> = T extends TableName ? Tables[T]["Insert"] : FallbackRow;
type Update<T extends string> = T extends TableName ? Tables[T]["Update"] : FallbackRow;

export type BioPost = Row<"bio_posts">;
export type BioPostInsert = Insert<"bio_posts">;
export type BioPostUpdate = Update<"bio_posts">;
export type BioPostRow = BioPost;

export type Place = Row<"places">;
export type PlaceInsert = Insert<"places">;
export type PlaceUpdate = Update<"places">;

export type Profile = Row<"profiles">;
export type ProfileInsert = Insert<"profiles">;
export type ProfileUpdate = Update<"profiles">;
export type ProfileRow = Profile;

export type Reel = Row<"reels">;
export type ReelInsert = Insert<"reels">;
export type ReelUpdate = Update<"reels">;

export type ReelComment = Row<"reel_comments">;
export type ReelCommentInsert = Insert<"reel_comments">;
export type ReelCommentUpdate = Update<"reel_comments">;

export type ReelLike = Row<"reel_likes">;
export type ReelLikeInsert = Insert<"reel_likes">;
export type ReelLikeUpdate = Update<"reel_likes">;

export type Conversation = Row<"conversations">;
export type ConversationInsert = Insert<"conversations">;
export type ConversationUpdate = Update<"conversations">;
export type ConversationRow = Conversation;

export type ConversationParticipant = Row<"conversation_participants">;
export type ConversationParticipantInsert = Insert<"conversation_participants">;
export type ConversationParticipantUpdate = Update<"conversation_participants">;

export type Message = Row<"messages">;
export type MessageInsert = Insert<"messages">;
export type MessageUpdate = Update<"messages">;
export type MessageRow = Message;

export type Notification = Row<"notifications">;
export type NotificationInsert = Insert<"notifications">;
export type NotificationUpdate = Update<"notifications">;
export type NotificationRow = Notification;

export type Ride = Row<"rides">;
export type RideInsert = Insert<"rides">;
export type RideUpdate = Update<"rides">;
export type RideRow = Ride;

export type Like = Row<"likes">;
export type LikeInsert = Insert<"likes">;
export type LikeUpdate = Update<"likes">;

export type Moment = Row<"moments">;
export type MomentInsert = Insert<"moments">;
export type MomentUpdate = Update<"moments">;
export type MomentRow = Moment;

export type Compatibility = Row<"compatibility">;
export type CompatibilityInsert = Insert<"compatibility">;
export type CompatibilityUpdate = Update<"compatibility">;
export type CompatibilityRow = Compatibility;

export type ConnectionRequest = Row<"connection_requests">;
export type ConnectionRequestInsert = Insert<"connection_requests">;
export type ConnectionRequestUpdate = Update<"connection_requests">;

export type Business = Row<"businesses">;
export type BusinessInsert = Insert<"businesses">;
export type BusinessUpdate = Update<"businesses">;
export type BusinessRow = Business;

export type Event = Row<"events">;
export type EventInsert = Insert<"events">;
export type EventUpdate = Update<"events">;
export type EventRow = Event;

export type EventUser = Row<"event_users">;
export type EventUserInsert = Insert<"event_users">;
export type EventUserUpdate = Update<"event_users">;

export type Offer = Row<"offers">;
export type OfferInsert = Insert<"offers">;
export type OfferUpdate = Update<"offers">;
export type OfferRow = Offer;

export type Coupon = Row<"coupons">;
export type CouponInsert = Insert<"coupons">;
export type CouponUpdate = Update<"coupons">;
export type CouponRow = Coupon;

export type Review = Row<"reviews">;
export type ReviewInsert = Insert<"reviews">;
export type ReviewUpdate = Update<"reviews">;
