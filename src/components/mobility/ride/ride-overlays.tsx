import { AnimatePresence, motion } from "framer-motion";
import {
  Banknote,
  Car,
  Info,
  LifeBuoy,
  MapPin,
  MapPinPlus,
  MessageCircle,
  Navigation,
  Phone,
  Share2,
  ShieldCheck,
  Smartphone,
  Wallet,
} from "lucide-react";
import { DEMO_DESTINATIONS, type DriverMock, destinationToGeo } from "./ride-data";
import {
  ListRow,
  RideModal,
  RideOverlaySheet,
  RIDE_LILAC,
  SecondaryCTA,
  PrimaryCTA,
} from "./ride-sheet";
import { RideProgress } from "./ride-progress";
import { progressForState } from "./ride-live-panels";
import type { PaymentOption } from "./ride-flow-types";
import type { GeoLocation } from "@/lib/mobility/ride-types";

function RowIcon({
  label,
  icon: Icon,
  onClick,
  description,
}: {
  label: string;
  icon: typeof MapPinPlus;
  onClick: () => void;
  description?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 py-3.5 text-left"
    >
      <span className="grid h-9 w-9 shrink-0 grid-cols-1 place-items-center rounded-full bg-zinc-100">
        <Icon className="h-4 w-4 text-[#111111]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-semibold text-[#111111]">{label}</span>
        {description && <span className="block text-[11px] text-zinc-500">{description}</span>}
      </span>
    </button>
  );
}

/* ─── Forma de pagamento ─────────────────────────────────── */

export function PaymentOverlay({
  open,
  onClose,
  payment,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  payment: PaymentOption;
  onPick: (payment: PaymentOption) => void;
}) {
  return (
    <RideOverlaySheet open={open} onClose={onClose} title="Forma de pagamento">
      <div className="divide-y divide-zinc-100">
        <ListRow
          title="Pix"
          subtitle="Pagamento instantâneo"
          leading={<Smartphone className="h-4 w-4 text-[#111111]" />}
          selected={payment === "pix"}
          onClick={() => onPick("pix")}
        />
        <ListRow
          title="Dinheiro"
          subtitle="Pague diretamente ao motorista"
          leading={<Banknote className="h-4 w-4 text-[#111111]" />}
          selected={payment === "dinheiro"}
          onClick={() => onPick("dinheiro")}
        />
      </div>
      <p className="pt-2 text-[10px] text-zinc-400">
        No modo demo não há cobrança real — apenas simulação local.
      </p>
    </RideOverlaySheet>
  );
}

/* ─── Central de segurança ───────────────────────────────── */

export function SafetyOverlay({
  open,
  onClose,
  onShare,
  onDriverInfo,
  onHelp,
  onEmergency,
}: {
  open: boolean;
  onClose: () => void;
  onShare: () => void;
  onDriverInfo: () => void;
  onHelp: () => void;
  onEmergency: () => void;
}) {
  return (
    <RideOverlaySheet open={open} onClose={onClose} title="Central de segurança">
      <div className="divide-y divide-zinc-100">
        <RowIcon
          label="Compartilhar viagem"
          icon={Share2}
          onClick={() => {
            onClose();
            onShare();
          }}
          description="Avise alguém sobre sua corrida"
        />
        <RowIcon
          label="Dados do motorista"
          icon={Car}
          onClick={() => {
            onClose();
            onDriverInfo();
          }}
          description="Placa, veículo e avaliação"
        />
        <RowIcon
          label="Ajuda"
          icon={LifeBuoy}
          onClick={() => {
            onClose();
            onHelp();
          }}
          description="Central de suporte Connexy"
        />
        <RowIcon
          label="Emergência"
          icon={ShieldCheck}
          onClick={() => {
            onClose();
            onEmergency();
          }}
          description="Acionar ajuda imediata"
        />
      </div>
    </RideOverlaySheet>
  );
}

/* ─── Mais (alterar viagem) ──────────────────────────────── */

export function AlterarOverlay({
  open,
  onClose,
  onAddStop,
  onChangeDest,
  onPayment,
  onDetails,
  onCancelRide,
}: {
  open: boolean;
  onClose: () => void;
  onAddStop: () => void;
  onChangeDest: () => void;
  onPayment: () => void;
  onDetails: () => void;
  onCancelRide: () => void;
}) {
  return (
    <RideOverlaySheet open={open} onClose={onClose} title="Alterar viagem">
      <div className="divide-y divide-zinc-100">
        <RowIcon
          label="Adicionar parada"
          icon={MapPinPlus}
          onClick={() => {
            onClose();
            onAddStop();
          }}
        />
        <RowIcon
          label="Alterar destino"
          icon={Navigation}
          onClick={() => {
            onClose();
            onChangeDest();
          }}
        />
        <RowIcon
          label="Forma de pagamento"
          icon={Wallet}
          onClick={() => {
            onClose();
            onPayment();
          }}
        />
        <RowIcon
          label="Detalhes da viagem"
          icon={Info}
          onClick={() => {
            onClose();
            onDetails();
          }}
        />
        <button
          type="button"
          onClick={() => {
            onClose();
            onCancelRide();
          }}
          className="flex w-full items-center gap-3 py-3.5 text-left"
        >
          <span className="grid h-9 w-9 shrink-0 grid-cols-1 place-items-center rounded-full bg-red-50">
            <ShieldCheck className="h-4 w-4 rotate-45 text-red-500" />
          </span>
          <span className="text-[14px] font-bold text-red-600">Cancelar corrida</span>
        </button>
      </div>
    </RideOverlaySheet>
  );
}

