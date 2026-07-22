import { useState } from "react";
import { cn } from "@/lib/utils";
import { NotificationCategory } from "@/lib/notifications/notification-types";
import type {
  NotificationCategoryValue,
  NotificationFilterState,
} from "@/lib/notifications/notification-types";
import { getCategoryLabel } from "@/lib/notifications/notification-utils";
import { toggleCategory } from "@/lib/notifications/notification-filter";
import { Search, X } from "lucide-react";

const QUICK_FILTERS: NotificationCategoryValue[] = [
  NotificationCategory.MESSAGE,
  NotificationCategory.LIKE,
  NotificationCategory.COMMENT,
  NotificationCategory.CONNECTION_REQUEST,
  NotificationCategory.NEARBY_EVENT,
  NotificationCategory.COUPON_AVAILABLE,
];

interface NotificationFiltersProps {
  filter: NotificationFilterState;
  onChange: (filter: NotificationFilterState) => void;
}

export function NotificationFilters({ filter, onChange }: NotificationFiltersProps) {
  const [showSearch, setShowSearch] = useState(false);

  return (
    <div className="flex flex-col gap-3 px-4">
      {showSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#71717A]" />
          <input
            autoFocus
            value={filter.search}
            onChange={(e) => onChange({ ...filter, search: e.target.value })}
            placeholder="Buscar notificações..."
            className="h-10 w-full rounded-xl bg-[#F8F8FC] pl-9 pr-8 text-sm text-[#18181B] placeholder:text-[#71717A] outline-none"
          />
          <button
            onClick={() => {
              onChange({ ...filter, search: "" });
              setShowSearch(false);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#71717A]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {!showSearch && (
          <button
            onClick={() => setShowSearch(true)}
            className="flex h-8 shrink-0 items-center gap-1 rounded-full bg-[#F8F8FC] px-3 text-xs font-medium text-[#71717A] transition-colors hover:bg-[#F4F1FF]"
          >
            <Search className="h-3.5 w-3.5" />
          </button>
        )}

        <button
          onClick={() => onChange({ ...filter, unreadOnly: !filter.unreadOnly })}
          className={cn(
            "h-8 shrink-0 rounded-full px-3 text-xs font-medium transition-colors",
            filter.unreadOnly
              ? "bg-[#6C3BFF] text-white"
              : "bg-[#F8F8FC] text-[#71717A] hover:bg-[#F4F1FF]",
          )}
        >
          Não lidas
        </button>

        {QUICK_FILTERS.map((cat) => (
          <button
            key={cat}
            onClick={() =>
              onChange({ ...filter, categories: toggleCategory(filter.categories, cat) })
            }
            className={cn(
              "h-8 shrink-0 rounded-full px-3 text-xs font-medium transition-colors whitespace-nowrap",
              filter.categories.includes(cat)
                ? "bg-[#6C3BFF] text-white"
                : "bg-[#F8F8FC] text-[#71717A] hover:bg-[#F4F1FF]",
            )}
          >
            {getCategoryLabel(cat)}
          </button>
        ))}
      </div>
    </div>
  );
}
