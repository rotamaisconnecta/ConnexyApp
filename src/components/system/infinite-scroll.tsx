import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useInfiniteScroll } from "@/hooks/system/use-infinite-scroll";

interface InfiniteScrollProps {
  children: ReactNode;
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  className?: string;
}

export function InfiniteScroll({
  children,
  hasMore,
  isLoading,
  onLoadMore,
  className,
}: InfiniteScrollProps) {
  const { containerRef } = useInfiniteScroll({
    hasMore,
    isLoading,
    onLoadMore,
  });

  return (
    <div ref={containerRef} className={cn("overflow-y-auto", className)}>
      {children}

      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <svg className="w-6 h-6 animate-spin text-[#6C3BFF]" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
