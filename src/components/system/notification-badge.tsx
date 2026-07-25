import { cn } from "@/lib/utils";
import { Colors, Radius } from "@/theme";

interface NotificationBadgeProps {
  count: number;
  className?: string;
}

export function NotificationBadge({ count, className }: NotificationBadgeProps) {
  return (
    <span
      className={cn(
        "absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full px-1.5 text-[10px] font-bold leading-none",
        className,
      )}
      style={{
        backgroundColor: Colors.danger,
        color: Colors.background,
        borderRadius: Radius.floating,
        minWidth: 16,
        height: 16,
      }}
    >
      {count}
    </span>
  );
}
