import { motion } from "framer-motion";
import {
  Banknote,
  Car,
  Check,
  ChevronRight,
  MapPin,
  MessageCircle,
  Phone,
  Share2,
  ShieldCheck,
  Smartphone,
  Star,
  Users,
} from "lucide-react";
import type { PaymentOption } from "./ride-flow-types";
import {
  PlateBadge,
  RideSheet,
  RIDE_MUTED,
  RIDE_LILAC,
  RIDE_PURPLE,
  SecondaryCTA,
  PrimaryCTA,
} from "./ride-sheet";
import { formatPrice } from "@/lib/mobility/ride-pricing";
import type { DriverMock } from "./ride-data";
import type { GeoLocation } from "@/lib/mobility/ride-types";

/* ─── Tela 05 — Procurando motorista ─────────────────────── */

export function SearchingPanel({
  message,
  categoryLabel,
  fare,
  payment,
  onCancel,
}: {
  message: string;
  categoryLabel: string;
  fare: number;
  payment: PaymentOption;
  onCancel: () => void;
}) {
  return (
    <RideSheet>
      <div className="px-5 pb-3 pt-4 text-center">
        <motion.div
          key={message}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          <div className="relative flex h-14 w-14 items-center justify-center">
            <span
              className="absolute inset-0 rounded-full"
              style={{ background: "rgba(168,85,247,0.08)" }}
            />
            <span
              className="absolute inset-0 animate-ping rounded-full"
              style={{ background: "rgba(168,85,247,0.15)" }}
            />
            <span
              className="relative grid h-9 w-9 grid-cols-1 place-items-center rounded-full"
              style={{ background: RIDE_LILAC }}
            >
              <Car className="h-4 w-4 text-white" />
            </span>
          </div>
          <h3 className="mt-3 text-[17px] font-extrabold tracking-tight text-[#111111]">
            Encontrando seu motorista
          </h3>
          <p className="mt-0.5 text-[12px]" style={{ color: RIDE_MUTED }}>
            {message}
          </p>
        </motion.div>

        <div className="mt-4 flex items-center justify-between rounded-[16px] bg-zinc-50 px-4 py-3">
          <span className="flex items-center gap-2 text-[13px] font-semibold text-[#111111]">
            <Car className="h-4 w-4" />
            {categoryLabel}
          </span>
          <span className="text-right">
            <span className="block text-[15px] font-extrabold text-[#111111]">
              {formatPrice(fare)}
            </span>
            <span className="block text-[10px] capitalize" style={{ color: RIDE_MUTED }}>
              {payment}
            </span>
          </span>
        </div>

        <div className="mt-4">
          <SecondaryCTA onClick={onCancel}>Cancelar solicitação</SecondaryCTA>
        </div>
      </div>
    </RideSheet>
  );
}

/* ─── Tela 06/07/08 — Motorista encontrado / chegando / chegou ─── */

