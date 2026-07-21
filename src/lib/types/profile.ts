import type { ReactNode } from "react";

/* =========================================================
   SHARED
========================================================= */

export type ProfileVariant = "person" | "business" | "event" | "driver";

export interface BaseEntity {
  id: string;
}

export interface ImageAsset {
  id: string;
  url: string;
  alt?: string;
}

export interface PlaceReference {
  id: string;
  name: string;
}

export interface PersonReference {
  id: string;
  name: string;
  photo: string;
}

export interface MomentLocation {
  id: string;
  name: string;
}

export interface Activity {
  emoji: string;
  label: string;
  until?: string;
}

export interface CompatibilityReason {
  category: "interest" | "place" | "vibe" | "proximity" | "moment";

  label: string;

  emoji?: string;

  shared: boolean;
}

export interface IceBreakerSuggestion {
  id: string;

  text: string;

  emoji?: string;

  source: "interest" | "place" | "event" | "moment" | "vibe" | "proximity";
}

/* =========================================================
   HERO (Átomo 1)
========================================================= */

export interface HeroMood {
  emoji: string;
  text: string;
}

export interface HeroNowPlaying {
  kind: "music" | "reading" | "watching";
  title: string;
  subtitle?: string;
}

export type HeroPhotoVariant = "circle" | "square" | "wide";

export interface HeroProps {
  photo: string;

  name: string;

  subtitle?: string;

  handle?: string;

  headline?: string;

  online?: boolean;

  lastSeen?: string;

  proximity?: string;

  radius?: string | null;

  badge?: ReactNode;

  mood?: HeroMood;

  nowPlaying?: HeroNowPlaying;

  photoVariant: HeroPhotoVariant;

  gradientBg?: boolean;
}

/* =========================================================
   MOMENT (Átomo 2)
========================================================= */

export interface ProfileMoment {
  id: string;

  text: string;

  emoji: string;

  photo?: string;

  place?: MomentLocation;

  createdAt: string;

  expiresAt: string;
}

export type MomentVariant = "full" | "compact";

export interface MomentProps {
  moment: ProfileMoment | null;

  variant?: MomentVariant;
}

/* =========================================================
   AVAILABILITY (Átomo 3)
========================================================= */

export interface AvailabilityProps {
  activities: Activity[];
}

/* =========================================================
   BIO (Átomo 4)
========================================================= */

export interface BioProps {
  bio?: string;

  looksFor?: string[];

  title?: string;

  looksForLabel?: string;

  variant: "person" | "business" | "event";
}

/* =========================================================
   INTERESTS (Átomo 5)
========================================================= */

export interface InterestsProps {
  interests: string[];

  vibeTags?: string[];

  sharedInterests?: string[];

  emojiMap?: Record<string, string>;
}

/* =========================================================
   PLACES (Átomo 6)
========================================================= */

export interface ProfilePlace {
  id: string;

  name: string;

  category: string;

  cover: string;

  rating?: number;

  distanceMeters?: number;
}

export interface PlacesProps {
  places: ProfilePlace[];

  sharedPlaceIds?: string[];

  title?: string;

  variant?: "scroll" | "grid";
}

/* =========================================================
   COMPATIBILITY (Átomo 7)
========================================================= */

export type CompatibilityTier = "excelente" | "alta" | "compativel" | null;

export interface CompatibilityProps {
  score: number;

  tier: CompatibilityTier;

  tierLabel: string;

  reasons: CompatibilityReason[];
}

/* =========================================================
   ICE BREAKER (Átomo 8)
========================================================= */

export interface IceBreakerProps {
  suggestions: IceBreakerSuggestion[];

  viewerName: string;

  profileName: string;
}

/* =========================================================
   MUTUAL (Átomo 9)
========================================================= */

export interface MutualProps {
  connections?: PersonReference[];

  sharedInterests?: string[];

  sharedPlaces?: string[];

  totalMutual?: number;
}

/* =========================================================
   GALLERY (Átomo 10)
========================================================= */

export type GalleryVariant = "scroll" | "grid-2" | "grid-3";

export interface GalleryProps {
  images: ImageAsset[];

  variant?: GalleryVariant;
}

/* =========================================================
   ACTION BAR (Átomo 11)
========================================================= */

export interface ActionBarProps {
  variant: ProfileVariant;

  onChatRequest?: () => void;

  chatRequested?: boolean;

  onCall?: () => void;

  onDirections?: () => void;

  onAttend?: () => void;

  attending?: boolean;

  onRequestRide?: () => void;

  onFavorite?: () => void;

  favorited?: boolean;

  onShare?: () => void;
}

/* =========================================================
   PROFILE LAYOUT (Composição)
========================================================= */

export interface ProfileLayoutProps {
  hero: HeroProps;

  moment?: MomentProps;

  availability?: AvailabilityProps;

  compatibility?: CompatibilityProps;

  bio?: BioProps;

  interests?: InterestsProps;

  places?: PlacesProps;

  iceBreaker?: IceBreakerProps;

  mutual?: MutualProps;

  gallery?: GalleryProps;

  actionBar: ActionBarProps;
}

/* =========================================================
   PROFILE DATA (Dados)
========================================================= */

export interface ProfileData {
  id: string;

  variant: ProfileVariant;

  hero: HeroProps;

  moment?: ProfileMoment | null;

  availability?: Activity[];

  bio?: string;

  looksFor?: string[];

  interests?: string[];

  vibeTags?: string[];

  places?: ProfilePlace[];

  gallery?: ImageAsset[];

  compatibility?: CompatibilityProps;

  mutual?: MutualProps;
}

/* =========================================================
   PROFILE NAVIGATION (Navegação)
========================================================= */

export interface ProfileNavigationState {
  from?: string;

  profileId: string;
}

/* =========================================================
   PROFILE RESPONSE (Resposta)
========================================================= */

export interface ProfileResponse {
  profile: ProfileData;

  loadedAt: string;

  cache: boolean;
}
