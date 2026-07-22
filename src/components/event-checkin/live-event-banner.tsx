import { motion } from "framer-motion";
import { Radio } from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveEventBannerProps {
  eventName: string;
  checkinCount: number;
  isActive: boolean;
}

export function LiveEventBanner({ eventName, checkinCount, isActive }: LiveEventBannerProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl px-4 py-3",
        isActive ? "bg-gradient-to-r from-[#6C3BFF] to-[#8B5CFF]" : "bg-surface shadow-soft",
      )}
    >
      {isActive && (
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9zdmc+')] opacity-40" />
      )}

      <div className="relative flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Radio className={cn("h-4 w-4", isActive ? "text-white" : "text-muted-foreground")} />
            {isActive && (
              <motion.span
                className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400"
                animate={{ opacity: [1, 0.4, 1], scale: [1, 0.8, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
          </div>
          {isActive && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/90">
              AO VIVO
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "truncate text-sm font-semibold",
              isActive ? "text-white" : "text-foreground",
            )}
          >
            {eventName}
          </p>
        </div>

        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold",
            isActive ? "bg-white/20 text-white" : "bg-[#F4F1FF] text-primary",
          )}
        >
          {checkinCount} {checkinCount === 1 ? "check-in" : "check-ins"}
        </span>
      </div>
    </div>
  );
}
