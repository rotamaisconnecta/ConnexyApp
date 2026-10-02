import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Bell,
  Building2,
  CalendarDays,
  CarFront,
  ChevronRight,
  LocateFixed,
  MapPin,
  Navigation,
  ShoppingBag,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";
import { StatusBar } from "@/components/phone-frame";
import { useAuth } from "@/hooks/use-auth";
import { isDemoMode } from "@/lib/demo/demo-config";
import { useDemoOwnProfile } from "@/lib/demo/demo-own-profile";
import { useDemoPendingRequests } from "@/lib/demo/use-demo-db";
import { RIDE_EXPLORE_PIN_COLORS, type RideExploreKind } from "@/lib/mobility/ride-explore-pins";
import type { GeoLocation } from "@/lib/mobility/ride-types";
import { RIDE_LILAC } from "./ride-sheet";

const CATEGORIES: {
  id: RideExploreKind;
  label?: string;
  icon: typeof CarFront;
}[] = [
  { id: "motoristas", label: "Motoristas", icon: CarFront },
  { id: "negocios", label: "Negócios", icon: Building2 },
  { id: "eventos", label: "Eventos", icon: CalendarDays },
  { id: "locais", icon: ShoppingBag },
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function RideLandingChrome({
  destination,
  exploreKind,
  onExploreKind,
  onOpenDestination,
  onOpenFilters,
  onRequestRide,
  onRecenter,
}: {
  destination: GeoLocation | null;
  exploreKind: RideExploreKind;
  onExploreKind: (kind: RideExploreKind) => void;
  onOpenDestination: () => void;
  onOpenFilters: () => void;
  onRequestRide: () => void;
  onRecenter: () => void;
}) {
  const { user } = useAuth();
  const demoProfile = useDemoOwnProfile();
  const pendingRequests = useDemoPendingRequests(user?.id);
  const pendingRequestCount = isDemoMode() ? pendingRequests.length : 0;
  const displayName = isDemoMode()
    ? demoProfile.name
    : (user?.user_metadata?.name as string | undefined)?.trim() || "Você";
  const avatarUrl = isDemoMode() ? demoProfile.photo : null;
  const initials = getInitials(displayName);

  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex flex-col">
      <div className="pointer-events-auto bg-white">
        <StatusBar />
        <header className="flex items-center justify-between px-5 pb-2 pt-1">
          <BrandLogo variant="full" size="md" className="w-[138px]" />
          <div className="flex items-center gap-2">
            <Link
              to="/notificacoes"
              aria-label="Notificações"
              className="relative grid h-10 w-10 place-items-center rounded-full bg-white shadow-[0_6px_18px_rgba(17,17,17,0.08)] transition-transform active:scale-95"
            >
              <Bell className="h-[18px] w-[18px] text-[#111111]" strokeWidth={1.9} />
              {pendingRequestCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-semibold leading-none text-white">
                  {pendingRequestCount > 9 ? "9+" : pendingRequestCount}
                </span>
              )}
            </Link>
            <Link
              to="/perfil"
              aria-label="Abrir meu perfil"
              className="shrink-0 rounded-full shadow-[0_6px_18px_rgba(17,17,17,0.08)] transition-transform active:scale-95"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={`Foto de ${displayName}`}
                  className="h-10 w-10 rounded-full object-cover ring-2 ring-white"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-brand text-white ring-2 ring-white">
                  {initials ? (
                    <span className="text-xs font-semibold">{initials}</span>
                  ) : (
                    <UserRound className="h-[18px] w-[18px]" />
                  )}
                </div>
              )}
            </Link>
          </div>
        </header>

        <div className="px-5 pb-1">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex h-[54px] w-full items-center gap-1 rounded-full border border-zinc-100 bg-white pl-4 pr-2 text-left shadow-[0_10px_28px_rgba(17,17,17,0.08)]"
        >
          <button
            type="button"
            onClick={onOpenDestination}
            className="flex min-w-0 flex-1 items-center gap-3 py-2 text-left"
            aria-label="Definir destino"
          >
            <MapPin className="h-5 w-5 shrink-0" style={{ color: RIDE_LILAC }} strokeWidth={2.2} />
            <span
              className={`min-w-0 flex-1 truncate text-[16px] ${
                destination?.label ? "font-semibold text-[#111111]" : "font-semibold text-zinc-400"
              }`}
            >
              {destination?.label ?? "Para onde você vai?"}
            </span>
          </button>
          <button
            type="button"
            aria-label="Abrir definições da corrida"
            onClick={onOpenFilters}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#111111] transition-transform active:scale-95"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </motion.div>

        <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar pb-3">
          {CATEGORIES.map((category) => {
            const Icon = category.icon;
            const selected = exploreKind === category.id;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => onExploreKind(category.id)}
                className={`flex h-9 items-center gap-1.5 rounded-full text-[12px] font-semibold shadow-[0_6px_16px_rgba(17,17,17,0.06)] transition-all ${
                  selected
                    ? "text-white"
                    : "border border-zinc-100 bg-white text-[#111111]"
                } ${category.label ? "min-w-0 flex-1 justify-center px-2" : "w-9 shrink-0 justify-center px-0"}`}
                style={selected ? { background: RIDE_LILAC } : undefined}
                aria-pressed={selected}
                aria-label={category.label ?? "Locais"}
              >
                <Icon
                  className="h-4 w-4"
                  strokeWidth={2.1}
                  style={selected ? undefined : { color: RIDE_EXPLORE_PIN_COLORS[category.id] }}
                />
                {category.label}
              </button>
            );
          })}
        </div>
        </div>
      </div>

      <div className="pointer-events-none relative min-h-0 flex-1">
        <div className="pointer-events-auto absolute right-4 top-[38%] flex -translate-y-1/2 flex-col gap-2.5">
          <button
            type="button"
            onClick={onRecenter}
            aria-label="Centralizar no mapa"
            className="grid h-11 w-11 place-items-center rounded-full bg-white shadow-[0_8px_20px_rgba(17,17,17,0.1)] transition-transform active:scale-95"
          >
            <LocateFixed className="h-4 w-4" style={{ color: RIDE_LILAC }} />
          </button>
          <button
            type="button"
            onClick={onRecenter}
            aria-label="Minha localização"
            className="grid h-11 w-11 place-items-center rounded-full bg-white shadow-[0_8px_20px_rgba(17,17,17,0.1)] transition-transform active:scale-95"
          >
            <Navigation className="h-4 w-4" style={{ color: RIDE_LILAC }} />
          </button>
        </div>
      </div>

      <div className="pointer-events-auto px-5 pb-3 pt-2">
        <motion.button
          type="button"
          onClick={onRequestRide}
          whileTap={{ scale: 0.98 }}
          className="flex h-[54px] w-full items-center justify-center gap-2 rounded-full text-[16px] font-semibold text-white shadow-[0_12px_28px_rgba(124,58,237,0.32)]"
          style={{ background: "linear-gradient(90deg, #7C3AED 0%, #A855F7 100%)" }}
        >
          Pedir Corrida
          <ChevronRight className="h-5 w-5" strokeWidth={2.4} />
        </motion.button>
      </div>
    </div>
  );
}
