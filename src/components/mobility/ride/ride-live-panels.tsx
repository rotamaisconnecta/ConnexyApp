import { motion } from "framer-motion";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import {
  Banknote,
  CalendarDays,
  Car,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  Coffee,
  FileText,
  Gift,
  Heart,
  LocateFixed,
  MapPin,
  MessageCircle,
  Phone,
  Route,
  Share2,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Smile,
  Sparkles,
  Star,
  Trees,
  Users,
  UtensilsCrossed,
  Wine,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatRouteDistance } from "@/lib/mobility/route-utils";
import { SwipeCarousel } from "@/components/system/swipe-carousel";
import {
  CONNECT_PULSE_LIMIT,
  getHomeDiscoveryNavigation,
  HOME_DISCOVERY_KIND_LABEL,
  listConnectPulseFeatured,
  type HomeDiscoveryItem,
} from "@/lib/home/home-discovery";
import { vehicleImageForName } from "@/lib/mobility/vehicle-visual";
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
import { paymentMethodLabel } from "@/lib/mobility/payment";
import type { TripPaymentIssue } from "@/lib/mobility/trip/trip-types";
import type { DriverMock } from "./ride-data";
import type { GeoLocation } from "@/lib/mobility/ride-types";
import {
  connexyPointsForFare,
  formatPostRideDistance,
  listPostRideDiscovery,
  ratingFeedbackLabel,
  resolvePostRideNavigation,
  RATING_COMMENT_MAX,
} from "@/lib/mobility/post-ride-discovery";
import {
  isSponsoredPlacement,
  type DiscoveryPlacement,
} from "@/lib/ads/sponsored-placement";
import { AD_PLACEMENTS, recordAdMetric } from "@/lib/ads/ad-metrics";
import { useAdImpression } from "@/hooks/use-ad-metrics";

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
              {paymentMethodLabel(payment)}
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
  onCancel,
  onPickFriend,
  pickFriendDisabled,
  pickFriendHint,
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
  onCancel: () => void;
  onPickFriend?: () => void;
  pickFriendDisabled?: boolean;
  pickFriendHint?: string;
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
              {categoryLabel} · {formatPrice(fare)} · Pagamento {paymentMethodLabel(payment)}
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
          <div className="mt-4 space-y-2">
            {onPickFriend && (
              <SecondaryCTA onClick={onPickFriend} disabled={pickFriendDisabled}>
                <Users className="h-4 w-4" />
                Pegar amigo
              </SecondaryCTA>
            )}
            {pickFriendHint && (
              <p className="text-center text-[11px] font-medium text-zinc-400">{pickFriendHint}</p>
            )}
            <SecondaryCTA onClick={onShare}>
              <Share2 className="h-4 w-4" />
              Compartilhar viagem
            </SecondaryCTA>
          </div>
        )}

        <button
          type="button"
          onClick={onCancel}
          className="mt-4 w-full text-center text-[12px] font-bold text-red-500"
        >
          Cancelar corrida
        </button>
      </div>
    </RideSheet>
  );
}

/* ─── Tela 09 — Corrida em andamento ─────────────────────── */

