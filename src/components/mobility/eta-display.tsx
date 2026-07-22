import { cn } from "@/lib/utils";
import { formatEta, getEtaColor, getEtaBgColor } from "@/lib/mobility/eta-utils";
import { Clock } from "lucide-react";

interface EtaDisplayProps {
  minutes: number;
  label?: string;
  size?: "sm" | "md" | "lg";
}

export function EtaDisplay({ minutes, label, size = "md" }: EtaDisplayProps) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold",
          getEtaBgColor(minutes),
          size === "sm" && "text-[10px] px-2 py-0.5",
          size === "lg" && "text-sm px-3 py-1.5",
        )}
      >
        <Clock
          className={cn(size === "sm" ? "h-2.5 w-2.5" : size === "lg" ? "h-4 w-4" : "h-3 w-3")}
        />
        {formatEta(minutes)}
      </span>
      {label && <span className={cn("text-xs", getEtaColor(minutes))}>{label}</span>}
    </div>
  );
}
