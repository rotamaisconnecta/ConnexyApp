import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  hasMoreNearby,
  listHomeDiscoveryItems,
  NEARBY_PAGE_SIZE,
  paginateNearby,
  type HomeDiscoveryItem,
} from "@/lib/home/home-discovery";
import { subscribeLocalCatalog } from "@/lib/catalog/local-catalog";

export function NearbyYouList() {
  const [catalogTick, setCatalogTick] = useState(0);
  const [limit, setLimit] = useState(NEARBY_PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => subscribeLocalCatalog(() => setCatalogTick((tick) => tick + 1)), []);

  const all = useMemo(() => {
    void catalogTick;
    return listHomeDiscoveryItems();
  }, [catalogTick]);
  const visible = paginateNearby(all, limit);
  const more = hasMoreNearby(all.length, limit);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !more) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setLimit((current) => Math.min(current + NEARBY_PAGE_SIZE, all.length));
        }
      },
      { rootMargin: "80px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [all.length, more, visible.length]);

  return (
    <section className="bg-background px-5 pb-5 pt-4" aria-labelledby="perto-de-voce-title">
      <div className="mb-3 flex items-end justify-between gap-3">
        <h3 id="perto-de-voce-title" className="font-display text-base font-bold">
          Perto de você
        </h3>
        <Link to="/locais" className="text-xs font-semibold text-primary">
          Ver mais
        </Link>
      </div>

      <ul className="space-y-2.5">
        {visible.map((item) => (
          <NearbyRow key={item.id} item={item} />
        ))}
      </ul>

      {more ? (
        <div ref={sentinelRef} className="h-8" aria-hidden />
      ) : (
        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          {all.length === 0 ? "Nada por perto no momento." : "Não há mais itens"}
        </p>
      )}
    </section>
  );
}

function NearbyRow({ item }: { item: HomeDiscoveryItem }) {
  return (
    <li className="flex items-center gap-3 rounded-[18px] border border-border/50 bg-surface p-2.5 shadow-soft">
      <img src={item.image} alt="" className="h-14 w-14 shrink-0 rounded-[14px] object-cover" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-sm font-bold">{item.title}</p>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{item.subtitle}</p>
      </div>
      <span className="shrink-0 text-[10px] font-semibold text-primary">{item.distanceLabel}</span>
    </li>
  );
}
