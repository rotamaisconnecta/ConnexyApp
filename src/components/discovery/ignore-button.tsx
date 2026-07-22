import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface IgnoreButtonProps {
  onClick: () => void;
}

export function IgnoreButton({ onClick }: IgnoreButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-9 w-9 rounded-xl grid place-items-center bg-secondary text-muted-foreground hover:bg-accent transition-colors",
      )}
      aria-label="Ignorar"
    >
      <X className="h-4 w-4" />
    </button>
  );
}
