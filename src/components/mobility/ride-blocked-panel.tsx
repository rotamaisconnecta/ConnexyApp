import { ShieldAlert, MapPin, ArrowLeft } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { formatPrice } from "@/lib/mobility/ride-pricing";
import { formatRideDateTime } from "@/lib/mobility/ride-utils";
import { paymentMethodLabel } from "@/lib/mobility/payment";
import type { RideBlock } from "@/lib/mobility/trip/ride-blocks";

interface RideBlockedPanelProps {
  block: RideBlock;
}

export function RideBlockedPanel({ block }: RideBlockedPanelProps) {
  const navigate = useNavigate();
  const { summary } = block;

  return (
    <div className="flex h-full flex-col bg-white">
      <StatusBar />
      <header className="flex items-center gap-2 px-5 pt-2 pb-3">
        <button
          type="button"
          aria-label="Voltar para o início"
          onClick={() => navigate({ to: "/home" })}
          className="grid h-9 w-9 place-items-center rounded-full bg-secondary"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-base font-bold">Mobilidade</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-6">
        <div className="mx-auto flex max-w-md flex-col items-center pt-6 text-center">
          <span className="grid h-16 w-16 grid-cols-1 place-items-center rounded-full bg-red-50">
            <ShieldAlert className="h-8 w-8 text-red-500" />
          </span>
          <h2 className="mt-4 text-[22px] font-extrabold tracking-tight text-[#111111]">
            Corrida bloqueada
          </h2>
          <p className="mt-2 max-w-[300px] text-[13px] leading-relaxed text-zinc-500">
            Existe uma corrida anterior registrada como não paga. Regularize essa pendência para
            voltar a solicitar novas corridas.
          </p>
        </div>

        <div className="mx-auto mt-6 max-w-md rounded-[18px] border border-red-200 bg-red-50/60 p-4">
          <p className="flex items-center gap-1.5 text-[12px] font-bold text-red-600">
            <ShieldAlert className="h-3.5 w-3.5" aria-hidden />
            Corrida não paga
          </p>
          <div className="mt-3 space-y-2.5 text-[12px] text-zinc-600">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="min-w-0 flex-1 truncate">
                {summary.origin}
                {summary.destination ? ` → ${summary.destination}` : ""}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-zinc-500">Data</span>
              <span className="font-semibold text-[#111111]">
                {formatRideDateTime(new Date(summary.date))}
              </span>
            </div>
            {summary.fare != null && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-zinc-500">Valor</span>
                <span className="font-semibold text-[#111111]">{formatPrice(summary.fare)}</span>
              </div>
            )}
            <div className="flex items-center justify-between gap-3">
              <span className="text-zinc-500">Pagamento</span>
              <span className="font-semibold text-[#111111]">
                {paymentMethodLabel(summary.paymentMethod)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-zinc-500">Status</span>
              <span className="font-semibold text-red-600">Pagamento pendente</span>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-6 max-w-md">
          <button
            type="button"
            onClick={() => navigate({ to: "/home" })}
            className="flex h-[48px] w-full items-center justify-center rounded-[16px] bg-zinc-900 text-[14px] font-bold text-white"
          >
            Voltar para o início
          </button>
          <p className="mt-3 text-center text-[11px] leading-relaxed text-zinc-400">
            Nesta versão demo a regularização da pendência ainda não está disponível.
          </p>
        </div>
      </div>
    </div>
  );
}
