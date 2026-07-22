import type { ReactNode } from "react";
import { NotificationGroupLabel } from "@/lib/notifications/notification-types";
import type { NotificationGroup } from "@/lib/notifications/notification-types";
import { NotificationCard } from "./notification-card";
import type { Notification } from "@/lib/notifications/notification-types";

const GROUP_LABEL_PT: Record<string, string> = {
  [NotificationGroupLabel.TODAY]: "Hoje",
  [NotificationGroupLabel.YESTERDAY]: "Ontem",
  [NotificationGroupLabel.EARLIER]: "Anteriores",
};

interface NotificationGroupProps {
  group: NotificationGroup;
  onRead?: (id: string) => void;
  onDismiss?: (id: string) => void;
}

export function NotificationGroupCard({ group, onRead, onDismiss }: NotificationGroupProps) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="px-4 text-xs font-semibold uppercase tracking-wider text-[#71717A]">
        {GROUP_LABEL_PT[group.label] ?? group.label}
      </h3>
      <div className="flex flex-col gap-1">
        {group.items.map((n) => (
          <NotificationCard key={n.id} notification={n} onRead={onRead} onDismiss={onDismiss} />
        ))}
      </div>
    </section>
  );
}
