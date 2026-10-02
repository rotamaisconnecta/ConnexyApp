import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Bike,
  Car,
  CircleDollarSign,
  Clock3,
  Crown,
  Headphones,
  LocateFixed,
  MapPin,
  MoreHorizontal,
  Pencil,
  Percent,
  Route,
  ShieldCheck,
  Star,
  Users,
  Zap,
} from "lucide-react";
import { CATEGORY_INFO } from "./ride-data";
import { RIDE_LILAC, RIDE_MAGENTA } from "./ride-sheet";
import {
  canConfirmRideChoose,
  listRideChooseOptions,
  pruneSelectedRideOptionIds,
  rideChooseCategoryLabel,
  rideChooseOptionTag,
  toggleRideChooseOption,
  toggleRideVehicleType,
  vehicleTypeFromCategory,
  visibleSelectedRideOptions,
  type RideChooseOption,
  type RideChooseSort,
  type RideVehicleType,
} from "@/lib/mobility/ride-choose-options";
import type { RideCategory } from "@/lib/mobility/demo-fare";
import type { GeoLocation } from "@/lib/mobility/ride-types";
import { formatRouteDistance } from "@/lib/mobility/route-utils";
import { formatPrice } from "@/lib/mobility/ride-pricing";
import { CURRENT_RIDE_ORIGIN_LABEL } from "@/lib/mobility/ride-request-context";

const VEHICLE_TYPES: { id: RideVehicleType; label: string; icon: typeof Car }[] = [
  { id: "carro", label: "Carro", icon: Car },
  { id: "moto", label: "Moto", icon: Bike },
];

const SORTS: { id: RideChooseSort; label: string; icon: typeof Star }[] = [
  { id: "recomendado", label: "Recomendado", icon: Star },
  { id: "rapido", label: "Mais rápido", icon: Zap },
  { id: "economico", label: "Mais econômico", icon: CircleDollarSign },
  { id: "premium", label: "Premium", icon: Crown },
];

