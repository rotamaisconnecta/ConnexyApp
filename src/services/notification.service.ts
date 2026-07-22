import { NotificationRepository } from "@/repositories/notification.repository";

const DEFAULT_PAGE_SIZE = 20;

export const NotificationService = {
  async getNotifications(userId: string, page: number) {
    const offset = page * DEFAULT_PAGE_SIZE;
    const notifications = await NotificationRepository.getNotifications(userId, offset, DEFAULT_PAGE_SIZE);
    return notifications;
  },

  async markAsRead(notificationId: string) {
    await NotificationRepository.markAsRead(notificationId);
  },

  async markAllAsRead(userId: string) {
    await NotificationRepository.markAllAsRead(userId);
  },

  async getUnreadCount(userId: string) {
    const count = await NotificationRepository.getUnreadCount(userId);
    return count;
  },

  async deleteNotification(notificationId: string) {
    await NotificationRepository.delete(notificationId);
  },
};
