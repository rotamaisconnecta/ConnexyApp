import { ArrowLeft, CheckCheck, Settings } from "lucide-react";

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
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#18181B]"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <div>
          <h1 className="text-lg font-bold text-[#18181B]">Notificações</h1>
          {unreadCount > 0 && (
            <p className="text-[10px] text-[#71717A]">
              {unreadCount} não lida{unreadCount > 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        {unreadCount > 0 && onMarkAllRead && (
          <button
            onClick={onMarkAllRead}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#6C3BFF] transition-colors hover:bg-[#F4F1FF]"
            title="Marcar todas como lidas"
          >
            <CheckCheck className="h-5 w-5" />
          </button>
        )}
        {onSettings && (
          <button
            onClick={onSettings}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#71717A] transition-colors hover:bg-[#F8F8FC]"
          >
            <Settings className="h-5 w-5" />
          </button>
        )}
      </div>
    </header>
  );
}
