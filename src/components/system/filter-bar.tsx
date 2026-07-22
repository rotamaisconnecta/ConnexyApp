import { cn } from "@/lib/utils";
import { Colors, Radius } from "@/lib/branding/brand-config";

interface FilterItem {
  id: string;
  label: string;
  active: boolean;
}

interface FilterBarProps {
  filters: FilterItem[];
  onToggle: (id: string) => void;
  className?: string;
}

export function FilterBar({ filters, onToggle, className }: FilterBarProps) {
  return (
    <div className={cn("flex gap-2 overflow-x-auto scrollbar-none py-2 px-4", className)}>
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onToggle(filter.id)}
          className={cn(
            "flex-shrink-0 px-4 py-2 text-sm font-medium transition-all rounded-full whitespace-nowrap",
          )}
          style={{
            borderRadius: Radius.floating,
            background: filter.active ? Colors.brand.primary : Colors.surface,
            color: filter.active ? "white" : Colors.text.secondary,
            border: `1px solid ${filter.active ? Colors.brand.primary : Colors.border}`,
          }}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
