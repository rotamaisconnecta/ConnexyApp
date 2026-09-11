import { useState } from "react";
import { Banknote, Check, ShieldAlert } from "lucide-react";
import type { Trip } from "@/lib/mobility/trip/trip-types";
import { confirmDriverPayment, recordUnpaidTrip } from "@/lib/mobility/trip/trip-store";
import { paymentMethodLabel, tripPaymentStatus } from "@/lib/mobility/payment";
import { formatPrice } from "@/lib/mobility/ride-pricing";
import { RideModal, SecondaryCTA } from "@/components/mobility/ride/ride-sheet";

interface DriverPaymentPanelProps {
  trip: Trip;
}

export function DriverPaymentPanel({ trip }: DriverPaymentPanelProps) {
  const [showUnpaidConfirm, setShowUnpaidConfirm] = useState(false);
  const status = tripPaymentStatus(trip);
  const fare = trip.finalFare ?? trip.estimatedFare;
  const paidNote = trip.paymentMethod === "pix" ? "Pago via Pix" : "Pago em dinheiro";

  if (!trip || hasNoPaymentWindow(trip)) return null;

  return (
    <section className="mt-2 overflow-hidden rounded-3xl border border-border bg-surface p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-600/10 text-emerald-600">
            {status === "paid" ? <Check className="h-5 w-5" /> : <Banknote className="h-5 w-5" />}
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Tarifa final
            </p>
            <p className="text-sm font-bold text-foreground">{formatPrice(fare)}</p>
          </div>
        </div>
        <span className="text-[12px] font-bold text-muted-foreground">
          {paymentMethodLabel(trip.paymentMethod)}
        </span>
      </div>

      {status === "paid" && (
        <div className="mt-3 flex items-center gap-2 rounded-2xl bg-emerald-50 px-3 py-2.5">
          <Check className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
          <p className="text-[13px] font-bold text-emerald-700">
            Pagamento confirmado · {paidNote} · {formatPrice(fare)}
          </p>
        </div>
      )}

      {status === "unpaid" && (
        <div className="mt-3 flex items-start gap-2 rounded-2xl bg-red-50 px-3 py-2.5">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden />
          <p className="text-[13px] font-semibold text-red-700">
            Corrida não paga. O passageiro ficou bloqueado para novas solicitações.
          </p>
        </div>
      )}

      {status === "pending" && (
        <div className="mt-3">
          <p className="text-[12px] text-muted-foreground">
            Aguardando pagamento. Confirme após receber o valor do passageiro.
          </p>
          <div className="mt-3 grid gap-2">
            <button
              type="button"
              onClick={() => confirmDriverPayment()}
              className="flex h-[46px] items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-[14px] font-bold text-white active:scale-[0.99]"
            >
              <Check className="h-4 w-4" aria-hidden />
              Confirmar pagamento
            </button>
            <button
              type="button"
              onClick={() => setShowUnpaidConfirm(true)}
              className="flex h-[46px] items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 text-[14px] font-bold text-red-600"
            >
              <ShieldAlert className="h-4 w-4" aria-hidden />
              Usuário não pagou
            </button>
          </div>
        </div>
      )}

      <RideModal open={showUnpaidConfirm} onClose={() => setShowUnpaidConfirm(false)}>
        <div className="mx-auto grid h-12 w-12 grid-cols-1 place-items-center rounded-full bg-red-50">
          <ShieldAlert className="h-6 w-6 text-red-500" />
        </div>
        <h3 className="mt-3 text-center text-[17px] font-extrabold tracking-tight text-[#111111]">
          Usuário não pagou a corrida?
        </h3>
        <p className="mt-1 text-center text-[12px] leading-relaxed text-zinc-500">
          Ao confirmar, esta viagem será registrada como não paga e o usuário ficará impedido de
          solicitar novas corridas até regularizar a pendência.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <SecondaryCTA onClick={() => setShowUnpaidConfirm(false)}>Voltar</SecondaryCTA>
          <button
            type="button"
            onClick={() => {
              setShowUnpaidConfirm(false);
              recordUnpaidTrip();
            }}
            className="flex h-[48px] items-center justify-center rounded-[16px] bg-red-500 text-[14px] font-bold text-white"
          >
            Confirmar não pagamento
          </button>
        </div>
      </RideModal>
    </section>
  );
}

function hasNoPaymentWindow(trip: Trip): boolean {
  return trip.status !== "chegada" && trip.status !== "avaliacao";
}
