import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CheckinUser } from "@/lib/event-checkin/checkin-types";
import { CheckinStatus } from "@/lib/event-checkin/checkin-types";

interface AttendanceListProps {
  users: CheckinUser[];
  title?: string;
}

const STATUS_LABELS: Record<CheckinStatus, string> = {
  [CheckinStatus.CHECKED_IN]: "Presente",
  [CheckinStatus.CHECKED_OUT]: "Saída",
  [CheckinStatus.INTERESTED]: "Interessado",
  [CheckinStatus.FAVORITE]: "Favorito",
  [CheckinStatus.FOLLOWING]: "Seguindo",
  [CheckinStatus.PENDING]: "Pendente",
};

const STATUS_COLORS: Record<CheckinStatus, string> = {
  [CheckinStatus.CHECKED_IN]: "bg-emerald-50 text-emerald-700",
  [CheckinStatus.CHECKED_OUT]: "bg-gray-100 text-gray-500",
  [CheckinStatus.INTERESTED]: "bg-amber-50 text-amber-700",
  [CheckinStatus.FAVORITE]: "bg-rose-50 text-rose-700",
  [CheckinStatus.FOLLOWING]: "bg-blue-50 text-blue-700",
  [CheckinStatus.PENDING]: "bg-gray-100 text-gray-500",
};

function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

export function AttendanceList({ users, title }: AttendanceListProps) {
  return (
    <div className="rounded-2xl bg-surface shadow-soft">
      {title && (
        <div className="border-b border-border px-4 py-3">
          <h3 className="font-display text-sm font-bold text-foreground">{title}</h3>
        </div>
      )}

      <div className="max-h-[300px] overflow-y-auto">
        <motion.ul
          variants={container}
          initial="hidden"
          animate="show"
          className="divide-y divide-border"
        >
          {users.map((user) => (
            <motion.li key={user.id} variants={item} className="flex items-center gap-3 px-4 py-3">
              <img
                src={user.photo}
                alt={user.name}
                className="h-10 w-10 shrink-0 rounded-full object-cover"
              />

              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span>{formatDistance(user.distanceMeters)}</span>
                </div>
              </div>

              <span
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold",
                  STATUS_COLORS[user.status],
                )}
              >
                {STATUS_LABELS[user.status]}
              </span>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </div>
  );
}
