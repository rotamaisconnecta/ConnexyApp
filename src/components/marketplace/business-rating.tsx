import { Star } from "lucide-react";
import type { BusinessRating as BusinessRatingType } from "@/lib/marketplace/business-types";

interface BusinessRatingProps {
  rating: BusinessRatingType;
}

export function BusinessRating({ rating }: BusinessRatingProps) {
  const maxCount = Math.max(...Object.values(rating.distribution), 1);

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm">Avaliações</h3>

      <div className="flex items-center gap-4">
        <div className="text-center">
          <div className="text-3xl font-bold">{rating.average}</div>
          <div className="flex items-center gap-0.5 mt-0.5">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${
                  i < Math.round(rating.average) ? "fill-amber text-amber" : "text-border"
                }`}
              />
            ))}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            {rating.totalReviews} avaliações
          </div>
        </div>

        <div className="flex-1 space-y-1.5">
          {([5, 4, 3, 2, 1] as const).map((stars) => {
            const count = rating.distribution[stars] ?? 0;
            const percent = maxCount > 0 ? (count / rating.totalReviews) * 100 : 0;
            return (
              <div key={stars} className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-3 text-right">{stars}</span>
                <Star className="h-2.5 w-2.5 fill-amber text-amber" />
                <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber transition-all"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground w-6 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
