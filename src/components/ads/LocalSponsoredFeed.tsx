import { motion } from "framer-motion";
import { useEffect, useMemo } from "react";
import { toast } from "sonner";
import { MapPin } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { SwipeCarousel } from "@/components/system/swipe-carousel";
import { useGeolocation } from "@/hooks/use-geolocation";
import { calculateDistanceMeters, formatDistance } from "@/lib/marketplace/distance-utils";
import {
  SPONSORED_ADS,
  sponsoredActionMessage,
  type SponsoredAction,
} from "@/lib/ads/mock-sponsored-content";
import { resolveSponsoredRoute } from "@/lib/navigation/detail-routes";

export function LocalSponsoredFeed() {
  const nav = useNavigate();
  const geolocation = useGeolocation();

  useEffect(() => {
    geolocation.request();
  }, [geolocation.request]);

  const nearbyAds = useMemo(() => {
    const userLocation =
      geolocation.latitude !== null && geolocation.longitude !== null
        ? { lat: geolocation.latitude, lng: geolocation.longitude }
        : { lat: -23.55, lng: -46.64 };

    return SPONSORED_ADS.map((ad) => ({
      ...ad,
      liveDistanceMeters: calculateDistanceMeters(userLocation, {
        lat: ad.latitude,
        lng: ad.longitude,
      }),
    }))
      .filter((ad) => ad.liveDistanceMeters <= 2_000)
      .sort((a, b) => a.liveDistanceMeters - b.liveDistanceMeters);
  }, [geolocation.latitude, geolocation.longitude]);

  function handleClick(adId: string, action: string, title: string) {
    const ad = SPONSORED_ADS.find((a) => a.id === adId);
    const route = ad ? resolveSponsoredRoute(ad) : null;
    if (route) {
      nav({ href: route });
      return;
    }
    toast.success(sponsoredActionMessage(action as SponsoredAction, title));
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full"
    >
      <div className="mb-4 px-6">
        <div className="flex items-center gap-1.5">
          <span className="text-sm" aria-hidden>
            🏷️
          </span>
          <h3 className="font-display text-base font-bold truncate">Descobertas locais</h3>
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Patrocinados em até 2 km da sua localização
        </p>
      </div>

      <SwipeCarousel
        ariaLabel="Descobertas locais"
        hintLabel="Deslize para ver mais ofertas"
        className="gap-4"
      >
        {nearbyAds.map((ad) => (
          <article
            key={ad.id}
            className="w-[272px] shrink-0 snap-start overflow-hidden rounded-2xl border border-border/50 bg-surface shadow-soft transition-all duration-300 hover:shadow-xl"
          >
            <div className="relative h-28">
              {ad.cover ? (
                <img
                  src={ad.cover}
                  alt={ad.title}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-primary/10 to-secondary/40 text-3xl">
                  {ad.emoji ?? "🛍️"}
                </div>
              )}
              <span className="absolute top-2.5 left-2.5 z-10 rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-bold text-gray-800 shadow-soft">
                Patrocinado
              </span>
              <span className="absolute bottom-2.5 left-2.5 z-10 inline-flex items-center gap-1 rounded-full bg-black/45 px-2.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
                <MapPin className="h-3 w-3" />
                {formatDistance(ad.liveDistanceMeters)}
              </span>
            </div>

            <div className="flex flex-col p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                {ad.category}
              </div>
              <h4 className="font-display text-sm font-bold leading-snug">{ad.title}</h4>
              {ad.subtitle && (
                <p className="mt-0.5 text-[11px] text-muted-foreground">{ad.subtitle}</p>
              )}
              <button
                type="button"
                onClick={() => handleClick(ad.id, ad.action, ad.title)}
                className="mt-3 h-10 w-full rounded-full bg-primary/10 text-primary text-xs font-semibold transition-colors hover:bg-primary/20 active:scale-[0.98]"
              >
                {ad.ctaLabel}
              </button>
            </div>
          </article>
        ))}
        {nearbyAds.length === 0 && (
          <div className="w-[272px] shrink-0 rounded-2xl border border-dashed border-border bg-surface p-5 text-sm text-muted-foreground">
            Nenhuma descoberta patrocinada neste raio agora. Ao se movimentar, novas opções podem aparecer.
          </div>
        )}
      </SwipeCarousel>
    </motion.div>
  );
}
