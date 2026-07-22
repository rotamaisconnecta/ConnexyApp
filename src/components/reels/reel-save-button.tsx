import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReelSaveButtonProps {
  saved: boolean;
  onToggle: () => void;
}

export function ReelSaveButton({ saved, onToggle }: ReelSaveButtonProps) {
  return (
    <button
      onClick={onToggle}
      className="h-11 w-11 grid place-items-center rounded-full active:scale-90 transition-transform"
      aria-label={saved ? "Remover guarda" : "Guardar"}
    >
      <Bookmark
        className={cn(
          "h-6 w-6 transition-colors",
          saved ? "fill-amber-400 text-amber-400" : "text-white",
        )}
      />
    </button>
  );
}
