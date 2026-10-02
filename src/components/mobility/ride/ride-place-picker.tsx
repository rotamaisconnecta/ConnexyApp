import { useMemo, useState } from "react";
import { LocateFixed, Search, X } from "lucide-react";
import { motion } from "framer-motion";
import { DEMO_DESTINATIONS, ridePlaceToLocation } from "./ride-data";
import { ListRow, RIDE_LILAC } from "./ride-sheet";
import { resolveRideOrigin } from "@/lib/mobility/ride-request-context";
import type { GeoLocation } from "@/lib/mobility/ride-types";

export function RidePlacePickerOverlay({
  open,
  onClose,
  onConfirm,
  title,
  allowCurrentLocation = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (place: GeoLocation) => void;
  title: string;
  allowCurrentLocation?: boolean;
}) {
  const [query, setQuery] = useState("");
  const current = allowCurrentLocation ? resolveRideOrigin() : null;

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return DEMO_DESTINATIONS;
    return DEMO_DESTINATIONS.filter(
      (item) =>
        item.name.toLowerCase().includes(needle) || item.address.toLowerCase().includes(needle),
    );
  }, [query]);

  if (!open) return null;

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="absolute inset-x-0 bottom-0 z-50 flex max-h-[48%] flex-col overflow-hidden rounded-t-[26px] bg-white shadow-[0_-14px_44px_rgba(0,0,0,0.2)]"
    >
      <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-zinc-200" aria-hidden />
      <div className="flex items-center justify-between px-5 pt-3">
        <h3 className="text-[16px] font-bold tracking-tight text-[#111111]">{title}</h3>
        <button
          type="button"
          onClick={() => {
            setQuery("");
            onClose();
          }}
          aria-label="Fechar"
          className="grid h-9 w-9 grid-cols-1 place-items-center rounded-full bg-zinc-100 text-zinc-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-[max(env(safe-area-inset-bottom,0px),1rem)] pt-3 no-scrollbar">
        <p className="mb-2 text-[11px] font-medium" style={{ color: RIDE_LILAC }}>
          Pesquise, use o mapa ou a localização atual
        </p>
        <label className="flex items-center gap-2 rounded-[16px] border border-zinc-200 bg-zinc-50 px-3 py-2.5">
          <Search className="h-4 w-4 shrink-0 text-zinc-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar endereço ou local"
            aria-label="Buscar endereço ou local"
            className="min-w-0 flex-1 bg-transparent text-[14px] font-medium text-[#111111] outline-none placeholder:text-zinc-400"
          />
        </label>

        {current && (
          <button
            type="button"
            onClick={() => {
              onConfirm(current);
              setQuery("");
            }}
            className="mt-3 flex w-full items-center gap-3 rounded-[16px] bg-zinc-50 px-3 py-3 text-left"
          >
            <span className="grid h-9 w-9 shrink-0 grid-cols-1 place-items-center rounded-full bg-white shadow-sm">
              <LocateFixed className="h-4 w-4 text-[#A855F7]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-semibold text-[#111111]">{current.label}</span>
              <span className="block truncate text-[11px] text-zinc-500">
                {current.address ?? "Usar a posição atual"}
              </span>
            </span>
          </button>
        )}

        <div className="mt-2 divide-y divide-zinc-100">
          {matches.length === 0 ? (
            <p className="py-6 text-center text-[12px] text-zinc-500">Nenhum local encontrado.</p>
          ) : (
            matches.map((item) => (
              <ListRow
                key={item.id}
                title={item.name}
                subtitle={item.address}
                leading={
                  <span className="text-[17px]" aria-hidden>
                    {item.icon}
                  </span>
                }
                onClick={() => {
                  onConfirm(ridePlaceToLocation(item));
                  setQuery("");
                }}
              />
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}
