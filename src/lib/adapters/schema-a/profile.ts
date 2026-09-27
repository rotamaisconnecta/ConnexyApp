import type { DemoOwnProfile, ProfileVisibility } from "@/lib/demo/demo-own-profile";
import { ageFromBirthDate } from "@/lib/demo/demo-own-profile";
import type { Json } from "../../../../supabase/schema-a.generated.ts";
import type {
  ProfilePrivateRow,
  ProfilePrivateUpdate,
  ProfileRow,
  ProfileUpdate,
} from "@/integrations/supabase/remote/types";
import type { Database } from "../../../../supabase/schema-a.generated.ts";
import { AdapterMappingCode, AdapterMappingError } from "./errors";
import { requireSchemaAUuid } from "./ids";

type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
type ProfilePrivateInsert = Database["public"]["Tables"]["profile_private"]["Insert"];

export type RemoteVisibilityLevel = "everyone" | "connections" | "only_me";

export type RemoteProfileVisibility = {
  confirmed_activity: RemoteVisibilityLevel;
  liked_places: RemoteVisibilityLevel;
  mutual_connections: RemoteVisibilityLevel;
};

const LOCAL_TO_REMOTE_VISIBILITY: Record<ProfileVisibility, RemoteVisibilityLevel> = {
  Todos: "everyone",
  Conexões: "connections",
  "Somente você": "only_me",
};

const REMOTE_TO_LOCAL_VISIBILITY: Record<RemoteVisibilityLevel, ProfileVisibility> = {
  everyone: "Todos",
  connections: "Conexões",
  only_me: "Somente você",
};

function isVisibilityLevel(value: unknown): value is RemoteVisibilityLevel {
  return value === "everyone" || value === "connections" || value === "only_me";
}

export function toRemoteVisibility(local: DemoOwnProfile["visibility"]): RemoteProfileVisibility {
  return {
    confirmed_activity: LOCAL_TO_REMOTE_VISIBILITY[local.confirmedActivity],
    liked_places: LOCAL_TO_REMOTE_VISIBILITY[local.likedPlaces],
    mutual_connections: LOCAL_TO_REMOTE_VISIBILITY[local.mutualFriends],
  };
}

export function visibilityToJson(visibility: RemoteProfileVisibility): Json {
  return {
    confirmed_activity: visibility.confirmed_activity,
    liked_places: visibility.liked_places,
    mutual_connections: visibility.mutual_connections,
  };
}

export function fromRemoteVisibility(value: Json): DemoOwnProfile["visibility"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AdapterMappingError(
      "profiles.visibility is not a JSON object",
      AdapterMappingCode.INVALID_JSON,
      "visibility",
    );
  }
  const record = value as Record<string, unknown>;
  const confirmed = record.confirmed_activity;
  const liked = record.liked_places;
  const mutual = record.mutual_connections;
  if (!isVisibilityLevel(confirmed) || !isVisibilityLevel(liked) || !isVisibilityLevel(mutual)) {
    throw new AdapterMappingError(
      "profiles.visibility tokens are not everyone|connections|only_me",
      AdapterMappingCode.INVALID_JSON,
      "visibility",
    );
  }
  return {
    confirmedActivity: REMOTE_TO_LOCAL_VISIBILITY[confirmed],
    likedPlaces: REMOTE_TO_LOCAL_VISIBILITY[liked],
    mutualFriends: REMOTE_TO_LOCAL_VISIBILITY[mutual],
  };
}

export function toRemoteLocale(language: string): string | null {
  if (language === "Português") return "pt-BR";
  if (language === "English") return "en";
  return null;
}

export function fromRemoteLocale(locale: string | null): string | null {
  if (locale === "pt-BR") return "Português";
  if (locale === "en") return "English";
  return locale;
}

/** Public profile only. Private addresses and birth date stay on profile_private. */
export function toRemoteProfileInsert(
  profile: DemoOwnProfile,
  remoteUserId: string,
  locale?: string | null,
): ProfileInsert {
  const id = requireSchemaAUuid(remoteUserId, "profiles.id");
  return {
    id,
    name: profile.name,
    handle: profile.handle,
    photo_url: profile.photo || null,
    cover_url: profile.cover || null,
    city: profile.city || null,
    bio: profile.bio || null,
    interests: profile.interests,
    age: typeof profile.age === "number" ? profile.age : null,
    locale: locale ?? null,
    visibility: visibilityToJson(toRemoteVisibility(profile.visibility)),
  };
}

export function toRemoteProfileUpdate(
  profile: Partial<DemoOwnProfile>,
  locale?: string | null,
): ProfileUpdate {
  const next: ProfileUpdate = {};
  if (profile.name !== undefined) next.name = profile.name;
  if (profile.handle !== undefined) next.handle = profile.handle;
  if (profile.photo !== undefined) next.photo_url = profile.photo || null;
  if (profile.cover !== undefined) next.cover_url = profile.cover || null;
  if (profile.city !== undefined) next.city = profile.city || null;
  if (profile.bio !== undefined) next.bio = profile.bio || null;
  if (profile.interests !== undefined) next.interests = profile.interests;
  if (profile.age !== undefined) next.age = profile.age ?? null;
  if (locale !== undefined) next.locale = locale;
  if (profile.visibility !== undefined) {
    next.visibility = visibilityToJson(toRemoteVisibility(profile.visibility));
  }
  return next;
}

export function toRemoteProfilePrivateInsert(
  profile: DemoOwnProfile,
  remoteUserId: string,
): ProfilePrivateInsert {
  return {
    user_id: requireSchemaAUuid(remoteUserId, "profile_private.user_id"),
    birth_date: profile.birthDate?.trim() || null,
    home_address: profile.privateAddresses.home.trim() || null,
    work_address: profile.privateAddresses.work.trim() || null,
  };
}

export function toRemoteProfilePrivateUpdate(profile: DemoOwnProfile): ProfilePrivateUpdate {
  return {
    birth_date: profile.birthDate?.trim() || null,
    home_address: profile.privateAddresses.home.trim() || null,
    work_address: profile.privateAddresses.work.trim() || null,
  };
}

export function toDomainProfile(
  publicRow: ProfileRow,
  privateRow: ProfilePrivateRow | null,
): DemoOwnProfile {
  const birthDate = privateRow?.birth_date ?? undefined;
  const derivedAge = birthDate ? ageFromBirthDate(birthDate) : null;
  return {
    name: publicRow.name,
    handle: publicRow.handle,
    photo: publicRow.photo_url ?? "",
    cover: publicRow.cover_url ?? "",
    city: publicRow.city ?? "",
    bio: publicRow.bio ?? "",
    interests: publicRow.interests,
    privateAddresses: {
      home: privateRow?.home_address ?? "",
      work: privateRow?.work_address ?? "",
    },
    visibility: fromRemoteVisibility(publicRow.visibility),
    age: publicRow.age ?? derivedAge,
    birthDate,
    identityId: publicRow.id,
  };
}
