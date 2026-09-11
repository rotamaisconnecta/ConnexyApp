import { Check, MapPin, ShieldAlert, ShieldX, Car } from "lucide-react";
import { StatusBar } from "@/components/phone-frame";
import { BackButton } from "@/components/navigation/back-button";
import type { Trip } from "@/lib/mobility/trip/trip-types";
import { formatPrice } from "@/lib/mobility/ride-pricing";
import { formatDistance, formatRideDateTime } from "@/lib/mobility/ride-utils";
import { demoCategoryLabel } from "@/lib/mobility/demo-fare";
import { paymentMethodLabel, tripPaymentStatus } from "@/lib/mobility/payment";

interface RideTripDetailProps {
  trip: Trip;
}

export function RideTripDetail({ trip }: RideTripDetailProps) {
  const cancelled = trip.status === "cancelada";
  const status = tripPaymentStatus(trip);

  const rows: { label: string; value: string }[] = [];
  rows.push({
    label: "Data e horário",
    value: formatRideDateTime(new Date(trip.completedAt ?? trip.cancelledAt ?? trip.createdAt)),
  });
  rows.push({ label: "Origem", value: trip.origin.label });
  rows.push({ label: "Destino", value: trip.destination?.label ?? "Não definido" });
  rows.push({ label: "Distância", value: formatDistance(trip.distanceMeters) });
  rows.push({ label: "Categoria", value: demoCategoryLabel(trip.category) });
  rows.push({
    label: "Motorista",
    value: trip.driver ? `${trip.driver.name} · ${trip.driver.vehicle.plate}` : "Motorista demo",
  });

  return (
    <div className="flex h-full flex-col bg-white">
      <StatusBar />
      <header className="flex items-center gap-3 px-5 pt-1 pb-3">
        <BackButton fallbackTo="/ride/history" />
        <h1 className="text-base font-bold">Detalhes da viagem</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-6">
        {cancelled ? (
          <div className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
            <ShieldX className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden />
            <p className="text-[13px] font-bold text-zinc-600">Viagem cancelada</p>
          </div>
        ) : status === "paid" ? (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <span className="grid h-9 w-9 grid-cols-1 place-items-center rounded-full bg-emerald-500 text-white">
              <Check className="h-4 w-4" strokeWidth={3} />
            </span>
            <div>
              <p className="text-[13px] font-bold text-[#111111]">Pagamento confirmado</p>
              <p className="text-[11px] text-zinc-500">
                Pago via {paymentMethodLabel(trip.paymentMethod)} ·{" "}
                {formatPrice(trip.finalFare ?? trip.estimatedFare)}
              </p>
            </div>
          </div>
        ) : status === "unpaid" ? (
          <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
            <span className="grid h-9 w-9 grid-cols-1 place-items-center rounded-full bg-red-500 text-white">
              <ShieldAlert className="h-4 w-4 rotate-45" />
            </span>
            <div>
              <p className="text-[13px] font-bold text-[#111111]">Corrida não paga</p>
              <p className="text-[11px] text-zinc-500">
                O motorista informou que o pagamento não foi recebido.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
            <span className="h-2 w-2 animate-pulse rounded-full bg-zinc-400" aria-hidden />
            <p className="text-[13px] font-bold text-zinc-600">Aguardando pagamento</p>
          </div>
        )}

        <div className="mt-4 divide-y divide-zinc-100 rounded-[18px] bg-zinc-50 px-4">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-4 py-2.5">
              <span className="shrink-0 text-[12px] text-zinc-500">{row.label}</span>
              <span className="min-w-0 truncate text-right text-[13px] font-bold text-[#111111]">
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {trip.stops.length > 0 && (
          <div className="mt-3 rounded-[18px] bg-zinc-50 px-4 py-3">
            <p className="text-[12px] font-bold uppercase tracking-wide text-zinc-500">Paradas</p>
            <div className="mt-2 space-y-2">
              {trip.stops.map((stop, index) => (
                <div
                  key={`${stop.location.label}-${index}`}
                  className="flex items-center gap-2 text-[13px] font-semibold text-[#111111]"
                >
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden />
                  <span className="truncate">{stop.location.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!cancelled && (
          <div className="mt-3 divide-y divide-zinc-100 rounded-[18px] bg-zinc-50 px-4">
            <div className="flex items-center justify-between gap-4 py-2.5">
              <span className="shrink-0 text-[12px] text-zinc-500">Valor estimado</span>
              <span className="text-[13px] font-bold text-[#111111]">
                {formatPrice(trip.estimatedFare)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 py-2.5">
              <span className="shrink-0 text-[12px] text-zinc-500">Valor final</span>
              <span className="text-[13px] font-extrabold text-[#111111]">
                {trip.finalFare != null
                  ? formatPrice(trip.finalFare)
                  : formatPrice(trip.estimatedFare)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 py-2.5">
              <span className="shrink-0 text-[12px] text-zinc-500">Pagamento</span>
              <span className="text-[13px] font-bold text-[#111111]">
                {paymentMethodLabel(trip.paymentMethod)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 py-2.5">
              <span className="shrink-0 text-[12px] text-zinc-500">Status</span>
              <span
                className={`text-[13px] font-bold ${
                  status === "paid"
                    ? "text-emerald-600"
                    : status === "unpaid"
                      ? "text-red-600"
                      : "text-zinc-600"
                }`}
              >
                {status === "paid"
                  ? "Pago"
                  : status === "unpaid"
                    ? "Não pago"
                    : "Aguardando pagamento"}
              </span>
            </div>
            {trip.driver && (
              <div className="flex items-center gap-3 py-3">
                <span className="grid h-10 w-10 shrink-0 grid-cols-1 place-items-center rounded-full bg-secondary text-[13px] font-bold">
                  {trip.driver.name.slice(0, 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold text-[#111111]">
                    {trip.driver.name}
                  </p>
                  <p className="flex items-center gap-1 text-[11px] text-zinc-500">
                    <Car className="h-3 w-3" aria-hidden />
                    {trip.driver.vehicle.name} · {trip.driver.vehicle.plate}
                  </p>
                </div>
                <span className="text-[12px] font-bold text-zinc-500">
                  Código {trip.driver.boardingCode}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