/* ─── Detalhes da viagem (RideProgress) ──────────────────── */

export function DetailsOverlay({
  open,
  onClose,
  state,
  distance,
  duration,
  fare,
  fareColor,
  categoryLabel,
  payment,
}: {
  open: boolean;
  onClose: () => void;
  state: string;
  distance: string;
  duration: string;
  fare: string;
  fareColor: boolean;
  categoryLabel: string;
  payment: PaymentOption;
}) {
  return (
    <RideOverlaySheet open={open} onClose={onClose} title="Detalhes da viagem">
      <div className="rounded-[18px] bg-zinc-50 px-4 py-4">
        <RideProgress progress={progressForState(state)} />
      </div>
      <div className="mt-3 divide-y divide-zinc-100 rounded-[18px] bg-zinc-50 px-4">
        {[
          { label: "Categoria", value: categoryLabel },
          { label: "Distância", value: distance },
          { label: "Tempo estimado", value: duration },
          { label: "Pagamento", value: payment === "pix" ? "Pix" : "Dinheiro" },
          { label: "Valor", value: fare, bold: true },
        ].map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 py-2.5">
            <span className="text-[12px] text-zinc-500">{row.label}</span>
            <span
              className={`text-[13px] ${row.bold ? "font-extrabold text-[#111111]" : "font-semibold text-[#111111]"}`}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </RideOverlaySheet>
  );
}

/* ─── Alterar destino (com confirmação) ──────────────────── */

export function ChangeDestinationOverlay({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (dest: GeoLocation) => void;
}) {
  return (
    <RideOverlaySheet open={open} onClose={onClose} title="Alterar destino">
      <div className="divide-y divide-zinc-100">
        {DEMO_DESTINATIONS.map((item) => (
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
              onClose();
              onConfirm(destinationToGeo(item));
            }}
          />
        ))}
      </div>
    </RideOverlaySheet>
  );
}

/* ─── Compartilhar viagem ────────────────────────────────── */

export function ShareSheet({
  open,
  onClose,
  onNative,
  onCopy,
}: {
  open: boolean;
  onClose: () => void;
  onNative: () => void;
  onCopy: () => void;
}) {
  return (
    <RideOverlaySheet open={open} onClose={onClose} title="Compartilhar viagem">
      <p className="rounded-[16px] bg-zinc-50 px-4 py-3 text-[13px] leading-relaxed text-zinc-600">
        Estou viajando com o Connexy. Estarei informando meu status durante a corrida. 🟡
      </p>
      <div className="mt-3 space-y-2.5">
        <PrimaryCTA
          onClick={() => {
            onNative();
            onClose();
          }}
        >
          <Share2 className="h-4 w-4" />
          Compartilhar
        </PrimaryCTA>
        <SecondaryCTA
          onClick={() => {
            onCopy();
            onClose();
          }}
        >
          <MessageCircle className="h-4 w-4" />
          Copiar código de compartilhamento
        </SecondaryCTA>
      </div>
    </RideOverlaySheet>
  );
}

/* ─── Confirmação de cancelamento ────────────────────────── */

export function CancelConfirmModal({
  open,
  onClose,
  onConfirm,
  reason,
  title = "Cancelar esta viagem?",
  dismissLabel = "Manter viagem",
  confirmLabel = "Cancelar",
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  reason: string;
  title?: string;
  dismissLabel?: string;
  confirmLabel?: string;
}) {
  return (
    <RideModal open={open} onClose={onClose}>
      <div className="mx-auto grid h-12 w-12 grid-cols-1 place-items-center rounded-full bg-red-50">
        <ShieldCheck className="h-6 w-6 rotate-45 text-red-500" />
      </div>
      <h3 className="mt-3 text-center text-[17px] font-extrabold tracking-tight text-[#111111]">
        {title}
      </h3>
      <p className="mt-1 text-center text-[12px] leading-relaxed text-zinc-500">{reason}</p>
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <SecondaryCTA onClick={onClose}>{dismissLabel}</SecondaryCTA>
        <button
          type="button"
          onClick={onConfirm}
          className="flex h-[48px] items-center justify-center rounded-[16px] bg-red-500 text-[14px] font-bold text-white"
        >
          {confirmLabel}
        </button>
      </div>
    </RideModal>
  );
}

/* ─── Modal informativo (emergência / dados / ajuda / mensagem / ligar) ─── */

