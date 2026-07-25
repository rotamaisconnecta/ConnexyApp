import { cn } from "@/lib/utils";
import type { Notification } from "@/lib/notifications/notification-types";
import { getCategoryColor, getRelativeTimeLabel } from "@/lib/notifications/notification-utils";
import { formatNotificationTitle } from "@/lib/notifications/notification-format";

interface NotificationPreviewProps {
  notification: Notification;
  className?: string;
}

export function NotificationPreview({ notification, className }: NotificationPreviewProps) {
  const color = getCategoryColor(notification.category);
  const title = formatNotificationTitle(notification);

  return (
    <div
      className={cn("flex items-center gap-3 rounded-2xl bg-white p-3 shadow-medium", className)}
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `${color}15` }}
      >
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-xs font-semibold text-foreground">{title}</p>
        <p className="truncate text-[10px] text-muted-foreground">{notification.body}</p>
      </div>
      <span className="shrink-0 text-[9px] text-muted-foreground">
        {getRelativeTimeLabel(notification.createdAt)}
      </span>
    </div>
  );
}
