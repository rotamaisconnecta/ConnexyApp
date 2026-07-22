import { useState, useCallback } from 'react';
import { NotificationService } from '@/services/notification-service';

export function useNotifications() {
  const [notifications, setNotifications] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await NotificationService.getNotifications();
      setNotifications(result);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const unreadCount = notifications.filter((n: unknown) => {
    if (typeof n === 'object' && n !== null && 'read' in n) {
      return !(n as { read: boolean }).read;
    }
    return false;
  }).length;

  const markAsRead = useCallback(async (notificationId: string) => {
    await NotificationService.markAsRead(notificationId);
    setNotifications((prev) =>
      prev.map((n: unknown) => {
        if (typeof n === 'object' && n !== null && 'id' in n) {
          if ((n as { id: string }).id === notificationId) {
            return { ...n, read: true };
          }
        }
        return n;
      }),
    );
  }, []);

  const markAllAsRead = useCallback(async () => {
    await NotificationService.markAllAsRead();
    setNotifications((prev) =>
      prev.map((n: unknown) => {
        if (typeof n === 'object' && n !== null) {
          return { ...n, read: true };
        }
        return n;
      }),
    );
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refresh,
  };
}