export function InfoModal({
  open,
  onClose,
  title,
  children,
  primaryLabel,
  onPrimary,
  primaryTone = "lilac",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children?: React.ReactNode;
  primaryLabel?: string;
  onPrimary?: () => void;
  primaryTone?: "lilac" | "red";
}) {
  return (
    <RideModal open={open} onClose={onClose}>
      <h3 className="text-center text-[17px] font-extrabold tracking-tight text-[#111111]">
        {title}
      </h3>
      <div className="mt-2 text-center text-[12px] leading-relaxed text-zinc-500">{children}</div>
      {(primaryLabel || onPrimary) && (
        <div className="mt-4">
          {primaryTone === "red" ? (
            <button
              type="button"
              onClick={() => {
                onPrimary?.();
                onClose();
              }}
              className="flex h-[48px] w-full items-center justify-center gap-2 rounded-[16px] bg-red-500 text-[14px] font-bold text-white"
            >
              {primaryLabel}
            </button>
          ) : (
            <PrimaryCTA
              onClick={() => {
                onPrimary?.();
                onClose();
              }}
            >
              {primaryLabel}
            </PrimaryCTA>
          )}
        </div>
      )}
    </RideModal>
  );
}

/* ─── Modal de mensagem (demo) ───────────────────────────── */

export function MessageModal({
  open,
  onClose,
  driver,
}: {
  open: boolean;
  onClose: () => void;
  driver: DriverMock;
}) {
  return (
    <RideOverlaySheet
      open={open}
      onClose={onClose}
      title={`Mensagem para ${driver.name.split(" ")[0]}`}
    >
      <p className="rounded-[16px] bg-zinc-50 px-4 py-3 text-[12px] leading-relaxed text-zinc-500">
        Ambiente demo — mensagens são simuladas localmente e não são enviadas.
      </p>
      <textarea
        aria-label="Escrever mensagem"
        rows={3}
        defaultValue="Oi! Estou na esquina, pode me ver?"
        className="mt-3 w-full resize-none rounded-[16px] border border-zinc-200 bg-zinc-50 px-4 py-3 text-[13px] font-medium text-[#111111] outline-none"
      />
      <div className="mt-3">
        <SecondaryCTA onClick={onClose}>
          <Smartphone className="h-4 w-4" />
          Enviar (simulado)
        </SecondaryCTA>
      </div>
    </RideOverlaySheet>
  );
}

/* ─── Modal de ligação (demo) ────────────────────────────── */

export function CallModal({
  open,
  onClose,
  driver,
}: {
  open: boolean;
  onClose: () => void;
  driver: DriverMock;
}) {
  return (
    <RideModal open={open} onClose={onClose}>
      <div className="flex flex-col items-center">
        <img src={driver.photo} alt={driver.name} className="h-16 w-16 rounded-full object-cover" />
        <h3 className="mt-2 text-[16px] font-extrabold text-[#111111]">{driver.name}</h3>
        <p className="flex items-center gap-1.5 text-[12px] text-zinc-500">
          <Phone className="h-3.5 w-3.5" /> Chamando…
        </p>
        <p className="mt-2 text-center text-[11px] text-zinc-400">
          Ligação simulada no demo — nenhuma chamada real é feita.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 grid h-12 w-12 grid-cols-1 place-items-center rounded-full bg-red-500 text-white"
          aria-label="Encerrar ligação"
        >
          <Phone className="h-5 w-5 rotate-[135deg]" />
        </button>
      </div>
    </RideModal>
  );
}

/* ─── Rota (listagem de paradas) ─────────────────────────── */

export function RouteStopsSheet({
  open,
  onClose,
  originLabel,
  stops,
  destination,
}: {
  open: boolean;
  onClose: () => void;
  originLabel: string;
  stops: { label: string; order: number }[];
  destination: GeoLocation;
}) {
  const rows: { letter: string; label: string; kind: "origin" | "stop" | "dest" }[] = [
    { letter: "A", label: originLabel, kind: "origin" },
    ...stops.map((stop, index) => ({
      letter: String.fromCharCode(66 + index),
      label: stop.label,
      kind: "stop" as const,
    })),
    { letter: "●", label: destination.label, kind: "dest" },
  ];
  return (
    <RideOverlaySheet open={open} onClose={onClose} title="Sua rota">
      <div className="relative">
        <span className="absolute bottom-4 left-[26px] top-4 w-0.5 bg-zinc-200" aria-hidden />
        {rows.map((row) => (
          <div
            key={`${row.letter}-${row.label}`}
            className="relative flex items-center gap-3 py-2.5"
          >
            <span
              className={`relative z-10 grid h-6 w-6 shrink-0 grid-cols-1 place-items-center text-[10px] font-black ${
                row.kind === "dest" ? "rounded-[6px]" : "rounded-full"
              }`}
              style={{
                background: row.kind === "stop" ? "#fff" : RIDE_LILAC,
                border: row.kind === "stop" ? "1px solid #d4d4d8" : "none",
              }}
            >
              {row.letter}
            </span>
            <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[#111111]">
              {row.label}
            </p>
          </div>
        ))}
      </div>
    </RideOverlaySheet>
  );
}
