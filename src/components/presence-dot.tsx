import { cn } from "@/lib/utils";

export function PresenceDot({
  online,
  className,
  size = 12,
}: {
  online: boolean;
  className?: string;
  size?: number;
}) {
  return (
    <span className={cn("relative inline-flex", className)} style={{ height: size, width: size }}>
      {online && (
        <span
          className="absolute inset-0 rounded-full bg-success/50 animate-ping"
          style={{ animationDuration: "1.8s" }}
        />
      )}
      <span
        className={cn(
          "relative m-auto rounded-full ring-2 ring-surface",
          online ? "bg-success" : "bg-muted-foreground/60",
        )}
        style={{ height: size, width: size }}
      />
    </span>
  );
}