export function DriverPanel({
  state,
  driver,
  etaMinutes,
  categoryLabel,
  fare,
  payment,
  onStartRide,
  onMessage,
  onCall,
  onSafety,
  onShare,
}: {
  state: "encontrado" | "chegando" | "chegou";
  driver: DriverMock;
  etaMinutes: number;
  categoryLabel: string;
  fare: number;
  payment: PaymentOption;
  onStartRide: () => void;
  onMessage: () => void;
  onCall: () => void;
  onSafety: () => void;
  onShare: () => void;
}) {
  const arrived = state === "chegou";
  const approaching = state === "chegando";

  return (
    <RideSheet
      footer={
        arrived ? (
          <PrimaryCTA onClick={onStartRide}>
            <Check className="h-4 w-4" strokeWidth={2.6} />
            Encontrei o motorista
          </PrimaryCTA>
        ) : undefined
      }
    >
      <div className="px-5 pb-3 pt-3">
        {arrived ? (
          <>
            <h2 className="text-[21px] font-extrabold tracking-tight text-[#111111]">
              {driver.name} chegou
            </h2>
            <p className="mt-0.5 text-[12px]" style={{ color: RIDE_MUTED }}>
              {driver.vehicle.name} {driver.vehicle.color.toLowerCase()} · Tire a dúvida antes de
              entrar.
            </p>
            <div className="mt-3 rounded-[18px] bg-zinc-50 px-4 py-3.5">
              <p className="text-center text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">
                Seu código
              </p>
              <div className="mt-2 flex items-center justify-center gap-2.5">
                {driver.boardingCode.split("").map((digit, index) => (
                  <span
                    key={`${digit}-${index}`}
                    className="grid h-[52px] w-[52px] grid-cols-1 place-items-center rounded-[16px] border border-zinc-200 bg-white text-[22px] font-extrabold tracking-tight text-[#111111]"
                  >
                    {digit}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-center text-[11px]" style={{ color: RIDE_MUTED }}>
                Informe este código ao motorista.
              </p>
            </div>
          </>
        ) : approaching ? (
          <>
            <h2 className="text-[21px] font-extrabold tracking-tight text-[#111111]">
              Prepare-se para embarcar
            </h2>
            <p className="mt-0.5 text-[12px]" style={{ color: RIDE_MUTED }}>
              Confira a placa antes de entrar.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-[21px] font-extrabold tracking-tight text-[#111111]">
              Motorista encontrado
            </h2>
            <p className="mt-0.5 text-[12px]" style={{ color: RIDE_MUTED }}>
              {categoryLabel} · {formatPrice(fare)} · Pagamento {payment}
            </p>
          </>
        )}

        {/* Motorista */}
        <div className="mt-3 flex items-center gap-3">
          <img
            src={driver.photo}
            alt={`Foto de ${driver.name}`}
            className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-white shadow-sm"
          />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-[15px] font-extrabold tracking-tight text-[#111111]">
              {driver.name}
              <span
                className="flex items-center gap-0.5 text-[12px] font-bold"
                style={{ color: RIDE_LILAC }}
              >
                <Star className="h-3.5 w-3.5 fill-current" />
                {driver.rating.toFixed(1)}
              </span>
            </p>
            <p className="mt-0.5 text-[12px] font-semibold text-zinc-600">
              {driver.vehicle.name} · {driver.vehicle.color.toLowerCase()}
            </p>
            <p
              className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold"
              style={{ color: RIDE_MUTED }}
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Motorista verificado
              <span className="ml-0.5 text-zinc-400">(simulado)</span>
            </p>
          </div>
        </div>

        {/* Placa em destaque */}
        <div className="mt-3.5 flex items-center justify-between rounded-[16px] bg-zinc-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <PlateBadge plate={driver.vehicle.plate} />
            <span className="text-[12px] font-semibold text-zinc-600">
              {arrived ? "chegou" : `chega em ${etaMinutes} min`}
            </span>
          </div>
          <span className="text-[12px] font-semibold" style={{ color: RIDE_MUTED }}>
            {driver.vehicle.color}
          </span>
        </div>

        {/* Ações circulares */}
        <div className="mt-3 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onMessage}
            aria-label="Mensagem para o motorista"
            className="flex h-12 w-12 flex-col items-center justify-center gap-0.5 rounded-full bg-zinc-100 text-zinc-800"
          >
            <MessageCircle className="h-5 w-5" />
            <span className="text-[8px] font-semibold">Mensagem</span>
          </button>
          <button
            type="button"
            onClick={onCall}
            aria-label="Ligar para o motorista"
            className="flex h-12 w-12 flex-col items-center justify-center gap-0.5 rounded-full bg-zinc-100 text-zinc-800"
          >
            <Phone className="h-5 w-5" />
            <span className="text-[8px] font-semibold">Ligar</span>
          </button>
          <button
            type="button"
            onClick={onSafety}
            aria-label="Central de segurança"
            className="flex h-12 w-12 flex-col items-center justify-center gap-0.5 rounded-full bg-zinc-100 text-zinc-800"
          >
            <ShieldCheck className="h-5 w-5" />
            <span className="text-[8px] font-semibold">Segurança</span>
          </button>
        </div>

        {!arrived && (
          <div className="mt-4">
            <SecondaryCTA onClick={onShare}>
              <Share2 className="h-4 w-4" />
              Compartilhar viagem
            </SecondaryCTA>
          </div>
        )}
      </div>
    </RideSheet>
  );
}

/* ─── Tela 09 — Viagem em andamento ──────────────────────── */

export function ActiveRidePanel({
  driver,
  destination,
  stopLabel,
  etaMinutes,
  onSafety,
  onShare,
  onRoute,
  onMore,
}: {
  driver: DriverMock;
  destination: GeoLocation;
  stopLabel?: string;
  etaMinutes: number;
  onSafety: () => void;
  onShare: () => void;
  onRoute: () => void;
  onMore: () => void;
}) {
  return (
    <RideSheet>
      <div className="px-5 pb-3 pt-3">
        <div className="flex items-center justify-between">
          <p className="truncate text-[14px] font-bold text-[#111111]">
            {stopLabel ?? destination.label}
          </p>
          <span className="shrink-0 pl-3 text-[15px] font-extrabold text-[#111111]">
            {etaMinutes} min
          </span>
        </div>
        <div className="mt-1 flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: RIDE_LILAC }}
            aria-hidden
          />
          <p className="truncate text-[11px]" style={{ color: RIDE_MUTED }}>
            {driver.vehicle.name} {driver.vehicle.color.toLowerCase()} · {driver.name}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {[
            { label: "Segurança", icon: ShieldCheck, action: onSafety },
            { label: "Compartilhar", icon: Share2, action: onShare },
            { label: "Rota", icon: MapPin, action: onRoute },
            { label: "Mais", icon: ChevronRight, action: onMore },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={item.action}
              className="flex min-w-0 flex-col items-center gap-1.5 rounded-[16px] bg-zinc-50 py-3 text-zinc-800 transition-colors hover:bg-zinc-100"
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-semibold">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </RideSheet>
  );
}

/* ─── Tela 10 — Parada durante a corrida ─────────────────── */

export function StopPanel({
  current,
  total,
  onContinue,
}: {
  current: number;
  total: number;
  onContinue: () => void;
}) {
  return (
    <RideSheet
      footer={
        <PrimaryCTA onClick={onContinue}>
          <Car className="h-4 w-4" />
          Continuar viagem
        </PrimaryCTA>
      }
    >
      <div className="px-5 pb-3 pt-4 text-center">
        <div
          className="mx-auto grid h-12 w-12 grid-cols-1 place-items-center rounded-full"
          style={{ background: "rgba(168,85,247,0.10)" }}
        >
          <span className="text-[16px] font-black" style={{ color: RIDE_PURPLE }}>
            {current}
          </span>
        </div>
        <h3 className="mt-2.5 text-[17px] font-extrabold tracking-tight text-[#111111]">
          Parada {current} de {total}
        </h3>
        <p className="mt-0.5 text-[12px]" style={{ color: RIDE_MUTED }}>
          Motorista aguardando
        </p>
        <p className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-zinc-500">
          <Users className="h-3.5 w-3.5" />
          Passageiro embarcando
        </p>
      </div>
    </RideSheet>
  );
}

/* ─── Tela 11 — Chegada + pagamento ──────────────────────── */

export function ArrivalPanel({
  categoryLabel,
  fare,
  payment,
  pixConfirmed,
  onSimulatePix,
  onContinue,
  routeMeta,
  destination,
}: {
  categoryLabel: string;
  fare: number;
  payment: PaymentOption;
  pixConfirmed: boolean;
  onSimulatePix: () => void;
  onContinue: () => void;
  routeMeta: { distance: string; duration: string };
  destination: GeoLocation;
}) {
  const pix = payment === "pix";
  return (
    <RideSheet
      footer={
        <PrimaryCTA onClick={onContinue}>
          <Check className="h-4 w-4" strokeWidth={2.6} />
          Continuar
        </PrimaryCTA>
      }
    >
      <div className="px-5 pb-3 pt-4">
        <h2 className="text-[24px] font-extrabold tracking-tight text-[#111111]">Você chegou</h2>
        <p className="mt-0.5 flex items-center gap-1 text-[12px]" style={{ color: RIDE_MUTED }}>
          <MapPin className="h-3.5 w-3.5" />
          {destination.label}
        </p>

        <div className="mt-4 divide-y divide-zinc-100 rounded-[18px] bg-zinc-50 px-4">
          {[
            { label: "Destino", value: destination.label },
            { label: "Tempo total", value: routeMeta.duration },
            { label: "Distância", value: routeMeta.distance },
            { label: "Valor", value: formatPrice(fare) },
            { label: "Pagamento", value: payment === "pix" ? "Pix" : "Dinheiro" },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-3 py-2.5">
              <span className="shrink-0 text-[12px]" style={{ color: RIDE_MUTED }}>
                {row.label}
              </span>
              <span className="min-w-0 truncate text-right text-[13px] font-bold text-[#111111]">
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {/* Estado de pagamento */}
        <div
          className={`mt-3 rounded-[18px] border px-4 py-3.5 ${
            pixConfirmed ? "border-emerald-200 bg-emerald-50" : "border-zinc-100 bg-white"
          }`}
        >
          {pix ? (
            pixConfirmed ? (
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 grid-cols-1 place-items-center rounded-full bg-emerald-500 text-white">
                  <Check className="h-4 w-4" strokeWidth={3} />
                </span>
                <div className="flex-1">
                  <p className="text-[13px] font-bold text-[#111111]">Pagamento confirmado</p>
                  <p className="text-[11px] text-zinc-500">Pago via Pix · {formatPrice(fare)}</p>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3">
                  <span
                    className="grid h-9 w-9 grid-cols-1 place-items-center rounded-full"
                    style={{ background: RIDE_LILAC }}
                  >
                    <Smartphone className="h-4 w-4 text-white" />
                  </span>
                  <div className="flex-1">
                    <p className="text-[13px] font-bold text-[#111111]">Pagamento via Pix</p>
                    <p className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                      <span
                        className="h-1.5 w-1.5 animate-pulse rounded-full"
                        style={{ background: RIDE_LILAC }}
                      />
                      Aguardando pagamento
                    </p>
                  </div>
                  <span className="text-[15px] font-extrabold text-[#111111]">
                    {formatPrice(fare)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onSimulatePix}
                  className="mt-3 flex h-[44px] w-full items-center justify-center gap-2 rounded-[14px] bg-zinc-900 text-[13px] font-bold text-white"
                >
                  <Smartphone className="h-4 w-4" />
                  Simular pagamento
                </button>
              </div>
            )
          ) : (
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 grid-cols-1 place-items-center rounded-full bg-zinc-100">
                <Banknote className="h-4 w-4 text-[#111111]" />
              </span>
              <div className="flex-1">
                <p className="text-[13px] font-bold text-[#111111]">Pagamento em dinheiro</p>
                <p className="text-[11px] text-zinc-500">Pague diretamente ao motorista.</p>
              </div>
              <span className="text-[15px] font-extrabold text-[#111111]">{formatPrice(fare)}</span>
            </div>
          )}
        </div>
      </div>
    </RideSheet>
  );
}

/* ─── Tela 12 — Avaliação ────────────────────────────────── */

const RATING_CHIPS_POSITIVE = [
  "Boa direção",
  "Carro limpo",
  "Educado",
  "Pontual",
  "Viagem tranquila",
];
const RATING_CHIPS_NEUTRAL = ["Boa comunicação", "Respeitou a rota"];

export function RatingPanel({
  driver,
  categoryLabel,
  stars,
  onStars,
  tags,
  onTag,
  comment,
  onComment,
  onSend,
  onSkip,
}: {
  driver: DriverMock;
  categoryLabel: string;
  stars: number;
  onStars: (n: number) => void;
  tags: string[];
  onTag: (tag: string) => void;
  comment: string;
  onComment: (text: string) => void;
  onSend: () => void;
  onSkip: () => void;
}) {
  const chips = stars >= 4 ? RATING_CHIPS_POSITIVE : stars > 0 ? RATING_CHIPS_NEUTRAL : [];
  return (
    <RideSheet
      footer={
        <>
          <PrimaryCTA onClick={onSend} disabled={stars === 0}>
            Enviar avaliação
          </PrimaryCTA>
          <button
            type="button"
            onClick={onSkip}
            className="mt-2 h-9 w-full text-[12px] font-semibold text-zinc-400"
          >
            Agora não
          </button>
        </>
      }
    >
      <div className="px-5 pb-3 pt-4 text-center">
        <img
          src={driver.photo}
          alt={driver.name}
          className="mx-auto h-16 w-16 rounded-full object-cover ring-2 ring-white shadow-sm"
        />
        <h2 className="mt-2.5 text-[21px] font-extrabold tracking-tight text-[#111111]">
          Como foi sua viagem?
        </h2>
        <p className="mt-0.5 text-[12px]" style={{ color: RIDE_MUTED }}>
          {driver.name} · {categoryLabel}
        </p>

        <div
          className="mt-3.5 flex items-center justify-center gap-1.5"
          role="radiogroup"
          aria-label="Nota do motorista"
        >
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={stars >= value}
              aria-label={`${value} estrela${value > 1 ? "s" : ""}`}
              onClick={() => onStars(value)}
              className="grid h-12 w-11 grid-cols-1 place-items-center transition-transform active:scale-90"
            >
              <Star
                className={`h-9 w-9 ${
                  stars >= value ? "fill-[#A855F7] text-[#A855F7]" : "fill-none text-[#D1D1D6]"
                }`}
                strokeWidth={1.5}
              />
            </button>
          ))}
        </div>

        {stars > 0 && (
          <div className="mt-3.5 flex flex-wrap justify-center gap-1.5">
            {chips.map((chip) => {
              const active = tags.includes(chip);
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => onTag(chip)}
                  className={`h-9 rounded-full border px-3.5 text-[12px] font-semibold transition-colors ${
                    active ? "border-transparent" : "border-zinc-200 bg-white text-zinc-600"
                  }`}
                  style={
                    active
                      ? {
                          background: "rgba(168,85,247,0.08)",
                          border: "1px solid rgba(168,85,247,0.25)",
                          color: RIDE_PURPLE,
                        }
                      : undefined
                  }
                >
                  {chip}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-4 text-left">
          <label
            htmlFor="rating-comment"
            className="text-[11px] font-bold uppercase tracking-wide text-zinc-400"
          >
            Quer contar mais?
          </label>
          <textarea
            id="rating-comment"
            value={comment}
            onChange={(event) => onComment(event.target.value)}
            rows={3}
            placeholder="Conte como foi a sua viagem (opcional)"
            className="mt-1.5 w-full resize-none rounded-[16px] border border-zinc-200 bg-zinc-50 px-4 py-3 text-[13px] font-medium text-[#111111] outline-none transition-colors focus:border-zinc-300 focus:bg-white"
          />
        </div>
      </div>
    </RideSheet>
  );
}

/* ─── Resumo final ───────────────────────────────────────── */

export function FinalPanel({
  originLabel,
  destination,
  routeMeta,
  fare,
  payment,
  onHome,
}: {
  originLabel: string;
  destination: GeoLocation;
  routeMeta: { distance: string; duration: string };
  fare: number;
  payment: PaymentOption;
  onHome: () => void;
}) {
  return (
    <RideSheet footer={<PrimaryCTA onClick={onHome}>Voltar para Home</PrimaryCTA>}>
      <div className="px-5 pb-3 pt-5 text-center">
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="mx-auto grid h-14 w-14 grid-cols-1 place-items-center rounded-full text-white shadow-lg"
          style={{ background: RIDE_LILAC }}
        >
          <Check className="h-7 w-7" strokeWidth={3} />
        </motion.span>
        <h2 className="mt-3 text-[21px] font-extrabold tracking-tight text-[#111111]">
          Obrigado por viajar com o Connexy.
        </h2>
        <p className="mt-1 text-[12px]" style={{ color: RIDE_MUTED }}>
          Sua viagem foi concluída com sucesso.
        </p>

        <div className="mt-4 divide-y divide-zinc-100 rounded-[18px] bg-zinc-50 px-4 text-left">
          {[
            { label: "Origem", value: originLabel },
            { label: "Destino", value: destination.label },
            { label: "Distância", value: routeMeta.distance },
            { label: "Tempo", value: routeMeta.duration },
            { label: "Valor", value: formatPrice(fare) },
            { label: "Forma de pagamento", value: payment === "pix" ? "Pix" : "Dinheiro" },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-3 py-2.5">
              <span className="shrink-0 text-[12px]" style={{ color: RIDE_MUTED }}>
                {row.label}
              </span>
              <span className="min-w-0 truncate text-right text-[13px] font-bold text-[#111111]">
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </RideSheet>
  );
}

/* ─── Helper de progresso do fluxo ───────────────────────── */

export function progressForState(state: string): number {
  switch (state) {
    case "solicitar":
    case "rota":
      return 0;
    case "categoria":
      return 1;
    case "buscando":
      return 1;
    case "encontrado":
    case "chegando":
      return 1;
    case "chegou":
      return 2;
    case "emviagem":
    case "parada":
      return 3;
    case "chegada":
    case "avaliacao":
      return 4;
    default:
      return 0;
  }
}
