import { AnimatePresence } from "framer-motion";
import { NotificationCard } from "./notification-card";
import { NotificationEmpty } from "./notification-empty";
import type { Notification } from "@/lib/notifications/notification-types";

interface NotificationListProps {
  notifications: Notification[];
  onRead?: (id: string) => void;
  onDismiss?: (id: string) => void;
  onOpen?: (notification: Notification) => void;
}

export function NotificationList({
  notifications,
  onRead,
  onDismiss,
  onOpen,
}: NotificationListProps) {
  if (notifications.length === 0) {
    return <NotificationEmpty />;
  }

  return (
    <div className="flex flex-col gap-1 px-4">
      <AnimatePresence mode="popLayout">
        {notifications.map((n) => (
          <NotificationCard
            key={n.id}
            notification={n}
            onRead={onRead}
            onDismiss={onDismiss}
            onOpen={onOpen}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
