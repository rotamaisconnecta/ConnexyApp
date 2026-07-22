import { cn } from "@/lib/utils";
import type { BusinessCategoryValue } from "@/lib/marketplace/business-types";
import { BUSINESS_CATEGORY_OPTIONS } from "@/lib/marketplace/business-types";
import { getCategoryColor } from "@/lib/marketplace/category-utils";

interface CategoryFilterProps {
  selected: BusinessCategoryValue[];
  onSelect: (categories: BusinessCategoryValue[]) => void;
  showAll?: boolean;
}

export function CategoryFilter({ selected, onSelect, showAll = true }: CategoryFilterProps) {
  function handleToggle(category: BusinessCategoryValue) {
    if (selected.includes(category)) {
      onSelect(selected.filter((c) => c !== category));
    } else {
      onSelect([...selected, category]);
    }
  }

  function handleClear() {
    onSelect([]);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Categorias</h3>
        {selected.length > 0 && (
          <button onClick={handleClear} className="text-[11px] text-primary font-medium">
            Limpar
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {showAll && (
          <button
            onClick={handleClear}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
              selected.length === 0
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground",
            )}
          >
            Todos
          </button>
        )}
        {BUSINESS_CATEGORY_OPTIONS.map((opt) => {
          const isActive = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => handleToggle(opt.value)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all flex items-center gap-1.5",
                isActive ? getCategoryColor(opt.value) : "bg-secondary text-muted-foreground",
              )}
            >
              <span>{opt.icon}</span>
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
