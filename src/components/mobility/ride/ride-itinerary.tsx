import { AnimatePresence, Reorder, motion } from "framer-motion";
import { ArrowUpDown, GripVertical, LocateFixed, Pencil, Plus, Users, X } from "lucide-react";
import type { GeoLocation } from "@/lib/mobility/ride-types";
import { MAX_ROUTE_STOPS, type RouteStop } from "@/lib/mobility/route-utils";
import { RIDE_LILAC, RIDE_MAGENTA, RIDE_MUTED, RIDE_STOP } from "./ride-sheet";

function SequenceDot({
  kind,
  index,
}: {
  kind: "origin" | "stop" | "destination";
  index?: number;
}) {
  if (kind === "origin") {
    return (
      <span
        className="relative z-10 mt-1.5 block h-2.5 w-2.5 shrink-0 rounded-full ring-[3px] ring-[#A855F7]/20"
        style={{ background: RIDE_LILAC }}
        aria-hidden
      />
    );
  }
  if (kind === "destination") {
    return (
      <span
        className="relative z-10 mt-1.5 block h-2.5 w-2.5 shrink-0 rounded-full ring-[3px] ring-[#E11D8F]/20"
        style={{ background: RIDE_MAGENTA }}
        aria-hidden
      />
    );
  }
  return (
    <span
      className="relative z-10 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white text-[9px] font-black text-[#111111]"
      style={{ border: `1.5px solid ${RIDE_STOP}` }}
    >
      {index ?? 1}
    </span>
  );
}

export function RideItineraryCard({
  origin,
  destination,
  stops,
  onEditOrigin,
  onEditDestination,
  onAddStop,
  onEditStop,
  onRemoveStop,
  onMoveStops,
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
  onMoveStops?: (next: RouteStop[]) => void;
  onPickFriend?: () => void;
  pickFriendDisabled?: boolean;
  occupancyLabel?: string;
  vacancyLabel?: string;
}) {
  const atLimit = stops.length >= MAX_ROUTE_STOPS;

  return (
    <div className="relative rounded-[24px] bg-white px-3.5 py-1 shadow-[0_10px_28px_rgba(17,17,17,0.05)] ring-1 ring-zinc-100/80">
      <span
        className="absolute bottom-[52px] left-[19px] top-6 w-px bg-zinc-200"
        aria-hidden
      />

      <div className="relative flex items-start gap-3 py-1.5">
        <div className="flex w-5 shrink-0 justify-center">
          <SequenceDot kind="origin" />
        </div>
        <button type="button" onClick={onEditOrigin} className="min-w-0 flex-1 py-0.5 text-left">
          <p className="text-[11px] font-medium text-zinc-400">Origem</p>
          <p className="truncate text-[15px] font-semibold text-[#111111]">
            {origin?.label ?? "Definir ponto de partida"}
          </p>
        </button>
        <button
          type="button"
          onClick={onEditOrigin}
          aria-label="Alterar origem"
          className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-zinc-50 text-[#6D28D9] transition-transform active:scale-95"
        >
          <LocateFixed className="h-4 w-4" strokeWidth={2.2} />
        </button>
      </div>

      {onMoveStops ? (
        <Reorder.Group axis="y" values={stops} onReorder={onMoveStops} as="div">
          <AnimatePresence initial={false}>
            {stops.map((stop, index) => (
              <Reorder.Item key={stop.id} value={stop} as="div">
                <StopRow
                  stop={stop}
                  index={index}
                  draggable
                  onEdit={() => onEditStop(stop.id)}
                  onRemove={() => onRemoveStop(stop.id)}
                />
              </Reorder.Item>
            ))}
          </AnimatePresence>
        </Reorder.Group>
      ) : (
        <AnimatePresence initial={false}>
          {stops.map((stop, index) => (
            <StopRow
              key={stop.id}
              stop={stop}
              index={index}
              onEdit={() => onEditStop(stop.id)}
              onRemove={() => onRemoveStop(stop.id)}
            />
          ))}
        </AnimatePresence>
      )}

      <div className="relative flex items-start gap-3 py-1.5">
        <div className="flex w-5 shrink-0 justify-center">
          <SequenceDot kind="destination" />
        </div>
        <button type="button" onClick={onEditDestination} className="min-w-0 flex-1 py-0.5 text-left">
          <p className="text-[11px] font-medium text-zinc-400">Destino</p>
          <p
            className={`truncate text-[15px] font-semibold ${
              destination ? "text-[#111111]" : "text-zinc-400"
            }`}
          >
            {destination?.label ?? "Para onde você vai?"}
          </p>
        </button>
        <button
          type="button"
          onClick={onEditDestination}
          aria-label={destination ? "Alterar destino" : "Escolher destino"}
          className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-zinc-50 text-zinc-500 transition-transform active:scale-95"
        >
          <ArrowUpDown className="h-4 w-4" strokeWidth={2.2} />
        </button>
      </div>

      <div className="relative pb-1 pt-0.5">
        {atLimit ? (
          <p className="px-1 py-1.5 text-center text-[11px] font-medium" style={{ color: RIDE_MUTED }}>
            Você pode adicionar até {MAX_ROUTE_STOPS} paradas.
          </p>
        ) : (
          <button
            type="button"
            onClick={onAddStop}
            className="flex h-8 w-full items-center justify-center gap-1.5 rounded-full text-[12px] font-semibold text-[#6D28D9] transition-colors"
            style={{ background: "rgba(168,85,247,0.08)" }}
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar parada
          </button>
        )}
        {onPickFriend && (
          <button
            type="button"
            onClick={onPickFriend}
            disabled={pickFriendDisabled}
            className="mt-1.5 flex h-8 w-full items-center justify-center gap-1.5 rounded-full text-[12px] font-semibold text-[#6D28D9] transition-colors disabled:opacity-45"
            style={{ background: "rgba(168,85,247,0.08)" }}
          >
            <Users className="h-3.5 w-3.5" />
            Pegar amigo
          </button>
        )}
        {(occupancyLabel || vacancyLabel) && (
          <p className="px-1 pb-1 pt-1.5 text-center text-[11px] font-medium" style={{ color: RIDE_MUTED }}>
            {occupancyLabel}
            {occupancyLabel && vacancyLabel ? " · " : ""}
            {vacancyLabel}
          </p>
        )}
      </div>
    </div>
  );
}

function StopRow({
  stop,
  index,
  draggable = false,
  onEdit,
  onRemove,
}: {
  stop: RouteStop;
  index: number;
  draggable?: boolean;
  onEdit: () => void;
  onRemove: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16, height: 0 }}
      className="relative flex items-start gap-3 py-1.5"
    >
      <div className="flex w-5 shrink-0 justify-center pt-0.5">
        <SequenceDot kind="stop" index={index + 1} />
      </div>
      <button type="button" onClick={onEdit} className="min-w-0 flex-1 text-left">
        <p className="truncate text-[14px] font-semibold text-[#111111]">{stop.label}</p>
        <p className="truncate text-[11px] text-zinc-400">Parada</p>
      </button>
      <span className="flex shrink-0 items-center gap-0.5">
        {draggable && (
          <GripVertical className="h-4 w-4 cursor-grab text-zinc-300 active:cursor-grabbing" />
        )}
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Editar parada ${index + 1}`}
          className="grid h-8 w-8 place-items-center rounded-full text-zinc-500"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remover parada ${index + 1}`}
          className="grid h-8 w-8 place-items-center rounded-full text-zinc-400"
        >
          <X className="h-4 w-4" />
        </button>
      </span>
    </motion.div>
  );
}