function formatArrivalClock(etaMinutes: number) {
  const at = new Date(Date.now() + Math.max(0, etaMinutes) * 60_000);
  return at.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function formatRating(value: number) {
  return value.toFixed(1).replace(".", ",");
}

function formatRouteDurationLabel(minutes: number) {
  return `${Math.max(0, Math.round(minutes))} min`;
}

export function ActiveRidePanel({
  driver,
  destination,
  stopLabel,
  etaMinutes,
  distanceMeters,
  fare,
  payment,
  onSafety,
  onShare,
  onDetails,
  onRecenter,
  onPickFriend,
  pickFriendDisabled,
  pickFriendHint,
}: {
  driver: DriverMock;
  destination: GeoLocation;
  stopLabel?: string;
  etaMinutes: number;
  distanceMeters: number;
  fare: number;
  payment: PaymentOption;
  onSafety: () => void;
  onShare: () => void;
  onDetails: () => void;
  onRecenter: () => void;
  onPickFriend?: () => void;
  pickFriendDisabled?: boolean;
  pickFriendHint?: string;
}) {
  const [expanded, setExpanded] = useState(true);
  const [socialActive, setSocialActive] = useState(false);
  const vehicleImage = vehicleImageForName(driver.vehicle.name);
  const discoveries = useMemo(
    () => listConnectPulseFeatured().slice(0, CONNECT_PULSE_LIMIT),
    [],
  );
  const stats = [
    {
      icon: Clock3,
      label: "Chegada em",
      value: formatRouteDurationLabel(etaMinutes),
      hint: `às ${formatArrivalClock(etaMinutes)}`,
    },
    {
      icon: Route,
      label: "Distância",
      value: formatRouteDistance(distanceMeters || 0),
      hint: "Restante",
    },
    {
      icon: Banknote,
      label: "Valor da corrida",
      value: formatPrice(fare),
      hint: paymentMethodLabel(payment),
    },
    {
      icon: Users,
      label: "Modo Social",
      value: socialActive ? "Ativo" : "Inativo",
      hint: socialActive ? "Ver perfis" : "Ativar",
    },
  ] as const;

  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex flex-col overflow-hidden">
      <p className="sr-only">
        Destino {destination.label}
        {stopLabel ? ` · Próxima parada ${stopLabel}` : ""}
      </p>
      <div className="relative min-h-[34%] flex-1">
        <header className="pointer-events-auto absolute inset-x-3 top-[max(0.4rem,env(safe-area-inset-top,0px))] z-10 md:inset-x-4 md:top-3">
          <div className="rounded-[28px] bg-white px-3 pb-3 pt-3 shadow-[0_12px_32px_rgba(17,17,17,0.08)]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                aria-label={expanded ? "Recolher detalhes da corrida" : "Expandir detalhes da corrida"}
                aria-expanded={expanded}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-[#6D28D9] shadow-[0_6px_16px_rgba(17,17,17,0.08)]"
              >
                <ChevronDown
                  className={`h-[18px] w-[18px] transition-transform ${expanded ? "" : "rotate-180"}`}
                  strokeWidth={2.2}
                />
              </button>
              <div className="min-w-0 flex-1 pr-10 text-center">
                <h2 className="text-[16px] font-extrabold tracking-tight text-[#111111]">
                  Corrida em andamento
                </h2>
                <p className="text-[12px] font-medium text-zinc-400">Aproveite sua viagem!</p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-4 gap-1">
              {stats.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="min-w-0 rounded-[18px] px-1 py-1 text-center">
                    <span
                      className="mx-auto grid h-7 w-7 place-items-center rounded-full"
                      style={{ background: "rgba(168,85,247,0.12)", color: RIDE_LILAC }}
                    >
                      <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
                    </span>
                    <span className="mt-1 block truncate text-[9px] font-medium text-zinc-400">
                      {item.label}
                    </span>
                    <span className="mt-0.5 block truncate text-[12px] font-extrabold text-[#111111]">
                      {item.value}
                    </span>
                    <span className="block truncate text-[9px] font-medium text-zinc-400">
                      {item.hint}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </header>

        <button
          type="button"
          onClick={onRecenter}
          aria-label="Centralizar no mapa"
          className="pointer-events-auto absolute bottom-3 right-3 z-10 grid h-11 w-11 place-items-center rounded-full bg-white text-[#6D28D9] shadow-[0_8px_20px_rgba(17,17,17,0.1)] md:right-4"
        >
          <LocateFixed className="h-4 w-4" strokeWidth={2.2} />
        </button>
      </div>

      <section
        className={`pointer-events-auto flex min-h-0 shrink-0 flex-col overflow-hidden rounded-t-[28px] bg-white/95 shadow-[0_-16px_40px_rgba(17,17,17,0.08)] backdrop-blur-md ${
          expanded ? "h-[min(32%,13.75rem)]" : ""
        }`}
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-zinc-200" aria-hidden />
        <div
          className={`${
            expanded ? "min-h-0 flex-1 overflow-y-auto overscroll-y-contain touch-pan-y no-scrollbar" : ""
          }`}
        >
          <div className={expanded ? "flex min-h-full flex-col px-4 pb-1 pt-2.5" : "px-4 pb-3 pt-2.5"}>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-400">Motorista</p>
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-400">Veículo</p>
              <div className="flex min-w-0 items-center gap-2">
                <span className="relative shrink-0">
                  <img
                    src={driver.photo}
                    alt={`Foto de ${driver.name}`}
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-white shadow-sm"
                  />
                  <span className="absolute -bottom-0.5 left-1/2 flex -translate-x-1/2 items-center gap-0.5 rounded-full bg-white px-1 py-px text-[8px] font-bold text-[#111111] shadow-[0_4px_10px_rgba(17,17,17,0.08)]">
                    <Star className="h-2 w-2 fill-[#EAB308] text-[#EAB308]" />
                    {formatRating(driver.rating)}
                  </span>
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-extrabold tracking-tight text-[#111111]">
                    {driver.name}
                  </p>
                  <p className="truncate text-[10px] font-medium text-zinc-400">
                    {driver.verified ? "Motorista parceiro" : "Motorista"}
                  </p>
                </div>
              </div>
              <div className="flex min-w-0 items-center gap-2">
                <img
                  src={vehicleImage}
                  alt={driver.vehicle.name}
                  className="h-9 w-[3.25rem] shrink-0 rounded-[10px] object-cover object-center"
                />
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-bold text-[#111111]">{driver.vehicle.name}</p>
                  <p className="truncate text-[10px] font-medium text-zinc-500">
                    {driver.vehicle.color ? `${driver.vehicle.color} · ` : null}
                    <span className="font-extrabold tracking-[0.06em]" style={{ color: RIDE_PURPLE }}>
                      {driver.vehicle.plate}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {expanded && (
              <div className="mt-auto flex flex-col items-center pb-1 pt-2">
                <ChevronDown className="h-4 w-4 text-zinc-300" strokeWidth={2.4} aria-hidden />
                <span className="sr-only">Há mais informações abaixo.</span>
              </div>
            )}
          </div>

          {expanded && (
            <>
              <div className="px-4 pb-2">
                <ActiveRideMenuRow
                  icon={FileText}
                  title="Detalhes da corrida"
                  subtitle="Informações da viagem"
                  onClick={onDetails}
                />
                <ActiveRideMenuRow
                  icon={Share2}
                  title="Compartilhar corrida"
                  subtitle="Avise alguém"
                  onClick={onShare}
                />
                <ActiveRideMenuRow
                  icon={ShieldCheck}
                  title="Segurança"
                  subtitle="Ajuda e SOS"
                  onClick={onSafety}
                />
                {onPickFriend && (
                  <ActiveRideMenuRow
                    icon={Users}
                    title="Pegar amigo"
                    subtitle={pickFriendHint ?? "Adicionar um passageiro"}
                    onClick={onPickFriend}
                    disabled={pickFriendDisabled}
                  />
                )}
                <ActiveRideMenuRow
                  icon={Users}
                  title="Conecta durante a viagem"
                  subtitle={socialActive ? "Modo Social ativo" : "Conecte-se no trajeto"}
                  onClick={() => setSocialActive((value) => !value)}
                />
              </div>

              {discoveries.length > 0 && (
                <div className="pb-3 pt-0.5">
                  <p className="px-4 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                    Durante a viagem
                  </p>
                  <SwipeCarousel
                    ariaLabel="Conteúdos durante a viagem"
                    hintLabel="Deslize para ver mais"
                    autoplay
                    autoplayMs={4500}
                    className="gap-2 pl-4 pr-8"
                  >
                    {discoveries.map((item) => (
                      <RideDiscoveryCard key={item.id} item={item} />
                    ))}
                  </SwipeCarousel>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function ActiveRideMenuRow({
  icon: Icon,
  title,
  subtitle,
  onClick,
  disabled,
}: {
  icon: typeof FileText;
  title: string;
  subtitle: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center gap-3 rounded-[18px] py-2 text-left disabled:opacity-45"
    >
      <span
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full"
        style={{ background: "rgba(168,85,247,0.12)", color: RIDE_LILAC }}
      >
        <Icon className="h-4 w-4" strokeWidth={2.2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-bold text-[#111111]">{title}</span>
        <span className="block text-[11px] font-medium text-zinc-400">{subtitle}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-zinc-300" strokeWidth={2.2} />
    </button>
  );
}

function RideDiscoveryCard({ item }: { item: HomeDiscoveryItem }) {
  const target = getHomeDiscoveryNavigation(item);
  const className =
    "relative flex h-[3.25rem] w-[78%] shrink-0 snap-start items-center overflow-hidden rounded-[16px] border border-zinc-100 bg-white/90 shadow-[0_8px_20px_rgba(17,17,17,0.06)] backdrop-blur-sm";
  const body = (
    <>
      <div className="relative h-full w-[3.5rem] shrink-0 overflow-hidden">
        <img src={item.image} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="min-w-0 flex-1 px-2.5 py-1">
        <span className="block truncate text-[8px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
          {HOME_DISCOVERY_KIND_LABEL[item.kind]}
        </span>
        <p className="truncate text-[12px] font-bold leading-tight text-[#111111]">{item.title}</p>
        <p className="truncate text-[10px] font-medium text-zinc-400">
          {item.subtitle}
          {item.distanceLabel ? ` · ${item.distanceLabel}` : ""}
        </p>
      </div>
    </>
  );

  if (!target) {
    return <article className={className}>{body}</article>;
  }
  if (target.to === "/marketplace") {
    return (
      <Link to="/marketplace" aria-label={`Ver ${item.title}`} className={className}>
        {body}
      </Link>
    );
  }
  return (
    <Link to={target.to} params={target.params} aria-label={`Ver ${item.title}`} className={className}>
      {body}
    </Link>
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
  paymentConfirmed,
  paymentIssue,
  onContinue,
  routeMeta,
  destination,
}: {
  categoryLabel: string;
  fare: number;
  payment: PaymentOption;
  paymentConfirmed: boolean;
  paymentIssue?: TripPaymentIssue;
  onContinue: () => void;
  routeMeta: { distance: string; duration: string };
  destination: GeoLocation;
}) {
  const [simulatePix, setSimulatePix] = useState(false);
  const pix = payment === "pix";
  const unpaid = paymentIssue === "user_not_paid";
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
            { label: "Pagamento", value: paymentMethodLabel(payment) },
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
            paymentConfirmed
              ? "border-emerald-200 bg-emerald-50"
              : unpaid
                ? "border-red-200 bg-red-50"
                : "border-zinc-100 bg-white"
          }`}
        >
          {paymentConfirmed ? (
            pix ? (
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
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 grid-cols-1 place-items-center rounded-full bg-emerald-500 text-white">
                  <Check className="h-4 w-4" strokeWidth={3} />
                </span>
                <div className="flex-1">
                  <p className="text-[13px] font-bold text-[#111111]">Pagamento confirmado</p>
                  <p className="text-[11px] text-zinc-500">
                    Pago em dinheiro · {formatPrice(fare)}
                  </p>
                </div>
              </div>
            )
          ) : unpaid ? (
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 grid-cols-1 place-items-center rounded-full bg-red-500 text-white">
                <ShieldCheck className="h-4 w-4 rotate-45" />
              </span>
              <div className="flex-1">
                <p className="text-[13px] font-bold text-[#111111]">Corrida não paga</p>
                <p className="text-[11px] text-zinc-500">
                  O motorista não recebeu o pagamento. Você precisará regularizar esta pendência
                  para solicitar novas corridas.
                </p>
              </div>
            </div>
          ) : pix ? (
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
              {simulatePix ? (
                <p className="mt-3 rounded-[12px] bg-zinc-100 px-3 py-2 text-[11px] leading-relaxed text-zinc-600">
                  Pagamento simulado enviado. O motorista confirmará o recebimento do PIX.
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => setSimulatePix(true)}
                  className="mt-3 flex h-[44px] w-full items-center justify-center gap-2 rounded-[14px] bg-zinc-900 text-[13px] font-bold text-white"
                >
                  <Smartphone className="h-4 w-4" />
                  Simular pagamento
                </button>
              )}
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 grid-cols-1 place-items-center rounded-full bg-zinc-100">
                  <Banknote className="h-4 w-4 text-[#111111]" />
                </span>
                <div className="flex-1">
                  <p className="text-[13px] font-bold text-[#111111]">Pagamento em dinheiro</p>
                  <p className="text-[11px] text-zinc-500">
                    Pague diretamente ao motorista — ele confirmará o recebimento.
                  </p>
                </div>
                <span className="text-[15px] font-extrabold text-[#111111]">
                  {formatPrice(fare)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </RideSheet>
  );
}

/* ─── Tela 12 — Avaliação / Viagem concluída ─────────────── */

const RATING_CHIPS_POSITIVE = [
  { label: "Motorista educado", icon: Smile },
  { label: "Carro limpo", icon: Car },
  { label: "Condução segura", icon: Shield },
  { label: "Chegou no horário", icon: Clock3 },
  { label: "Ótimo atendimento", icon: Heart },
] as const;
const RATING_CHIPS_NEUTRAL = [
  { label: "Boa comunicação", icon: MessageCircle },
  { label: "Respeitou a rota", icon: Route },
] as const;

function postRideCategoryIcon(category: string): LucideIcon {
  const key = category.toLowerCase();
  if (key.includes("café") || key.includes("cafe") || key.includes("cafeteria")) return Coffee;
  if (key.includes("pizza") || key.includes("restaur") || key.includes("gastro")) return UtensilsCrossed;
  if (key.includes("bar") || key.includes("vinho") || key.includes("wine")) return Wine;
  if (key.includes("shop") || key.includes("loja") || key.includes("mall")) return ShoppingBag;
  if (key.includes("parque") || key.includes("praça") || key.includes("praca") || key.includes("natureza")) {
    return Trees;
  }
  if (key.includes("evento") || key.includes("show")) return CalendarDays;
  if (key.includes("bem-estar") || key.includes("spa") || key.includes("ativid")) return Sparkles;
  return MapPin;
}

function PostRideScreen({
  children,
  footer,
}: {
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <section className="absolute inset-0 z-40 flex flex-col bg-white">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
        {children}
      </div>
      <div className="shrink-0 bg-white px-5 pb-[max(env(safe-area-inset-bottom,0px),1rem)] pt-2">
        {footer}
      </div>
    </section>
  );
}

function FinalizarButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      className="flex h-[54px] w-full items-center justify-center rounded-full text-[16px] font-semibold text-white shadow-[0_10px_24px_rgba(124,58,237,0.28)] disabled:opacity-40"
      style={{ background: "linear-gradient(90deg, #7C3AED 0%, #A855F7 100%)" }}
    >
      Finalizar
    </motion.button>
  );
}

function TripSummaryCard({
  driver,
  fare,
  routeMeta,
}: {
  driver: DriverMock;
  fare: number;
  routeMeta: { distance: string; duration: string };
}) {
  return (
    <div className="flex items-center gap-3.5 rounded-[28px] bg-white px-3.5 py-3.5 shadow-[0_8px_30px_rgba(17,17,17,0.06)] ring-1 ring-black/[0.03]">
      <img
        src={driver.photo}
        alt={driver.name}
        className="h-[64px] w-[64px] shrink-0 rounded-full object-cover"
      />
      <div className="min-w-0 flex-1 text-left">
        <p className="truncate text-[16px] font-bold tracking-tight text-[#111111]">{driver.name}</p>
        <p className="mt-0.5 truncate text-[12px] text-zinc-500">
          {driver.vehicle.name} · {driver.vehicle.color}
        </p>
        <p className="mt-0.5 text-[12px] font-semibold tracking-[0.12em] text-zinc-500">
          {driver.vehicle.plate}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-[20px] font-extrabold tracking-tight text-[#111111]">{formatPrice(fare)}</p>
        <p className="mt-0.5 text-[11px] font-medium text-zinc-400">
          {routeMeta.distance} · {routeMeta.duration}
        </p>
      </div>
    </div>
  );
}

function ConnexyPointsCard({ fare }: { fare: number }) {
  const points = connexyPointsForFare(fare);
  return (
    <div className="flex items-center gap-3 rounded-[24px] bg-[#F3EBFF] px-4 py-3.5">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-white text-[#7C3AED]">
        <Gift className="h-5 w-5" strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-bold tracking-tight text-[#111111]">
          Você ganhou {points} pontos Connexy!
        </p>
        <p className="mt-0.5 text-[12px] leading-snug text-zinc-500">
          Continue acumulando e desbloqueie benefícios.
        </p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-zinc-400" aria-hidden />
    </div>
  );
}

function PostRidePlaceCard({ card }: { card: DiscoveryPlacement }) {
  const nav = useNavigate();
  const sponsored = isSponsoredPlacement(card);
  const distance = formatPostRideDistance(card.distanceMeters);
  const CategoryIcon = postRideCategoryIcon(card.category);
  const impressionRef = useAdImpression(
    sponsored
      ? {
          ad: card.id,
          placement: AD_PLACEMENTS.POST_RIDE_DISCOVERY,
          advertiserId: card.advertiserId ?? null,
          campaignId: card.campaignId ?? null,
        }
      : { ad: "", placement: "" }, // orgânico nunca gera métrica
  );

  function openCard() {
    const target = resolvePostRideNavigation(card);
    if (!target) return;
    if (sponsored) {
      recordAdMetric({
        type: "click",
        ad: card.id,
        placement: AD_PLACEMENTS.POST_RIDE_DISCOVERY,
        advertiserId: card.advertiserId ?? null,
        campaignId: card.campaignId ?? null,
      });
    }
    if (target.kind === "external") {
      window.open(target.href, "_blank", "noopener,noreferrer");
      return;
    }
    nav({ href: target.href });
  }

  return (
    <button
      type="button"
      ref={impressionRef}
      onClick={openCard}
      className="w-[142px] min-w-[142px] shrink-0 overflow-hidden rounded-[22px] bg-white text-left shadow-[0_10px_24px_rgba(17,17,17,0.06)]"
    >
      <div className="relative aspect-[5/4] overflow-hidden">
        <img src={card.image} alt="" className="h-full w-full object-cover" />
        {sponsored ? (
          <span className="absolute left-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[9px] font-semibold text-white">
            Patrocinado
          </span>
        ) : null}
        <span className="absolute bottom-2 left-2 grid h-7 w-7 place-items-center rounded-[10px] bg-white text-[#7C3AED] shadow-sm">
          <CategoryIcon className="h-3.5 w-3.5" strokeWidth={2.1} />
        </span>
      </div>
      <div className="px-2.5 py-2.5">
        <p className="truncate text-[13px] font-bold tracking-tight text-[#111111]">{card.name}</p>
        <p className="mt-0.5 truncate text-[11px] text-zinc-500">
          {card.category}
          {distance ? ` · ${distance}` : ""}
        </p>
        {card.rating != null ? (
          <p className="mt-1 flex items-center gap-0.5 text-[11px] font-semibold text-[#111111]">
            {card.rating.toFixed(1).replace(".", ",")}
            <Star className="h-3 w-3 fill-[#7C3AED] text-[#7C3AED]" />
          </p>
        ) : card.ctaLabel ? (
          <p className="mt-1 text-[11px] font-semibold text-[#7C3AED]">{card.ctaLabel}</p>
        ) : null}
      </div>
    </button>
  );
}

function PostRidePlacesRail({ destination }: { destination: GeoLocation }) {
  const cards = useMemo(() => listPostRideDiscovery(destination), [destination]);
  if (cards.length === 0) return null;
  return (
    <section className="mt-7 text-left">
      <div className="px-5">
        <h3 className="text-[17px] font-bold tracking-tight text-[#111111]">Lugares perto do seu destino</h3>
        <p className="mt-0.5 text-[12px] text-zinc-500">Descubra excelentes opções na região</p>
      </div>
      <SwipeCarousel hint={false} ariaLabel="Lugares perto do seu destino" className="mt-3.5 gap-3 px-5">
        {cards.map((card) => (
          <PostRidePlaceCard key={`${card.sponsored ? "ad" : "place"}:${card.id}`} card={card} />
        ))}
      </SwipeCarousel>
    </section>
  );
}

export function RatingPanel({
  driver,
  fare,
  routeMeta,
  destination,
  stars,
  onStars,
  tags,
  onTag,
  comment,
  onComment,
  onSend,
  onSkip: _onSkip,
}: {
  driver: DriverMock;
  fare: number;
  routeMeta: { distance: string; duration: string };
  destination: GeoLocation;
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
  const feedback = ratingFeedbackLabel(stars);
  return (
    <PostRideScreen footer={<FinalizarButton onClick={onSend} disabled={stars === 0} />}>
      <div className="px-5 pb-4 pt-[max(1.75rem,env(safe-area-inset-top,0px))] text-center">
        <h1 className="text-[26px] font-bold leading-tight tracking-tight text-[#111111]">
          Viagem concluída!
        </h1>
        <p className="mt-1.5 text-[13px] text-zinc-500">Obrigado por escolher a Connexy.</p>

        <div className="mt-6 text-left">
          <TripSummaryCard driver={driver} fare={fare} routeMeta={routeMeta} />
        </div>

        <h2 className="mt-8 text-[18px] font-bold tracking-tight text-[#111111]">Como foi sua viagem?</h2>
        <p className="mt-1 text-[13px] text-zinc-400">Avalie seu motorista</p>

        <div
          className="mt-5 flex items-center justify-center gap-2.5"
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
              className="grid h-12 w-12 grid-cols-1 place-items-center transition-transform active:scale-90"
            >
              <Star
                className={`h-10 w-10 ${
                  stars >= value ? "fill-[#7C3AED] text-[#7C3AED]" : "fill-none text-[#D4D4D8]"
                }`}
                strokeWidth={1.6}
              />
            </button>
          ))}
        </div>
        {feedback ? (
          <p className="mt-2 text-[14px] font-semibold text-[#7C3AED]">{feedback}</p>
        ) : (
          <p className="mt-2 h-5" aria-hidden />
        )}

        {stars > 0 && (
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {chips.map((chip) => {
              const active = tags.includes(chip.label);
              const Icon = chip.icon;
              return (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => onTag(chip.label)}
                  className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[12px] font-medium transition-colors ${
                    active
                      ? "bg-[#EFE6FF] text-[#7C3AED]"
                      : "bg-[#F6F4F8] text-zinc-600"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 text-[#7C3AED]" />
                  {chip.label}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-7 text-left">
          <label htmlFor="rating-comment" className="text-[13px] font-semibold text-[#111111]">
            Deixe um comentário (opcional)
          </label>
          <div className="relative mt-2.5">
            <textarea
              id="rating-comment"
              value={comment}
              onChange={(event) => onComment(event.target.value.slice(0, RATING_COMMENT_MAX))}
              rows={4}
              maxLength={RATING_COMMENT_MAX}
              placeholder="Conte mais sobre sua experiência..."
              className="w-full resize-none rounded-[22px] border border-zinc-200 bg-white px-4 py-3.5 pb-8 text-[13px] font-medium text-[#111111] outline-none placeholder:text-zinc-400 focus:border-violet-200 focus:ring-2 focus:ring-violet-100"
            />
            <span className="pointer-events-none absolute bottom-3 right-3.5 text-[11px] text-zinc-400">
              {comment.length}/{RATING_COMMENT_MAX}
            </span>
          </div>
        </div>
      </div>

      <PostRidePlacesRail destination={destination} />

      <div className="px-5 pb-2 pt-5">
        <ConnexyPointsCard fare={fare} />
      </div>
    </PostRideScreen>
  );
}

/* ─── Resumo final ───────────────────────────────────────── */

export function FinalPanel({
  originLabel,
  destination,
  routeMeta,
  fare,
  payment,
  driver,
  onHome,
}: {
  originLabel: string;
  destination: GeoLocation;
  routeMeta: { distance: string; duration: string };
  fare: number;
  payment: PaymentOption;
  driver?: DriverMock | null;
  onHome: () => void;
}) {
  return (
    <PostRideScreen footer={<FinalizarButton onClick={onHome} />}>
      <div className="px-5 pb-5 pt-[max(1.75rem,env(safe-area-inset-top,0px))] text-center">
        <h1 className="text-[26px] font-bold leading-tight tracking-tight text-[#111111]">
          Viagem concluída!
        </h1>
        <p className="mt-1.5 text-[13px] text-zinc-500">Obrigado por escolher a Connexy.</p>

        <div className="mt-5 text-left">
          {driver ? (
            <TripSummaryCard driver={driver} fare={fare} routeMeta={routeMeta} />
          ) : (
            <div className="divide-y divide-zinc-100 rounded-[22px] bg-white px-4 shadow-[0_10px_28px_rgba(109,40,217,0.07)]">
              {[
                { label: "Origem", value: originLabel },
                { label: "Destino", value: destination.label },
                { label: "Distância", value: routeMeta.distance },
                { label: "Tempo", value: routeMeta.duration },
                { label: "Valor", value: formatPrice(fare) },
                { label: "Forma de pagamento", value: paymentMethodLabel(payment) },
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
          )}
        </div>
      </div>

      <div className="px-5 pb-2 pt-5">
        <ConnexyPointsCard fare={fare} />
      </div>
    </PostRideScreen>
  );
}

/* ─── Resumo de cancelamento ─────────────────────────────── */

export function CancelledPanel({
  byDriver,
  originLabel,
  destination,
  onHome,
}: {
  byDriver: boolean;
  originLabel: string;
  destination: GeoLocation;
  onHome: () => void;
}) {
  return (
    <RideSheet footer={<PrimaryCTA onClick={onHome}>Voltar para Home</PrimaryCTA>}>
      <div className="px-5 pb-3 pt-5 text-center">
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="mx-auto grid h-14 w-14 grid-cols-1 place-items-center rounded-full bg-red-50 text-red-500"
        >
          <ShieldCheck className="h-7 w-7 rotate-45" strokeWidth={2.6} />
        </motion.span>
        <h2 className="mt-3 text-[21px] font-extrabold tracking-tight text-[#111111]">
          {byDriver ? "O motorista desistiu da corrida" : "Corrida cancelada"}
        </h2>
        <p className="mt-1 text-[12px]" style={{ color: RIDE_MUTED }}>
          {byDriver
            ? "A viagem foi cancelada pelo motorista. Sem cobrança na fase demo."
            : "Você poderá solicitar uma nova corrida quando desejar."}
        </p>

        <div className="mt-4 divide-y divide-zinc-100 rounded-[18px] bg-zinc-50 px-4 text-left">
          {[
            { label: "Origem", value: originLabel },
            { label: "Destino", value: destination.label },
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
