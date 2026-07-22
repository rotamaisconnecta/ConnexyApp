import { cn } from "@/lib/utils";
import { formatCount } from "@/lib/notifications/notification-format";

interface NotificationBadgeProps {
  count: number;
  className?: string;
}

export function NotificationBadge({ count, className }: NotificationBadgeProps) {
  const formatted = formatCount(count);

  if (!formatted) return null;

  return (
    <span
      className={cn(
        "absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#EF4444] px-1 text-[9px] font-bold text-white",
        className,
      )}
    >
      {formatted}
    </span>
  );
}
