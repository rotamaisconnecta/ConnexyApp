import type { Database } from "@/integrations/supabase/types";

type Tables = Database["public"]["Tables"];

export type BioPost = Tables["bio_posts"]["Row"];
export type BioPostInsert = Tables["bio_posts"]["Insert"];
export type BioPostUpdate = Tables["bio_posts"]["Update"];
export type BioPostRow = BioPost;

export type Place = Tables["places"]["Row"];
export type PlaceInsert = Tables["places"]["Insert"];
export type PlaceUpdate = Tables["places"]["Update"];

export type Profile = Tables["profiles"]["Row"];
export type ProfileInsert = Tables["profiles"]["Insert"];
export type ProfileUpdate = Tables["profiles"]["Update"];
export type ProfileRow = Profile;

export type Reel = Tables["reels"]["Row"];
export type ReelInsert = Tables["reels"]["Insert"];
export type ReelUpdate = Tables["reels"]["Update"];

export type ReelComment = Tables["reel_comments"]["Row"];
export type ReelCommentInsert = Tables["reel_comments"]["Insert"];
export type ReelCommentUpdate = Tables["reel_comments"]["Update"];

export type ReelLike = Tables["reel_likes"]["Row"];
export type ReelLikeInsert = Tables["reel_likes"]["Insert"];
export type ReelLikeUpdate = Tables["reel_likes"]["Update"];

export type Conversation = Tables["conversations"]["Row"];
export type ConversationInsert = Tables["conversations"]["Insert"];
export type ConversationUpdate = Tables["conversations"]["Update"];
export type ConversationRow = Conversation;

export type ConversationParticipant = Tables["conversation_participants"]["Row"];
export type ConversationParticipantInsert = Tables["conversation_participants"]["Insert"];
export type ConversationParticipantUpdate = Tables["conversation_participants"]["Update"];

export type Message = Tables["messages"]["Row"];
export type MessageInsert = Tables["messages"]["Insert"];
export type MessageUpdate = Tables["messages"]["Update"];
export type MessageRow = Message;

export type Notification = Tables["notifications"]["Row"];
export type NotificationInsert = Tables["notifications"]["Insert"];
export type NotificationUpdate = Tables["notifications"]["Update"];
export type NotificationRow = Notification;

export type Ride = Tables["rides"]["Row"];
export type RideInsert = Tables["rides"]["Insert"];
export type RideUpdate = Tables["rides"]["Update"];
export type RideRow = Ride;

export type Like = Tables["likes"]["Row"];
export type LikeInsert = Tables["likes"]["Insert"];
export type LikeUpdate = Tables["likes"]["Update"];

export type Moment = Tables["moments"]["Row"];
export type MomentInsert = Tables["moments"]["Insert"];
export type MomentUpdate = Tables["moments"]["Update"];
export type MomentRow = Moment;

export type Compatibility = Tables["compatibility"]["Row"];
export type CompatibilityInsert = Tables["compatibility"]["Insert"];
export type CompatibilityUpdate = Tables["compatibility"]["Update"];
export type CompatibilityRow = Compatibility;

export type ConnectionRequest = Tables["connection_requests"]["Row"];
export type ConnectionRequestInsert = Tables["connection_requests"]["Insert"];
export type ConnectionRequestUpdate = Tables["connection_requests"]["Update"];

export type Business = Tables["businesses"]["Row"];
export type BusinessInsert = Tables["businesses"]["Insert"];
export type BusinessUpdate = Tables["businesses"]["Update"];
export type BusinessRow = Business;

export type Event = Tables["events"]["Row"];
export type EventInsert = Tables["events"]["Insert"];
export type EventUpdate = Tables["events"]["Update"];
export type EventRow = Event;

export type EventUser = Tables["event_users"]["Row"];
export type EventUserInsert = Tables["event_users"]["Insert"];
export type EventUserUpdate = Tables["event_users"]["Update"];

export type Offer = Tables["offers"]["Row"];
export type OfferInsert = Tables["offers"]["Insert"];
export type OfferUpdate = Tables["offers"]["Update"];
export type OfferRow = Offer;

export type Coupon = Tables["coupons"]["Row"];
export type CouponInsert = Tables["coupons"]["Insert"];
export type CouponUpdate = Tables["coupons"]["Update"];
export type CouponRow = Coupon;

export type Review = Tables["reviews"]["Row"];
export type ReviewInsert = Tables["reviews"]["Insert"];
export type ReviewUpdate = Tables["reviews"]["Update"];
