import type { Database } from "@/integrations/supabase/types";

type Tables = Database["public"]["Tables"];

export type BioPost = Tables["bio_posts"]["Row"];
export type BioPostInsert = Tables["bio_posts"]["Insert"];
export type BioPostUpdate = Tables["bio_posts"]["Update"];

export type Place = Tables["places"]["Row"];
export type PlaceInsert = Tables["places"]["Insert"];
export type PlaceUpdate = Tables["places"]["Update"];

export type Profile = Tables["profiles"]["Row"];
export type ProfileInsert = Tables["profiles"]["Insert"];
export type ProfileUpdate = Tables["profiles"]["Update"];

export type Reel = Tables["reels"]["Row"];
export type ReelInsert = Tables["reels"]["Insert"];
export type ReelUpdate = Tables["reels"]["Update"];

export type ReelComment = Tables["reel_comments"]["Row"];
export type ReelCommentInsert = Tables["reel_comments"]["Insert"];
export type ReelCommentUpdate = Tables["reel_comments"]["Update"];

export type ReelLike = Tables["reel_likes"]["Row"];
export type ReelLikeInsert = Tables["reel_likes"]["Insert"];
export type ReelLikeUpdate = Tables["reel_likes"]["Update"];
