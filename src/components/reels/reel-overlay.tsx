import type { ReactNode } from "react";
import { Building2, CalendarDays, Car, Tag, ChevronRight } from "lucide-react";
import type { Reel } from "@/lib/reels/reel-types";
import { ReelCategory } from "@/lib/reels/reel-types";
import { ReelUser } from "./reel-user";
import { ReelDescription } from "./reel-description";
import { ReelTags } from "./reel-tags";
import { ReelLocation } from "./reel-location";
import { ReelMusic } from "./reel-music";
import { getReelContext, type ReelContextTarget } from "@/lib/reels/reel-context";
import { formatRelativeTime } from "@/lib/reels/reel-utils";

interface ReelOverlayProps {
  reel: Reel;
  onOpenContext: (target: ReelContextTarget) => void;
}

function EntityRow({
  icon,
  title,
  subtitle,
  onClick,
  children,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  onClick: () => void;
  children?: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="mt-3 flex w-full max-w-[86%] items-center gap-3 rounded-2xl bg-black/55 backdrop-blur-md px-3 py-2 border border-white/10 text-left active:scale-[0.99] transition"
    >
      <span className="h-8 w-8 shrink-0 grid place-items-center rounded-lg bg-white/10 text-white">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold text-white">{title}</span>
        {subtitle && <span className="block truncate text-[10px] text-white/70">{subtitle}</span>}
      </span>
      {children ?? <ChevronRight className="h-4 w-4 shrink-0 text-white/60" />}
    </button>
  );
}

export function ReelOverlay({ reel, onOpenContext }: ReelOverlayProps) {
  const ctx = getReelContext(reel);
  const location = reel.location;
  const business = reel.business;
  const event = reel.event;
  const driver = reel.driver;
  const offer = business?.offers[0];

  return (
    <div className="absolute inset-x-0 bottom-4 z-10 px-4">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
          {ctx.badge}
        </span>
        {ctx.distance && (
          <span className="text-[11px] text-white/80 drop-shadow">{ctx.distance}</span>
        )}
        <span className="text-[11px] text-white/60">{formatRelativeTime(reel.createdAt)}</span>
      </div>

      <ReelUser author={reel.author} onOpenProfile={() => onOpenContext(ctx.authorTarget)} />

      <div className="mt-1.5">
        <ReelDescription text={reel.caption} />
      </div>

      <div className="mt-1.5">
        <ReelTags category={reel.category} hashtags={reel.hashtags} />
      </div>

      {location && (
        <div className="mt-2 max-w-[62%]">
          <ReelLocation location={location} />
        </div>
      )}

      {reel.category === ReelCategory.OFFER && business && offer && (
        <EntityRow
          icon={<Tag className="h-4 w-4 text-amber-300" />}
          title={offer.title}
          subtitle={`${business.name} · ${offer.discountPercent}% off`}
          onClick={() => onOpenContext({ type: "oferta", id: business.id })}
        />
      )}

      {reel.category === ReelCategory.BUSINESS && business && (
        <EntityRow
          icon={<Building2 className="h-4 w-4 text-primary" />}
          title={business.name}
          subtitle={`${business.category} · ${business.rating.toFixed(1)}★ · ${business.reviewCount} avaliações`}
          onClick={() => onOpenContext({ type: "negocio", id: business.id })}
        />
      )}

      {event && reel.category !== ReelCategory.OFFER && (
        <EntityRow
          icon={<CalendarDays className="h-4 w-4 text-pink-300" />}
          title={event.name}
          subtitle={`${formatRelativeTime(event.date)} · ${event.attendingCount} vão`}
          onClick={() => onOpenContext({ type: "evento", id: event.id })}
        />
      )}

      {driver && (
        <EntityRow
          icon={<Car className="h-4 w-4 text-cyan-300" />}
          title={driver.name}
          subtitle={`${driver.vehicle} · ${driver.rating.toFixed(1)}★ · ETA ${driver.etaMinutes}min`}
          onClick={() => onOpenContext({ type: "corrida", id: driver.id })}
        />
      )}

      {reel.music && (
        <div className="mt-2">
          <ReelMusic music={reel.music} />
        </div>
      )}

      <button
        onClick={() => onOpenContext(ctx.actionTarget)}
        className="mt-3 inline-flex items-center gap-1 rounded-full bg-gradient-brand px-4 py-2 text-[12px] font-bold text-white shadow-lg active:scale-95 transition"
      >
        {ctx.actionLabel}
      </button>
    </div>
  );
}
