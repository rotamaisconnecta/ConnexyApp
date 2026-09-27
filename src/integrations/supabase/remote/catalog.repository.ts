import { requireAuthUserId, type SchemaAClient } from "./client";
import { RemoteErrorCode, RemoteRepositoryError } from "./errors";
import { runRemote, unwrapList, unwrapMaybe, unwrapRow } from "./result";
import type { BusinessRow, EventRow, OfferRow, PlaceRow } from "./types";

export class RemoteCatalogRepository {
  constructor(private readonly client: SchemaAClient) {}

  async createBusiness(input: {
    name: string;
    address: string;
    category: string;
    description?: string | null;
    cover_url?: string | null;
    lat?: number | null;
    lng?: number | null;
  }): Promise<BusinessRow> {
    return runRemote(async () => {
      const uid = await requireAuthUserId(this.client);
      if (!input.name.trim()) {
        throw new RemoteRepositoryError("Business name is required", RemoteErrorCode.VALIDATION);
      }
      return unwrapRow(
        await this.client
          .from("businesses")
          .insert({
            owner_id: uid,
            name: input.name,
            address: input.address,
            category: input.category,
            description: input.description ?? null,
            cover_url: input.cover_url ?? null,
            lat: input.lat ?? null,
            lng: input.lng ?? null,
          })
          .select("*")
          .single(),
        "Business was not created",
      );
    });
  }

  async getBusiness(id: string): Promise<BusinessRow | null> {
    return runRemote(async () => {
      await requireAuthUserId(this.client);
      return unwrapMaybe(
        await this.client.from("businesses").select("*").eq("id", id).maybeSingle(),
      );
    });
  }

  async createPlace(input: {
    name: string;
    address?: string;
    category?: string | null;
    description?: string | null;
    cover_url?: string | null;
    hours?: string | null;
    lat?: number | null;
    lng?: number | null;
  }): Promise<PlaceRow> {
    return runRemote(async () => {
      const uid = await requireAuthUserId(this.client);
      if (!input.name.trim()) {
        throw new RemoteRepositoryError("Place name is required", RemoteErrorCode.VALIDATION);
      }
      return unwrapRow(
        await this.client
          .from("places")
          .insert({
            owner_id: uid,
            name: input.name,
            address: input.address ?? "",
            category: input.category ?? null,
            description: input.description ?? null,
            cover_url: input.cover_url ?? null,
            hours: input.hours ?? null,
            lat: input.lat ?? null,
            lng: input.lng ?? null,
          })
          .select("*")
          .single(),
        "Place was not created",
      );
    });
  }

  async getPlace(id: string): Promise<PlaceRow | null> {
    return runRemote(async () => {
      await requireAuthUserId(this.client);
      return unwrapMaybe(await this.client.from("places").select("*").eq("id", id).maybeSingle());
    });
  }

  async createEvent(input: {
    title: string;
    location: string;
    start_at: string;
    end_at?: string | null;
    description?: string | null;
    capacity?: number | null;
    price?: number | null;
    photo_url?: string | null;
    business_id?: string | null;
  }): Promise<EventRow> {
    return runRemote(async () => {
      const uid = await requireAuthUserId(this.client);
      if (!input.title.trim()) {
        throw new RemoteRepositoryError("Event title is required", RemoteErrorCode.VALIDATION);
      }
      return unwrapRow(
        await this.client
          .from("events")
          .insert({
            owner_id: uid,
            title: input.title,
            location: input.location,
            start_at: input.start_at,
            end_at: input.end_at ?? null,
            description: input.description ?? null,
            capacity: input.capacity ?? null,
            price: input.price ?? null,
            photo_url: input.photo_url ?? null,
            business_id: input.business_id ?? null,
          })
          .select("*")
          .single(),
        "Event was not created",
      );
    });
  }

  async getEvent(id: string): Promise<EventRow | null> {
    return runRemote(async () => {
      await requireAuthUserId(this.client);
      return unwrapMaybe(await this.client.from("events").select("*").eq("id", id).maybeSingle());
    });
  }

  async createOffer(input: {
    business_id: string;
    title: string;
    discount_value: number;
    valid_until: string;
    description?: string | null;
  }): Promise<OfferRow> {
    return runRemote(async () => {
      const uid = await requireAuthUserId(this.client);
      if (!input.business_id) {
        throw new RemoteRepositoryError("Offer requires a business_id", RemoteErrorCode.VALIDATION);
      }
      return unwrapRow(
        await this.client
          .from("offers")
          .insert({
            owner_id: uid,
            business_id: input.business_id,
            title: input.title,
            discount_value: input.discount_value,
            valid_until: input.valid_until,
            description: input.description ?? null,
          })
          .select("*")
          .single(),
        "Offer was not created",
      );
    });
  }

  async getOffer(id: string): Promise<OfferRow | null> {
    return runRemote(async () => {
      await requireAuthUserId(this.client);
      return unwrapMaybe(await this.client.from("offers").select("*").eq("id", id).maybeSingle());
    });
  }

  async listOwnBusinesses(): Promise<BusinessRow[]> {
    return runRemote(async () => {
      const uid = await requireAuthUserId(this.client);
      return unwrapList(await this.client.from("businesses").select("*").eq("owner_id", uid));
    });
  }
}
