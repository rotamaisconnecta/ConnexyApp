import { requireAuthUserId, type SchemaAClient } from "./client";
import { RemoteErrorCode, RemoteRepositoryError } from "./errors";
import { runRemote, unwrapList, unwrapMaybe, unwrapRow } from "./result";
import type { ReservationResourceType, ReservationRow, ReservationStatus } from "./types";

export class RemoteReservationRepository {
  constructor(private readonly client: SchemaAClient) {}

  async create(input: {
    resource_type: ReservationResourceType;
    business_id?: string | null;
    place_id?: string | null;
    resource_name: string;
    slot_date: string;
    slot_time: string;
    party_size: number;
  }): Promise<ReservationRow> {
    return runRemote(async () => {
      const uid = await requireAuthUserId(this.client);
      if (input.party_size < 1 || input.party_size > 20) {
        throw new RemoteRepositoryError(
          "party_size must be between 1 and 20",
          RemoteErrorCode.VALIDATION,
        );
      }
      const businessId = input.resource_type === "business" ? (input.business_id ?? null) : null;
      const placeId = input.resource_type === "place" ? (input.place_id ?? null) : null;
      if (input.resource_type === "business" && !businessId) {
        throw new RemoteRepositoryError(
          "Business reservation requires business_id",
          RemoteErrorCode.VALIDATION,
        );
      }
      if (input.resource_type === "place" && !placeId) {
        throw new RemoteRepositoryError(
          "Place reservation requires place_id",
          RemoteErrorCode.VALIDATION,
        );
      }
      return unwrapRow(
        await this.client
          .from("reservations")
          .insert({
            user_id: uid,
            resource_type: input.resource_type,
            business_id: businessId,
            place_id: placeId,
            resource_name: input.resource_name,
            slot_date: input.slot_date,
            slot_time: input.slot_time,
            party_size: input.party_size,
            status: "pending" satisfies ReservationStatus,
          })
          .select("*")
          .single(),
        "Reservation was not created",
      );
    });
  }

  async get(id: string): Promise<ReservationRow | null> {
    return runRemote(async () => {
      await requireAuthUserId(this.client);
      return unwrapMaybe(
        await this.client.from("reservations").select("*").eq("id", id).maybeSingle(),
      );
    });
  }

  async listMine(): Promise<ReservationRow[]> {
    return runRemote(async () => {
      const uid = await requireAuthUserId(this.client);
      return unwrapList(
        await this.client
          .from("reservations")
          .select("*")
          .eq("user_id", uid)
          .order("created_at", { ascending: false }),
      );
    });
  }

  async setStatus(id: string, status: ReservationStatus): Promise<ReservationRow> {
    return runRemote(async () => {
      await requireAuthUserId(this.client);
      return unwrapRow(
        await this.client.from("reservations").update({ status }).eq("id", id).select("*").single(),
        "Reservation not found",
      );
    });
  }
}
