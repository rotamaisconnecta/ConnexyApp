import { supabase } from "@/lib/supabase/client";
import { SupabaseError } from "@/lib/supabase/errors";
import type {
  BusinessRow,
  EventRow,
  OfferRow,
  CouponRow,
} from "@/types/database/tables";

interface BusinessFilters {
  category?: string;
  search?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
}

interface EventFilters {
  category?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export const MarketplaceRepository = {
  async getBusinesses(filters: BusinessFilters = {}): Promise<BusinessRow[]> {
    let query = supabase.from("businesses").select("*");

    if (filters.category) {
      query = query.eq("category", filters.category);
    }
    if (filters.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
      );
    }
    if (filters.latitude && filters.longitude && filters.radiusKm) {
      query = query.rpc("get_nearby_businesses", {
        p_latitude: filters.latitude,
        p_longitude: filters.longitude,
        p_radius_km: filters.radiusKm,
      });
    }

    const { data, error } = await query.order("name");
    if (error) throw new SupabaseError(error.message, error.code);
    return data ?? [];
  },

  async getBusinessById(id: string): Promise<BusinessRow> {
    const { data, error } = await supabase
      .from("businesses")
      .select("*, offers(*), reviews(*, user:profiles(*))")
      .eq("id", id)
      .single();
    if (error) throw new SupabaseError(error.message, error.code);
    return data;
  },

  async getEvents(filters: EventFilters = {}): Promise<EventRow[]> {
    let query = supabase.from("events").select("*, organizer:profiles(*)");

    if (filters.category) {
      query = query.eq("category", filters.category);
    }
    if (filters.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
      );
    }
    if (filters.startDate) {
      query = query.gte("starts_at", filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte("starts_at", filters.endDate);
    }

    const { data, error } = await query.order("starts_at", { ascending: true });
    if (error) throw new SupabaseError(error.message, error.code);
    return data ?? [];
  },

  async getEventById(id: string): Promise<EventRow> {
    const { data, error } = await supabase
      .from("events")
      .select("*, organizer:profiles(*), attendees(event_users(*, user:profiles(*)))")
      .eq("id", id)
      .single();
    if (error) throw new SupabaseError(error.message, error.code);
    return data;
  },

  async getOffers(businessId?: string): Promise<OfferRow[]> {
    let query = supabase.from("offers").select("*, business:businesses(*)");

    if (businessId) {
      query = query.eq("business_id", businessId);
    }

    const { data, error } = await query
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    if (error) throw new SupabaseError(error.message, error.code);
    return data ?? [];
  },

  async getCoupons(userId: string): Promise<CouponRow[]> {
    const { data, error } = await supabase
      .from("coupons")
      .select("*, offer:offers(*, business:businesses(*))")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new SupabaseError(error.message, error.code);
    return data ?? [];
  },
};
