import {
  getHomeDiscoveryNavigation,
  listConnectPulseItems,
  pulseMetaLine,
  type HomeDiscoveryItem,
} from "@/lib/home/home-discovery";
import { subscribeLocalCatalog } from "@/lib/catalog/local-catalog";
import { TypeScale } from "@/theme/typography";
import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";

function pulseCopy(item: HomeDiscoveryItem): { summary?: string; meta?: string } {
  const meta = pulseMetaLine(item.whenLabel, item.whereLabel);
  if (item.summary) return { summary: item.summary, meta };
  if (meta) return { meta };
  const parts = item.subtitle.split(" · ");
  const leftover = parts.slice(1).join(" · ");
  return leftover ? { summary: leftover } : {};
}

function PulseCardBody({ item }: { item: HomeDiscoveryItem }) {
  const { summary, meta } = pulseCopy(item);
  return (
    <>
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img src={item.image} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        <span className="absolute left-3 top-3 rounded-full bg-white/92 px-2.5 py-0.5 text-[11px] font-semibold text-foreground shadow-soft">
          {item.subtitle.split(" · ")[0]}
        </span>
      </div>
      <div className="px-3 py-3.5">
        <p className={`font-display font-semibold leading-snug ${TypeScale.cardTitle}`}>
          {item.title}
        </p>
        {summary ? (
          <p className={`mt-1.5 ${TypeScale.caption} text-muted-foreground`}>
            {summary}
          </p>
        ) : null}
        {meta ? (
          <p className={`mt-1.5 ${TypeScale.caption} text-foreground/80`}>{meta}</p>
        ) : null}
        <p className={`mt-2 font-medium text-primary ${TypeScale.meta}`}>{item.distanceLabel}</p>
      </div>
    </>
  );
}

function PulseCardLink({ item, children }: { item: HomeDiscoveryItem; children: ReactNode }) {
  const target = getHomeDiscoveryNavigation(item);
  const className =
    "block w-full overflow-hidden rounded-[22px] border border-border/50 bg-surface shadow-soft outline-none transition-shadow hover:shadow-elevated focus-visible:ring-2 focus-visible:ring-primary/40";
  const label = `Ver ${item.title}`;

  if (!target) {
    return <article className={className}>{children}</article>;
  }

  if (target.to === "/marketplace") {
    return (
      <Link to="/marketplace" aria-label={label} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <Link to={target.to} params={target.params} aria-label={label} className={className}>
      {children}
    </Link>
  );
}

function PulseCard({ item }: { item: HomeDiscoveryItem }) {
  return (
    <PulseCardLink item={item}>
      <PulseCardBody item={item} />
    </PulseCardLink>
  );
}

export function ConnexyPulse() {
  const [catalogTick, setCatalogTick] = useState(0);
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => subscribeLocalCatalog(() => setCatalogTick((tick) => tick + 1)), []);
  useEffect(() => {
    const timer = window.setInterval(() => setNowTick(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const items = useMemo(() => {
    void catalogTick;
    return listConnectPulseItems(new Date(nowTick));
  }, [catalogTick, nowTick]);

  return (
    <section className="mt-6 overflow-hidden border-y border-border/30 bg-surface/40">
      <div className="px-5 pb-1 pt-4">
        <h2 className={`font-display font-semibold ${TypeScale.sectionTitle}`}>Connexy Pulse</h2>
        <p className={`mt-1 ${TypeScale.caption} text-muted-foreground`}>
          Tudo o que importa ao seu redor.
        </p>
      </div>

      <div
        className="mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto pl-5 pb-5 no-scrollbar"
        role="list"
        aria-label="Connexy Pulse"
      >
        {items.map((item) => (
          <div key={item.id} role="listitem" className="min-w-[86%] w-[86%] shrink-0 snap-start">
            <PulseCard item={item} />
          </div>
        ))}
        <span aria-hidden className="w-5 shrink-0" />
      </div>
    </section>
  );
}
