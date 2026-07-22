import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { usePullToRefresh } from "@/hooks/system/use-pull-to-refresh";

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
  className?: string;
}

export function PullToRefresh({ onRefresh, children, className }: PullToRefreshProps) {
  const { isRefreshing, pullDistance, containerRef } = usePullToRefresh({
    onRefresh,
  });

  const showIndicator = pullDistance > 0 || isRefreshing;

  return (
    <div ref={containerRef} className={cn("relative overflow-y-auto", className)}>
      {showIndicator && (
        <div
          className="flex items-center justify-center overflow-hidden"
          style={{ height: isRefreshing ? 48 : pullDistance }}
        >
          <motion.div
            animate={isRefreshing ? { rotate: 360 } : { rotate: 0 }}
            transition={
              isRefreshing ? { repeat: Infinity, duration: 0.8, ease: "linear" } : { duration: 0 }
            }
          >
            <svg className="w-6 h-6 text-[#6C3BFF]" viewBox="0 0 24 24" fill="none">
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
          </motion.div>
        </div>
      )}

      {children}
    </div>
  );
}
