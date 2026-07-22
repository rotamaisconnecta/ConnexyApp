import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type {
  Notification,
  NotificationCategoryValue,
} from "@/lib/notifications/notification-types";
import { getCategoryColor, getRelativeTimeLabel } from "@/lib/notifications/notification-utils";
import { formatNotificationTitle } from "@/lib/notifications/notification-format";
import {
  MessageCircle,
  UserPlus,
  CheckCircle,
  MapPin,
  Camera,
  Tag,
  Calendar,
  Car,
  Navigation,
  Flag,
  Building2,
  Ticket,
  Heart,
  MessageSquare,
  AtSign,
  Share2,
} from "lucide-react";

const ICON_MAP: Record<NotificationCategoryValue, React.ComponentType<{ className?: string }>> = {
  MESSAGE: MessageCircle,
  CONNECTION_REQUEST: UserPlus,
  CONNECTION_ACCEPTED: CheckCircle,
  NEARBY_PERSON: MapPin,
  NEARBY_MOMENT: Camera,
  NEARBY_OFFER: Tag,
  NEARBY_EVENT: Calendar,
  DRIVER_FOUND: Car,
  RIDE_STARTED: Navigation,
  RIDE_FINISHED: Flag,
  BUSINESS_FOLLOW: Building2,
  COUPON_AVAILABLE: Ticket,
  LIKE: Heart,
  COMMENT: MessageSquare,
  MENTION: AtSign,
  SHARE: Share2,
};

interface NotificationCardProps {
  notification: Notification;
  onRead?: (id: string) => void;
  onDismiss?: (id: string) => void;
  onLongPress?: (notification: Notification) => void;
}

export function NotificationCard({
  notification,
  onRead,
  onDismiss,
  onLongPress,
}: NotificationCardProps) {
  const Icon = ICON_MAP[notification.category];
  const color = getCategoryColor(notification.category);
  const title = formatNotificationTitle(notification);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 80, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onRead?.(notification.id)}
      onDoubleClick={() => onDismiss?.(notification.id)}
      className={cn(
        "relative flex gap-3 rounded-2xl p-3 transition-colors",
        notification.isRead ? "bg-white" : "bg-[#F4F1FF]/60",
      )}
    >
      {!notification.isRead && (
        <span
          className="absolute left-1 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}

      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `${color}15` }}
      >
        {Icon && (
          <span style={{ color }}>
            <Icon className="h-5 w-5" />
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-sm leading-snug",
              notification.isRead ? "text-[#71717A] font-normal" : "text-[#18181B] font-semibold",
            )}
          >
            {title}
          </p>
          <span className="shrink-0 text-[10px] text-[#71717A]">
            {getRelativeTimeLabel(notification.createdAt)}
          </span>
        </div>
        {notification.body && (
          <p className="mt-0.5 text-xs text-[#71717A] line-clamp-2">{notification.body}</p>
        )}
      </div>
    </motion.div>
  );
}
