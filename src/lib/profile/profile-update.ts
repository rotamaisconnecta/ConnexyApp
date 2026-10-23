import { SupabaseError } from "@/lib/supabase/errors";
import type { ProfileRow } from "@/types/database/tables";

/**
 * Patch accepted by the legacy profile repository. `id` is never updatable.
 *
 * The real `public.profiles` contract (Schema A) declares `name` and `handle`
 * as NOT NULL, so those two fields may only ever be written as non-empty
 * strings. Every other column remains nullable as before.
 */
export type ProfileUpdatePatch = Partial<Omit<ProfileRow, "id">>;

export const ProfileUpdateErrorCode = {
  NAME_REQUIRED: "PROFILE_NAME_REQUIRED",
  HANDLE_REQUIRED: "PROFILE_HANDLE_REQUIRED",
} as const;

export type ProfileUpdateErrorCodeValue =
  (typeof ProfileUpdateErrorCode)[keyof typeof ProfileUpdateErrorCode];

/** Controlled error raised before anything reaches the database. */
export class ProfileUpdateError extends SupabaseError {
  constructor(message: string, code: ProfileUpdateErrorCodeValue) {
    super(message, code);
    this.name = "ProfileUpdateError";
  }
}

type ProfileUpdateExecution = {
  data: ProfileRow | null;
  error: { message: string; code?: string | null } | null;
};

export type ProfileUpdateExecutor = (
  payload: ProfileUpdatePatch & { updated_at: string },
) => Promise<ProfileUpdateExecution>;

function normalizeRequired(
  value: unknown,
  code: ProfileUpdateErrorCodeValue,
  message: string,
): string {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) throw new ProfileUpdateError(message, code);
  return text;
}

/**
 * Builds the payload for `profiles.update`.
 *
 * - A field absent from the patch (or explicitly `undefined`) is omitted, so
 *   the stored value is preserved by the database.
 * - `name` and `handle` are never emitted as `null`/blank: a blank attempt is
 *   rejected with a controlled `ProfileUpdateError` instead of writing an
 *   invalid value or inventing a replacement.
 */
export function buildProfileUpdatePatch(patch: ProfileUpdatePatch): ProfileUpdatePatch {
  const next: ProfileUpdatePatch = {};
  const assign = (key: keyof ProfileUpdatePatch, value: unknown) => {
    (next as Record<string, unknown>)[key as string] = value;
  };

  for (const key of Object.keys(patch) as (keyof ProfileUpdatePatch)[]) {
    const value = patch[key];
    if (value === undefined) continue;

    if (key === "name") {
      assign(
        "name",
        normalizeRequired(
          value,
          ProfileUpdateErrorCode.NAME_REQUIRED,
          "O nome do perfil e obrigatorio e nao pode ficar em branco.",
        ),
      );
      continue;
    }

    if (key === "handle") {
      assign(
        "handle",
        normalizeRequired(
          value,
          ProfileUpdateErrorCode.HANDLE_REQUIRED,
          "O @usuario do perfil e obrigatorio e nao pode ficar em branco.",
        ).toLowerCase(),
      );
      continue;
    }

    assign(key, value);
  }

  return next;
}

/**
 * Runs a guarded profile update. Injecting the executor keeps the storage,
 * error propagation and return-shape behaviour testable without a database.
 */
export async function runProfileUpdate(
  patch: ProfileUpdatePatch,
  execute: ProfileUpdateExecutor,
): Promise<ProfileRow> {
  const payload = buildProfileUpdatePatch(patch);
  const { data, error } = await execute({ ...payload, updated_at: new Date().toISOString() });

  if (error) throw new SupabaseError(error.message, error.code ?? "UNKNOWN");
  if (!data) throw new SupabaseError("Perfil nao encontrado.", "PGRST116");

  return data;
}
