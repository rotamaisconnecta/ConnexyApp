import { MarketplaceRepository } from "@/repositories/marketplace.repository";

export interface MarketplaceFilters {
  category?: string;
  search?: string;
  lat?: number;
  lng?: number;
  radius?: number;
}

export const MarketplaceService = {
  async getBusinesses(filters: MarketplaceFilters) {
    const businesses = await MarketplaceRepository.getBusinesses(filters);
    return businesses;
  },

  async getBusiness(id: string) {
    const business = await MarketplaceRepository.getBusinessById(id);
    if (!business) {
      throw new Error("Business not found");
    }
    return business;
  },

  async getEvents(filters: MarketplaceFilters) {
    const events = await MarketplaceRepository.getEvents(filters);
    return events;
  },

  async getEvent(id: string) {
    const event = await MarketplaceRepository.getEventById(id);
    if (!event) {
      throw new Error("Event not found");
    }
    return event;
  },

  async getOffers(businessId?: string) {
    const offers = await MarketplaceRepository.getOffers(businessId);
    return offers;
  },

  async getCoupons(userId: string) {
    const coupons = await MarketplaceRepository.getCoupons(userId);
    return coupons;
  },
};
