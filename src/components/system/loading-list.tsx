import { cn } from "@/lib/utils";
import { Colors } from "@/lib/branding/brand-config";

interface LoadingListProps {
  count?: number;
  className?: string;
}

export function LoadingList({ count = 5, className }: LoadingListProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <div
            className="h-10 w-10 shrink-0 animate-pulse rounded-full"
            style={{ backgroundColor: Colors.surface }}
          />
          <div className="flex-1 space-y-2">
            <div
              className="h-4 w-3/4 animate-pulse rounded"
              style={{ backgroundColor: Colors.surface }}
            />
            <div
              className="h-4 w-1/2 animate-pulse rounded"
              style={{ backgroundColor: Colors.surface }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
