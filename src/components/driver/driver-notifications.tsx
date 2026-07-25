/* ==== driver-notifications.tsx -- Driver notification panel ==== */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Calendar,
  Star,
  Navigation2,
  MapPin,
  Clock,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { driverSection, cardHover, buttonTap } from "./driver-animations";

/* ==== Notification type ==== */

interface DriverNotification {
  id: string;
  type: "event_nearby" | "ride_request" | "earnings" | "rating" | "hotspot";
  title: string;
  body: string;
  icon: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

/* ==== Props ==== */

interface DriverNotificationsProps {
  notifications: DriverNotification[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllRead?: () => void;
  onDismiss?: (id: string) => void;
}

/* ==== Icon config ==== */

const TYPE_ICON: Record<string, typeof Bell> = {
  event_nearby: Calendar,
  ride_request: Navigation2,
  earnings: Star,
  rating: Star,
  hotspot: MapPin,
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "border-l-muted-foreground",
  MEDIUM: "border-l-amber-400",
  HIGH: "border-l-primary",
};

/* ==== Single notification ==== */

function NotificationItem({
  notification,
  index,
  onRead,
  onDismiss,
}: {
  notification: DriverNotification;
  index: number;
  onRead?: () => void;
  onDismiss?: () => void;
}) {
  const Icon = TYPE_ICON[notification.type] ?? Bell;

  return (
    <motion.div
      variants={driverSection(index)}
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, x: -50, transition: { duration: 0.2 } }}
      {...cardHover}
      onClick={onRead}
      className={cn(
        "relative flex items-start gap-3 rounded-2xl border border-border border-l-4 bg-surface p-3 shadow-soft",
        PRIORITY_COLORS[notification.priority],
        !notification.read && "bg-primary/5",
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
          notification.read ? "bg-muted" : "bg-primary/10",
        )}
      >
        <Icon
          className={cn("h-4 w-4", notification.read ? "text-muted-foreground" : "text-primary")}
        />
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm",
            notification.read ? "text-muted-foreground" : "font-semibold text-foreground",
          )}
        >
          {notification.title}
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">{notification.body}</p>
        <div className="mt-1 flex items-center gap-2">
          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <Clock className="h-2.5 w-2.5" />
            {notification.createdAt}
          </span>
          {!notification.read && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
        </div>
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground hover:bg-muted"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </motion.div>
  );
}

/* ==== Main component ==== */

export function DriverNotifications({
  notifications,
  onMarkAsRead,
  onMarkAllRead,
  onDismiss,
}: DriverNotificationsProps) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <motion.div
      variants={driverSection(0)}
      initial="hidden"
      animate="visible"
      className="space-y-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Notificações</h3>
          {unreadCount > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllRead}
            {...buttonTap}
            className="flex items-center gap-1 text-[11px] font-semibold text-primary"
          >
            <CheckCheck className="h-3 w-3" />
            Ler todas
          </button>
        )}
      </div>

      {/* Notification list */}
      <AnimatePresence mode="popLayout">
        <div className="space-y-2">
          {notifications.map((n, i) => (
            <NotificationItem
              key={n.id}
              notification={n}
              index={i}
              onRead={() => onMarkAsRead?.(n.id)}
              onDismiss={() => onDismiss?.(n.id)}
            />
          ))}
        </div>
      </AnimatePresence>

      {notifications.length === 0 && (
        <div className="rounded-2xl border border-border bg-surface p-6 text-center shadow-soft">
          <BellOff className="mx-auto h-8 w-8 text-muted-foreground/40" />
          <p className="mt-2 text-sm text-muted-foreground">Nenhuma notificação no momento</p>
        </div>
      )}
    </motion.div>
  );
}
