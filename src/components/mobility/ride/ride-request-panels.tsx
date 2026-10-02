import { useRef, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Briefcase,
  Check,
  ChevronRight,
  Clock3,
  Coffee,
  Home,
  MapPin,
  Navigation2,
  Trees,
} from "lucide-react";
import { DEMO_DESTINATIONS, PICKUP_CHIPS, type DemoDestination } from "./ride-data";
import { RideItineraryCard } from "./ride-itinerary";
import { RideSheet, RIDE_MUTED, RIDE_LILAC, RIDE_MAGENTA, PrimaryCTA } from "./ride-sheet";
import type { GeoLocation } from "@/lib/mobility/ride-types";
import type { RouteStop } from "@/lib/mobility/route-utils";
import { estimateRouteDistance, formatRouteDistance } from "@/lib/mobility/route-utils";
import type { RideRouteStatus } from "./ride-map";

const SUGGESTION_ICONS: Record<string, typeof Home> = {
  casa: Home,
  trabalho: Briefcase,
  ibirapuera: Trees,
  "cafe-central": Coffee,
};

function suggestionIcon(item: DemoDestination) {
  return SUGGESTION_ICONS[item.id] ?? MapPin;
}

/* ─── Tela 01 — Solicitar viagem ─────────────────────────── */

