import { useMemo, useCallback } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { NotificationCenter } from "@/components/notifications/notification-center";
import type {
  Notification,
  NotificationCategoryValue,
  NotificationPriorityValue,
} from "@/lib/notifications/notification-types";
import { NotificationCategory, NotificationPriority } from "@/lib/notifications/notification-types";

export const Route = createFileRoute("/_app/notifications")({
  head: () => ({ meta: [{ title: "Notificações — Connexy" }] }),
  component: NotificationsPage,
});

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "n-1",
    category: NotificationCategory.MESSAGE,
    priority: NotificationPriority.HIGH,
    title: "",
    body: "Vamos nos encontrar no Café Central?",
    actorName: "Maria Santos",
    actorAvatar: undefined,
    isRead: false,
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    id: "n-2",
    category: NotificationCategory.LIKE,
    priority: NotificationPriority.MEDIUM,
    title: "",
    body: "curtiu seu post sobre o evento de tecnologia",
    actorName: "João Silva",
    isRead: false,
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
  },
  {
    id: "n-3",
    category: NotificationCategory.CONNECTION_REQUEST,
    priority: NotificationPriority.HIGH,
    title: "",
    body: "quer se conectar com você",
    actorName: "Ana Oliveira",
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: "n-4",
    category: NotificationCategory.NEARBY_EVENT,
    priority: NotificationPriority.MEDIUM,
    title: "",
    body: "Tech Meetup SP acontecendo a 2km de você",
    isRead: true,
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    id: "n-5",
    category: NotificationCategory.COUPON_AVAILABLE,
    priority: NotificationPriority.LOW,
    title: "",
    body: "15% de desconto no Restaurante Sabor",
    isRead: true,
    createdAt: new Date(Date.now() - 48 * 3600000).toISOString(),
  },
  {
    id: "n-6",
    category: NotificationCategory.COMMENT,
    priority: NotificationPriority.MEDIUM,
    title: "",
    body: 'Comentou: "Adorei esse lugar!"',
    actorName: "Carlos Souza",
    isRead: false,
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    id: "n-7",
    category: NotificationCategory.DRIVER_FOUND,
    priority: NotificationPriority.HIGH,
    title: "",
    body: "Seu motorista está a 3 minutos",
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 60000).toISOString(),
  },
  {
    id: "n-8",
    category: NotificationCategory.MENTION,
    priority: NotificationPriority.MEDIUM,
    title: "",
    body: "te mencionou em um post sobre mobilidade",
    actorName: "Pedro Lima",
    isRead: true,
    createdAt: new Date(Date.now() - 72 * 3600000).toISOString(),
  },
];

function NotificationsPage() {
  const navigate = useNavigate();

  const handleBack = useCallback(() => {
    navigate({ to: "/feed" });
  }, [navigate]);

  return (
    <div className="flex-1 pb-20">
      <StatusBar />
      <NotificationCenter notifications={MOCK_NOTIFICATIONS} onBack={handleBack} />
    </div>
  );
}
