import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Bike,
  Car,
  Clock3,
  LocateFixed,
  MapPin,
  MoreHorizontal,
  Pencil,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import { CATEGORY_INFO } from "./ride-data";
import { RIDE_LILAC, RIDE_MAGENTA } from "./ride-sheet";
import {
  canConfirmRideChoose,
  listRideChooseOptions,
  pruneSelectedRideOptionIds,
  rideChooseCategoryLabel,
  rideChooseOptionTag,
  RIDE_VEHICLE_TYPES,
  toggleRideChooseOption,
  visibleSelectedRideOptions,
  type RideChooseOption,
} from "@/lib/mobility/ride-choose-options";
import { RIDE_CHOOSE_SHEET_RATIO } from "@/lib/mobility/ride-map-layout";
import type { RideCategory } from "@/lib/mobility/demo-fare";
import type { GeoLocation } from "@/lib/mobility/ride-types";
import { formatRouteDistance } from "@/lib/mobility/route-utils";
import { formatPrice } from "@/lib/mobility/ride-pricing";
import { CURRENT_RIDE_ORIGIN_LABEL } from "@/lib/mobility/ride-request-context";

function placeLine(location: GeoLocation | null, fallback: string) {
  if (!location) return fallback;
  return location.address || location.label || fallback;
}

function formatRating(value: number) {
  return value.toFixed(1).replace(".", ",");
}

