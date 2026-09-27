import type { Place } from "@/lib/mock-data";
import {
  BusinessCategory,
  type Business,
  type BusinessCategoryValue,
} from "@/lib/marketplace/business-types";

const RESERVABLE_BUSINESS_CATEGORIES = new Set<BusinessCategoryValue>([
  BusinessCategory.RESTAURANT,
  BusinessCategory.BAR,
  BusinessCategory.CAFE,
  BusinessCategory.HOTEL,
  BusinessCategory.GYM,
  BusinessCategory.HEALTH,
  BusinessCategory.SERVICE,
  BusinessCategory.ENTERTAINMENT,
  BusinessCategory.EVENTS,
]);

const RESERVABLE_PLACE_CATEGORIES = new Set([
  "Cafés",
  "Restaurantes",
  "Bares",
  "Hotéis",
  "Saúde",
  "Serviços",
  "Bem-estar",
]);

export function isBusinessReservable(business: Pick<Business, "category">): boolean {
  return RESERVABLE_BUSINESS_CATEGORIES.has(business.category);
}

export function isPlaceReservable(place: Pick<Place, "category">): boolean {
  return RESERVABLE_PLACE_CATEGORIES.has(place.category);
}

export const RESERVATION_TIME_SLOTS = [
  "11:00",
  "12:30",
  "13:00",
  "19:00",
  "19:30",
  "20:00",
  "21:00",
] as const;
