import { cn } from "@/lib/utils";

interface ReelProgressProps {
  total: number;
  activeIdx: number;
}

export function ReelProgress({ total, activeIdx }: ReelProgressProps) {
  if (total <= 1) return null;

  return (
    <div className="absolute inset-x-0 bottom-0 z-10 flex gap-1 px-4 pb-2">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="h-0.5 flex-1 rounded-full bg-white/20 overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              i < activeIdx && "w-full bg-gradient-brand",
              i === activeIdx && "w-full bg-gradient-brand",
              i > activeIdx && "w-0 bg-white/20",
            )}
          />
        </div>
      ))}
    </div>
  );
}
