import { Star, MapPin, Tag, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Business } from "@/lib/marketplace/business-types";
import { getCategoryLabel, getCategoryColor } from "@/lib/marketplace/category-utils";
import { formatDistance } from "@/lib/marketplace/distance-utils";
import { BusinessGallery } from "./business-gallery";
import { BusinessHours } from "./business-hours";
import { BusinessRating } from "./business-rating";
import { BusinessMapPreview } from "./business-map-preview";
import { CouponList } from "./coupon-list";
import { OfferCarousel } from "./offer-carousel";
import { EventList } from "./event-list";

interface BusinessDetailsProps {
  business: Business;
  onShare?: () => void;
  onFavorite?: () => void;
  onSave?: () => void;
  onDirections?: () => void;
}

export function BusinessDetails({
  business,
  onShare,
  onFavorite,
  onSave,
  onDirections,
}: BusinessDetailsProps) {
  return (
    <div className="space-y-5">
      <BusinessGallery photos={business.photos} />

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-[10px] font-semibold px-2 py-0.5 rounded-full",
              getCategoryColor(business.category),
            )}
          >
            {getCategoryLabel(business.category)}
          </span>
          {business.isOpen ? (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-success/15 text-success">
              Aberto agora
            </span>
          ) : (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              Fechado
            </span>
          )}
        </div>

        <h1 className="font-display font-bold text-xl">{business.name}</h1>
        <p className="text-sm text-muted-foreground">{business.description}</p>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 fill-amber text-amber" />
          <span className="text-sm font-semibold">{business.rating.average}</span>
          <span className="text-xs text-muted-foreground">({business.rating.totalReviews})</span>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          {formatDistance(business.distanceMeters)}
        </div>
      </div>

      {business.tags.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {business.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground"
            >
              <Tag className="h-2.5 w-2.5" />
              {tag}
            </span>
          ))}
        </div>
      )}

      {business.promotions.length > 0 && <OfferCarousel promotions={business.promotions} />}

      {business.couponCount > 0 && (
        <CouponList coupons={[]} title={`Cupons disponíveis (${business.couponCount})`} />
      )}

      <BusinessHours hours={business.hours} isOpen={business.isOpen} />

      <BusinessRating rating={business.rating} />

      {business.events.length > 0 && (
        <EventList events={business.events} title="Próximos eventos" />
      )}

      <BusinessMapPreview
        location={business.location}
        address={business.address}
        businessName={business.name}
        distanceMeters={business.distanceMeters}
      />

      <button
        onClick={onDirections}
        className="w-full rounded-full bg-gradient-brand py-3.5 text-white font-semibold shadow-elegant flex items-center justify-center gap-2"
      >
        <ExternalLink className="h-4 w-4" />
        Ir até lá
      </button>
    </div>
  );
}
