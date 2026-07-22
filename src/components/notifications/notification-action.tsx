import { motion } from "framer-motion";
import type { NotificationCategoryValue } from "@/lib/notifications/notification-types";
import { getCategoryColor, getCategoryLabel } from "@/lib/notifications/notification-utils";
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

interface NotificationActionProps {
  category: NotificationCategoryValue;
  label?: string;
  onAction?: (category: NotificationCategoryValue) => void;
}

export function NotificationAction({ category, label, onAction }: NotificationActionProps) {
  const Icon = ICON_MAP[category];
  const color = getCategoryColor(category);

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={() => onAction?.(category)}
      className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
      style={{ backgroundColor: `${color}15`, color }}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {label ?? getCategoryLabel(category)}
    </motion.button>
  );
}
