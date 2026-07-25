/* ==== driver-mode-switch.tsx -- Reusable driver/passenger mode switch ==== */

import { motion } from "framer-motion";
import { Car, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { modeSwitchSpring } from "./driver-animations";

/* ==== Props ==== */

interface DriverModeSwitchProps {
  mode: "user" | "driver";
  onModeChange: (mode: "user" | "driver") => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

/* ==== Main component ==== */

export function DriverModeSwitch({
  mode,
  onModeChange,
  className,
  size = "md",
}: DriverModeSwitchProps) {
  const isDriver = mode === "driver";

  const sizeClasses = {
    sm: "h-8 w-[120px]",
    md: "h-10 w-[160px]",
    lg: "h-12 w-[200px]",
  };

  const iconSize = size === "sm" ? "h-3.5 w-3.5" : size === "md" ? "h-4 w-4" : "h-5 w-5";
  const textSize = size === "sm" ? "text-[10px]" : size === "md" ? "text-xs" : "text-sm";

  return (
    <div
      className={cn(
        "relative flex items-center rounded-full bg-muted p-1",
        sizeClasses[size],
        className,
      )}
    >
      {/* Sliding indicator */}
      <motion.div
        layout
        transition={modeSwitchSpring}
        className={cn(
          "absolute top-1 bottom-1 w-[calc(50%-2px)] rounded-full",
          isDriver ? "bg-primary" : "bg-foreground",
        )}
        style={{
          left: isDriver ? "calc(50% + 1px)" : "4px",
        }}
      />

      {/* Passenger button */}
      <button
        type="button"
        onClick={() => onModeChange("user")}
        className={cn(
          "relative z-10 flex flex-1 items-center justify-center gap-1 rounded-full transition-colors",
          !isDriver ? "text-white" : "text-muted-foreground",
          size === "sm" ? "py-0.5" : "py-1",
        )}
      >
        <User className={iconSize} />
        <span className={cn("font-medium", textSize)}>Passageiro</span>
      </button>

      {/* Driver button */}
      <button
        type="button"
        onClick={() => onModeChange("driver")}
        className={cn(
          "relative z-10 flex flex-1 items-center justify-center gap-1 rounded-full transition-colors",
          isDriver ? "text-white" : "text-muted-foreground",
          size === "sm" ? "py-0.5" : "py-1",
        )}
      >
        <Car className={iconSize} />
        <span className={cn("font-medium", textSize)}>Motorista</span>
      </button>
    </div>
  );
}
