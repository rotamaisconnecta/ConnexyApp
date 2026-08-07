import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  X,
  MessageCircle,
  Calendar,
  Tag,
  User,
  Compass,
  Building2,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { formatCount } from "@/lib/notifications/notification-format";
import { getRelativeTimeLabel } from "@/lib/notifications/notification-utils";

type NotificationDestination =
  | { type: "conversation"; conversationId: string }
  | { type: "event"; eventId: string }
  | { type: "business"; businessId: string }
  | { type: "route"; to: "/locais" | "/home" };

interface BellNotification {
  id: string;
  type: "event" | "chat" | "business" | "offer" | "profile" | "map";
  title: string;
  description: string;
  icon: string;
  createdAt: string;
  destination: NotificationDestination;
}

const MOCK_BELL_NOTIFICATIONS: BellNotification[] = [
  {
    id: "b1",
    type: "event",
    title: "Sunset no Parque",
    description: "Evento acontecendo a 450m de voce",
    icon: "🎉",
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
    destination: { type: "event", eventId: "evt-1" },
  },
  {
    id: "b2",
    type: "chat",
    title: "Maria Santos",
    description: "Vamos nos encontrar no Cafe Central?",
    icon: "💬",
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
    destination: { type: "conversation", conversationId: "maria" },
  },
  {
    id: "b3",
    type: "offer",
    title: "20% OFF no Burger House",
    description: "Oferta exclusiva perto de voce",
    icon: "🏷",
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    destination: { type: "route", to: "/locais" },
  },
  {
    id: "b4",
    type: "business",
    title: "Cafe Central",
    description: "Novo horario de funcionamento",
    icon: "🏢",
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    destination: { type: "business", businessId: "b1" },
  },
];

const TYPE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  event: Calendar,
  chat: MessageCircle,
  business: Building2,
  offer: Tag,
  profile: User,
  map: Compass,
};

function getNotificationIcon(type: string, emoji: string): React.ReactNode {
  const Icon = TYPE_ICON[type];
  if (Icon) return <Icon className="h-5 w-5 text-primary" />;
  return <span className="text-lg">{emoji}</span>;
}

export function NotificationBell() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const [notifications] = useState(MOCK_BELL_NOTIFICATIONS);
  const unreadCount = notifications.length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  function handleNotificationClick(n: BellNotification) {
    setIsOpen(false);
    const destination = n.destination;
    switch (destination.type) {
      case "conversation":
        navigate({
          to: "/chat/$conversationId",
          params: { conversationId: destination.conversationId },
        });
        break;
      case "event":
        navigate({ to: "/event/$eventId", params: { eventId: destination.eventId } });
        break;
      case "business":
        navigate({ to: "/business/$businessId", params: { businessId: destination.businessId } });
        break;
      case "route":
        navigate({ to: destination.to });
        break;
    }
  }

  function handleViewAll() {
    setIsOpen(false);
    navigate({ to: "/notificacoes" });
  }

  const badgeLabel =
    unreadCount > 0 ? `${formatCount(unreadCount)} notificações não lidas` : "Notificações";

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={badgeLabel}
        title={badgeLabel}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="relative h-9 w-9 grid place-items-center rounded-full bg-secondary hover:bg-secondary/80 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <Bell className="h-5 w-5 text-foreground" aria-hidden="true" />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white leading-none"
          >
            {formatCount(unreadCount)}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2.25rem)] rounded-2xl border border-border bg-background shadow-elevated overflow-hidden z-[100]"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
              <h3 className="text-sm font-bold text-foreground">Notificações</h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="h-6 w-6 grid place-items-center rounded-full hover:bg-secondary transition-colors"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center">
                  <Bell className="mx-auto h-8 w-8 text-muted-foreground/40" />
                  <p className="mt-2 text-sm text-muted-foreground">Nenhuma notificacao</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => handleNotificationClick(n)}
                    className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-secondary/50 transition-colors border-b border-border/30 last:border-b-0"
                  >
                    <span className="h-9 w-9 shrink-0 grid place-items-center rounded-full bg-primary/10">
                      {getNotificationIcon(n.type, n.icon)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-semibold text-foreground truncate">
                          {n.title}
                        </span>
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {getRelativeTimeLabel(n.createdAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                        {n.description}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="border-t border-border/50 p-1">
              <button
                type="button"
                onClick={handleViewAll}
                className="w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-primary hover:bg-secondary/50 transition-colors"
              >
                Ver todas as notificações
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
