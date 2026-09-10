import { Check, MapPin } from "lucide-react";
import type { Trip } from "@/lib/mobility/trip/trip-types";
import { formatPrice } from "@/lib/mobility/ride-pricing";
import { formatDistance, formatRideDate } from "@/lib/mobility/ride-utils";
import { paymentMethodLabel, paymentStatusLabel } from "@/lib/mobility/payment";
import { demoCategoryLabel } from "@/lib/mobility/demo-fare";

interface RideHistoryCardProps {
  trip: Trip;
  onClick?: (id: string) => void;
}

function tripTimestamp(trip: Trip): string {
  return trip.completedAt ?? trip.cancelledAt ?? trip.createdAt;
}

function tripPrice(trip: Trip): number {
  return trip.finalFare ?? trip.estimatedFare;
}

export function RideHistoryCard({ trip, onClick }: RideHistoryCardProps) {
  const cancelled = trip.status === "cancelada";
  const destination = trip.destination?.label ?? "Cancelada";
  const driverName = trip.driver?.name;

  return (
    <button
      type="button"
      onClick={() => onClick?.(trip.id)}
      className="w-full rounded-2xl border border-border bg-surface p-3 text-left transition-colors hover:bg-accent/30"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary text-[13px] font-bold text-foreground">
          {driverName?.slice(0, 1) ?? "?"}
        </span>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center justify-between gap-3">
            <span className="truncate font-semibold text-sm">
              {driverName ?? "Motorista demo"}
              {cancelled && (
                <span className="ml-2 text-[11px] font-medium text-muted-foreground">
                  Cancelada
                </span>
              )}
            </span>
            {!cancelled && (
              <span className="shrink-0 font-display font-bold text-sm">
                {formatPrice(tripPrice(trip))}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">
              {trip.origin.label} → {destination}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <span>{demoCategoryLabel(trip.category)}</span>
            {!cancelled && (
              <>
                <span>{paymentMethodLabel(trip.paymentMethod)}</span>
                {trip.paymentConfirmed && (
                  <span className="flex items-center gap-0.5 text-emerald-600">
                    <Check className="h-3 w-3" aria-hidden />
                    {paymentStatusLabel(true)}
                  </span>
                )}
              </>
            )}
            <span>{formatDistance(trip.distanceMeters)}</span>
            <span>{formatRideDate(new Date(tripTimestamp(trip)))}</span>
          </div>
        </div>
      </div>
    </button>
  );
}