const SAFETY = [
  { icon: ShieldCheck, title: "Viagem segura", subtitle: "Todos verificados" },
  { icon: Headphones, title: "Suporte 24h", subtitle: "Durante a viagem" },
  { icon: Route, title: "Rota otimizada", subtitle: "Mais rápida" },
] as const;

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
  onPromos,
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
  onPromos: () => void;
  onEditOrigin: () => void;
  onEditDestination: () => void;
  onRecenter: () => void;
}) {
  const [vehicleTypes, setVehicleTypes] = useState<RideVehicleType[]>(() => [
    vehicleTypeFromCategory(category),
  ]);
  const [sort, setSort] = useState<RideChooseSort>("recomendado");
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);

  const options = useMemo(
    () => listRideChooseOptions({ origin, types: vehicleTypes, sort, fares, etaMap }),
    [origin, vehicleTypes, sort, fares, etaMap],
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
  const canConfirm = canConfirmRideChoose(vehicleTypes, selectedOptions);

  const handleVehicleType = (type: RideVehicleType) => {
    const nextTypes = toggleRideVehicleType(vehicleTypes, type);
    const nextSort =
      sort === "premium" && nextTypes.length === 1 && nextTypes[0] === "moto" ? "recomendado" : sort;
    setVehicleTypes(nextTypes);
    if (nextSort !== sort) setSort(nextSort);
  };

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
        <header className="pointer-events-auto absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 pb-2 pt-[max(0.35rem,env(safe-area-inset-top,0px))] md:pt-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Voltar"
            className="grid h-10 w-10 place-items-center rounded-full bg-white/95 text-[#6D28D9] shadow-[0_6px_16px_rgba(17,17,17,0.08)]"
          >
            <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={2.1} />
          </button>
          <div className="min-w-0 flex-1 px-3 text-center">
            <h2 className="text-[17px] font-bold tracking-tight text-[#111111]">Escolha sua corrida</h2>
            <p className="text-[12px] font-medium text-zinc-400">Motoristas disponíveis para você</p>
          </div>
          <button
            type="button"
            onClick={onSafety}
            aria-label="Segurança"
            className="grid h-10 w-10 place-items-center rounded-full bg-white/95 text-[#6D28D9] shadow-[0_6px_16px_rgba(17,17,17,0.08)]"
          >
            <ShieldCheck className="h-[18px] w-[18px]" strokeWidth={2.1} />
          </button>
        </header>

        <div className="pointer-events-auto absolute inset-x-4 top-[3.65rem] z-10 md:top-[4.25rem]">
          <div className="rounded-[22px] border border-white/80 bg-white/95 p-3 shadow-[0_10px_28px_rgba(17,17,17,0.08)] backdrop-blur-md">
            <div className="flex items-stretch gap-3">
              <div className="flex w-4 shrink-0 flex-col items-center pt-1">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: RIDE_LILAC }} />
                <span className="my-1 w-px flex-1 bg-gradient-to-b from-[#A855F7] to-[#E11D8F]" />
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: RIDE_MAGENTA }} />
              </div>
              <div className="min-w-0 flex-1">
                <button type="button" onClick={onEditOrigin} className="block w-full text-left">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                    Origem
                  </span>
                  <span className="mt-0.5 block truncate text-[13px] font-semibold text-[#111111]">
                    {placeLine(origin, CURRENT_RIDE_ORIGIN_LABEL)}
                  </span>
                </button>
                <button type="button" onClick={onEditDestination} className="mt-1.5 block w-full text-left">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                    Destino
                  </span>
                  <span className="mt-0.5 block truncate text-[13px] font-semibold text-[#111111]">
                    {placeLine(destination, "Escolha o destino")}
                  </span>
                </button>
              </div>
              <button
                type="button"
                onClick={onEditDestination}
                className="flex shrink-0 items-center gap-1 self-start rounded-full bg-zinc-50 px-2.5 py-1.5 text-[11px] font-semibold text-[#6D28D9]"
              >
                <Pencil className="h-3 w-3" strokeWidth={2.2} />
                Alterar
              </button>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-14 flex justify-center">
          <span className="flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 shadow-[0_8px_20px_rgba(17,17,17,0.1)]">
            <span className="text-[12px] font-bold text-[#111111]">{routeMeta.duration}</span>
            <span className="text-[11px] font-medium text-zinc-400">{routeMeta.distance}</span>
          </span>
        </div>
        <button
          type="button"
          onClick={onRecenter}
          aria-label="Centralizar no mapa"
          className="pointer-events-auto absolute bottom-3 right-4 grid h-11 w-11 place-items-center rounded-full bg-white shadow-[0_8px_20px_rgba(17,17,17,0.1)] transition-transform active:scale-95"
        >
          <LocateFixed className="h-4 w-4" style={{ color: RIDE_LILAC }} />
        </button>
      </div>

      <section className="pointer-events-auto flex h-[62%] min-h-0 shrink-0 flex-col overflow-hidden rounded-t-[28px] bg-white shadow-[0_-16px_40px_rgba(17,17,17,0.1)] [@media(min-height:42rem)]:h-[70%]">
        <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-zinc-200" aria-hidden />

        <div className="shrink-0 px-4 pt-2.5">
          <div
            role="group"
            aria-label="Tipos de veículo"
            className="grid grid-cols-2 gap-1 rounded-full bg-zinc-100/90 p-1"
          >
            {VEHICLE_TYPES.map((item) => {
              const Icon = item.icon;
              const active = vehicleTypes.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => handleVehicleType(item.id)}
                  className="relative flex h-9 items-center justify-center gap-1.5 rounded-full text-[12px] font-semibold"
                  style={active ? { background: RIDE_LILAC, color: "#fff" } : undefined}
                >
                  <Icon
                    className={`h-3.5 w-3.5 ${active ? "text-white" : "text-zinc-500"}`}
                    strokeWidth={2.2}
                  />
                  <span className={active ? "text-white" : "text-[#111111]"}>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {SORTS.map((item) => {
              const Icon = item.icon;
              const active = sort === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSort(item.id)}
                  className={`flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[11px] font-semibold transition-colors ${
                    active ? "text-white" : "border border-zinc-100 bg-white text-[#111111]"
                  }`}
                  style={active ? { background: RIDE_LILAC } : undefined}
                  aria-pressed={active}
                >
                  <Icon
                    className="h-3.5 w-3.5"
                    strokeWidth={2.1}
                    style={
                      active
                        ? undefined
                        : item.id === "premium"
                          ? { color: "#EAB308" }
                          : { color: RIDE_LILAC }
                    }
                  />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar px-4 pb-1 pt-2">
          {options.length === 0 ? (
            <p className="rounded-[20px] bg-zinc-50 px-4 py-6 text-center text-[13px] font-medium text-zinc-500">
                {vehicleTypes.length === 0
                  ? "Selecione Carro ou Moto para ver as opções."
                  : "Nenhuma opção nesta combinação. Troque o filtro ou o tipo de veículo."}
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

        <div className="shrink-0 px-3 pb-0.5">
          <div className="grid grid-cols-3 gap-1 rounded-[16px] bg-[#F7F4FF] px-1.5 py-1.5">
            {SAFETY.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex min-w-0 items-center gap-1.5 px-1">
                  <span
                    className="grid h-6 w-6 shrink-0 place-items-center rounded-full"
                    style={{ background: "rgba(168,85,247,0.14)", color: RIDE_LILAC }}
                  >
                    <Icon className="h-3 w-3" strokeWidth={2.2} />
                  </span>
                  <span className="min-w-0 text-left">
                    <span className="block truncate text-[9px] font-bold leading-tight text-[#111111]">
                      {item.title}
                    </span>
                    <span className="block truncate text-[8px] font-medium leading-tight text-zinc-400">
                      {item.subtitle}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid shrink-0 grid-cols-[64px_minmax(0,1fr)_64px] items-center gap-2 border-t border-zinc-100 px-3 pb-2.5 pt-2">
          <button
            type="button"
            onClick={onMore}
            className="flex flex-col items-center gap-0.5 text-[9px] font-semibold text-zinc-500"
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
            className="flex h-[54px] min-w-0 items-center justify-center gap-2 rounded-full px-3 text-white shadow-[0_12px_28px_rgba(124,58,237,0.32)] disabled:opacity-40"
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
          <button
            type="button"
            onClick={onPromos}
            className="flex flex-col items-center gap-0.5 text-[9px] font-semibold text-zinc-500"
          >
            <span className="grid h-10 w-10 place-items-center rounded-2xl border border-zinc-100 bg-white">
              <Percent className="h-4 w-4 text-[#111111]" />
            </span>
            Promoções
          </button>
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
      className={`mb-2 flex w-full items-center gap-2.5 rounded-[22px] px-3 py-2.5 text-left transition-colors ${
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
          className="h-12 w-12 rounded-full object-cover ring-2 ring-white"
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
