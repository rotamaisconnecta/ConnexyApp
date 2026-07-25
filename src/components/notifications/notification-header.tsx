import { ArrowLeft, CheckCheck, Settings } from "lucide-react";
import { Colors, Radius } from "@/theme";

interface NotificationHeaderProps {
  unreadCount: number;
  onBack?: () => void;
  onMarkAllRead?: () => void;
  onSettings?: () => void;
}

export function NotificationHeader({
  unreadCount,
  onBack,
  onMarkAllRead,
  onSettings,
}: NotificationHeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between px-4">
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{ color: Colors.text.primary, borderRadius: Radius.floating }}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <div>
          <h1 className="text-lg font-bold" style={{ color: Colors.text.primary }}>
            Notificações
          </h1>
          {unreadCount > 0 && (
            <p className="text-[10px]" style={{ color: Colors.text.secondary }}>
              {unreadCount} não lida{unreadCount > 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        {unreadCount > 0 && onMarkAllRead && (
          <button
            onClick={onMarkAllRead}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
            style={{
              color: Colors.brand.primary,
              borderRadius: Radius.floating,
              backgroundColor: Colors.surface,
            }}
            title="Marcar todas como lidas"
          >
            <CheckCheck className="h-5 w-5" />
          </button>
        )}
        {onSettings && (
          <button
            onClick={onSettings}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
            style={{ color: Colors.text.secondary, borderRadius: Radius.floating }}
          >
            <Settings className="h-5 w-5" />
          </button>
        )}
      </div>
    </header>
  );
}
