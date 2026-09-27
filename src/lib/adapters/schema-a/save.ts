import type { SaveRow, SaveTargetType } from "@/integrations/supabase/remote/types";
import type { Database } from "../../../../supabase/schema-a.generated.ts";
import { AdapterMappingCode, AdapterMappingError } from "./errors";
import { isoToEpochMs, requireSchemaAUuid } from "./ids";

type SaveInsert = Database["public"]["Tables"]["saves"]["Insert"];

export const SCHEMA_A_SAVE_TYPES = [
  "business",
  "place",
  "event",
  "offer",
  "reel",
  "post",
] as const satisfies readonly SaveTargetType[];

export type AdaptedSave = {
  id: string | null;
  userId: string;
  targetType: SaveTargetType;
  targetId: string;
  createdAt: number;
};

export function isSchemaASaveType(value: string): value is SaveTargetType {
  return (SCHEMA_A_SAVE_TYPES as readonly string[]).includes(value);
}

/**
 * Local `connexy:demo:saved-details` is an untyped id list.
 * Schema A requires target_type. This function does not invent a type.
 */
export function fromLocalSavedDetailId(targetId: string): {
  targetId: string;
  targetType: null;
} {
  return { targetId, targetType: null };
}

export function toRemoteSaveInsert(input: {
  userId: string;
  targetType: string;
  targetId: string;
}): SaveInsert {
  if (!isSchemaASaveType(input.targetType)) {
    throw new AdapterMappingError(
      `Save target_type ${input.targetType} is not in Schema A`,
      AdapterMappingCode.MISSING_TARGET_TYPE,
      "target_type",
    );
  }
  return {
    user_id: requireSchemaAUuid(input.userId, "saves.user_id"),
    target_type: input.targetType,
    target_id: requireSchemaAUuid(input.targetId, "saves.target_id"),
  };
}

export function toDomainSave(row: SaveRow): AdaptedSave {
  return {
    id: row.id,
    userId: row.user_id,
    targetType: row.target_type as SaveTargetType,
    targetId: row.target_id,
    createdAt: isoToEpochMs(row.created_at),
  };
}
