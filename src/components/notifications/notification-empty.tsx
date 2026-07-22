import { Bell } from "lucide-react";

export function NotificationEmpty() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F4F1FF]">
        <Bell className="h-8 w-8 text-[#A88DFF]" />
      </div>
      <div className="text-center">
        <p className="text-base font-semibold text-[#18181B]">Nenhuma notificação</p>
        <p className="mt-1 text-sm text-[#71717A]">
          Quando alguém interagir com você, aparecerá aqui.
        </p>
      </div>
    </div>
  );
}