export function SolicitarPanel({
  origin,
  destination,
  stops,
  onEditOrigin,
  onEditDestination,
  onAddStop,
  onEditStop,
  onRemoveStop,
  onMoveStops,
  onPickDestination,
  onProceed,
  onClose,
  companionLabel,
  routeMeta,
  routeStatus,
  map,
  onPickFriend,
  pickFriendDisabled,
  occupancyLabel,
  vacancyLabel,
}: {
  origin: GeoLocation | null;
  destination: GeoLocation | null;
  stops: RouteStop[];
  onEditOrigin: () => void;
  onEditDestination: () => void;
  onAddStop: () => void;
  onEditStop: (id: string) => void;
  onRemoveStop: (id: string) => void;
  onMoveStops: (next: RouteStop[]) => void;
  onPickDestination: (dest: GeoLocation, name: string) => void;
  onProceed: () => void;
  onClose?: () => void;
  companionLabel?: string;
  routeMeta: { distance: string; duration: string };
  routeStatus: RideRouteStatus;
  map?: ReactNode;
  onPickFriend?: () => void;
  pickFriendDisabled?: boolean;
  occupancyLabel?: string;
  vacancyLabel?: string;
}) {
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const favorites = DEMO_DESTINATIONS.filter((item) => !item.recent);
  const recents = DEMO_DESTINATIONS.filter((item) => item.recent);
  const suggestions = [...favorites, ...recents];
  const canProceed = Boolean(origin && destination);
  const distanceText =
    routeStatus === "calculating"
      ? "…"
      : routeStatus === "error" || !destination
        ? "—"
        : routeMeta.distance;
  const durationText =
    routeStatus === "calculating"
      ? "Calculando rota..."
      : routeStatus === "error" || !destination
        ? "—"
        : routeMeta.duration;

  const pickSuggestion = (item: DemoDestination) => {
    onPickDestination(
      { lat: item.lat, lng: item.lng, label: item.name, address: item.address },
      item.name,
    );
  };

  return (
    <section className="absolute inset-0 z-30 flex flex-col overflow-hidden bg-[#F7F6F8]">
      <div className="h-[env(safe-area-inset-top,0px)] md:h-2" aria-hidden />
      <header className="relative flex items-center justify-between px-4 pb-2 pt-1">
        <button
          type="button"
          onClick={onClose}
          aria-label="Voltar"
          className="grid h-10 w-10 place-items-center rounded-full bg-white text-[#111111] shadow-[0_6px_16px_rgba(17,17,17,0.06)]"
        >
          <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={2.1} />
        </button>
        <div className="min-w-0 flex-1 px-3 text-center">
          <h2 className="text-[17px] font-bold tracking-tight text-[#111111]">Definir destino</h2>
          <p className="text-[12px] font-medium text-zinc-400">Informe onde você quer ir</p>
        </div>
        <button
          type="button"
          aria-label="Locais recentes"
          onClick={() => suggestionsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
          className="grid h-10 w-10 place-items-center rounded-full bg-white text-[#111111] shadow-[0_6px_16px_rgba(17,17,17,0.06)]"
        >
          <Clock3 className="h-[18px] w-[18px]" strokeWidth={2.1} />
        </button>
      </header>

      {companionLabel && (
        <div className="px-5 pb-1">
          <span className="rounded-full bg-[#111111] px-2.5 py-1 text-[9px] font-bold text-white">
            {companionLabel}
          </span>
        </div>
      )}

      <div
        className="grid min-h-0 flex-1 gap-2.5 overflow-hidden px-4 pb-1"
        style={{ gridTemplateRows: "auto 88px minmax(100px, 1fr) 52px" }}
      >
        <div>
          <RideItineraryCard
            origin={origin}
            destination={destination}
            stops={stops}
            onEditOrigin={onEditOrigin}
            onEditDestination={onEditDestination}
            onAddStop={onAddStop}
            onEditStop={onEditStop}
            onRemoveStop={onRemoveStop}
            onMoveStops={onMoveStops}
            onPickFriend={onPickFriend}
            pickFriendDisabled={pickFriendDisabled}
            occupancyLabel={occupancyLabel}
            vacancyLabel={vacancyLabel}
          />
        </div>

        {suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            id="ride-recents"
            className="min-h-0 overflow-y-auto no-scrollbar rounded-[24px] bg-white px-2 py-1.5 shadow-[0_10px_28px_rgba(17,17,17,0.04)] ring-1 ring-zinc-100/80"
          >
            <p className="px-2 pb-0.5 pt-0.5 text-[12px] font-semibold text-zinc-400">
              Sugestões para você
            </p>
            {suggestions.map((item) => {
              const Icon = suggestionIcon(item);
              const distance =
                origin && Number.isFinite(origin.lat)
                  ? formatRouteDistance(
                      estimateRouteDistance(origin, {
                        lat: item.lat,
                        lng: item.lng,
                        label: item.name,
                      }),
                    )
                  : null;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => pickSuggestion(item)}
                  className="flex w-full items-center gap-3 rounded-[16px] px-2 py-1.5 text-left transition-colors active:bg-zinc-50"
                >
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full"
                    style={{ background: "rgba(168,85,247,0.12)", color: RIDE_LILAC }}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2.1} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold text-[#111111]">
                      {item.name}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-zinc-400">
                      {item.address}
                    </span>
                  </span>
                  {distance && (
                    <span className="shrink-0 text-[12px] font-medium text-zinc-400">{distance}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {map && (
          <div className="relative min-h-0 overflow-hidden rounded-[24px] bg-zinc-100">
            {map}
          </div>
        )}

        <div className="flex items-stretch overflow-hidden rounded-[22px] bg-white shadow-[0_10px_28px_rgba(17,17,17,0.04)] ring-1 ring-zinc-100/80">
          <div className="flex flex-1 items-center gap-2 px-3 py-1.5">
            <span
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full"
              style={{ background: "rgba(168,85,247,0.12)", color: RIDE_LILAC }}
            >
              <Navigation2 className="h-4 w-4" strokeWidth={2.2} />
            </span>
            <span className="min-w-0">
              <span className="block text-[11px] font-medium text-zinc-400">Distância estimada</span>
              <span className="block text-[17px] font-bold text-[#111111]">{distanceText}</span>
            </span>
          </div>
          <div className="my-2.5 w-px bg-zinc-100" />
          <div className="flex flex-1 items-center gap-2 px-3 py-1.5">
            <span
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full"
              style={{ background: "rgba(225,29,143,0.1)", color: RIDE_MAGENTA }}
            >
              <Clock3 className="h-4 w-4" strokeWidth={2.2} />
            </span>
            <span className="min-w-0">
              <span className="block text-[11px] font-medium text-zinc-400">Tempo estimado</span>
              <span className="block text-[17px] font-bold text-[#111111]">{durationText}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="shrink-0 px-4 pb-4 pt-2">
        <motion.button
          type="button"
          onClick={onProceed}
          disabled={!canProceed || routeStatus === "error"}
          whileTap={canProceed ? { scale: 0.98 } : undefined}
          className="flex h-[54px] w-full items-center justify-center gap-2 rounded-full text-[16px] font-semibold text-white shadow-[0_12px_28px_rgba(124,58,237,0.28)] disabled:opacity-45"
          style={{ background: "linear-gradient(90deg, #7C3AED 0%, #A855F7 100%)" }}
        >
          Confirmar destino
          <ChevronRight className="h-5 w-5" strokeWidth={2.4} />
        </motion.button>
      </div>
    </section>
  );
}

/* ─── Tela 02 — Montar rota ──────────────────────────────── */

export function RouteEditorPanel({
  origin,
  destination,
  stops,
  onEditOrigin,
  onEditDestination,
  onAddStop,
  onRemoveStop,
  onEditStop,
  onMoveStops,
  onProceed,
  routeMeta,
  routeStatus,
  source,
  onPickFriend,
  pickFriendDisabled,
  occupancyLabel,
  vacancyLabel,
}: {
  origin: GeoLocation | null;
  destination: GeoLocation;
  stops: RouteStop[];
  onEditOrigin: () => void;
  onEditDestination: () => void;
  onAddStop: () => void;
  onRemoveStop: (id: string) => void;
  onEditStop: (id: string) => void;
  onMoveStops: (next: RouteStop[]) => void;
  onProceed: () => void;
  routeMeta: { distance: string; duration: string };
  routeStatus: RideRouteStatus;
  source?: string | null;
  onPickFriend?: () => void;
  pickFriendDisabled?: boolean;
  occupancyLabel?: string;
  vacancyLabel?: string;
}) {
  return (
    <RideSheet
      className="!max-h-[min(62dvh,560px)]"
      footer={
        <PrimaryCTA onClick={onProceed}>
          <Check className="h-4 w-4" strokeWidth={2.6} />
          Continuar
        </PrimaryCTA>
      }
    >
      <div className="px-5 pb-2 pt-3">
        <div className="flex items-end justify-between gap-2">
          <div>
            <h2 className="text-[22px] font-extrabold tracking-tight text-[#111111]">Sua rota</h2>
            <p className="mt-0.5 text-[12px]" style={{ color: RIDE_MUTED }}>
              {routeStatus === "calculating"
                ? "Calculando rota..."
                : routeStatus === "error"
                  ? "Não foi possível calcular essa rota."
                  : `${routeMeta.distance} · ${routeMeta.duration}`}
              {source === "invite" ? " · Ir juntos" : ""}
            </p>
          </div>
        </div>

        <div className="mt-3">
          <RideItineraryCard
            origin={origin}
            destination={destination}
            stops={stops}
            onEditOrigin={onEditOrigin}
            onEditDestination={onEditDestination}
            onAddStop={onAddStop}
            onEditStop={onEditStop}
            onRemoveStop={onRemoveStop}
            onMoveStops={onMoveStops}
            onPickFriend={onPickFriend}
            pickFriendDisabled={pickFriendDisabled}
            occupancyLabel={occupancyLabel}
            vacancyLabel={vacancyLabel}
          />
        </div>
      </div>
    </RideSheet>
  );
}

/* ─── Confirmação de embarque ────────────────────────────── */

export function PickupPanel({
  pickupLabel,
  pickupPoint,
  onPickupChip,
  onConfirm,
}: {
  pickupLabel: string;
  pickupPoint: string;
  onPickupChip: (chip: string) => void;
  onConfirm: () => void;
}) {
  return (
    <RideSheet
      footer={
        <PrimaryCTA onClick={onConfirm}>
          <Check className="h-4 w-4" strokeWidth={2.6} />
          Confirmar local
        </PrimaryCTA>
      }
    >
      <div className="px-5 pb-2 pt-3">
        <h2 className="text-[21px] font-extrabold tracking-tight text-[#111111]">
          Confirme seu local de embarque
        </h2>
        <p className="mt-0.5 text-[12px]" style={{ color: RIDE_MUTED }}>
          Arraste o mapa para ajustar.
        </p>

        <div className="mt-3 flex items-center gap-3 rounded-[16px] border border-zinc-200 bg-zinc-50 px-3.5 py-3">
          <span
            className="grid h-9 w-9 shrink-0 grid-cols-1 place-items-center rounded-full"
            style={{ background: RIDE_LILAC }}
          >
            <MapPin className="h-4 w-4 text-black" strokeWidth={2.4} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] font-semibold text-[#111111]">
              {pickupLabel}
            </span>
            <span className="block truncate text-[10px] text-zinc-500">{pickupPoint}</span>
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5 pb-2">
          {PICKUP_CHIPS.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => onPickupChip(chip.label)}
              className={`h-9 rounded-full border px-3.5 text-[12px] font-semibold transition-colors ${
                pickupPoint === chip.label
                  ? "border-transparent text-[#111111]"
                  : "border-zinc-200 bg-white text-zinc-600"
              }`}
              style={
                pickupPoint === chip.label
                  ? { background: "rgba(168,85,247,0.08)", borderColor: "rgba(168,85,247,0.25)" }
                  : undefined
              }
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>
    </RideSheet>
  );
}

export { RideChooseScreen as CategoryPanel } from "./ride-choose-screen";
