import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { EngineNotification } from "@/lib/engine/engine-types";
import { RecommendationType, RecommendationReason } from "@/lib/engine/engine-types";
import {
  Users,
  Calendar,
  Building2,
  MapPin,
  Ticket,
  Film,
  Car,
  Navigation,
  Handshake,
} from "lucide-react";

interface SmartAlertProps {
  notification: EngineNotification;
  onRead?: (id: string) => void;
}

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  [RecommendationType.PERSON]: Users,
  [RecommendationType.EVENT]: Calendar,
  [RecommendationType.BUSINESS]: Building2,
  [RecommendationType.PLACE]: MapPin,
  [RecommendationType.OFFER]: Ticket,
  [RecommendationType.REEL]: Film,
  [RecommendationType.DRIVER]: Car,
  [RecommendationType.ROUTE]: Navigation,
  [RecommendationType.NETWORKING]: Handshake,
};

const REASON_LABELS: Record<string, string> = {
  [RecommendationReason.DISTANCIA]: "Proximidade",
  [RecommendationReason.INTERESSE]: "Interesse",
  [RecommendationReason.COMPATIBILIDADE]: "Compatível",
  [RecommendationReason.POPULARIDADE]: "Popular",
  [RecommendationReason.EVENTO]: "Evento",
  [RecommendationReason.LOCAL]: "Local",
  [RecommendationReason.HORARIO]: "Horário",
  [RecommendationReason.TENDENCIA]: "Tendência",
};

function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function SmartAlert({ notification, onRead }: SmartAlertProps) {
  const Icon = TYPE_ICONS[notification.type] ?? Users;
  const reasonLabel = REASON_LABELS[notification.type] ?? notification.reason;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 80, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onRead?.(notification.id)}
      className={cn(
        "relative flex gap-3 rounded-2xl p-3 transition-colors",
        notification.read ? "bg-white" : "bg-[#F4F1FF]/60",
      )}
    >
      {!notification.read && (
        <span className="absolute left-1 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-[#A88DFF]" />
      )}

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F4F1FF]">
        {notification.icon ? (
          <span className="text-lg">{notification.icon}</span>
        ) : (
          <Icon className="h-5 w-5 text-[#A88DFF]" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-sm leading-snug",
              notification.read ? "text-[#71717A] font-normal" : "text-[#18181B] font-semibold",
            )}
          >
            {notification.title}
          </p>
          <span className="shrink-0 text-[10px] text-[#71717A]">
            {getRelativeTime(notification.createdAt)}
          </span>
        </div>

        <p className="mt-0.5 text-xs text-[#71717A] line-clamp-2">{notification.body}</p>

        <div className="mt-1.5 flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-[#F4F1FF] px-1.5 py-0.5 text-[10px] font-medium text-[#A88DFF]">
            {reasonLabel}
          </span>
          <span className="inline-flex items-center rounded-full bg-green-500/15 px-1.5 py-0.5 text-[10px] font-bold text-green-600">
            {Math.round(notification.score * 100)}%
          </span>
        </div>
      </div>
    </motion.div>
  );
}
