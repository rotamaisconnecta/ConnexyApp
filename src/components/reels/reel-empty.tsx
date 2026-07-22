import { Clapperboard, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReelEmptyProps {
  message?: string;
  onCreate?: () => void;
}

export function ReelEmpty({ message, onCreate }: ReelEmptyProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
        <Clapperboard className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="text-center">
        <p className="text-base font-display font-semibold text-foreground">
          {message ?? "Nenhum reel disponível"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Volta mais tarde ou cria o teu próprio reel.
        </p>
      </div>
      {onCreate && (
        <button
          onClick={onCreate}
          className={cn(
            "mt-2 flex items-center gap-2 rounded-full px-5 py-2.5",
            "bg-gradient-brand text-sm font-semibold text-white",
          )}
        >
          <Plus className="h-4 w-4" />
          Criar reel
        </button>
      )}
    </div>
  );
}
