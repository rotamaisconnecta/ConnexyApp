/* ==== driver-ride-bottom-sheet.tsx -- Premium ride request bottom sheet ==== */

import { motion } from "framer-motion";
import { Star, MapPin, Navigation2, Clock, CreditCard, Smartphone, Banknote } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RideRequest, PaymentMethod } from "@/lib/driver/driver-types";
import { DriverBottomSheet } from "./driver-bottom-sheet";
import { rideAcceptDecline, driverSection } from "./driver-animations";

/* ==== Props ==== */

interface DriverRideBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  request: RideRequest | null;
  onAccept: () => void;
  onDecline: () => void;
}

/* ==== Payment method config ==== */

const PAYMENT_CONFIG: Record<PaymentMethod, { icon: typeof CreditCard; label: string }> = {
  CASH: { icon: Banknote, label: "Dinheiro" },
  PIX: { icon: Smartphone, label: "PIX" },
  CREDIT_CARD: { icon: CreditCard, label: "Crédito" },
  DEBIT_CARD: { icon: CreditCard, label: "Débito" },
};

/* ==== Helpers ==== */

function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h ${m}min`;
}

/* ==== Main component ==== */

export function DriverRideBottomSheet({
  isOpen,
  onClose,
  request,
  onAccept,
  onDecline,
}: DriverRideBottomSheetProps) {
  if (!request) return null;

  const payment = PAYMENT_CONFIG[request.paymentMethod];
  const PaymentIcon = payment.icon;

  return (
    <DriverBottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="space-y-4">
        {/* Passenger info */}
        <motion.div
          variants={driverSection(0)}
          initial="hidden"
          animate="visible"
          className="flex items-center gap-3"
        >
          <img
            src={request.passengerPhoto}
            alt={request.passengerName}
            className="h-14 w-14 rounded-full object-cover border-2 border-border"
          />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-foreground">{request.passengerName}</p>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {request.passengerRating.toFixed(1)}
            </span>
          </div>
          <div className="text-right shrink-0">
            <p className="font-display font-bold text-xl text-primary">
              {formatCurrency(request.price)}
            </p>
          </div>
        </motion.div>

        {/* Route info */}
        <motion.div
          variants={driverSection(1)}
          initial="hidden"
          animate="visible"
          className="rounded-2xl border border-border bg-muted/50 p-3 space-y-2"
        >
          <div className="flex items-start gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20">
              <MapPin className="h-3 w-3 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">Origem</p>
              <p className="text-sm text-foreground">{request.origin}</p>
            </div>
          </div>
          <div className="ml-3 h-3 w-px bg-border" />
          <div className="flex items-start gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20">
              <Navigation2 className="h-3 w-3 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">Destino</p>
              <p className="text-sm text-foreground">{request.destination}</p>
            </div>
          </div>
        </motion.div>

        {/* Trip details */}
        <motion.div
          variants={driverSection(2)}
          initial="hidden"
          animate="visible"
          className="flex items-center justify-around rounded-2xl border border-border bg-muted/50 p-3"
        >
          <div className="flex flex-col items-center gap-1">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-semibold text-foreground">
              {formatDuration(request.duration)}
            </span>
            <span className="text-[9px] text-muted-foreground">Duração</span>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="flex flex-col items-center gap-1">
            <Navigation2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-semibold text-foreground">
              {formatDistance(request.distance)}
            </span>
            <span className="text-[9px] text-muted-foreground">Distância</span>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="flex flex-col items-center gap-1">
            <PaymentIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-semibold text-foreground">{payment.label}</span>
            <span className="text-[9px] text-muted-foreground">Pagamento</span>
          </div>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          variants={rideAcceptDecline}
          initial="hidden"
          animate="visible"
          className="flex gap-3 pb-4"
        >
          <button
            type="button"
            onClick={onDecline}
            className="flex-1 rounded-2xl border border-red-200 bg-red-50 py-3.5 text-sm font-bold text-red-600 transition-colors hover:bg-red-100 active:scale-[0.98]"
          >
            Recusar
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="flex-1 rounded-2xl bg-gradient-brand py-3.5 text-sm font-bold text-white shadow-soft transition-colors hover:opacity-90 active:scale-[0.98]"
          >
            Aceitar Corrida
          </button>
        </motion.div>
      </div>
    </DriverBottomSheet>
  );
}
