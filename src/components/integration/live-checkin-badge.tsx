/* ==== live-checkin-badge.tsx -- Check-in badge with transition states ==== */

import { motion } from "framer-motion";
import { CheckCircle, Clock, Heart, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CheckinTransitionValue } from "@/lib/integration/integration-types";
import { CheckinTransition } from "@/lib/integration/integration-types";
import {
  getCheckinTransitionLabel,
  getCheckinTransitionEmoji,
  formatRelativeTime,
} from "@/lib/integration/integration-utils";

/* ==== Props ==== */

interface LiveCheckinBadgeProps {
  userName: string;
  userPhoto?: string;
  eventName: string;
  placeName?: string;
  transition: CheckinTransitionValue;
  timestamp: string;
  className?: string;
}

/* ==== Transition config ==== */

const TRANSITION_CONFIG: Record<
  CheckinTransitionValue,
  { icon: typeof CheckCircle; color: string; bg: string }
> = {
  INTERESTED: { icon: Heart, color: "text-blue-600", bg: "bg-blue-50" },
  GOING: { icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
  CHECKED_IN: { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
  LEFT_EVENT: { icon: MapPin, color: "text-gray-500", bg: "bg-gray-50" },
};

/* ==== Main component ==== */

export function LiveCheckinBadge({
  userName,
  userPhoto,
  eventName,
  placeName,
  transition,
  timestamp,
  className,
}: LiveCheckinBadgeProps) {
  const config = TRANSITION_CONFIG[transition];
  const Icon = config.icon;
  const label = getCheckinTransitionLabel(transition);
  const emoji = getCheckinTransitionEmoji(transition);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "flex items-center gap-2.5 rounded-2xl border border-border bg-surface p-2.5 shadow-soft",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg",
          config.bg,
        )}
      >
        <Icon className={cn("h-4 w-4", config.color)} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-foreground">
          <span>{emoji} </span>
          <span className="font-semibold">{userName}</span>{" "}
          <span className="text-muted-foreground">{label.toLowerCase()}</span>{" "}
          <span className="text-muted-foreground">em</span>{" "}
          <span className="font-medium">{placeName ?? eventName}</span>
        </p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">{formatRelativeTime(timestamp)}</p>
      </div>
    </motion.div>
  );
}