export function RideChooseScreen({
  origin,
  destination,
  category,
  fares,
  etaMap,
  routeMeta,
  onRequest,
  onBack,
  onSafety,
  onMore,
  onEditOrigin,
  onEditDestination,
  onRecenter,
}: {
  origin: GeoLocation | null;
  destination: GeoLocation | null;
  category: RideCategory;
  fares: Record<RideCategory, number>;
  etaMap: Record<RideCategory, number>;
  routeMeta: { distance: string; duration: string };
  onRequest: (selected: RideChooseOption[]) => void;
  onBack: () => void;
  onSafety: () => void;
  onMore: () => void;
  onEditOrigin: () => void;
  onEditDestination: () => void;
  onRecenter: () => void;
}) {
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);

  const options = useMemo(
    () => listRideChooseOptions({ origin, types: RIDE_VEHICLE_TYPES, fares, etaMap }),
    [origin, fares, etaMap],
  );

  useEffect(() => {
    setSelectedOptionIds((current) => {
      const next = pruneSelectedRideOptionIds(options, current);
      if (next.length === current.length && next.every((id, index) => id === current[index])) {
        return current;
      }
      return next;
    });
  }, [options]);

  const selectedOptions = visibleSelectedRideOptions(options, selectedOptionIds);
  const selectedFare = selectedOptions[0]?.fare ?? fares[category];
  const TransportIcon =
    selectedOptions.length > 0 && selectedOptions.every((option) => option.category === "moto")
      ? Bike
      : Car;
  const canConfirm = canConfirmRideChoose(RIDE_VEHICLE_TYPES, selectedOptions);

  const handleToggleOption = (optionId: string) => {
    setSelectedOptionIds((current) => toggleRideChooseOption(current, optionId));
  };

  const handleConfirm = () => {
    if (!canConfirm) return;
    onRequest(selectedOptions);
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex flex-col overflow-hidden">
      <div className="relative min-h-0 flex-1">
        <header className="pointer-events-auto absolute inset-x-0 top-0 z-10 flex items-center justify-between px-3 pb-1.5 pt-[max(0.2rem,env(safe-area-inset-top,0px))] md:pt-2">
          <button
            type="button"
            onClick={onBack}
            aria-label="Voltar"
            className="grid h-9 w-9 place-items-center rounded-full bg-white/90 text-[#6D28D9] shadow-[0_6px_16px_rgba(17,17,17,0.08)] backdrop-blur-md"
          >
            <ArrowLeft className="h-[16px] w-[16px]" strokeWidth={2.1} />
          </button>
          <div className="min-w-0 flex-1 px-2 text-center">
            <h2 className="text-[15px] font-bold tracking-tight text-[#111111]">Escolha sua corrida</h2>
          </div>
          <button
            type="button"
            onClick={onSafety}
            aria-label="Segurança"
            className="grid h-9 w-9 place-items-center rounded-full bg-white/90 text-[#6D28D9] shadow-[0_6px_16px_rgba(17,17,17,0.08)] backdrop-blur-md"
          >
            <ShieldCheck className="h-[16px] w-[16px]" strokeWidth={2.1} />
          </button>
        </header>

        <div className="pointer-events-auto absolute inset-x-3 top-[2.85rem] z-10">
          <div className="rounded-[18px] border border-white/70 bg-white/88 px-2.5 py-1.5 shadow-[0_8px_20px_rgba(17,17,17,0.08)] backdrop-blur-md">
            <div className="flex items-center gap-2">
              <div className="flex w-3 shrink-0 flex-col items-center self-stretch py-0.5">
                <span className="h-2 w-2 rounded-full" style={{ background: RIDE_LILAC }} />
                <span className="my-0.5 w-px flex-1 bg-gradient-to-b from-[#A855F7] to-[#E11D8F]" />
                <span className="h-2 w-2 rounded-full" style={{ background: RIDE_MAGENTA }} />
              </div>
              <div className="min-w-0 flex-1">
                <button type="button" onClick={onEditOrigin} className="block w-full truncate text-left text-[12px] font-semibold text-[#111111]">
                  {placeLine(origin, CURRENT_RIDE_ORIGIN_LABEL)}
                </button>
                <button type="button" onClick={onEditDestination} className="mt-0.5 block w-full truncate text-left text-[12px] font-semibold text-[#111111]">
                  {placeLine(destination, "Escolha o destino")}
                </button>
              </div>
              <button
                type="button"
                onClick={onEditDestination}
                aria-label="Alterar destino"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-zinc-50 text-[#6D28D9]"
              >
                <Pencil className="h-3.5 w-3.5" strokeWidth={2.2} />
              </button>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center pr-14">
          <span className="flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 shadow-[0_8px_20px_rgba(17,17,17,0.1)] backdrop-blur-md">
            <span className="text-[12px] font-bold text-[#111111]">{routeMeta.duration}</span>
            <span className="text-[11px] font-medium text-zinc-400">{routeMeta.distance}</span>
          </span>
        </div>
        <button
          type="button"
          onClick={onRecenter}
          aria-label="Centralizar no mapa"
          className="pointer-events-auto absolute bottom-2 right-3 grid h-10 w-10 place-items-center rounded-full bg-white/90 shadow-[0_8px_20px_rgba(17,17,17,0.1)] backdrop-blur-md transition-transform active:scale-95"
        >
          <LocateFixed className="h-4 w-4" style={{ color: RIDE_LILAC }} />
        </button>
      </div>

      <section
        className="pointer-events-auto flex min-h-0 shrink-0 flex-col overflow-hidden rounded-t-[26px] bg-white shadow-[0_-16px_40px_rgba(17,17,17,0.1)]"
        style={{ height: `${Math.round(RIDE_CHOOSE_SHEET_RATIO * 100)}%` }}
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-zinc-200" aria-hidden />

        <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar px-4 pb-1 pt-2">
          {options.length === 0 ? (
            <p className="rounded-[20px] bg-zinc-50 px-4 py-6 text-center text-[13px] font-medium text-zinc-500">
              Nenhum veículo disponível agora.
            </p>
          ) : (
            options.map((option, index) => (
              <ChooseRideCard
                key={option.id}
                option={option}
                selected={selectedOptionIds.includes(option.id)}
                tag={rideChooseOptionTag(option, options)}
                delay={index * 0.03}
                onSelect={() => handleToggleOption(option.id)}
              />
            ))
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2 border-t border-zinc-100 px-3 pb-2 pt-1.5">
          <button
            type="button"
            onClick={onMore}
            className="flex shrink-0 flex-col items-center gap-0.5 text-[9px] font-semibold text-zinc-500"
          >
            <span className="grid h-10 w-10 place-items-center rounded-2xl border border-zinc-100 bg-white">
              <MoreHorizontal className="h-4 w-4 text-[#111111]" />
            </span>
            Mais opções
          </button>
          <motion.button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm}
            whileTap={canConfirm ? { scale: 0.98 } : undefined}
            className="flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-full px-3 text-white shadow-[0_12px_28px_rgba(124,58,237,0.32)] disabled:opacity-40"
            style={{ background: "linear-gradient(90deg, #7C3AED 0%, #A855F7 100%)" }}
          >
            <TransportIcon className="h-4 w-4 shrink-0" strokeWidth={2.2} />
            <span className="min-w-0 text-left">
              <span className="block truncate text-[13px] font-bold leading-tight">Confirmar corrida</span>
              <span className="block text-[11px] font-semibold leading-tight text-white/85">
                {formatPrice(selectedFare)}
              </span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2.4} />
          </motion.button>
        </div>
      </section>
    </div>
  );
}

