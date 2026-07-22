import { ChevronRight } from "lucide-react";
import type { Recommendation } from "@/lib/engine/engine-types";
import { RecommendationCard } from "./recommendation-card";
import { EngineEmpty } from "./engine-empty";

interface RecommendationSectionProps {
  title: string;
  icon: React.ReactNode;
  items: Recommendation[];
  onSelect?: (id: string) => void;
}

export function RecommendationSection({
  title,
  icon,
  items,
  onSelect,
}: RecommendationSectionProps) {
  if (items.length === 0) {
    return (
      <div className="space-y-2 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <h2 className="font-display text-sm font-semibold text-[#18181B]">{title}</h2>
          </div>
        </div>
        <EngineEmpty message={`Nenhum ${title.toLowerCase()} no momento`} />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="font-display text-sm font-semibold text-[#18181B]">{title}</h2>
        </div>
        <button className="flex items-center gap-0.5 text-xs font-medium text-[#A88DFF]">
          Ver todos
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
        {items.map((item) => (
          <RecommendationCard key={item.id} recommendation={item} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}
