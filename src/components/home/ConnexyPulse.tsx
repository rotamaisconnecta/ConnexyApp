import { NearbyYouList } from "@/components/home/nearby-you-list";
import { listConnectPulseItems, type HomeDiscoveryItem } from "@/lib/home/home-discovery";
import { subscribeLocalCatalog } from "@/lib/catalog/local-catalog";
import { useEffect, useMemo, useState } from "react";

function PulseCard({ item }: { item: HomeDiscoveryItem }) {
  return (
    <article className="w-[196px] shrink-0 snap-start overflow-hidden rounded-[22px] border border-border/50 bg-surface shadow-soft">
      <div className="relative h-[148px] overflow-hidden bg-muted">
        <img src={item.image} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <span className="absolute left-2.5 top-2.5 rounded-full bg-white/92 px-2 py-0.5 text-[9px] font-bold text-foreground shadow-soft">
          {item.subtitle.split(" · ")[0]}
        </span>
        <p className="absolute bottom-2.5 left-2.5 right-2.5 line-clamp-2 font-display text-[15px] font-bold leading-tight text-white">
          {item.title}
        </p>
      </div>
      <p className="px-2.5 py-2 text-[10px] text-muted-foreground">{item.distanceLabel}</p>
    </article>
  );
}

export function ConnexyPulse() {
  const [catalogTick, setCatalogTick] = useState(0);
  useEffect(() => subscribeLocalCatalog(() => setCatalogTick((tick) => tick + 1)), []);
  const items = useMemo(() => {
    void catalogTick;
    return listConnectPulseItems();
  }, [catalogTick]);

  return (
    <section className="mt-6 overflow-hidden border-y border-border/30 bg-surface/40">
      <div className="px-5 pb-1 pt-4">
        <h2 className="font-display text-[20px] font-bold leading-tight tracking-[-0.025em]">
          Connect Pulse
        </h2>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
          Uma vitrine da cidade ao seu redor.
        </p>
      </div>

      <div
        className="mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-4 no-scrollbar"
        role="list"
        aria-label="Connect Pulse"
      >
        {items.map((item) => (
          <div key={item.id} role="listitem">
            <PulseCard item={item} />
          </div>
        ))}
      </div>

      <NearbyYouList />
    </section>
  );
}
