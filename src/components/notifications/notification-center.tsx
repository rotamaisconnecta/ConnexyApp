import { useState, useCallback, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { NotificationHeader } from "./notification-header";
import { NotificationFilters } from "./notification-filters";
import { NotificationList } from "./notification-list";
import { NotificationSkeleton } from "./notification-skeleton";
import { NotificationSettings } from "./notification-settings";
import { NotificationGroupCard } from "./notification-group";
import type {
  Notification,
  NotificationFilterState,
  NotificationSettingsState,
} from "@/lib/notifications/notification-types";
import {
  markAsRead as markAsReadAction,
  markAllAsRead,
  removeNotification,
} from "@/lib/notifications/notification-actions";
import { filterNotifications } from "@/lib/notifications/notification-filter";
import { createDefaultFilter } from "@/lib/notifications/notification-filter";
import { createDefaultSettings } from "@/lib/notifications/notification-settings";
import { groupNotifications } from "@/lib/notifications/notification-grouping";

interface NotificationCenterProps {
  notifications: Notification[];
  loading?: boolean;
  onNotificationsChange?: (notifications: Notification[]) => void;
  onBack?: () => void;
}

export function NotificationCenter({
  notifications: initialNotifications,
  loading = false,
  onNotificationsChange,
  onBack,
}: NotificationCenterProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState<NotificationFilterState>(createDefaultFilter());
  const [settings, setSettings] = useState<NotificationSettingsState>(createDefaultSettings());
  const [showSettings, setShowSettings] = useState(false);
  const [view, setView] = useState<"list" | "grouped">("grouped");

  const handleUpdate = useCallback(
    (next: Notification[]) => {
      setNotifications(next);
      onNotificationsChange?.(next);
    },
    [onNotificationsChange],
  );

  const handleRead = useCallback(
    (id: string) => {
      handleUpdate(markAsReadAction(notifications, id));
    },
    [notifications, handleUpdate],
  );

  const handleDismiss = useCallback(
    (id: string) => {
      handleUpdate(removeNotification(notifications, id));
    },
    [notifications, handleUpdate],
  );

  const handleMarkAllRead = useCallback(() => {
    handleUpdate(markAllAsRead(notifications));
  }, [notifications, handleUpdate]);

  const filtered = useMemo(
    () => filterNotifications(notifications, filter),
    [notifications, filter],
  );

  const groups = useMemo(() => groupNotifications(filtered), [filtered]);
  const unreadCount = useMemo(() => notifications.filter((n) => !n.isRead).length, [notifications]);

  if (showSettings) {
    return (
      <NotificationSettings
        settings={settings}
        onChange={setSettings}
        onBack={() => setShowSettings(false)}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <NotificationHeader
        unreadCount={unreadCount}
        onBack={onBack}
        onMarkAllRead={handleMarkAllRead}
        onSettings={() => setShowSettings(true)}
      />

      {loading ? (
        <NotificationSkeleton />
      ) : (
        <>
          <div className="mt-2">
            <NotificationFilters filter={filter} onChange={setFilter} />
          </div>

          <div className="mt-4 flex-1">
            <AnimatePresence mode="wait">
              {view === "grouped" ? (
                <div key="grouped" className="flex flex-col gap-6">
                  {groups.length === 0 ? (
                    <NotificationList
                      notifications={[]}
                      onRead={handleRead}
                      onDismiss={handleDismiss}
                    />
                  ) : (
                    groups.map((g) => (
                      <NotificationGroupCard
                        key={g.label}
                        group={g}
                        onRead={handleRead}
                        onDismiss={handleDismiss}
                      />
                    ))
                  )}
                </div>
              ) : (
                <NotificationList
                  key="list"
                  notifications={filtered}
                  onRead={handleRead}
                  onDismiss={handleDismiss}
                />
              )}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
}
