import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface OnlineSwitchProps {
  isOnline: boolean;
  onToggle: () => void;
}

export function OnlineSwitch({ isOnline, onToggle }: OnlineSwitchProps) {
  return (
    <button
      onClick={onToggle}
      role="switch"
      aria-checked={isOnline}
      aria-label={isOnline ? "Ficar offline" : "Ficar online"}
      className="flex items-center gap-3"
    >
      <div
        className={cn(
          "relative h-12 w-[72px] rounded-full transition-colors duration-300",
          isOnline ? "bg-emerald-500" : "bg-muted",
        )}
      >
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={cn(
            "absolute top-1 h-10 w-10 rounded-full bg-white shadow-md",
            isOnline ? "left-[calc(100%-44px)]" : "left-1",
          )}
        />
      </div>
      <span
        className={cn(
          "text-sm font-semibold transition-colors",
          isOnline ? "text-emerald-600" : "text-muted-foreground",
        )}
      >
        {isOnline ? "Disponível" : "Offline"}
      </span>
    </button>
  );
}
