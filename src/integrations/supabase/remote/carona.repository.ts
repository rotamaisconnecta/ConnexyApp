import { requireAuthUserId, type SchemaAClient } from "./client";
import { RemoteErrorCode, RemoteRepositoryError } from "./errors";
import { runRemote, unwrapList, unwrapMaybe, unwrapRow } from "./result";
import type {
  CaronaOfferRow,
  CaronaOfferStatus,
  CaronaRequestRow,
  CaronaRequestStatus,
} from "./types";

export class RemoteCaronaRepository {
  constructor(private readonly client: SchemaAClient) {}

  async createOffer(input: {
    origin: string;
    destination: string;
    meetup: string;
    ride_date: string;
    ride_time: string;
    available_seats: number;
  }): Promise<CaronaOfferRow> {
    return runRemote(async () => {
      const uid = await requireAuthUserId(this.client);
      if (input.available_seats < 0) {
        throw new RemoteRepositoryError("available_seats must be >= 0", RemoteErrorCode.VALIDATION);
      }
      return unwrapRow(
        await this.client
          .from("carona_offers")
          .insert({
            owner_id: uid,
            origin: input.origin,
            destination: input.destination,
            meetup: input.meetup,
            ride_date: input.ride_date,
            ride_time: input.ride_time,
            available_seats: input.available_seats,
            status: "active" satisfies CaronaOfferStatus,
          })
          .select("*")
          .single(),
        "Carona offer was not created",
      );
    });
  }

  async getOffer(id: string): Promise<CaronaOfferRow | null> {
    return runRemote(async () => {
      await requireAuthUserId(this.client);
      return unwrapMaybe(
        await this.client.from("carona_offers").select("*").eq("id", id).maybeSingle(),
      );
    });
  }

  async requestSeat(offerId: string): Promise<CaronaRequestRow> {
    return runRemote(async () => {
      const uid = await requireAuthUserId(this.client);
      return unwrapRow(
        await this.client
          .from("carona_requests")
          .insert({
            ride_offer_id: offerId,
            requester_id: uid,
            status: "requested" satisfies CaronaRequestStatus,
          })
          .select("*")
          .single(),
        "Carona request was not created",
      );
    });
  }

  async listRequestsForOffer(offerId: string): Promise<CaronaRequestRow[]> {
    return runRemote(async () => {
      await requireAuthUserId(this.client);
      return unwrapList(
        await this.client.from("carona_requests").select("*").eq("ride_offer_id", offerId),
      );
    });
  }

  async getRequest(id: string): Promise<CaronaRequestRow | null> {
    return runRemote(async () => {
      await requireAuthUserId(this.client);
      return unwrapMaybe(
        await this.client.from("carona_requests").select("*").eq("id", id).maybeSingle(),
      );
    });
  }

  /**
   * Owner accept: request → accepted, seats decremented, offer FULL at 0.
   * Connection / Conversation remain explicit application steps — not created here.
   */
  async acceptRequest(
    requestId: string,
  ): Promise<{ request: CaronaRequestRow; offer: CaronaOfferRow }> {
    return runRemote(async () => {
      const uid = await requireAuthUserId(this.client);
      const request = unwrapRow(
        await this.client.from("carona_requests").select("*").eq("id", requestId).maybeSingle(),
        "Carona request not found",
      );
      if (request.status !== "requested") {
        throw new RemoteRepositoryError(
          "Carona request is not requested",
          RemoteErrorCode.VALIDATION,
        );
      }
      const offer = unwrapRow(
        await this.client
          .from("carona_offers")
          .select("*")
          .eq("id", request.ride_offer_id)
          .maybeSingle(),
        "Carona offer not found",
      );
      if (offer.owner_id !== uid) {
        throw new RemoteRepositoryError(
          "Only the offer owner can accept",
          RemoteErrorCode.VALIDATION,
        );
      }
      const seats = Math.max(0, offer.available_seats - 1);
      const status: CaronaOfferStatus = seats === 0 ? "full" : "active";
      const updatedRequest = unwrapRow(
        await this.client
          .from("carona_requests")
          .update({ status: "accepted" satisfies CaronaRequestStatus })
          .eq("id", requestId)
          .select("*")
          .single(),
        "Carona request was not accepted",
      );
      const updatedOffer = unwrapRow(
        await this.client
          .from("carona_offers")
          .update({ available_seats: seats, status })
          .eq("id", offer.id)
          .select("*")
          .single(),
        "Carona offer was not updated",
      );
      return { request: updatedRequest, offer: updatedOffer };
    });
  }

  async rejectRequest(requestId: string): Promise<CaronaRequestRow> {
    return runRemote(async () => {
      await requireAuthUserId(this.client);
      return unwrapRow(
        await this.client
          .from("carona_requests")
          .update({ status: "rejected" satisfies CaronaRequestStatus })
          .eq("id", requestId)
          .select("*")
          .single(),
        "Carona request not found",
      );
    });
  }

  async linkConversation(requestId: string, conversationId: string): Promise<CaronaRequestRow> {
    return runRemote(async () => {
      await requireAuthUserId(this.client);
      return unwrapRow(
        await this.client
          .from("carona_requests")
          .update({ conversation_id: conversationId })
          .eq("id", requestId)
          .select("*")
          .single(),
        "Carona request not found",
      );
    });
  }
}
