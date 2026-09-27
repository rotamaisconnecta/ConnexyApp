import { requireAuthUserId, type SchemaAClient } from "./client";
import { RemoteErrorCode, RemoteRepositoryError } from "./errors";
import { runRemote, unwrapMaybe, unwrapRow } from "./result";
import type { ProfilePrivateRow, ProfilePrivateUpdate, ProfileRow, ProfileUpdate } from "./types";

const PUBLIC_PROFILE_FIELDS = [
  "name",
  "handle",
  "photo_url",
  "cover_url",
  "city",
  "bio",
  "interests",
  "age",
  "locale",
  "visibility",
  "headline",
] as const satisfies readonly (keyof ProfileUpdate)[];

export type OwnProfilePatch = Pick<ProfileUpdate, (typeof PUBLIC_PROFILE_FIELDS)[number]>;

export class RemoteProfileRepository {
  constructor(private readonly client: SchemaAClient) {}

  async getById(id: string): Promise<ProfileRow | null> {
    return runRemote(async () => {
      const result = await this.client.from("profiles").select("*").eq("id", id).maybeSingle();
      return unwrapMaybe(result);
    });
  }

  async getOwn(): Promise<ProfileRow> {
    return runRemote(async () => {
      const uid = await requireAuthUserId(this.client);
      const result = await this.client.from("profiles").select("*").eq("id", uid).maybeSingle();
      return unwrapRow(result, "Own profile not found");
    });
  }

  async updateOwn(patch: OwnProfilePatch): Promise<ProfileRow> {
    return runRemote(async () => {
      const uid = await requireAuthUserId(this.client);
      const next: ProfileUpdate = {};
      if (patch.name !== undefined) next.name = patch.name;
      if (patch.handle !== undefined) next.handle = patch.handle;
      if (patch.photo_url !== undefined) next.photo_url = patch.photo_url;
      if (patch.cover_url !== undefined) next.cover_url = patch.cover_url;
      if (patch.city !== undefined) next.city = patch.city;
      if (patch.bio !== undefined) next.bio = patch.bio;
      if (patch.interests !== undefined) next.interests = patch.interests;
      if (patch.age !== undefined) next.age = patch.age;
      if (patch.locale !== undefined) next.locale = patch.locale;
      if (patch.visibility !== undefined) next.visibility = patch.visibility;
      if (patch.headline !== undefined) next.headline = patch.headline;
      if (Object.keys(next).length === 0) {
        throw new RemoteRepositoryError("Profile update is empty", RemoteErrorCode.VALIDATION);
      }
      const result = await this.client
        .from("profiles")
        .update(next)
        .eq("id", uid)
        .select("*")
        .single();
      return unwrapRow(result, "Own profile not found");
    });
  }

  async getOwnPrivate(): Promise<ProfilePrivateRow> {
    return runRemote(async () => {
      const uid = await requireAuthUserId(this.client);
      const result = await this.client
        .from("profile_private")
        .select("*")
        .eq("user_id", uid)
        .maybeSingle();
      return unwrapRow(result, "Own private profile not found");
    });
  }

  async getPrivateByUserId(userId: string): Promise<ProfilePrivateRow | null> {
    return runRemote(async () => {
      await requireAuthUserId(this.client);
      const result = await this.client
        .from("profile_private")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      return unwrapMaybe(result);
    });
  }

  async updateOwnPrivate(patch: Omit<ProfilePrivateUpdate, "user_id">): Promise<ProfilePrivateRow> {
    return runRemote(async () => {
      const uid = await requireAuthUserId(this.client);
      const next: ProfilePrivateUpdate = { ...patch, user_id: undefined };
      const result = await this.client
        .from("profile_private")
        .update(next)
        .eq("user_id", uid)
        .select("*")
        .single();
      return unwrapRow(result, "Own private profile not found");
    });
  }
}
