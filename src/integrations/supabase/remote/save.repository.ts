import { requireAuthUserId, type SchemaAClient } from "./client";
import { RemoteErrorCode, RemoteRepositoryError, throwIfPostgrestError } from "./errors";
import { runRemote, unwrapList, unwrapRow } from "./result";
import type { SaveRow, SaveTargetType } from "./types";

const SAVE_TYPES: readonly SaveTargetType[] = [
  "business",
  "place",
  "event",
  "offer",
  "reel",
  "post",
];

export class RemoteSaveRepository {
  constructor(private readonly client: SchemaAClient) {}

  async save(targetType: SaveTargetType, targetId: string): Promise<SaveRow> {
    return runRemote(async () => {
      const uid = await requireAuthUserId(this.client);
      if (!SAVE_TYPES.includes(targetType)) {
        throw new RemoteRepositoryError("Invalid save target_type", RemoteErrorCode.VALIDATION);
      }
      return unwrapRow(
        await this.client
          .from("saves")
          .insert({ user_id: uid, target_type: targetType, target_id: targetId })
          .select("*")
          .single(),
        "Save was not created",
      );
    });
  }

  async unsave(targetType: SaveTargetType, targetId: string): Promise<void> {
    return runRemote(async () => {
      const uid = await requireAuthUserId(this.client);
      const result = await this.client
        .from("saves")
        .delete()
        .eq("user_id", uid)
        .eq("target_type", targetType)
        .eq("target_id", targetId);
      throwIfPostgrestError(result.error);
    });
  }

  async listMine(): Promise<SaveRow[]> {
    return runRemote(async () => {
      const uid = await requireAuthUserId(this.client);
      return unwrapList(
        await this.client
          .from("saves")
          .select("*")
          .eq("user_id", uid)
          .order("created_at", { ascending: false }),
      );
    });
  }
}
