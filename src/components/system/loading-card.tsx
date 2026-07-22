import { cn } from "@/lib/utils";
import { Colors, Radius } from "@/lib/branding/brand-config";

interface LoadingCardProps {
  className?: string;
}

export function LoadingCard({ className }: LoadingCardProps) {
  return (
    <div className={cn("overflow-hidden", className)} style={{ borderRadius: Radius.md }}>
      <div className="h-40 w-full animate-pulse" style={{ backgroundColor: Colors.surface }} />
      <div className="space-y-3 p-4">
        <div
          className="h-4 w-3/4 animate-pulse rounded"
          style={{ backgroundColor: Colors.surface }}
        />
        <div
          className="h-4 w-1/2 animate-pulse rounded"
          style={{ backgroundColor: Colors.surface }}
        />
        <div
          className="h-4 w-2/3 animate-pulse rounded"
          style={{ backgroundColor: Colors.surface }}
        />
      </div>
    </div>
  );
}
