import { Reorder, motion } from "framer-motion";
import {
  CarFront,
  Check,
  ChevronRight,
  Clock3,
  GripVertical,
  MapPin,
  Plus,
  Wallet,
  X,
} from "lucide-react";
import { CATEGORY_INFO, DEMO_DESTINATIONS, PICKUP_CHIPS, STOP_SUGGESTIONS } from "./ride-data";
import { ListRow, RideSheet, RIDE_MUTED, RIDE_LILAC, RIDE_PURPLE, PrimaryCTA } from "./ride-sheet";
import { RIDE_CATEGORIES } from "@/lib/mobility/demo-fare";
import type { RideCategory } from "@/lib/mobility/demo-fare";
import type { GeoLocation } from "@/lib/mobility/ride-types";
import type { RouteStop } from "@/lib/mobility/route-utils";
import { formatPrice } from "@/lib/mobility/ride-pricing";
import type { PaymentOption } from "./ride-flow-types";

/* ─── Tela 01 — Solicitar viagem ─────────────────────────── */

export function SolicitarPanel({
  destination,
  onPickDestination,
  onClearDestination,
  onProceed,
  companionLabel,
}: {
  destination: GeoLocation | null;
  onPickDestination: (dest: GeoLocation, name: string) => void;
  onClearDestination: () => void;
  onProceed: () => void;
  companionLabel?: string;
}) {
  const favorites = DEMO_DESTINATIONS.filter((item) => !item.recent);
  const recents = DEMO_DESTINATIONS.filter((item) => item.recent);

  return (
    <RideSheet
      footer={
        <PrimaryCTA onClick={onProceed} disabled={!destination}>
          Escolher destino
        </PrimaryCTA>
      }
    >
      <div className="px-5 pb-2 pt-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[22px] font-extrabold tracking-tight text-[#111111]">
            Para onde você vai?
          </h2>
          {companionLabel && (
            <span className="shrink-0 rounded-full bg-[#111111] px-2.5 py-1 text-[9px] font-bold text-white">
              {companionLabel}
            </span>
          )}
        </div>

        {/* Destino */}
        {destination ? (
          <div className="mt-3 flex items-center gap-3 rounded-[16px] border border-zinc-200 bg-zinc-50 px-3.5 py-3">
            <span
              className="grid h-9 w-9 shrink-0 grid-cols-1 place-items-center rounded-full"
              style={{ background: RIDE_LILAC }}
            >
              <MapPin className="h-4 w-4 text-black" strokeWidth={2.4} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-semibold text-[#111111]">
                {destination.label}
              </span>
              <span className="block text-[10px] text-zinc-500">Destino</span>
            </span>
            <button
              type="button"
              onClick={onClearDestination}
              aria-label="Limpar destino"
              className="grid h-8 w-8 shrink-0 grid-cols-1 place-items-center rounded-full bg-zinc-200 text-zinc-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="mt-3 flex items-center gap-3 rounded-[16px] border border-zinc-200 bg-zinc-50 px-3.5 py-3">
            <span
              className="grid h-9 w-9 shrink-0 grid-cols-1 place-items-center rounded-full"
              style={{ background: RIDE_LILAC }}
            >
              <MapPin className="h-4 w-4 text-black" strokeWidth={2.4} />
            </span>
            <span className="flex-1 text-[15px] font-semibold text-zinc-400">
              Para onde você vai?
            </span>
          </div>
        )}

        {/* Origem */}
        <div className="mt-2.5 flex items-center gap-3 px-1.5 py-1.5">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
          <span className="flex-1">
            <span className="block text-[14px] font-semibold text-[#111111]">Sua localização</span>
            <span className="block text-[10px] text-zinc-500">Bela Cintra, 750</span>
          </span>
        </div>

        {/* Favoritos */}
        {favorites.length > 0 && (
          <div className="mt-2 border-t border-zinc-100">
            <p className="pt-3 text-[11px] font-bold uppercase tracking-wide text-zinc-400">
              Favoritos
            </p>
            {favorites.map((item) => (
              <ListRow
                key={item.id}
                title={item.name}
                subtitle={item.address}
                leading={
                  <span className="text-[17px]" aria-hidden>
                    {item.icon}
                  </span>
                }
                onClick={() =>
                  onPickDestination(
                    { lat: item.lat, lng: item.lng, label: item.address, address: item.address },
                    item.name,
                  )
                }
              />
            ))}
          </div>
        )}

        {/* Destinos recentes */}
        {recents.length > 0 && (
          <div className="border-t border-zinc-100">
            <p className="pt-3 text-[11px] font-bold uppercase tracking-wide text-zinc-400">
              Destinos recentes
            </p>
            {recents.map((item) => (
              <ListRow
                key={item.id}
                title={item.name}
                subtitle={item.address}
                leading={
                  <span className="text-[17px]" aria-hidden>
                    {item.icon}
                  </span>
                }
                onClick={() =>
                  onPickDestination(
                    { lat: item.lat, lng: item.lng, label: item.address, address: item.address },
                    item.name,
                  )
                }
              />
            ))}
          </div>
        )}
      </div>
    </RideSheet>
  );
}

/* ─── Tela 02 — Montar rota ──────────────────────────────── */

export function RouteEditorPanel({
  originLabel,
  destination,
  stops,
  onAddStop,
  onAddSuggestion,
  onRemoveStop,
  onEditStop,
  onMoveStops,
  onProceed,
  routeMeta,
  source,
}: {
  originLabel: string;
  destination: GeoLocation;
  stops: RouteStop[];
  onAddStop: () => void;
  onAddSuggestion: (label: string, address: string) => void;
  onRemoveStop: (id: string) => void;
  onEditStop: (id: string, label: string) => void;
  onMoveStops: (next: RouteStop[]) => void;
  onProceed: () => void;
  routeMeta: { distance: string; duration: string };
  source?: string | null;
}) {
  return (
    <RideSheet
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
              {routeMeta.distance} · {routeMeta.duration}
              {source === "invite" ? " · Ir juntos" : ""}
            </p>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-semibold text-zinc-600">
            <GripVertical className="h-3 w-3" />
            arraste as paradas
          </span>
        </div>

        <div className="mt-3 rounded-[18px] px-1">
          {/* Origem (A) — fixa */}
          <div className="flex items-center gap-3 py-2.5">
            <span
              className="grid h-6 w-6 shrink-0 grid-cols-1 place-items-center rounded-full text-white text-[11px] font-black ring-2 ring-white"
              style={{ background: RIDE_LILAC }}
            >
              A
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold text-[#111111]">{originLabel}</p>
              <p className="text-[10px] text-zinc-500">Bela Cintra, 750</p>
            </div>
          </div>

          {/* Paradas — reordenáveis */}
          <Reorder.Group axis="y" values={stops} onReorder={onMoveStops} as="div">
            {stops.map((stop, index) => (
              <Reorder.Item key={stop.id} value={stop} as="div">
                <motion.div
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-3 py-2.5"
                >
                  <span className="grid h-6 w-6 shrink-0 grid-cols-1 place-items-center rounded-full border border-zinc-300 bg-white text-[11px] font-black text-[#111111]">
                    {String.fromCharCode(66 + index)}
                  </span>
                  <input
                    value={stop.label}
                    aria-label={`Editar parada ${index + 1}`}
                    onChange={(event) => onEditStop(stop.id, event.target.value)}
                    className="min-w-0 flex-1 rounded-xl border border-transparent bg-zinc-50 px-3 py-2 text-[13px] font-medium text-[#111111] outline-none transition-colors focus:border-zinc-300 focus:bg-white"
                  />
                  <span className="flex shrink-0 items-center gap-2 text-zinc-400">
                    <GripVertical className="h-4 w-4 cursor-grab active:cursor-grabbing" />
                    <button
                      type="button"
                      aria-label={`Remover parada ${index + 1}`}
                      onClick={() => onRemoveStop(stop.id)}
                      className="grid h-8 w-8 grid-cols-1 place-items-center rounded-full bg-zinc-100 text-zinc-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </span>
                </motion.div>
              </Reorder.Item>
            ))}
          </Reorder.Group>

          {/* Destino */}
          <div className="flex items-center gap-3 py-2.5">
            <span
              className="grid h-6 w-6 shrink-0 grid-cols-1 place-items-center rounded-[8px] ring-2 ring-white"
              style={{ background: RIDE_PURPLE }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-black" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold text-[#111111]">
                {destination.label}
              </p>
              <p className="text-[10px] text-zinc-500">Destino</p>
            </div>
          </div>
        </div>

        {stops.length < 3 && (
          <div className="mt-1">
            <button
              type="button"
              onClick={onAddStop}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-[14px] bg-zinc-50 text-[13px] font-semibold text-zinc-700 transition-colors hover:bg-zinc-100"
            >
              <Plus className="h-4 w-4" />
              Adicionar parada
            </button>
            <div className="mt-2.5 flex flex-wrap gap-1.5 pb-1">
              {STOP_SUGGESTIONS.slice(0, 3 - stops.length).map((suggestion) => (
                <button
                  key={suggestion.label}
                  type="button"
                  onClick={() => onAddSuggestion(suggestion.label, suggestion.address)}
                  className="h-8 rounded-full border border-zinc-200 px-3 text-[11px] font-semibold text-zinc-600 transition-colors hover:bg-zinc-50"
                >
                  + {suggestion.label}
                </button>
              ))}
            </div>
          </div>
        )}
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

/* ─── Tela 03/04 — Escolher viagem + pagamento ───────────── */

export function CategoryPanel({
  category,
  onCategory,
  payment,
  onPayment,
  fares,
  etaMap,
  routeMeta,
  onRequest,
}: {
  category: RideCategory;
  onCategory: (next: RideCategory) => void;
  payment: PaymentOption;
  onPayment: () => void;
  fares: Record<RideCategory, number>;
  etaMap: Record<RideCategory, number>;
  routeMeta: { distance: string; duration: string };
  onRequest: () => void;
}) {
  return (
    <RideSheet
      footer={
        <PrimaryCTA onClick={onRequest}>
          <CarFront className="h-4 w-4" />
          Solicitar {CATEGORY_INFO[category].label}
        </PrimaryCTA>
      }
    >
      <div className="px-5 pb-2 pt-3">
        <div className="flex items-end justify-between gap-2">
          <div>
            <h2 className="text-[22px] font-extrabold tracking-tight text-[#111111]">
              Escolha sua viagem
            </h2>
            <p className="mt-0.5 text-[12px]" style={{ color: RIDE_MUTED }}>
              {routeMeta.distance} · {routeMeta.duration}
            </p>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-semibold text-zinc-600">
            <Clock3 className="h-3 w-3" />
            chegada do motorista
          </span>
        </div>

        <div className="mt-2 divide-y divide-zinc-100">
          {RIDE_CATEGORIES.map((rideCategory) => {
            const info = CATEGORY_INFO[rideCategory];
            const Icon = info.icon;
            const selected = category === rideCategory;
            return (
              <button
                key={rideCategory}
                type="button"
                onClick={() => onCategory(rideCategory)}
                className={`relative flex w-full items-center gap-3 py-3.5 transition-colors ${selected ? "px-1 rounded-[18px]" : ""}`}
                style={
                  selected
                    ? {
                        background: "rgba(168,85,247,0.08)",
                        border: "1px solid rgba(168,85,247,0.25)",
                      }
                    : undefined
                }
              >
                {selected && (
                  <span
                    className="absolute left-0 top-1/2 h-[70%] w-1 -translate-y-1/2 rounded-full"
                    style={{ background: RIDE_LILAC }}
                    aria-hidden
                  />
                )}
                <span
                  className={`grid h-10 w-10 shrink-0 grid-cols-1 place-items-center rounded-[14px] ${
                    selected ? "bg-white shadow-sm" : "bg-zinc-100"
                  }`}
                >
                  <Icon className="h-5 w-5 text-[#111111]" />
                </span>
                <span className="min-w-0 flex-1 text-left">
                  <span className="flex items-center gap-2">
                    <span className="text-[14px] font-bold text-[#111111]">{info.label}</span>
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-zinc-500">
                      <Clock3 className="h-3 w-3" />
                      {etaMap[rideCategory]} min
                    </span>
                  </span>
                  <span className="mt-0.5 block truncate text-[11px]" style={{ color: RIDE_MUTED }}>
                    {info.description}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-[15px] font-extrabold text-[#111111]">
                    {formatPrice(fares[rideCategory])}
                  </span>
                  {selected && (
                    <motion.span
                      layoutId="category-check"
                      className="mt-0.5 flex items-center justify-end gap-1 text-[10px] font-bold text-[#111111]"
                    >
                      <Check className="h-3 w-3" strokeWidth={3} /> selecionada
                    </motion.span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onPayment}
          className="mt-3 flex w-full items-center gap-3 rounded-[16px] border border-zinc-100 bg-zinc-50 px-3.5 py-3"
        >
          <span className="grid h-9 w-9 shrink-0 grid-cols-1 place-items-center rounded-full bg-white shadow-sm">
            <Wallet className="h-4 w-4 text-[#111111]" />
          </span>
          <span className="min-w-0 flex-1 text-left">
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
              Forma de pagamento
            </span>
            <span className="block text-[14px] font-bold capitalize text-[#111111]">{payment}</span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" />
        </button>
      </div>
    </RideSheet>
  );
}