function ChooseRideCard({
  option,
  selected,
  tag,
  delay,
  onSelect,
}: {
  option: RideChooseOption;
  selected: boolean;
  tag: string;
  delay: number;
  onSelect: () => void;
}) {
  const { driver } = option;
  const Icon = CATEGORY_INFO[option.category].icon;
  const online = driver.status === "available";

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay }}
      onClick={onSelect}
      aria-pressed={selected}
      className={`mb-1.5 flex w-full items-center gap-2 rounded-[20px] px-2.5 py-2 text-left transition-colors ${
        selected
          ? "border bg-[rgba(168,85,247,0.07)]"
          : "border border-zinc-100 bg-white"
      }`}
      style={
        selected
          ? {
              borderColor: "rgba(168,85,247,0.45)",
              boxShadow: "0 10px 28px rgba(124,58,237,0.12)",
            }
          : { boxShadow: "0 8px 20px rgba(17,17,17,0.04)" }
      }
    >
      <span className="relative shrink-0">
        <img
          src={driver.photo}
          alt=""
          className="h-11 w-11 rounded-full object-cover ring-2 ring-white"
        />
        <span
          className="absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-white"
          style={{ background: online ? "#22C55E" : "#A1A1AA" }}
          aria-label={online ? "Disponível" : "Indisponível"}
        />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1">
          <span className="truncate text-[13px] font-bold text-[#111111]">{driver.name}</span>
          {driver.verified && (
            <BadgeCheck className="h-3.5 w-3.5 shrink-0" style={{ color: RIDE_LILAC }} />
          )}
        </span>
        <span className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-zinc-500">
          <Star className="h-3 w-3 fill-[#EAB308] text-[#EAB308]" />
          {formatRating(driver.rating)}
          <span className="text-zinc-400">({driver.totalRides})</span>
        </span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] font-medium text-zinc-400">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3 shrink-0" />
            {formatRouteDistance(option.distanceMeters)}
          </span>
          <span className="flex items-center gap-1">
            <Clock3 className="h-3 w-3 shrink-0" />
            {option.etaMinutes} min
          </span>
        </span>
      </span>

      <span className="flex w-[72px] shrink-0 flex-col items-center">
        <span className="grid h-10 w-14 place-items-center rounded-[14px] bg-zinc-50">
          <Icon className="h-5 w-5 text-[#111111]" />
        </span>
        <span className="mt-1 text-[10px] font-semibold text-zinc-500">
          {rideChooseCategoryLabel(option.category)}
        </span>
        <span className="flex items-center gap-0.5 text-[9px] font-medium text-zinc-400">
          <Users className="h-2.5 w-2.5" />
          {driver.vehicle.seats}
        </span>
      </span>

      <span className="flex w-[78px] shrink-0 flex-col items-end">
        <span className="text-[15px] font-extrabold tracking-tight text-[#111111]">
          {formatPrice(option.fare)}
        </span>
        <span className="mt-0.5 text-[9px] font-semibold text-zinc-400">{tag}</span>
        <span
          className={`mt-2 h-4 w-4 rounded-full border-2 ${selected ? "border-[6px]" : "bg-white"}`}
          style={{ borderColor: selected ? RIDE_LILAC : "#D4D4D8" }}
          aria-hidden
        />
      </span>
    </motion.button>
  );
}
